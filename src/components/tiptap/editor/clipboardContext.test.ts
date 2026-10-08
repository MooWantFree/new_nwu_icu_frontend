import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Schema, type Slice } from '@tiptap/pm/model'
import { EditorState } from '@tiptap/pm/state'
import { EditorView } from '@tiptap/pm/view'

let host: HTMLDivElement
let view: EditorView
let pastedSlice: Slice | undefined

const clipboardHTML = (label: string | number) => {
  const paragraph = document.createElement('p')
  paragraph.textContent = '保留的文本'
  paragraph.setAttribute('data-pm-slice', `1 1 ${JSON.stringify(['quote', { label }])}`)
  return paragraph.outerHTML
}
// jsdom does not provide ClipboardEvent; pasteHTML only passes this event to hooks.
const pasteContext = (label: string | number) =>
  view.pasteHTML(clipboardHTML(label), new Event('paste') as ClipboardEvent)

beforeEach(() => {
  const schema = new Schema({
    nodes: {
      doc: { content: 'block+' },
      paragraph: {
        group: 'block', content: 'text*',
        parseDOM: [{ tag: 'p' }], toDOM: () => ['p', 0],
      },
      text: { group: 'inline' },
      quote: {
        group: 'block', content: 'block+', defining: true,
        attrs: { label: { default: '', validate: 'string' } },
        parseDOM: [{ tag: 'blockquote' }],
        toDOM: node => ['blockquote', { 'data-label': node.attrs.label }, 0],
      },
    },
  })
  host = document.createElement('div')
  document.body.append(host)
  pastedSlice = undefined
  view = new EditorView(host, {
    state: EditorState.create({ schema }),
    transformPasted: slice => { pastedSlice = slice; return slice },
  })
})

afterEach(() => {
  view.destroy()
  host.remove()
})

describe('ProseMirror clipboard context attribute validation', () => {
  // GHSA-c8x8-7fp4-3x9w: clipboard metadata must not bypass schema validators.
  it('rejects a wrapper with an invalid context attribute and keeps the pasted text', () => {
    expect(pasteContext(42)).toBe(true)

    expect(pastedSlice?.content.firstChild?.type.name).toBe('paragraph')
    expect(view.state.doc.textContent).toBe('保留的文本')
    expect(view.dom.querySelector('blockquote')).toBeNull()
    expect(view.dom.querySelector('[data-label]')).toBeNull()
  })

  it('keeps a wrapper with a valid context attribute', () => {
    expect(pasteContext('引用')).toBe(true)

    expect(pastedSlice?.content.firstChild?.type.name).toBe('quote')
    expect(view.state.doc.textContent).toBe('保留的文本')
    expect(view.dom.querySelector('blockquote')?.getAttribute('data-label')).toBe('引用')
  })
})
