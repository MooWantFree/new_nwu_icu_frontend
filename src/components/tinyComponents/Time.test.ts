import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick, type App } from 'vue'
import Time from './Time.vue'

let app: App | undefined
let host: HTMLDivElement
const flush = async () => { for (let index = 0; index < 10; index++) { await Promise.resolve(); await nextTick() } }
const mount = async (time: string, mode?: 'message') => {
  app = createApp(Time, { time, mode })
  app.mount(host); await flush()
  return host.querySelector<HTMLElement>('.app-time')!
}
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-08T14:30:00'))
  host = document.createElement('div'); document.body.append(host)
})
afterEach(() => {
  app?.unmount(); app = undefined; host.remove()
  vi.clearAllTimers(); vi.useRealTimers()
})
describe('Time', () => {
  it('updates Chinese relative times and exposes the full date on keyboard focus', async () => {
    const trigger = await mount('2026-10-08T14:25:00')
    expect(trigger.textContent?.trim()).toBe('5 分钟前')
    await vi.advanceTimersByTimeAsync(5 * 60_000); await flush()
    expect(trigger.textContent?.trim()).toBe('10 分钟前')
    trigger.focus(); await flush()
    expect(document.body.querySelector('[role="tooltip"]')?.textContent?.trim()).toBe('2026-10-08 14:25:00')
  })
  it('uses today only until the local day changes', async () => {
    vi.setSystemTime(new Date('2026-10-08T23:59:30'))
    const trigger = await mount('2026-10-08T14:25:00', 'message')
    expect(trigger.textContent?.trim()).toBe('今天 14:25')
    await vi.advanceTimersByTimeAsync(60_000); await flush()
    expect(trigger.textContent?.trim()).toBe('2026年10月8日 14:25')
  })
  it('handles invalid dates without exposing Invalid Date', async () => {
    const trigger = await mount('invalid-date')
    expect(trigger.textContent?.trim()).toBe('时间未知')
  })
})
