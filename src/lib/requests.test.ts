import { afterEach, describe, expect, it, vi } from 'vitest'
import { api } from './requests'
import { registerCaptchaChallengeHandler } from './captchaChallenge'

afterEach(() => {
  registerCaptchaChallengeHandler(undefined)
  vi.unstubAllGlobals()
})

describe('API request query serialization', () => {
  it('omits undefined optional GET parameters', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      statusText: 'OK',
      text: async () => JSON.stringify({
        message: '',
        contents: { page: 1, max_page: 1, count: 0, results: [] },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await api.get({
      url: '/api/management/reports/',
      query: {
        status: 'pending',
        board: undefined,
        page: 1,
        pageSize: 10,
      },
    })

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock.mock.calls[0][0]).toBe(
      '/api/management/reports/?status=pending&page=1&pageSize=10',
    )
  })
})

describe('CAPTCHA step-up retry', () => {
  it('opens the challenge and retries the rejected request exactly once with proof', async () => {
    document.cookie = 'csrftoken=test-token; path=/'
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        status: 429,
        statusText: 'Too Many Requests',
        text: async () => JSON.stringify({
          message: '',
          errors: [{ field: 'captcha', err_code: 'captcha_required', err_msg: '请验证' }],
          contents: { captcha_scope: 'review_write' },
        }),
      })
      .mockResolvedValueOnce({
        status: 201,
        statusText: 'Created',
        text: async () => JSON.stringify({ message: '', errors: [], contents: { review_id: 1 } }),
      })
    vi.stubGlobal('fetch', fetchMock)
    const challenge = vi.fn().mockResolvedValue('signed-proof')
    registerCaptchaChallengeHandler(challenge)

    const response = await api.post({
      url: '/api/assessment/review/',
      query: {} as never,
    })

    expect(response.status).toBe(201)
    expect(challenge).toHaveBeenCalledOnce()
    expect(challenge).toHaveBeenCalledWith('review_write')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[1][1].headers).toMatchObject({
      'X-Captcha-Proof': 'signed-proof',
    })
  })

  it('does not enter a retry loop when the proof retry is rejected', async () => {
    document.cookie = 'csrftoken=test-token; path=/'
    const throttled = {
      status: 429,
      statusText: 'Too Many Requests',
      text: async () => JSON.stringify({ contents: { captcha_scope: 'reply_write' } }),
    }
    const fetchMock = vi.fn().mockResolvedValue(throttled)
    vi.stubGlobal('fetch', fetchMock)
    const challenge = vi.fn().mockResolvedValue('one-proof')
    registerCaptchaChallengeHandler(challenge)

    const response = await api.post({
      url: '/api/assessment/reply/',
      query: {} as never,
    })

    expect(response.status).toBe(429)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(challenge).toHaveBeenCalledOnce()
  })
})
