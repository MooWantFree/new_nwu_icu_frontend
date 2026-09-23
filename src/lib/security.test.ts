import { beforeEach, describe, expect, it, vi } from 'vitest'

import { hasUnsafeUrlCharacters, openSafeExternalUrl, redactSensitiveUrl, toSafeExternalUrl } from './security'

describe('security URL helpers', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/safe-page')
  })

  it('redacts action tokens in query strings and API paths', () => {
    expect(redactSensitiveUrl('/user/activate?token=secret&next=/')).toBe(
      '/user/activate?token=%5BREDACTED%5D&next=%2F',
    )
    expect(redactSensitiveUrl('/api/user/mail-reset/secret-token/')).toBe(
      '/api/user/mail-reset/[REDACTED]/',
    )
  })

  it('redacts action tokens in URL fragments', () => {
    expect(redactSensitiveUrl('/user/activate#token=secret')).toBe(
      '/user/activate#token=%5BREDACTED%5D',
    )
  })

  it('allows only HTTP and HTTPS external URLs', () => {
    expect(toSafeExternalUrl('https://example.com/file')).toBe('https://example.com/file')
    expect(toSafeExternalUrl('javascript:alert(1)')).toBeNull()
    expect(toSafeExternalUrl('data:text/html,hello')).toBeNull()
  })

  it('matches the server URL guard for whitespace, controls, and backslashes', () => {
    expect(hasUnsafeUrlCharacters('/announcements/1')).toBe(false)
    expect(hasUnsafeUrlCharacters('https://example.com/a b')).toBe(true)
    expect(hasUnsafeUrlCharacters('https://example.com/a\u00a0b')).toBe(true)
    expect(hasUnsafeUrlCharacters('/path\nnext')).toBe(true)
    expect(hasUnsafeUrlCharacters('/\\evil.example')).toBe(true)
  })

  it('opens safe URLs without giving the new page an opener', () => {
    const openedWindow = { opener: window } as unknown as Window
    const open = vi.spyOn(window, 'open').mockReturnValue(openedWindow)

    expect(openSafeExternalUrl('https://example.com')).toBe(true)
    expect(open).toHaveBeenCalledWith(
      'https://example.com/',
      '_blank',
      'noopener,noreferrer',
    )
    expect(openedWindow.opener).toBeNull()
    expect(openSafeExternalUrl('javascript:alert(1)')).toBe(false)
  })
})
