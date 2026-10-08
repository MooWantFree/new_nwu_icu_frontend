import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, type App } from 'vue'
import { createMemoryHistory, createRouter, RouterView, type RouteLocationRaw } from 'vue-router'
import Page403 from './403.vue'
import Page404 from './404.vue'
import Page500 from './500.vue'

let app: App | undefined
let container: HTMLDivElement

const flush = async () => {
  await new Promise(resolve => setTimeout(resolve, 0))
  for (let index = 0; index < 8; index++) {
    await Promise.resolve()
    await nextTick()
  }
}

const mount = async (path: RouteLocationRaw, props: Record<string, string> = {}) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { render: () => h('p', '主页内容') } },
      { path: '/previous', component: { render: () => h('p', '上一页内容') } },
      { path: '/403', component: Page403, props },
      { path: '/500', component: Page500, props },
      { path: '/:pathMatch(.*)*', component: Page404 },
    ],
  })
  await router.push(path)
  app = createApp(RouterView).use(router)
  app.mount(container)
  await flush()
  return router
}

beforeEach(() => {
  container = document.createElement('div')
  document.body.append(container)
})

afterEach(() => {
  app?.unmount()
  app = undefined
  container.remove()
  vi.restoreAllMocks()
})

describe('error page navigation and messages', () => {
  it('returns to the previous route and to the home route from the 404 page', async () => {
    const router = await mount('/previous')
    await router.push('/missing')
    await flush()
    const go = vi.spyOn(router, 'go')
    const back = [...container.querySelectorAll('button')].find(button => button.textContent?.includes('上一页'))!
    back.click()
    await flush()
    expect(go).toHaveBeenCalledWith(-1)
    expect(router.currentRoute.value.path).toBe('/previous')
    expect(container.textContent).toContain('上一页内容')

    await router.push('/missing-again')
    await flush()
    const push = vi.spyOn(router, 'push')
    const home = [...container.querySelectorAll('button')].find(button => button.textContent?.includes('回到主页'))!
    home.click()
    await flush()
    expect(push).toHaveBeenCalledWith('/')
    expect(router.currentRoute.value.path).toBe('/')
    expect(container.textContent).toContain('主页内容')
  })

  it('keeps the 403 message as plain text and provides a home link', async () => {
    const message = '<img src=x onerror=alert(1)>权限不足'
    const router = await mount('/403', { message })
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(message)
    expect(container.querySelector('img')).toBeNull()
    const home = container.querySelector<HTMLAnchorElement>('a[href="/"]')!
    expect(home.textContent).toContain('返回主页')
    home.click()
    await flush()
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('renders 500 query arrays with malformed encoding, null entries and HTML safely', async () => {
    await mount({
      path: '/500',
      query: { message: ['%E0%A4%A', null, '%E5%AD%97%E7%AC%A6', '<script>alert(1)</script>'] },
    })
    const message = container.querySelector('[role="alert"]')!
    expect(message.textContent).toContain('%E0%A4%A\n字符\n<script>alert(1)</script>')
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('a[href="/"]')?.textContent).toContain('返回主页')
  })

  it('uses an embedded course or teacher detail message before the route query', async () => {
    await mount({ path: '/500', query: { message: '链接中的说明' } }, { detail: '网络临时故障，进度 100%' })
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('网络临时故障，进度 100%')
    expect(container.textContent).not.toContain('链接中的说明')
  })

  it('updates a reused 500 page when the query message changes and clears absent messages', async () => {
    const router = await mount({ path: '/500', query: { message: '%E6%9A%82%E6%97%B6%E9%94%99%E8%AF%AF' } })
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('暂时错误')
    await router.push({ path: '/500', query: { message: '新错误 100%' } })
    await flush()
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('新错误 100%')
    await router.push('/500')
    await flush()
    expect(container.querySelector('[role="alert"]')).toBeNull()
  })
})
