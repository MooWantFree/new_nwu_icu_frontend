import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref, type App } from 'vue'

vi.mock('@/components/tiptap/editor/InsertLink.vue', () => ({
  default: defineComponent({
    props: { modelValue: Boolean },
    emits: ['update:modelValue', 'submit'],
    setup(props, { emit }) {
      return () => props.modelValue
        ? h('button', {
            'data-testid': 'submit-link',
            onClick: () => {
              emit('submit', { url: '/announcements/2', text: '站内公告' })
              emit('update:modelValue', false)
            },
          }, '提交链接')
        : null
    },
  }),
}))

vi.mock('@/components/tiptap/editor/ImageUpload.vue', () => ({
  default: defineComponent({
    emits: ['upload'],
    setup(_props, { emit }) {
      return () => h('button', {
        'data-testid': 'upload-image',
        onClick: () => emit('upload', '/api/download/00000000-0000-4000-8000-000000000001/'),
      }, '完成上传')
    },
  }),
}))

import GuestbookEditor from './GuestbookEditor.vue'

const flush = async () => {
  for (let index = 0; index < 8; index += 1) {
    await Promise.resolve()
    await nextTick()
  }
}

let app: App | undefined
let container: HTMLDivElement

const mountEditor = async (initialValue = '') => {
  const values: string[] = []
  const value = ref(initialValue)
  app = createApp({
    setup: () => () => h(GuestbookEditor, {
      modelValue: value.value,
      allowImages: true,
      'onUpdate:modelValue': (updatedValue: string) => {
        value.value = updatedValue
        values.push(updatedValue)
      },
    }),
  })
  app.mount(container)
  await flush()
  return values
}

const toolbarButton = (label: string) => container.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement

beforeEach(() => {
  container = document.createElement('div')
  document.body.append(container)
})

afterEach(() => {
  app?.unmount()
  container.remove()
  Reflect.deleteProperty(document, 'elementFromPoint')
})

describe('GuestbookEditor announcement rich text', () => {
  it('inserts a safe internal link and serializes a selected image after changing its size', async () => {
    const values = await mountEditor('<p>公告开头</p><img src="/api/download/00000000-0000-4000-8000-000000000001/" data-size="25">')

    toolbarButton('添加链接').click()
    await nextTick()
    ;(container.querySelector('[data-testid="submit-link"]') as HTMLButtonElement).click()
    await flush()

    const editorImage = container.querySelector('.ProseMirror img') as HTMLImageElement
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: () => editorImage,
    })
    editorImage.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, clientX: 0, clientY: 0 }))
    editorImage.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0, clientX: 0, clientY: 0 }))
    await flush()

    const sizeToolbar = container.querySelector('[aria-label="图片大小"]') as HTMLElement
    const seventyFivePercent = [...sizeToolbar.querySelectorAll('button')]
      .find(button => button.textContent?.trim() === '75%') as HTMLButtonElement
    seventyFivePercent.click()
    await flush()

    const documentNode = new DOMParser().parseFromString(values.at(-1) || '', 'text/html')
    const link = documentNode.querySelector('a')
    expect(link?.getAttribute('href')).toBe('/announcements/2')
    expect(link?.textContent).toBe('站内公告')
    expect(link?.hasAttribute('target')).toBe(false)
    expect(documentNode.querySelector('img')?.getAttribute('data-size')).toBe('75')
  })

  it('serializes newly uploaded images with the default 100% size', async () => {
    const values = await mountEditor()

    toolbarButton('上传图片').click()
    await nextTick()
    ;(container.querySelector('[data-testid="upload-image"]') as HTMLButtonElement).click()
    await flush()

    const documentNode = new DOMParser().parseFromString(values.at(-1) || '', 'text/html')
    const image = documentNode.querySelector('img')
    expect(image?.getAttribute('src')).toBe('/api/download/00000000-0000-4000-8000-000000000001/')
    expect(image?.getAttribute('data-size')).toBe('100')
  })
})
