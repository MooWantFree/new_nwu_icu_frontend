import { afterEach, describe, expect, it, vi } from 'vitest'
import { checkLoginStatus } from './logins'

afterEach(() => vi.unstubAllGlobals())
describe('login verification', () => {
  it.each([200, 401])('returns a known login status for HTTP %s', async status => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status, ok: status === 200 }))
    expect(await checkLoginStatus()).toBe(status === 200)
  })
  it.each([403, 500, 503])('does not treat HTTP %s as a logged-out session', async status => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status, ok: false }))
    await expect(checkLoginStatus()).rejects.toThrow('重试')
  })
  it('propagates a network failure instead of redirecting to login', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))
    await expect(checkLoginStatus()).rejects.toThrow('offline')
  })
})
