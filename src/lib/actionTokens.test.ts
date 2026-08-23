import { beforeEach, describe, expect, it } from 'vitest'

import { captureActionTokenFromUrl, clearActionToken, getActionToken } from './actionTokens'

describe('action token capture', () => {
  beforeEach(() => {
    for (const purpose of ['password-reset', 'account-activation', 'college-email-bind'] as const) {
      clearActionToken(purpose)
    }
  })

  it('removes a reset token from the visible URL while keeping it in memory', () => {
    window.history.replaceState({}, '', '/user/forget-password?source=email#token=secret')

    captureActionTokenFromUrl()

    expect(window.location.href).not.toContain('secret')
    expect(window.location.search).toBe('?source=email')
    expect(window.location.hash).toBe('')
    expect(getActionToken('password-reset')).toBe('secret')
  })

  it('supports both college-email route spellings', () => {
    window.history.replaceState({}, '', '/user/bind-college-email/#token=bind-secret')
    captureActionTokenFromUrl()
    expect(getActionToken('college-email-bind')).toBe('bind-secret')
  })

  it('still accepts legacy query-string links and removes the token', () => {
    window.history.replaceState({}, '', '/user/activate?token=legacy-secret')
    captureActionTokenFromUrl()
    expect(window.location.search).toBe('')
    expect(getActionToken('account-activation')).toBe('legacy-secret')
  })
})
