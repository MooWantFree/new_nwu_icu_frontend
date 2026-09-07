import { createApp } from 'vue'
import App from './App.vue'
import Router from './router/Router'
import naive from 'naive-ui'
import VueGtag from 'vue-gtag'
import * as Sentry from '@sentry/vue'
import '@/style/style.css'
import { captureActionTokenFromUrl } from '@/lib/actionTokens'
import { redactSensitiveUrl } from '@/lib/security'
import { isManagementPath } from '@/lib/managementRoute'

captureActionTokenFromUrl()
const app = createApp(App)
app.use(Router)
app.use(naive)

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

if (import.meta.env.PROD && !isManagementPath(window.location.pathname)) {
  app.use(VueGtag, {
    config: { id: 'G-MYB5VKYR7S' },
  })
  Sentry.init({
    app,
    dsn: 'https://70fa0bc07f114e538288ace62c87faa5@o971270.ingest.us.sentry.io/5923395',
    integrations: [Sentry.browserTracingIntegration({ Router })],
    tracesSampleRate: 0.1,
    tracePropagationTargets: [window.location.host, /^\/api\//],
    beforeSend: redactSentryEvent,
    beforeSendTransaction: redactSentryEvent,
  })
}

app.mount('#app')
