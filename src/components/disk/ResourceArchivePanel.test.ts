import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref, type App } from 'vue'
import ResourceArchivePanel from './ResourceArchivePanel.vue'
import { useResourceArchives, type ArchiveController } from '@/lib/useResourceArchives'
import type { ArchiveTask } from '@/types/api/resourceArchives'

vi.mock('@/lib/useShadcnToast', () => ({ useShadcnToast: () => ({ warning: vi.fn() }) }))

let app: App | undefined
let host: HTMLDivElement
let trigger: HTMLButtonElement
let control: ArchiveController
let originalOverflow: string
const flush = async () => { await nextTick(); await nextTick() }
const readyTask: ArchiveTask = {
  id: 'task', status: 'ready', file_count: 2, paths: ['/a', '/b'], source_bytes: 20,
  zip_bytes: 10, processed_bytes: 20, processed_files: 2, ahead: 0,
  expires_at: null, created_at: '', filename: '资料.zip', message: '',
}

beforeEach(() => {
  originalOverflow = document.body.style.overflow
  host = document.createElement('div')
  trigger = document.createElement('button')
  trigger.textContent = '打包下载'
  document.body.append(trigger, host)
  trigger.focus()
})
afterEach(() => {
  app?.unmount()
  app = undefined
  host.remove()
  trigger.remove()
  document.body.style.overflow = originalOverflow
})
function mount(open = true) {
  app = createApp({
    setup() {
      control = useResourceArchives(ref([]), ref('/'))
      control.state.panel = open
      control.state.tasks = [readyTask]
      return () => h(ResourceArchivePanel, { control })
    },
  })
  app.mount(host)
}

describe('ResourceArchivePanel keyboard and page state', () => {
  it('focuses an initially open panel and restores the trigger and prior scroll state on close', async () => {
    document.body.style.overflow = 'clip'
    mount()
    await flush()
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.activeElement).toBe(document.querySelector('[role="dialog"]'))
    document.querySelector<HTMLButtonElement>('[aria-label="关闭打包窗口"]')!.click()
    await flush()
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(document.body.style.overflow).toBe('clip')
    expect(document.activeElement).toBe(trigger)
  })

  it('cycles keyboard focus from the panel and both ends of its controls', async () => {
    mount()
    await flush()
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!
    const first = dialog.querySelector<HTMLButtonElement>('[aria-label="关闭打包窗口"]')!
    const last = [...dialog.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')].at(-1)!
    const tab = (shiftKey = false) => dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true }))
    expect(tab()).toBe(false)
    expect(document.activeElement).toBe(first)
    expect(tab(true)).toBe(false)
    expect(document.activeElement).toBe(last)
    expect(tab()).toBe(false)
    expect(document.activeElement).toBe(first)
  })

  it('restores an existing body scroll style when the open panel unmounts', async () => {
    document.body.style.overflow = 'auto'
    mount(false)
    await flush()
    expect(document.body.style.overflow).toBe('auto')
    control.state.panel = true
    await flush()
    expect(document.body.style.overflow).toBe('hidden')
    app!.unmount()
    app = undefined
    expect(document.body.style.overflow).toBe('auto')
    expect(document.activeElement).toBe(trigger)
  })
})
