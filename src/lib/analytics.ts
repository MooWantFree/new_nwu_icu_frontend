import { isManagementPath } from './managementRoute'
import { redactSensitiveUrl } from './security'

import { siteConfig } from './siteConfig'

const statisticsUrl = (value: string): string => {
  if (!value) return ''
  const url = new URL(redactSensitiveUrl(value), window.location.origin)
  if (isManagementPath(url.pathname) || url.pathname.startsWith('/admin/')) return ''
  // Search terms and account-action parameters do not belong in visit statistics.
  url.search = ''
  url.hash = ''
  url.username = ''
  url.password = ''
  return url.origin === window.location.origin ? url.pathname : url.toString()
}

export const beforeStatisticsSend = (type: string, payload: Record<string, unknown>) => {
  if (type !== 'event' || isManagementPath(window.location.pathname)) return false
  if (typeof payload.url !== 'string') return false
  try {
    const url = statisticsUrl(payload.url)
    if (!url) return false
    return {
      ...payload,
      url,
      referrer: typeof payload.referrer === 'string' ? statisticsUrl(payload.referrer) : '',
    }
  } catch {
    return false
  }
}

export const initializeStatistics = () => {
  const { website_id: websiteId, domains } = siteConfig.analytics
  if (!websiteId || !domains.includes(window.location.hostname) || isManagementPath(window.location.pathname)) return
  const statsWindow = window as Window & { nwuBeforeStatisticsSend?: typeof beforeStatisticsSend }
  statsWindow.nwuBeforeStatisticsSend = beforeStatisticsSend
  const script = document.createElement('script')
  script.defer = true
  script.src = '/_site/client.js'
  script.dataset.websiteId = websiteId
  script.dataset.domains = domains.join(',')
  script.dataset.excludeSearch = 'true'
  script.dataset.excludeHash = 'true'
  script.dataset.doNotTrack = 'true'
  script.dataset.beforeSend = 'nwuBeforeStatisticsSend'
  document.head.appendChild(script)
}
