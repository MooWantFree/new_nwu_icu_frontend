import { afterEach, describe, expect, it, vi } from 'vitest'
import { api } from './requests'
import { registerCaptchaChallengeHandler } from './captchaChallenge'

afterEach(() => {
  vi.restoreAllMocks()
  registerCaptchaChallengeHandler(undefined)
  vi.unstubAllGlobals()
})

describe('bounded requests', () => {
  const waitForAbort = (signal: AbortSignal) => new Promise<never>((_resolve, reject) => {
    if (signal.aborted) reject(signal.reason)
    else signal.addEventListener('abort', () => reject(signal.reason), { once: true })
  })

  it('times out while reading the response body without repeating a write', async () => {
    document.cookie = 'csrftoken=test-token; path=/'
    const deadline = new AbortController()
    const timeout = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(deadline.signal)
    const fetchMock = vi.fn().mockImplementation(async (_url, options) => ({
      status: 200, text: () => waitForAbort(options.signal),
    }))
    vi.stubGlobal('fetch', fetchMock)
    const pending = api.post({ url: '/api/assessment/review/', query: {} as never })
    const assertion = expect(pending).rejects.toMatchObject({ name: 'TimeoutError' })
    await Promise.resolve()
    deadline.abort(new DOMException('timeout', 'TimeoutError'))
    await assertion
    expect(timeout).toHaveBeenCalledWith(15_000)
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('preserves caller cancellation in addition to the timeout', async () => {
    const controller = new AbortController()
    const fetchMock = vi.fn().mockImplementation((_url, options) => waitForAbort(options.signal))
    vi.stubGlobal('fetch', fetchMock)
    const pending = api.get({ url: '/api/user/profile/', options: { signal: controller.signal } })
    const assertion = expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    controller.abort()
    await assertion
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('bounds the CSRF step and never submits if it times out', async () => {
    document.cookie = 'csrftoken=; Max-Age=0; path=/'
    const deadline = new AbortController()
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(deadline.signal)
    const fetchMock = vi.fn().mockImplementation((_url, options) => waitForAbort(options.signal))
    vi.stubGlobal('fetch', fetchMock)
    const pending = api.post({ url: '/api/assessment/review/', query: {} as never })
    const assertion = expect(pending).rejects.toMatchObject({ name: 'TimeoutError' })
    deadline.abort(new DOMException('timeout', 'TimeoutError'))
    await assertion
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith('/api/user/csrf/', expect.anything())
  })

  it('uses the longer upload deadline for file bodies', async () => {
    document.cookie = 'csrftoken=test-token; path=/'
    const timeout = vi.spyOn(AbortSignal, 'timeout')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200, text: async () => '{}' }))
    await api.post({ url: '/api/assessment/review/', query: new FormData() as never })
    expect(timeout).toHaveBeenCalledWith(60_000)
  })
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

  it('exposes the server Retry-After delay', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 429,
      statusText: 'Too Many Requests',
      headers: new Headers({ 'Retry-After': '23' }),
      text: async () => JSON.stringify({ message: '', errors: [], contents: {} }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const response = await api.get({
      url: '/api/management/reports/',
      query: { page: 1, pageSize: 10 },
    })

    expect(response.retryAfter).toBe(23)
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
