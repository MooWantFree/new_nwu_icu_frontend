import { afterEach, describe, expect, it, vi } from 'vitest'
import { api } from './requests'

afterEach(() => {
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
