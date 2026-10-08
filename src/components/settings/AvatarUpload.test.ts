import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref, type App, type Ref } from 'vue'
import AvatarUpload from './AvatarUpload.vue'

type UploadState = {
  loading: Ref<boolean>
  succeed: Ref<boolean>
  imageUrl: Ref<string>
  progress: Ref<number>
  errors: Ref<string[]>
}

const mocks = vi.hoisted(() => ({
  error: vi.fn(),
  close: vi.fn(),
  upload: vi.fn(),
  uploadFile: vi.fn(),
  toBlob: vi.fn(),
  getCroppedCanvas: vi.fn(),
  rotate: vi.fn(),
  createObjectURL: vi.fn(),
  revokeObjectURL: vi.fn(),
  state: null as UploadState | null,
}))

vi.mock('@/lib/useShadcnToast', () => ({ useShadcnToast: () => ({ error: mocks.error }) }))
vi.mock('@/lib/fileUploads', () => ({
  useFileUpload: () => {
    const state: UploadState = {
      loading: ref(false), succeed: ref(false), imageUrl: ref(''), progress: ref(0), errors: ref([]),
    }
    mocks.state = state
    return { ...state, uploadFile: mocks.uploadFile }
  },
}))
vi.mock('vue-cropperjs', () => ({
  default: defineComponent({
    setup: (_props, { expose }) => {
      expose({ getCroppedCanvas: mocks.getCroppedCanvas, rotate: mocks.rotate })
      return () => h('div', '头像裁剪预览')
    },
  }),
}))

let app: App | undefined
let host: HTMLDivElement
let previousOverflow: string
const originalCreateObjectURL = URL.createObjectURL
const originalRevokeObjectURL = URL.revokeObjectURL

const flush = async () => {
  for (let index = 0; index < 8; index++) { await Promise.resolve(); await nextTick() }
}
const dialog = () => document.body.querySelector<HTMLElement>('[role="dialog"]')!
const button = (label: string) => {
  const element = [...dialog().querySelectorAll<HTMLButtonElement>('button')]
    .find(candidate => candidate.textContent?.trim() === label || candidate.getAttribute('aria-label') === label)
  expect(element).toBeDefined()
  return element!
}
const succeedUpload = async () => {
  const state = mocks.state!
  state.loading.value = true
  await Promise.resolve()
  state.succeed.value = true
  state.imageUrl.value = '/api/download/avatar-resource/'
  state.progress.value = 100
  state.loading.value = false
}
const mount = async (bindAfterUpload = false) => {
  const open = ref(false)
  const binding = ref(false)
  app = createApp({
    render: () => h('div', [
      h('button', { id: 'avatar-trigger', type: 'button', onClick: () => { open.value = true } }, '更改头像'),
      open.value ? h(AvatarUpload, {
        binding: binding.value,
        onClose: () => { mocks.close(); open.value = false },
        onUpload: (url: string) => { mocks.upload(url); if (bindAfterUpload) binding.value = true },
      }) : null,
    ]),
  })
  app.mount(host)
  const trigger = host.querySelector<HTMLButtonElement>('#avatar-trigger')!
  trigger.focus()
  trigger.click()
  await flush()
  return { trigger, binding, open }
}
const choose = async (file: File) => {
  const input = dialog().querySelector<HTMLInputElement>('input[type="file"]')!
  Object.defineProperty(input, 'files', { configurable: true, value: [file] })
  input.dispatchEvent(new Event('change', { bubbles: true }))
  await flush()
}
const escape = () => dialog().dispatchEvent(new KeyboardEvent('keydown', {
  key: 'Escape', bubbles: true, cancelable: true,
}))
const backdrop = () => dialog().parentElement!.querySelector<HTMLDivElement>('div[aria-hidden="true"]')!

beforeEach(() => {
  vi.clearAllMocks()
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'scroll'
  host = document.createElement('div')
  document.body.append(host)
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: mocks.createObjectURL })
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: mocks.revokeObjectURL })
  mocks.createObjectURL.mockReturnValue('blob:avatar-preview')
  mocks.getCroppedCanvas.mockReturnValue({ toBlob: mocks.toBlob })
  mocks.toBlob.mockImplementation((callback: BlobCallback, type: string) => callback(new Blob(['cropped'], { type })))
  mocks.uploadFile.mockImplementation(succeedUpload)
})

afterEach(() => {
  app?.unmount()
  app = undefined
  host.remove()
  document.body.style.overflow = previousOverflow
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: originalCreateObjectURL })
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: originalRevokeObjectURL })
})

