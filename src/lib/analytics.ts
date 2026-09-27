import { isManagementPath } from './managementRoute'
import { redactSensitiveUrl } from './security'

const websiteId = '0d15e201-f875-4dd3-a36e-41b60243817d'

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
  if (window.location.hostname !== 'nwu.icu' || isManagementPath(window.location.pathname)) return
  const statsWindow = window as Window & { nwuBeforeStatisticsSend?: typeof beforeStatisticsSend }
  statsWindow.nwuBeforeStatisticsSend = beforeStatisticsSend
  const script = document.createElement('script')
  script.defer = true
  script.src = '/_site/client.js'
  script.dataset.websiteId = websiteId
  script.dataset.domains = 'nwu.icu'
  script.dataset.excludeSearch = 'true'
  script.dataset.excludeHash = 'true'
  script.dataset.doNotTrack = 'true'
  script.dataset.beforeSend = 'nwuBeforeStatisticsSend'
  document.head.appendChild(script)
}
