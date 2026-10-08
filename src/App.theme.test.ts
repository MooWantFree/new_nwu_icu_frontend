import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick, type App as VueApp } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from './App.vue'

vi.mock('@/components/NavBar.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/common/CaptchaChallenge.vue', () => ({ default: { render: () => null } }))

let app: VueApp | undefined
let host: HTMLDivElement | undefined
const previousTheme = document.documentElement.getAttribute('data-ui-theme')

afterEach(() => {
  app?.unmount()
  app = undefined
  host?.remove()
  if (previousTheme === null) document.documentElement.removeAttribute('data-ui-theme')
  else document.documentElement.setAttribute('data-ui-theme', previousTheme)
  vi.unstubAllEnvs()
})

describe('application theme scope', () => {
  it('keeps management on the existing theme while public and error routes use Shadcn', async () => {
    vi.stubEnv('VITE_FRONTEND_COMMIT', 'unknown')
    vi.stubEnv('VITE_BACKEND_COMMIT', 'unknown')
    const component = { render: () => null }
    const router = createRouter({ history: createMemoryHistory(), routes: [
      { path: '/', component },
      { path: '/500', component },
      { path: '/manage', component, meta: { isManagement: true } },
    ] })
    await router.push('/manage')
    host = document.createElement('div')
    document.body.append(host)
    app = createApp(App).use(router)
    app.mount(host)
    expect(document.documentElement.dataset.uiTheme).toBe('management')
    expect(host.querySelector('.bg-gray-50')).not.toBeNull()

    await router.push('/500')
    await nextTick()
    expect(document.documentElement.dataset.uiTheme).toBe('shadcn')
    expect(host.querySelector('.home-shell.bg-zinc-50')).not.toBeNull()

    await router.push('/manage')
    await nextTick()
    expect(document.documentElement.dataset.uiTheme).toBe('management')
    await router.push('/')
    await nextTick()
    expect(document.documentElement.dataset.uiTheme).toBe('shadcn')
    app.unmount()
    app = undefined
    expect(document.documentElement.getAttribute('data-ui-theme')).toBe(previousTheme)
  })
})