describe('avatar upload dialog behavior', () => {
  it('focuses the picker, traps Tab in both directions and locks scrolling', async () => {
    await mount()
    expect(document.activeElement).toBe(button('选择头像图片'))
    expect(document.body.style.overflow).toBe('hidden')
    expect(host.querySelector('[role="dialog"]')).toBeNull()
    expect(dialog().getAttribute('aria-modal')).toBe('true')
    expect(document.getElementById(dialog().getAttribute('aria-labelledby')!)?.textContent).toBe('上传头像')
    const first = button('关闭头像上传窗口')
    const last = button('取消')
    last.focus()
    last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }))
    expect(document.activeElement).toBe(first)
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }))
    expect(document.activeElement).toBe(last)
  })

  it.each(['close button', 'Escape', 'backdrop', 'cancel'] as const)('dismisses with %s and restores focus and scrolling', async method => {
    const { trigger } = await mount()
    if (method === 'close button') button('关闭头像上传窗口').click()
    else if (method === 'Escape') escape()
    else if (method === 'backdrop') backdrop().click()
    else button('取消').click()
    await flush()
    expect(mocks.close).toHaveBeenCalledOnce()
    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
    expect(document.activeElement).toBe(trigger)
    expect(document.body.style.overflow).toBe('scroll')
  })

  it('rejects unsupported and oversized files without entering the cropper', async () => {
    await mount()
    await choose(new File(['gif'], 'avatar.gif', { type: 'image/gif' }))
    expect(mocks.error).toHaveBeenLastCalledWith('只支持 JPEG, PNG 和 WebP 格式的图片')
    await choose(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' }))
    expect(mocks.error).toHaveBeenLastCalledWith('头像文件大小不能超过5MB')
    expect(button('选择头像图片')).toBeDefined()
    expect(mocks.createObjectURL).not.toHaveBeenCalled()
    expect(mocks.uploadFile).not.toHaveBeenCalled()
  })

  it.each([
    ['picker', 'image/jpeg', 'avatar.jpg'],
    ['drop', 'image/png', 'avatar.png'],
    ['paste', 'image/webp', 'avatar.webp'],
  ] as const)('accepts %s images and forwards a cropped file before waiting for parent binding', async (method, type, name) => {
    const { binding } = await mount(true)
    const file = new File(['source'], name, { type })
    if (method === 'picker') await choose(file)
    else {
      const event = new Event(method === 'drop' ? 'drop' : 'paste', { bubbles: true, cancelable: true })
      Object.defineProperty(event, method === 'drop' ? 'dataTransfer' : 'clipboardData', {
        value: method === 'drop' ? { files: [file] } : { items: [{ type, getAsFile: () => file }] },
      })
      button('选择头像图片').dispatchEvent(event)
      await flush()
    }
    expect(document.activeElement).toBe(button('上传'))
    button('向左旋转').click()
    button('向右旋转').click()
    expect(mocks.rotate.mock.calls).toEqual([[-90], [90]])
    button('上传').click()
    await flush()
    expect(mocks.toBlob).toHaveBeenCalledWith(expect.any(Function), type)
    expect(mocks.uploadFile).toHaveBeenCalledOnce()
    const uploadedFile = mocks.uploadFile.mock.calls[0][0] as File
    expect(uploadedFile.name).toBe(name)
    expect(uploadedFile.type).toBe(type)
    expect(mocks.upload).toHaveBeenCalledOnce()
    expect(mocks.upload).toHaveBeenCalledWith('/api/download/avatar-resource/')
    expect(mocks.close).not.toHaveBeenCalled()
    expect(binding.value).toBe(true)
    expect(button('保存中...').disabled).toBe(true)
    escape()
    backdrop().click()
    expect(mocks.close).not.toHaveBeenCalled()
    binding.value = false
    await flush()
    expect(button('上传').disabled).toBe(false)
    button('重新选择').click()
    await flush()
    expect(document.activeElement).toBe(button('选择头像图片'))
    expect(mocks.revokeObjectURL).toHaveBeenCalledWith('blob:avatar-preview')
  })

  it('blocks duplicate upload and dismissal from the start of asynchronous cropping through the upload request', async () => {
    let finishCrop: BlobCallback | undefined
    let finishUpload: (() => void) | undefined
    mocks.toBlob.mockImplementation((callback: BlobCallback) => { finishCrop = callback })
    mocks.uploadFile.mockImplementation(() => {
      mocks.state!.loading.value = true
      return new Promise<void>(resolve => { finishUpload = resolve })
    })
    await mount()
    await choose(new File(['source'], 'avatar.png', { type: 'image/png' }))
    const uploadButton = button('上传')
    uploadButton.click()
    uploadButton.click()
    await flush()
    expect(mocks.toBlob).toHaveBeenCalledOnce()
    expect(mocks.uploadFile).not.toHaveBeenCalled()
    expect(dialog().getAttribute('aria-busy')).toBe('true')
    expect(document.activeElement).toBe(dialog())
    expect(button('取消').disabled).toBe(true)
    expect(button('重新选择').disabled).toBe(true)
    escape()
    backdrop().click()
    button('关闭头像上传窗口').click()
    expect(mocks.close).not.toHaveBeenCalled()
    finishCrop!(new Blob(['cropped'], { type: 'image/png' }))
    await flush()
    expect(mocks.uploadFile).toHaveBeenCalledOnce()
    escape()
    expect(mocks.close).not.toHaveBeenCalled()
    mocks.state!.succeed.value = true
    mocks.state!.imageUrl.value = '/api/download/avatar-resource/'
    mocks.state!.loading.value = false
    finishUpload!()
    await flush()
    expect(mocks.upload).toHaveBeenCalledOnce()
    expect(mocks.close).not.toHaveBeenCalled()
    expect(button('上传').disabled).toBe(false)
  })

  it('keeps the selected image after a server error and allows a successful retry', async () => {
    mocks.uploadFile.mockImplementation(async () => {
      mocks.state!.loading.value = true
      await Promise.resolve()
      mocks.state!.errors.value = ['avatar: 文件被拒绝：图片内容不符合要求']
      mocks.state!.succeed.value = false
      mocks.state!.loading.value = false
    })
    await mount()
    await choose(new File(['source'], 'avatar.png', { type: 'image/png' }))
    button('上传').click()
    await flush()
    expect(mocks.error).toHaveBeenCalledWith('文件被拒绝：图片内容不符合要求')
    expect(mocks.upload).not.toHaveBeenCalled()
    expect(mocks.close).not.toHaveBeenCalled()
    expect(button('上传').disabled).toBe(false)
    mocks.uploadFile.mockImplementation(succeedUpload)
    button('上传').click()
    await flush()
    expect(mocks.uploadFile).toHaveBeenCalledTimes(2)
    expect(mocks.upload).toHaveBeenCalledOnce()
  })

  it('handles a failed canvas conversion without leaving the dialog busy', async () => {
    mocks.toBlob.mockImplementation((callback: BlobCallback) => callback(null))
    await mount()
    await choose(new File(['source'], 'avatar.png', { type: 'image/png' }))
    button('上传').click()
    await flush()
    expect(mocks.error).toHaveBeenCalledWith('头像裁剪失败，请重新选择图片')
    expect(mocks.uploadFile).not.toHaveBeenCalled()
    expect(button('上传').disabled).toBe(false)
  })

  it('validates the cropped file size before sending it', async () => {
    mocks.toBlob.mockImplementation((callback: BlobCallback) => callback(new Blob([new Uint8Array(5 * 1024 * 1024 + 1)], { type: 'image/png' })))
    await mount()
    await choose(new File(['source'], 'avatar.png', { type: 'image/png' }))
    button('上传').click()
    await flush()
    expect(mocks.error).toHaveBeenCalledWith('头像文件大小不能超过5MB')
    expect(mocks.uploadFile).not.toHaveBeenCalled()
    expect(button('上传').disabled).toBe(false)
  })

  it('releases previews and ignores a late crop result after its owner unmounts it', async () => {
    let finishCrop: BlobCallback | undefined
    mocks.toBlob.mockImplementation((callback: BlobCallback) => { finishCrop = callback })
    const { open, trigger } = await mount()
    await choose(new File(['source'], 'avatar.png', { type: 'image/png' }))
    button('上传').click()
    await flush()
    open.value = false
    await flush()
    expect(mocks.revokeObjectURL).toHaveBeenCalledWith('blob:avatar-preview')
    expect(document.activeElement).toBe(trigger)
    expect(document.body.style.overflow).toBe('scroll')
    finishCrop!(new Blob(['cropped'], { type: 'image/png' }))
    await flush()
    expect(mocks.uploadFile).not.toHaveBeenCalled()
    expect(mocks.upload).not.toHaveBeenCalled()
    expect(mocks.error).not.toHaveBeenCalled()
  })
})
