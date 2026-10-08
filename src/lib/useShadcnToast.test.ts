import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, type App } from 'vue'
import ShadcnFeedbackProvider from '@/components/common/ShadcnFeedbackProvider.vue'
import type { MessageApi } from './useShadcnToast'
import { useShadcnToast } from './useShadcnToast'

let app: App | undefined
let host: HTMLDivElement

const flush = async () => {
  for (let index = 0; index < 10; index++) { await Promise.resolve(); await nextTick() }
}

const settle = async () => {
  await flush()
  await vi.advanceTimersByTimeAsync(100)
  await flush()
}

const notifications = () => [...document.body.querySelectorAll<HTMLElement>('[role="status"], [role="alert"]')]
const notification = (content: string) => notifications().find(element => element.textContent?.includes(content))

const mountProvider = async () => {
  let toast!: MessageApi
  const Consumer = defineComponent({
    setup: () => {
      toast = useShadcnToast()
      return () => null
    },
  })
  app = createApp({ render: () => h(ShadcnFeedbackProvider, { max: 3 }, { default: () => h(Consumer) }) })
  app.mount(host)
  await flush()
  return toast
}

beforeEach(() => {
  vi.useFakeTimers()
  host = document.createElement('div')
  document.body.append(host)
})

afterEach(() => {
  app?.unmount()
  app = undefined
  host.remove()
  vi.clearAllTimers()
  vi.useRealTimers()
})

describe('useShadcnToast', () => {
  it('pauses expiry until both hover and keyboard focus leave the toast', async () => {
    const toast = await mountProvider()
    toast.info('交互中的通知', { duration: 1000 })
    await flush()
    const target = notification('交互中的通知')!
    const wrapper = target.parentElement!
    wrapper.dispatchEvent(new MouseEvent('mouseenter'))
    const close = target.querySelector<HTMLButtonElement>('button')!
    close.focus()
    wrapper.dispatchEvent(new MouseEvent('mouseleave'))
    await vi.advanceTimersByTimeAsync(1500)
    await flush()
    expect(notification('交互中的通知')).toBeDefined()
    close.blur()
    await vi.advanceTimersByTimeAsync(1100)
    await flush()
    expect(notification('交互中的通知')).toBeUndefined()
  })
  it('closes only the chosen toast through the provider lifecycle and keeps remaining messages usable', async () => {
    const toast = await mountProvider()
    const onClose = vi.fn(), onLeave = vi.fn(), onAfterLeave = vi.fn()
    const first = toast.success('第一条保存成功', { duration: 0 })
    toast.error('第二条保存失败', { duration: 0, onClose, onLeave, onAfterLeave })
    const third = toast.info('第三条提示', { duration: 0 })
    await settle()
    expect(notifications()).toHaveLength(3)

    const close = notification('第二条保存失败')!.querySelector<HTMLButtonElement>('button[aria-label="关闭通知"]')!
    close.focus()
    expect(document.activeElement).toBe(close)
    close.click()
    await settle()
    expect(onClose).toHaveBeenCalledOnce()
    expect(onLeave).toHaveBeenCalledOnce()
    expect(onAfterLeave).toHaveBeenCalledOnce()
    expect(notifications().map(element => element.textContent)).toEqual(['第一条保存成功', '第三条提示'])

    first.destroy()
    await settle()
    expect(notifications().map(element => element.textContent)).toEqual(['第三条提示'])
    third.content = '更新后的提示'
    await flush()
    expect(notification('更新后的提示')).toBeDefined()
    toast.destroyAll()
    await settle()
    expect(notifications()).toHaveLength(0)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it.each([
    { type: 'success' as const, duration: 4000, options: undefined },
    { type: 'error' as const, duration: 6000, options: undefined },
    { type: 'warning' as const, duration: 1200, options: { duration: 1200 } },
  ])('expires $type messages using the default or supplied duration', async ({ type, duration, options }) => {
    const toast = await mountProvider()
    const message = toast[type]('定时通知', options)
    expect(message.duration).toBe(duration)
    await settle()
    await vi.advanceTimersByTimeAsync(duration - 200)
    await flush()
    expect(notification('定时通知')).toBeDefined()
    await vi.advanceTimersByTimeAsync(300)
    await flush()
    expect(notification('定时通知')).toBeUndefined()
  })

  it('keeps the provider limit and removes a closed message without deleting another toast', async () => {
    const toast = await mountProvider()
    for (const content of ['第一条', '第二条', '第三条', '第四条']) {
      toast.info(content, { duration: 0 })
      await settle()
    }
    expect(notifications().map(element => element.textContent)).toEqual(['第二条', '第三条', '第四条'])
    notification('第三条')!.querySelector<HTMLButtonElement>('button[aria-label="关闭通知"]')!.click()
    await settle()
    expect(notifications().map(element => element.textContent)).toEqual(['第二条', '第四条'])
    toast.success('第五条', { duration: 0 })
    await settle()
    expect(notifications().map(element => element.textContent)).toEqual(['第二条', '第四条', '第五条'])
  })

  it('announces each notification once and supports content renderers and non-closable messages', async () => {
    const toast = await mountProvider()
    toast.success('保存成功', { duration: 0 })
    toast.error('保存失败', { duration: 0 })
    toast.info(() => h('strong', '渲染内容'), { duration: 0, closable: false })
    await settle()
    expect(notification('保存成功')!.getAttribute('role')).toBe('status')
    expect(notification('保存失败')!.getAttribute('role')).toBe('alert')
    expect(notification('渲染内容')!.querySelector('strong')?.textContent).toBe('渲染内容')
    expect(notification('渲染内容')!.querySelector('button')).toBeNull()
    for (const element of notifications()) {
      expect(element.hasAttribute('aria-live')).toBe(false)
      expect(element.querySelector('[aria-live], [role="alert"], [role="status"]')).toBeNull()
      expect(element.querySelector('svg')?.closest('[aria-hidden="true"]')).not.toBeNull()
    }
  })
})
