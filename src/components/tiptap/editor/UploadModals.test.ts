import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref, type App, type Component } from 'vue'
import FileUpload from './FileUpload.vue'
import ImageUpload from './ImageUpload.vue'

const { confirm, toastError } = vi.hoisted(() => ({ confirm: vi.fn(), toastError: vi.fn() }))
vi.mock('@/lib/useShadcnToast', () => ({ useShadcnToast: () => ({ error: toastError }) }))
vi.mock('@/lib/useShadcnDialog', () => ({ useShadcnDialog: () => ({ confirm }) }))
vi.mock('@/lib/fileUploads', () => ({ useFileUpload: () => uploadState }))
vi.mock('@/components/common/ShadcnFormDialog.vue', () => ({
  default: {
    props: ['show', 'title', 'suspended'],
    emits: ['close'],
    setup: (props: { show: boolean; title: string; suspended: boolean }, context: any) => () => props.show
      ? h('section', { role: 'dialog', 'aria-label': props.title }, [
        h('button', { 'aria-label': '关闭上传窗口', disabled: props.suspended, onClick: () => context.emit('close') }, '关闭'),
        context.slots.default?.(),
        context.slots.footer?.(),
      ])
      : null,
  },
}))

const makeUploadState = () => ({
  uploadFile: vi.fn(),
  loading: ref(false),
  succeed: ref(false),
  imageUrl: ref(''),
  progress: ref(0),
  errors: ref<string[]>([]),
})
let uploadState = makeUploadState()
let app: App | undefined
let container: HTMLDivElement
const close = vi.fn()
const uploaded = vi.fn()
const flush = async () => {
  for (let index = 0; index < 8; index += 1) {
    await Promise.resolve()
    await nextTick()
  }
}
const deferred = <T>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(accept => { resolve = accept })
  return { promise, resolve }
}
const mount = (component: Component) => {
  const visible = ref(true)
  app = createApp({
    render: () => visible.value ? h(component, {
      onClose: () => { close(); visible.value = false },
      onUpload: uploaded,
    }) : null,
  })
  app.mount(container)
}
const selectFile = async (kind: 'file' | 'image') => {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]')!
  const selected = kind === 'image'
    ? new File(['image'], '图片.png', { type: 'image/png' })
    : new File(['document'], '资料.pdf', { type: 'application/pdf' })
  Object.defineProperty(input, 'files', { configurable: true, value: [selected] })
  input.dispatchEvent(new Event('change', { bubbles: true }))
  await flush()
  return selected
}
const submit = () => [...container.querySelectorAll<HTMLButtonElement>('button')]
  .find(button => button.textContent?.trim() === '上传')!.click()

beforeEach(() => {
  vi.clearAllMocks()
  uploadState = makeUploadState()
  container = document.createElement('div')
  document.body.append(container)
  vi.stubGlobal('URL', class extends URL {
    static createObjectURL = vi.fn(() => 'blob:preview')
    static revokeObjectURL = vi.fn()
  })
})
afterEach(() => {
  app?.unmount()
  app = undefined
  container.remove()
  vi.unstubAllGlobals()
})

