import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref, type App } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import Link from '@tiptap/extension-link'
import EditorToolbar from './EditorToolbar.vue'
import ShadcnFormDialog from '@/components/common/ShadcnFormDialog.vue'

let app: App | undefined
let editor: Editor | undefined
let host: HTMLDivElement
const originalScroll = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollIntoView')
const originalRangeRect = Object.getOwnPropertyDescriptor(Range.prototype, 'getBoundingClientRect')
const originalRangeRects = Object.getOwnPropertyDescriptor(Range.prototype, 'getClientRects')
const flush = async () => { for (let index = 0; index < 15; index++) { await Promise.resolve(); await nextTick() } }
const settle = async () => { await flush(); await vi.advanceTimersByTimeAsync(50); await flush() }
const parentPanel = () => [...document.body.querySelectorAll<HTMLElement>('[role="dialog"]')].find(candidate => candidate.querySelector('h2')?.textContent === '写评价')!
const toolbarButton = (label: string) => parentPanel().querySelector<HTMLButtonElement>('button[aria-label="' + label + '"]')!
const popup = (label: string) => document.body.querySelector<HTMLElement>('[role="dialog"][aria-label="' + label + '"]')!
const expectPositioned = (content: HTMLElement) => {
  const wrapper = content.closest<HTMLElement>('[data-reka-popper-content-wrapper]')!
  expect(wrapper.style.transform).toMatch(/^translate\(.*px, .*px\)$/)
}
const key = async (target: HTMLElement, value: string) => { target.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true })); await settle() }
const mount = async () => {
  const open = ref(true)
  const closed = vi.fn(() => { open.value = false })
  const parentSubmit = vi.fn((event: Event) => event.preventDefault())
  editor = new Editor({
    extensions: [StarterKit, Underline, TextAlign.configure({ types: ['heading', 'paragraph'] }), Table, TableRow, TableHeader, TableCell, Link.configure({ openOnClick: false })],
    content: '<p>初始内容</p>', injectCSS: false,
  })
  app = createApp({ render: () => h(ShadcnFormDialog, { show: open.value, title: '写评价', onClose: closed }, {
    default: () => h('form', { onSubmit: parentSubmit }, [h(EditorToolbar, { editor: editor! }), h(EditorContent, { editor: editor! })]),
  }) })
  app.mount(host); await settle()
  return { open, closed, parentSubmit }
}
beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  Element.prototype.scrollIntoView = vi.fn()
  const rect = { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) }
  Object.defineProperty(Range.prototype, 'getBoundingClientRect', { configurable: true, value: () => rect })
  Object.defineProperty(Range.prototype, 'getClientRects', { configurable: true, value: () => [rect] })
  host = document.createElement('div'); document.body.append(host)
})
afterEach(() => {
  app?.unmount(); app = undefined; editor?.destroy(); editor = undefined; host.remove()
  for (const [name, descriptor] of [['getBoundingClientRect', originalRangeRect], ['getClientRects', originalRangeRects]] as const) {
    if (descriptor) Object.defineProperty(Range.prototype, name, descriptor)
    else Reflect.deleteProperty(Range.prototype, name)
  }
  if (originalScroll) Object.defineProperty(Element.prototype, 'scrollIntoView', originalScroll)
  else Reflect.deleteProperty(Element.prototype, 'scrollIntoView')
  vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals()
})
describe('EditorToolbar real editor and popup interactions', () => {
  it('keeps formatting and font commands working without submitting the parent form', async () => {
    const { parentSubmit } = await mount()
    editor!.commands.selectAll()
    toolbarButton('粗体').click(); await settle()
    expect(editor!.getHTML()).toContain('<strong>初始内容</strong>')
    expect(toolbarButton('粗体').getAttribute('aria-pressed')).toBe('true')
    const font = toolbarButton('字体选项')
    font.focus(); await key(font, 'ArrowDown')
    const menu = document.body.querySelector<HTMLElement>('[role="menu"][aria-label="字体选项"]')!
    expect(menu).not.toBeNull()
    expect(parentPanel().contains(menu)).toBe(false)
    expectPositioned(menu)
    const heading = [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]')].find(item => item.textContent?.trim() === '标题 2')!
    heading.focus(); await key(heading, 'Enter')
    expect(editor!.getHTML()).toContain('<h2>')
    expect(parentSubmit).not.toHaveBeenCalled()
  })
  it('positions the alignment menu against its trigger and preserves alignment commands', async () => {
    const { open, parentSubmit } = await mount()
    const trigger = toolbarButton('对齐选项')
    trigger.focus(); await key(trigger, 'ArrowDown')
    const menu = document.body.querySelector<HTMLElement>('[role="menu"][aria-label="对齐选项"]')!
    expectPositioned(menu)
    const center = [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]')].find(item => item.textContent?.trim() === '居中')!
    center.focus(); await key(center, 'Enter')
    expect(editor!.getAttributes('paragraph').textAlign).toBe('center')
    expect(open.value).toBe(true)
    expect(parentSubmit).not.toHaveBeenCalled()
  })
  it('portals the table form, closes it alone on Escape, and inserts validated dimensions', async () => {
    const { open, closed, parentSubmit } = await mount()
    const trigger = toolbarButton('表格')
    trigger.focus(); trigger.click(); await settle()
    expect(popup('插入表格')).not.toBeNull()
    expect(parentPanel().contains(popup('插入表格'))).toBe(false)
    expectPositioned(popup('插入表格'))
    expect(popup('插入表格').contains(document.activeElement)).toBe(true)
    await key(document.activeElement as HTMLElement, 'Escape')
    expect(popup('插入表格')).toBeNull()
    expect(open.value).toBe(true)
    expect(closed).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(trigger)
    trigger.click(); await settle()
    const form = popup('插入表格').querySelector<HTMLFormElement>('form')!
    const inputs = form.querySelectorAll<HTMLInputElement>('input')
    inputs[0].value = '0'; inputs[0].dispatchEvent(new Event('input', { bubbles: true }))
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await settle()
    expect(form.querySelector('[role="alert"]')?.textContent).toContain('1–10')
    expect(editor!.getHTML()).not.toContain('<table')
    inputs[0].value = '2'; inputs[0].dispatchEvent(new Event('input', { bubbles: true }))
    inputs[1].value = '4'; inputs[1].dispatchEvent(new Event('input', { bubbles: true }))
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await settle()
    const table = new DOMParser().parseFromString(editor!.getHTML(), 'text/html').querySelector('table')!
    expect(table.querySelectorAll('tr')).toHaveLength(2)
    expect(table.querySelectorAll('tr')[0].querySelectorAll('th')).toHaveLength(4)
    expect(popup('插入表格')).toBeNull()
    expect(open.value).toBe(true)
    expect(parentSubmit).not.toHaveBeenCalled()
  })
  it('supports emoji keyboard navigation and inserts the selected emoji', async () => {
    const { open, parentSubmit } = await mount()
    const trigger = toolbarButton('表情')
    trigger.focus(); trigger.click(); await settle()
    const picker = popup('常用表情')
    expectPositioned(picker)
    const buttons = picker.querySelectorAll<HTMLButtonElement>('button')
    expect(document.activeElement).toBe(buttons[0])
    await key(buttons[0], 'ArrowDown')
    expect(document.activeElement).toBe(buttons[6])
    buttons[6].click(); await settle()
    expect(editor!.getText()).toContain('😴')
    expect(popup('常用表情')).toBeNull()
    expect(open.value).toBe(true)
    expect(parentSubmit).not.toHaveBeenCalled()
  })
  it('uses the nested link modal and preserves the link editor command', async () => {
    const { open, parentSubmit } = await mount()
    const trigger = toolbarButton('添加链接')
    trigger.focus(); trigger.click(); await settle()
    const linkPanel = [...document.body.querySelectorAll<HTMLElement>('[role="dialog"]')].find(candidate => candidate.querySelector('h2')?.textContent === '添加链接')!
    const url = linkPanel.querySelector<HTMLInputElement>('input[autocomplete="url"]')!
    url.value = '/announcements/2'; url.dispatchEvent(new Event('input', { bubbles: true }))
    const text = linkPanel.querySelectorAll<HTMLInputElement>('input')[1]
    text.value = '站内公告'; text.dispatchEvent(new Event('input', { bubbles: true }))
    linkPanel.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await settle()
    expect(editor!.getHTML()).toContain('href="/announcements/2"')
    expect(editor!.getText()).toContain('站内公告')
    expect(open.value).toBe(true)
    expect(parentSubmit).not.toHaveBeenCalled()
  })
})
