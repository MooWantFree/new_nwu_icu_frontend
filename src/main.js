import { createApp } from 'vue'
import App from './App.vue'
import Router from './router/Router'
import * as Sentry from '@sentry/vue'
import '@/style/style.css'
import { captureActionTokenFromUrl } from '@/lib/actionTokens'
import { redactSensitiveUrl } from '@/lib/security'
import { isManagementPath } from '@/lib/managementRoute'
import { siteConfig } from '@/lib/siteConfig'
import { loadSiteConfigWithRetry } from '@/lib/siteStartup'
import { initializeStatistics } from '@/lib/analytics'

captureActionTokenFromUrl()

const redactSentryEvent = (event) => {
  if (event.request?.url) event.request.url = redactSensitiveUrl(event.request.url)
  if (event.transaction) event.transaction = redactSensitiveUrl(event.transaction)
  for (const breadcrumb of event.breadcrumbs ?? []) {
    if (typeof breadcrumb.data?.url === 'string') {
      breadcrumb.data.url = redactSensitiveUrl(breadcrumb.data.url)
    }
  }
  for (const span of event.spans ?? []) {
    if (typeof span.description === 'string') span.description = redactSensitiveUrl(span.description)
    if (typeof span.data?.url === 'string') span.data.url = redactSensitiveUrl(span.data.url)
  }
  return event
}

async function start() {
  await loadSiteConfigWithRetry(document.querySelector('#app'))
  const app = createApp(App)
  app.use(Router)
  if (import.meta.env.PROD && !isManagementPath(window.location.pathname)) {
    initializeStatistics()
    if (siteConfig.sentry_dsn) Sentry.init({
      app,
      dsn: siteConfig.sentry_dsn,
      integrations: [Sentry.browserTracingIntegration({ Router })],
      tracesSampleRate: 0.1,
      tracePropagationTargets: [window.location.host, /^\/api\//],
      beforeSend: redactSentryEvent,
      beforeSendTransaction: redactSentryEvent,
    })
  }

  // Keep server-rendered resource content visible until its Vue route is ready.
  await Router.isReady()
  app.mount('#app')
}

start().catch(() => {
  document.querySelector('[data-site-loading]')?.remove()
  const error = document.createElement('p')
  error.setAttribute('role', 'alert')
  error.textContent = '页面启动失败。'
  document.querySelector('#app')?.prepend(error)
})
