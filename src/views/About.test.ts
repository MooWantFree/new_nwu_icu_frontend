import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, type App } from 'vue'

import About from './About.vue'
import { api } from '@/lib/requests'

vi.mock('@/lib/requests', () => ({ api: { get: vi.fn() } }))

let app: App | undefined
let container: HTMLDivElement

const flush = async () => {
  for (let index = 0; index < 8; index += 1) {
    await Promise.resolve()
    await nextTick()
  }
}

const mountAbout = async () => {
  container = document.createElement('div')
  document.body.append(container)
  app = createApp({ render: () => h(About) })
  app.mount(container)
  await flush()
}

afterEach(() => {
  app?.unmount()
  container?.remove()
  vi.clearAllMocks()
})

describe('about page', () => {
  it('shows the page shell and a content skeleton while the request is pending', async () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}) as never)
    await mountAbout()

    expect(container.querySelector('h1')?.textContent).toBe('关于本站')
    expect(container.querySelector('[role="status"][aria-label="正在加载关于本站"]')).not.toBeNull()
    expect(container.querySelectorAll('[role="status"] [aria-hidden="true"]')).toHaveLength(4)
    expect(container.textContent).not.toContain('加载中...')
    expect(container.textContent).not.toContain('内容正在完善。')
  })

  it('renders announcement formatting and removes unsafe media', async () => {
    const image = '/api/download/4c1ab45d-2bb7-4a2c-9bea-3bfb697f1271/'
    vi.mocked(api.get).mockResolvedValue({
      status: 200,
      content: { about: `<p>本站介绍 <a href="/review/timeline?from=about#latest">评价时间线</a> <a href="https://www.nwu.edu.cn/">学校官网</a></p><img src="${image}" data-size="50"><img src="https://evil.example/image.png"><script>alert(1)</script>` },
    } as never)
    await mountAbout()

    expect(container.querySelector('h1')?.textContent).toBe('关于本站')
    expect(container.querySelector('.about-content')?.textContent).toContain('本站介绍')
    expect(container.querySelectorAll('.about-content img')).toHaveLength(1)
    expect(container.querySelector('.about-content img')?.getAttribute('data-size')).toBe('50')
    expect(container.querySelector('.about-content script')).toBeNull()
    const links = container.querySelectorAll<HTMLAnchorElement>('.about-content a')
    expect(links[0].getAttribute('href')).toBe('/review/timeline?from=about#latest')
    expect(links[1].getAttribute('href')).toBe('https://www.nwu.edu.cn/')
    expect(links[1].getAttribute('target')).toBe('_blank')
    expect(links[1].getAttribute('rel')).toContain('noopener')
  })

  it('shows an empty state when no content has been saved', async () => {
    vi.mocked(api.get).mockResolvedValue({ status: 200, content: { about: '' } } as never)
    await mountAbout()

    expect(container.textContent).toContain('内容正在完善。')
  })

  it.each(['server failure', 'network failure'] as const)('shows %s and allows one pending retry at a time', async failure => {
    if (failure === 'server failure') {
      vi.mocked(api.get).mockResolvedValue({ status: 503, content: {} } as never)
    } else {
      vi.mocked(api.get).mockRejectedValue(new Error('网络连接已断开'))
    }
    await mountAbout()
    const message = failure === 'server failure' ? '关于本站加载失败，请稍后重试。' : '网络连接已断开'
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(message)
    const retry = container.querySelector<HTMLButtonElement>('button')!
    expect(retry.textContent?.trim()).toBe('重试')
    let resolve!: (value: never) => void
    vi.mocked(api.get).mockReturnValueOnce(new Promise<never>(accept => { resolve = accept }))
    retry.click()
    retry.click()
    await flush()
    expect(api.get).toHaveBeenCalledTimes(2)
    expect(api.get).toHaveBeenNthCalledWith(2, { url: '/api/about/' })
    expect(container.querySelector('[role="status"][aria-label="正在加载关于本站"]')).not.toBeNull()
    expect(container.querySelector('[role="alert"]')).toBeNull()
    resolve({ status: 200, content: { about: '<p>重试后加载成功</p>' } } as never)
    await flush()
    expect(container.querySelector('.about-content')?.textContent).toBe('重试后加载成功')
    expect(container.querySelector('[role="status"]')).toBeNull()
    expect(container.querySelector('[role="alert"]')).toBeNull()
    expect(api.get).toHaveBeenCalledTimes(2)
  })
})
