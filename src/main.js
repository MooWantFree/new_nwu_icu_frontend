import { createApp } from 'vue'
import App from './App.vue'
import Router from './router/Router'
import naive from 'naive-ui'
import VueApexCharts from 'vue3-apexcharts'
import VueGtag from 'vue-gtag'
import * as Sentry from '@sentry/vue'
import '@/style/style.css'

const app = createApp(App)
app.use(Router)
app.use(VueApexCharts)
app.use(VueGtag, {
  config: { id: 'G-MYB5VKYR7S' },
})
app.use(naive)
Sentry.init({
  app,
  dsn: 'https://70fa0bc07f114e538288ace62c87faa5@o971270.ingest.us.sentry.io/5923395',
  integrations: [
    Sentry.browserTracingIntegration({ Router }),
    Sentry.replayIntegration(),
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
  tracesSampleRate: 1.0,

  // Set `tracePropagationTargets` to control for which URLs trace propagation should be enabled
  // tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],

  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/session-replay/configuration/#general-integration-configuration
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})

app.mount('#app')
