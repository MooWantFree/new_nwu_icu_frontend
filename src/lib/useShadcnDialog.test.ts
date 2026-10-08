import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref, type App } from 'vue'
import { NDialogProvider } from 'naive-ui'
import { useShadcnDialog } from './useShadcnDialog'

let app: App | undefined
let container: HTMLDivElement
const flush = async () => {
  for (let index = 0; index < 10; index++) { await Promise.resolve(); await nextTick() }
}
const settle = async () => { await flush(); await vi.advanceTimersByTimeAsync(350); await flush() }
const dialog = () => document.body.querySelector<HTMLElement>('[role="dialog"]')
const expectDialogSemantics = (title: string, description: string) => {
  const target = document.body.querySelector<HTMLElement>(`[role="dialog"][aria-label="${title}"]`)
  expect(target).not.toBeNull()
  expect(target!.getAttribute('aria-modal')).toBe('true')
  const descriptionId = target!.getAttribute('aria-describedby')
  expect(descriptionId).toBeTruthy()
  const descriptionNode = document.getElementById(descriptionId!)
  expect(target!.contains(descriptionNode)).toBe(true)
  expect(descriptionNode?.textContent).toBe(description)
  return descriptionId
}
const button = (label: string) => {
  const target = [...document.body.querySelectorAll<HTMLButtonElement>('button')]
    .find(candidate => candidate.textContent?.trim() === label || candidate.getAttribute('aria-label') === label)
  if (!target) throw new Error(`Missing dialog button: ${label}`)
  return target
}
const mount = async () => {
  let api!: ReturnType<typeof useShadcnDialog>
  const opened = ref(true)
  const Consumer = defineComponent({ setup() { api = useShadcnDialog(); return () => null } })
  app = createApp({ render: () => h(NDialogProvider, null, {
    default: () => [h('button', { id: 'dialog-trigger' }, '打开'), opened.value ? h(Consumer) : null],
  }) })
  app.mount(container)
  await flush()
  return { api, opened }
}
beforeEach(() => {
  vi.useFakeTimers()
  container = document.createElement('div')
  document.body.append(container)
})
afterEach(() => {
  app?.unmount()
  app = undefined
  container.remove()
  vi.clearAllTimers()
  vi.useRealTimers()
})

describe('Shadcn dialogs using the real Naive provider', () => {
  it('applies Dialog CSS variables to the actual dialog root through its supported style option', async () => {
    const { api } = await mount()
    const result = api.confirm({ title: '样式应用到弹窗', description: '保留现有交互。' })
    await settle()
    const target = dialog()!
    for (const [property, value] of Object.entries({
      '--n-color': '#ffffff', '--n-text-color': '#71717a', '--n-title-text-color': '#09090b',
      '--n-border': '1px solid #e4e4e7', '--n-border-radius': '12px', '--n-title-font-size': '16px',
      '--n-padding': '24px', '--n-close-icon-color': '#71717a', '--n-close-icon-color-hover': '#09090b',
      '--n-close-icon-color-pressed': '#09090b', '--n-close-color-hover': '#f4f4f5', '--n-close-color-pressed': '#e4e4e7',
    })) expect(target.style.getPropertyValue(property)).toBe(value)
    expect(target.style.maxWidth).toBe('calc(100vw - 2rem)')
    button('取消').click()
    expect(await result).toBe(false)
    await settle()
  })

  it('resolves confirmation once and lets the provider close and restore focus', async () => {
    const { api } = await mount()
    const trigger = button('打开')
    trigger.focus()
    const resolved = vi.fn()
    const result = api.confirm({ title: '删除回复', description: '下级回复会保留。', confirmText: '删除回复' })
    void result.then(resolved)
    await settle()
    expectDialogSemantics('删除回复', '下级回复会保留。')
    expect(dialog()?.textContent).toContain('下级回复会保留。')
    expect(dialog()?.contains(document.activeElement)).toBe(true)
    button('删除回复').click()
    expect(await result).toBe(true)
    await settle()
    expect(resolved).toHaveBeenCalledExactlyOnceWith(true)
    expect(dialog()).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it.each(['cancel', 'escape', 'mask'] as const)('resolves %s dismissal as false', async dismissal => {
    const { api } = await mount()
    const result = api.confirm({ title: '关闭回复框', description: '草稿已保存。' })
    await settle()
    if (dismissal === 'cancel') button('取消').click()
    else if (dismissal === 'escape') document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }))
    else {
      const mask = document.body.querySelector<HTMLElement>('.n-modal-mask')!
      mask.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      mask.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
      mask.click()
    }
    await settle()
    expect(await result).toBe(false)
    expect(dialog()).toBeNull()
  })

  it('keeps an oversized prompt open, focuses its error, and accepts 500 Unicode characters', async () => {
    const { api } = await mount()
    const resolved = vi.fn()
    const result = api.prompt({ title: '举报内容', description: '可补充说明。', maxLength: 500 })
    void result.then(resolved)
    await settle()
    const textarea = dialog()!.querySelector<HTMLTextAreaElement>('textarea')!
    expectDialogSemantics('举报内容', '可补充说明。')
    expect(document.activeElement).toBe(textarea)
    textarea.value = '😀'.repeat(501)
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()
    button('提交').click()
    await settle()
    expect(resolved).not.toHaveBeenCalled()
    expect(dialog()?.querySelector('[role="alert"]')?.textContent).toContain('不能超过 500 字')
    expect(textarea.getAttribute('aria-invalid')).toBe('true')
    expect(document.activeElement).toBe(textarea)
    textarea.value = '😀'.repeat(500)
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()
    button('提交').click()
    expect(await result).toBe('😀'.repeat(500))
    await settle()
    expect(dialog()).toBeNull()
    expect(resolved).toHaveBeenCalledOnce()
  })

  it('cancels only the selected prompt and resolves outstanding dialogs when their owner unmounts', async () => {
    const { api, opened } = await mount()
    const first = api.prompt({ title: '第一项说明', description: '可取消。' })
    await settle()
    button('取消').click()
    expect(await first).toBeNull()
    await settle()
    const second = api.confirm({ title: '未完成确认', description: '离开页面时取消。' })
    await settle()
    opened.value = false
    await settle()
    expect(await second).toBe(false)
    expect(dialog()).toBeNull()
  })

  it('keeps each simultaneous dialog linked to its own description', async () => {
    const { api, opened } = await mount()
    const first = api.confirm({ title: '第一项确认', description: '第一项的说明。' })
    const second = api.prompt({ title: '第二项说明', description: '第二项的说明。' })
    await settle()
    const firstDescription = expectDialogSemantics('第一项确认', '第一项的说明。')
    const secondDescription = expectDialogSemantics('第二项说明', '第二项的说明。')
    expect(firstDescription).not.toBe(secondDescription)
    opened.value = false
    await settle()
    expect(await first).toBe(false)
    expect(await second).toBeNull()
    expect(document.body.querySelectorAll('[role="dialog"]')).toHaveLength(0)
  })
})
