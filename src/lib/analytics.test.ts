import { afterEach, describe, expect, it } from 'vitest'
import { beforeStatisticsSend } from './analytics'

afterEach(() => window.history.replaceState({}, '', '/'))

describe('visit statistics privacy', () => {
  it('removes query parameters and fragments from page and referrer URLs', () => {
    const result = beforeStatisticsSend('event', {
      url: '/user/activate?token=secret#token=another-secret',
      referrer: 'https://example.org/search?q=private#private',
      website: 'example-id',
    })
    expect(result).toMatchObject({
      url: '/user/activate',
      referrer: 'https://example.org/search',
      website: 'example-id',
    })
  })

  it('redacts account tokens embedded in a URL path', () => {
    expect(beforeStatisticsSend('event', { url: '/api/user/mail-reset/private-token/' }))
      .toMatchObject({ url: '/api/user/mail-reset/[REDACTED]/' })
  })

  it('never sends management visits, even from an earlier public-page callback', () => {
    expect(beforeStatisticsSend('event', { url: '/manage/passkeys' })).toBe(false)
    window.history.replaceState({}, '', '/manage')
    expect(beforeStatisticsSend('event', { url: '/review/course/3040' })).toBe(false)
  })

  it('removes management referrers and rejects user identification payloads', () => {
    expect(beforeStatisticsSend('event', { url: '/', referrer: '/manage/users' }))
      .toMatchObject({ referrer: '' })
    expect(beforeStatisticsSend('identify', { url: '/', id: 'user-id' })).toBe(false)
  })
})
