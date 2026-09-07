import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick, type App } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import NavMenu from './NavMenu.vue'

const menuItems = [
  {
    key: 'courseReview',
    text: '课程评价',
    path: '/review/timeline',
    children: [
      { key: 'reviewTimeline', text: '时间线', path: '/review/timeline' },
      { key: 'reviewCourse', text: '课程', path: '/review/course' },
    ],
  },
]

let app: App | undefined
let container: HTMLDivElement

const flush = async () => {
  for (let index = 0; index < 10; index += 1) {
    await Promise.resolve()
    await nextTick()
  }
}

beforeEach(() => {
  container = document.createElement('div')
  document.body.append(container)
})

afterEach(() => {
  app?.unmount()
  app = undefined
  container.remove()
})

describe('NavMenu', () => {
  it('navigates from the parent label and opens the submenu only from the arrow button', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { render: () => null } },
        { path: '/review/timeline', component: { render: () => null } },
        { path: '/review/course', component: { render: () => null } },
      ],
    })
    await router.push('/')
    await router.isReady()

    app = createApp({ render: () => h(NavMenu, { menuItems }) }).use(router)
    app.mount(container)

    const label = container.querySelector<HTMLAnchorElement>('a[href="/review/timeline"]')
    const toggle = container.querySelector<HTMLButtonElement>('button[aria-label="展开课程评价菜单"]')
    const submenu = container.querySelector<HTMLElement>('.absolute')

    expect(label?.getAttribute('href')).toBe('/review/timeline')
    expect(toggle?.getAttribute('aria-expanded')).toBe('false')
    expect(submenu?.style.display).toBe('none')

    toggle?.click()
    await flush()

    expect(router.currentRoute.value.path).toBe('/')
    expect(toggle?.getAttribute('aria-expanded')).toBe('true')
    expect(submenu?.style.display).not.toBe('none')

    label?.click()
    await flush()

    expect(toggle?.getAttribute('aria-expanded')).toBe('false')
    expect(submenu?.style.display).toBe('none')
  })
})
