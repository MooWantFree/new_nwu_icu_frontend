export type CaptchaScope = 'login' | 'review_write' | 'guestbook_write' | 'reply_write' | 'catalog_write' | 'resource_download'

type ChallengeHandler = (scope: CaptchaScope) => Promise<string | null>

let handler: ChallengeHandler | undefined
const allowedScopes = new Set<CaptchaScope>([
  'login',
  'review_write',
  'guestbook_write',
  'reply_write',
  'catalog_write',
  'resource_download',
])

export function registerCaptchaChallengeHandler(next?: ChallengeHandler) {
  handler = next
}

export async function requestCaptchaProof(scope: string): Promise<string | null> {
  if (!handler || !allowedScopes.has(scope as CaptchaScope)) return null
  return handler(scope as CaptchaScope)
}
