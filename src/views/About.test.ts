import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, type App } from 'vue'

import About from './About.vue'
import { api } from '@/lib/requests'

vi.mock('@/lib/requests', () => ({ api: { get: vi.fn() } }))

let app: App | undefined
let container: HTMLDivElement

const mountAbout = async () => {
  container = document.createElement('div')
  document.body.append(container)
  app = createApp({ render: () => h(About) })
  app.mount(container)
  for (let index = 0; index < 8; index += 1) {
    await Promise.resolve()
    await nextTick()
  }
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
      content: { about: `<p>本站介绍</p><img src="${image}" data-size="50"><img src="https://evil.example/image.png"><script>alert(1)</script>` },
    } as never)
    await mountAbout()

    expect(container.querySelector('h1')?.textContent).toBe('关于本站')
    expect(container.querySelector('.about-content')?.textContent).toContain('本站介绍')
    expect(container.querySelectorAll('.about-content img')).toHaveLength(1)
    expect(container.querySelector('.about-content img')?.getAttribute('data-size')).toBe('50')
    expect(container.querySelector('.about-content script')).toBeNull()
  })

  it('shows an empty state when no content has been saved', async () => {
    vi.mocked(api.get).mockResolvedValue({ status: 200, content: { about: '' } } as never)
    await mountAbout()

    expect(container.textContent).toContain('内容正在完善。')
  })
})