describe.each([
  ['file', FileUpload],
  ['image', ImageUpload],
] as const)('%s upload dialog', (kind, component) => {
  it('asks before closing an active upload and keeps the upload after cancelling the confirmation', async () => {
    const pendingUpload = deferred<void>()
    const pendingConfirm = deferred<boolean>()
    confirm.mockReturnValue(pendingConfirm.promise)
    uploadState.uploadFile.mockImplementation(async () => {
      uploadState.loading.value = true
      await pendingUpload.promise
      uploadState.succeed.value = true
      uploadState.imageUrl.value = '/api/download/file-id/'
      uploadState.loading.value = false
    })
    mount(component)
    const selected = await selectFile(kind)
    submit()
    await flush()
    container.querySelector<HTMLButtonElement>('[aria-label="关闭上传窗口"]')!.click()
    await flush()
    expect(confirm).toHaveBeenCalledTimes(1)
    expect(close).not.toHaveBeenCalled()
    expect(container.querySelector<HTMLInputElement>('input[type="file"]')!.disabled).toBe(true)
    container.querySelector<HTMLButtonElement>('[aria-label="关闭上传窗口"]')!.click()
    expect(confirm).toHaveBeenCalledTimes(1)
    pendingConfirm.resolve(false)
    await flush()
    expect(close).not.toHaveBeenCalled()
    pendingUpload.resolve()
    await flush()
    expect(uploadState.uploadFile).toHaveBeenCalledWith(selected)
    expect(uploaded).toHaveBeenCalledWith(...(kind === 'image' ? ['/api/download/file-id/'] : [selected.name, '/api/download/file-id/']))
    expect(close).toHaveBeenCalledOnce()
  })

  it('does not insert a late upload result after confirming closure', async () => {
    const pendingUpload = deferred<void>()
    confirm.mockResolvedValue(true)
    uploadState.uploadFile.mockImplementation(async () => {
      uploadState.loading.value = true
      await pendingUpload.promise
      uploadState.succeed.value = true
      uploadState.imageUrl.value = '/api/download/late-file/'
      uploadState.loading.value = false
    })
    mount(component)
    await selectFile(kind)
    submit()
    await flush()
    container.querySelector<HTMLButtonElement>('[aria-label="关闭上传窗口"]')!.click()
    await flush()
    expect(close).toHaveBeenCalledOnce()
    expect(container.querySelector('[role="dialog"]')).toBeNull()
    pendingUpload.resolve()
    await flush()
    expect(uploaded).not.toHaveBeenCalled()
  })

  it('keeps the file selected and shows a Shadcn error toast when upload fails', async () => {
    uploadState.uploadFile.mockImplementation(async () => {
      uploadState.errors.value = ['连接失败，请重试']
    })
    mount(component)
    const selected = await selectFile(kind)
    submit()
    await flush()
    expect(toastError).toHaveBeenCalledWith('连接失败，请重试')
    expect(uploaded).not.toHaveBeenCalled()
    expect(close).not.toHaveBeenCalled()
    expect(container.textContent).toContain(selected.name)
  })
})

describe('image compression lifecycle', () => {
  it.each(['error', 'load'] as const)('ignores a late FileReader %s after closing the upload dialog', async outcome => {
    let pendingReader!: { onload?: (event: any) => void; onerror?: (event: ProgressEvent) => void }
    vi.stubGlobal('FileReader', class {
      onload?: (event: any) => void
      onerror?: (event: ProgressEvent) => void
      readAsDataURL() {
        pendingReader = {
          onload: event => this.onload?.(event),
          onerror: event => this.onerror?.(event),
        }
      }
    })
    const createPreview = vi.mocked(URL.createObjectURL)
    const imageConstructor = vi.fn()
    vi.stubGlobal('Image', imageConstructor)
    mount(ImageUpload)
    const selected = new File(['image'], '大图片.png', { type: 'image/png' })
    Object.defineProperty(selected, 'size', { value: 26 * 1024 * 1024 })
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!
    Object.defineProperty(input, 'files', { configurable: true, value: [selected] })
    input.dispatchEvent(new Event('change', { bubbles: true }))
    await flush()
    expect(container.textContent).toContain('正在压缩图片')
    container.querySelector<HTMLButtonElement>('[aria-label="关闭上传窗口"]')!.click()
    await flush()
    expect(close).toHaveBeenCalledOnce()
    if (outcome === 'error') pendingReader.onerror!(new ProgressEvent('error'))
    else pendingReader.onload!({ target: { result: 'data:image/png;base64,eA==' } })
    await flush()
    expect(toastError).not.toHaveBeenCalled()
    expect(imageConstructor).not.toHaveBeenCalled()
    expect(createPreview).not.toHaveBeenCalled()
    expect(uploaded).not.toHaveBeenCalled()
    expect(uploadState.uploadFile).not.toHaveBeenCalled()
  })
})
