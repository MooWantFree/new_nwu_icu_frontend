const SENSITIVE_QUERY_KEYS = new Set(['token'])
const SENSITIVE_PATH_PATTERNS = [
  /(\/api\/user\/mail-reset\/)[^/?#]+/gi,
]

export const redactSensitiveUrl = (rawUrl: string): string => {
  if (!rawUrl) return rawUrl

  let redacted = rawUrl
  for (const pattern of SENSITIVE_PATH_PATTERNS) {
    redacted = redacted.replace(pattern, '$1[REDACTED]')
  }

  try {
    const base = typeof window === 'undefined' ? 'https://localhost' : window.location.origin
    const parsed = new URL(redacted, base)
    for (const key of SENSITIVE_QUERY_KEYS) {
      if (parsed.searchParams.has(key)) parsed.searchParams.set(key, '[REDACTED]')
    }
    const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ''))
    for (const key of SENSITIVE_QUERY_KEYS) {
      if (hashParams.has(key)) hashParams.set(key, '[REDACTED]')
    }
    if (hashParams.has('token')) parsed.hash = hashParams.toString()
    return /^[a-z][a-z\d+.-]*:/i.test(rawUrl)
      ? parsed.toString()
      : `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return redacted.replace(/([?&#]token=)[^&#]*/gi, '$1[REDACTED]')
  }
}

export const toSafeExternalUrl = (rawUrl: unknown): string | null => {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) return null
  try {
    const url = new URL(rawUrl, window.location.origin)
    if (!['https:', 'http:'].includes(url.protocol)) return null
    return url.toString()
  } catch {
    return null
  }
}

export const openSafeExternalUrl = (rawUrl: string): boolean => {
  const safeUrl = toSafeExternalUrl(rawUrl)
  if (!safeUrl) return false
  const openedWindow = window.open(safeUrl, '_blank', 'noopener,noreferrer')
  if (openedWindow) openedWindow.opener = null
  return true
}
