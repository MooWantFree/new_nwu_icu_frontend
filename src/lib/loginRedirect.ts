import type { LocationQueryValue, Router } from 'vue-router'

export const DEFAULT_LOGIN_REASON = '请先登录或注册，再继续访问此页面'
export const DEFAULT_LOGIN_SUCCESS_MESSAGE = '登录成功'

const intentMessages = {
  guestbook: {
    reason: '请先登录，再参与留言板讨论',
    successMessage: '登录成功，正在返回留言板',
  },
  announcements: {
    reason: '请先登录，再参与公告栏讨论',
    successMessage: '登录成功，正在返回公告栏',
  },
} as const

type LoginIntent = keyof typeof intentMessages
type LoginQueryValue = LocationQueryValue | LocationQueryValue[] | undefined

const getLoginIntent = (intent: LoginQueryValue): LoginIntent | undefined =>
  intent === 'guestbook' || intent === 'announcements' ? intent : undefined

export const getSafeLoginRedirect = (
  redirect: LoginQueryValue,
): string => typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
  ? redirect
  : '/'

export const resolveLoginContext = (
  router: Router,
  redirect: LoginQueryValue,
  intent: LoginQueryValue,
) => {
  const safeRedirect = getSafeLoginRedirect(redirect)
  const targetMeta = router.resolve(safeRedirect).meta
  const trustedIntent = getLoginIntent(intent)
  const intentMessage = trustedIntent ? intentMessages[trustedIntent] : undefined
  const routeReason = typeof targetMeta.loginReason === 'string' ? targetMeta.loginReason : undefined
  const routeSuccessMessage = typeof targetMeta.loginSuccessMessage === 'string'
    ? targetMeta.loginSuccessMessage
    : undefined

  return {
    redirect: safeRedirect,
    reason: routeReason ?? intentMessage?.reason ?? DEFAULT_LOGIN_REASON,
    successMessage:
      routeSuccessMessage
      ?? intentMessage?.successMessage
      ?? DEFAULT_LOGIN_SUCCESS_MESSAGE,
  }
}
