export type ActionTokenPurpose = 'password-reset' | 'account-activation' | 'college-email-bind'

const actionTokens = new Map<ActionTokenPurpose, string>()

const purposeForPath = (pathname: string): ActionTokenPurpose | null => {
  const normalizedPath = pathname.replace(/\/+$/, '')
  if (normalizedPath === '/user/forget-password') return 'password-reset'
  if (normalizedPath === '/user/activate') return 'account-activation'
  if (normalizedPath === '/user/bind-college-email' || normalizedPath === '/user/bind-college-mail') {
    return 'college-email-bind'
  }
  return null
}

export const captureActionTokenFromUrl = (): void => {
  const purpose = purposeForPath(window.location.pathname)
  if (!purpose) return

  const url = new URL(window.location.href)
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''))
  const token = hashParams.get('token') || url.searchParams.get('token')
  if (!token) return

  actionTokens.set(purpose, token)
  url.searchParams.delete('token')
  hashParams.delete('token')
  url.hash = hashParams.toString() ? `#${hashParams.toString()}` : ''
  window.history.replaceState(
    window.history.state,
    '',
    `${url.pathname}${url.search}${url.hash}`,
  )
}

export const getActionToken = (
  purpose: ActionTokenPurpose,
  fallback?: unknown,
): string => {
  const capturedToken = actionTokens.get(purpose)
  if (capturedToken) return capturedToken
  return typeof fallback === 'string' ? fallback : ''
}

export const clearActionToken = (purpose: ActionTokenPurpose): void => {
  actionTokens.delete(purpose)
}
