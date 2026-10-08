import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, ref, type App } from 'vue'
import Editor from './Editor.vue'

const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }))
vi.mock('@/lib/useShadcnToast', () => ({ useShadcnToast: () => ({ error: toastError }) }))
vi.mock('@/lib/fileUploads', () => ({ useFileUpload: () => uploadState }))
vi.mock('@tiptap/vue-3', () => ({
  useEditor: () => ref(null),
  EditorContent: { render: () => h('div') },
}))
vi.mock('./EditorToolbar.vue', () => ({ default: { render: () => null } }))
vi.mock('@tiptap/extension-file-handler', () => ({
  default: { configure: (options: any) => { fileHandlerOptions = options; return {} } },
}))

const makeUploadState = () => ({
  uploadFile: vi.fn(),
  succeed: ref(false),
  imageUrl: ref(''),
  errors: ref<string[]>([]),
})
let uploadState = makeUploadState()
let fileHandlerOptions: any
let app: App | undefined
let container: HTMLDivElement
const pastedFile = new File(['image'], '图片.png', { type: 'image/png' })
const deferred = () => {
  let resolve!: () => void
  const promise = new Promise<void>(accept => { resolve = accept })
  return { promise, resolve }
}
const makeEditor = () => {
  const run = vi.fn()
  const insertContentAt = vi.fn(() => ({ run }))
  return {
    isDestroyed: false,
    state: { selection: { anchor: 7 } },
    chain: vi.fn(() => ({ insertContentAt })),
    insertContentAt,
    run,
  }
}
beforeEach(() => {
  vi.clearAllMocks()
  uploadState = makeUploadState()
  container = document.createElement('div')
  document.body.append(container)
  app = createApp(Editor)
  app.mount(container)
})
afterEach(() => {
  app?.unmount()
  app = undefined
  container.remove()
})

describe('editor pasted image uploads', () => {
  it('inserts the completed image at the original paste position', async () => {
    uploadState.uploadFile.mockImplementation(async () => {
      uploadState.succeed.value = true
      uploadState.imageUrl.value = '/api/download/image-id/'
    })
    const editor = makeEditor()
    await fileHandlerOptions.onPaste(editor, [pastedFile], null)
    expect(editor.insertContentAt).toHaveBeenCalledWith(7, {
      type: 'image', attrs: { src: '/api/download/image-id/' },
    })
    expect(editor.run).toHaveBeenCalledOnce()
    expect(toastError).not.toHaveBeenCalled()
  })

  it('shows a Shadcn error toast when the pasted image upload fails', async () => {
    uploadState.uploadFile.mockImplementation(async () => {
      uploadState.errors.value = ['上传服务暂不可用']
    })
    const editor = makeEditor()
    await fileHandlerOptions.onPaste(editor, [pastedFile], null)
    expect(toastError).toHaveBeenCalledWith('上传文件失败: 上传服务暂不可用')
    expect(editor.chain).not.toHaveBeenCalled()
  })

  it.each(['destroyed editor', 'unmounted component'] as const)('ignores late uploads after the %s', async reason => {
    const pending = deferred()
    uploadState.uploadFile.mockImplementation(async () => {
      await pending.promise
      uploadState.succeed.value = true
      uploadState.imageUrl.value = '/api/download/late-image/'
    })
    const editor = makeEditor()
    const paste = fileHandlerOptions.onPaste(editor, [pastedFile], null)
    if (reason === 'destroyed editor') editor.isDestroyed = true
    else { app!.unmount(); app = undefined }
    pending.resolve()
    await paste
    expect(editor.chain).not.toHaveBeenCalled()
    expect(toastError).not.toHaveBeenCalled()
  })
})
