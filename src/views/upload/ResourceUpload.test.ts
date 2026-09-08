import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, type App } from 'vue'
import ResourceUpload from './ResourceUpload.vue'
import { api } from '@/lib/requests'
import type { ResourceUploadRequest } from '@/types/api/resourceUpload'

vi.mock('@/lib/requests', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))
vi.mock('naive-ui', () => ({
  useMessage: () => ({ error: vi.fn(), info: vi.fn(), success: vi.fn(), warning: vi.fn() }),
  NModal: {
    props: ['show', 'maskClosable', 'closeOnEsc'],
    emits: ['update:show'],
    setup: (props: { show: boolean }, context: any) => () => props.show ? context.slots.default?.() : null,
  },
}))
vi.mock('@/components/tinyComponents/Time.vue', () => ({ default: { render: () => h('time') } }))

const flush = async () => {
  for (let index = 0; index < 15; index += 1) {
    await Promise.resolve()
    await nextTick()
  }
}

const makeRequest = (
  id: number,
  status: ResourceUploadRequest['status'],
  targetPath: string,
  createdAt: string,
): ResourceUploadRequest => ({
  id,
  uploaded_by: { id: 1, username: 'tester', nickname: 'Tester' },
  target_path: targetPath,
  creates_new_folder: false,
  status,
  total_size: 1024,
  total_size_display: '1 KB',
  files: [{
    id: id * 10,
    original_name: '资料.pdf',
    relative_path: '资料.pdf',
    size: 1024,
    size_display: '1 KB',
    published_path: `${targetPath}/资料.pdf`,
    published_at: status === 'approved' ? createdAt : null,
  }],
  created_at: createdAt,
  updated_at: createdAt,
  revision: 1,
  reviewed_at: status === 'approved' || status === 'rejected' ? createdAt : null,
  reviewed_by: null,
  rejection_reason: status === 'rejected' ? '目录不合适' : '',
  publish_error: status === 'publish_failed' ? '同步失败' : '',
  files_deleted_at: null,
  files_expires_at: null,
  can_edit: status === 'pending' || status === 'rejected',
  resource_url: status === 'approved' ? 'https://example.com/resource' : null,
})

const file = (name = '资料.pdf') => new File(['content'], name, { type: 'application/pdf' })

const setInputFiles = (input: HTMLInputElement, files: File[]) => {
  Object.defineProperty(input, 'files', { configurable: true, value: files })
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

let app: App | undefined
let container: HTMLDivElement

const mockApi = (history: ResourceUploadRequest[] = []) => {
  vi.mocked(api.get).mockImplementation(async ({ url, query }: any) => {
    if (url === '/api/upload/config/') {
      return { status: 200, content: {
        max_file_count: 20,
        max_file_size: 100 * 1024 * 1024,
        allowed_extensions: ['.pdf'],
        quota: { limit: 1024 ** 3, used: 0, remaining: 1024 ** 3 },
      } } as any
    }
    if (url === '/api/upload/request/') {
      return { status: 200, content: { upload_requests: history } } as any
    }
    if (url === '/api/upload/directories/') {
      const path = query.path as string
      return { status: 200, content: {
        path,
        updated_at: '2026-09-05T00:00:00Z',
        directories: path === '/' ? [{ name: '课程资料', path: '/课程资料', modified: null }] : [],
      } } as any
    }
    throw new Error(`Unexpected GET ${url}`)
  })
}

const mount = async () => {
  app = createApp(ResourceUpload)
  app.mount(container)
  await flush()
}

beforeEach(() => {
  vi.clearAllMocks()
  container = document.createElement('div')
  document.body.append(container)
  Element.prototype.scrollIntoView = vi.fn()
})

afterEach(() => {
  app?.unmount()
  container.remove()
  vi.restoreAllMocks()
})

describe('resource upload simplified flow', () => {
  it.each([
    ['file picker', (root: HTMLElement) => setInputFiles(root.querySelectorAll<HTMLInputElement>('input[type="file"]')[0]!, [file()])],
    ['folder picker', (root: HTMLElement) => {
      const folderFile = file()
      Object.defineProperty(folderFile, 'webkitRelativePath', { configurable: true, value: '课程/资料.pdf' })
      setInputFiles(root.querySelectorAll<HTMLInputElement>('input[type="file"]')[1]!, [folderFile])
    }],
    ['drop', (root: HTMLElement) => {
      const drop = new Event('drop', { bubbles: true, cancelable: true })
      Object.defineProperty(drop, 'dataTransfer', { value: { items: [], files: [file()] } })
      root.querySelector<HTMLElement>('[aria-label="选择要投稿的文件"]')!.dispatchEvent(drop)
    }],
  ])('opens the directory modal after valid files arrive through the %s', async (_name, addFiles) => {
    mockApi()
    await mount()
    addFiles(container)
    await flush()
    expect(container.querySelector('[role="dialog"]')).not.toBeNull()
    expect(container.textContent).toContain('选择目标目录')
  })

  it('does not open the directory modal when every selected file is rejected', async () => {
    mockApi()
    await mount()
    setInputFiles(container.querySelector<HTMLInputElement>('input[type="file"]')!, [file('程序.exe')])
    await flush()
    expect(container.querySelector('[role="dialog"]')).toBeNull()
    expect(container.textContent).toContain('格式暂不支持')
  })

  it('confirms a directory before submit and keeps it when more files are added', async () => {
    mockApi()
    const submitted = makeRequest(9, 'pending', '/课程资料', '2026-09-05T08:00:00Z')
    vi.mocked(api.post).mockResolvedValue({ status: 201, content: { upload_request: submitted } } as any)
    await mount()

    const inputs = container.querySelectorAll<HTMLInputElement>('input[type="file"]')
    setInputFiles(inputs[0]!, [file()])
    await flush()
    const folderButton = [...container.querySelectorAll<HTMLButtonElement>('button')]
      .find(button => button.textContent?.trim() === '课程资料')!
    folderButton.click()
    await flush()
    const confirmButton = [...container.querySelectorAll<HTMLButtonElement>('button')]
      .find(button => button.textContent?.trim() === '确认目录')!
    expect(confirmButton.disabled).toBe(false)
    confirmButton.click()
    await flush()
    expect(container.querySelector('[role="dialog"]')).toBeNull()
    expect(container.textContent).toContain('/课程资料')

    setInputFiles(inputs[0]!, [file('补充.pdf')])
    await flush()
    expect(container.querySelector('[role="dialog"]')).toBeNull()

    const submitButton = [...container.querySelectorAll<HTMLButtonElement>('button')]
      .find(button => button.textContent?.trim() === '提交审核')!
    expect(submitButton.disabled).toBe(false)
    submitButton.click()
    await flush()
    expect(api.post).toHaveBeenCalledTimes(1)
    const formData = vi.mocked(api.post).mock.calls[0]![0].query as unknown as FormData
    expect(formData.get('target_path')).toBe('/课程资料')
    expect(formData.getAll('relative_paths')).toEqual(['资料.pdf', '补充.pdf'])
    expect(container.textContent).toContain('尚未选择目录')
  })

  it('keeps files when directory selection is cancelled and validates root folder creation', async () => {
    mockApi()
    await mount()
    setInputFiles(container.querySelector<HTMLInputElement>('input[type="file"]')!, [file()])
    await flush()

    const confirmButton = [...container.querySelectorAll<HTMLButtonElement>('button')]
      .find(button => button.textContent?.trim() === '确认目录')!
    expect(confirmButton.disabled).toBe(true)
    const checkbox = container.querySelector<HTMLInputElement>('[role="dialog"] input[type="checkbox"]')!
    checkbox.click()
    await flush()
    const folderName = container.querySelector<HTMLInputElement>('#submission-new-folder-name')!
    folderName.value = '新资料'
    folderName.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()
    expect(confirmButton.disabled).toBe(false)

    const cancelButton = [...container.querySelectorAll<HTMLButtonElement>('button')]
      .find(button => button.textContent?.trim() === '取消')!
    cancelButton.click()
    await flush()
    expect(container.textContent).toContain('已选择的文件')
    expect(container.textContent).toContain('尚未选择目录')
    const submitButton = [...container.querySelectorAll<HTMLButtonElement>('button')]
      .find(button => button.textContent?.trim() === '提交审核')!
    expect(submitButton.disabled).toBe(true)
  })

  it('shows neutral grouped filters and orders each result by newest first', async () => {
    mockApi([
      makeRequest(1, 'approved', '/已通过-旧', '2026-09-01T00:00:00Z'),
      makeRequest(2, 'rejected', '/已退回', '2026-09-04T00:00:00Z'),
      makeRequest(3, 'pending', '/待审核', '2026-09-03T00:00:00Z'),
      makeRequest(4, 'publish_failed', '/发布异常', '2026-09-05T00:00:00Z'),
      makeRequest(5, 'approved', '/已通过-新', '2026-09-02T00:00:00Z'),
    ])
    await mount()

    expect([...container.querySelectorAll<HTMLElement>('article[id^="upload-record-"]')].map(item => item.id))
      .toEqual(['upload-record-4', 'upload-record-2', 'upload-record-3', 'upload-record-5', 'upload-record-1'])
    const issuesFilter = [...container.querySelectorAll<HTMLButtonElement>('button')]
      .find(button => button.textContent?.trim().startsWith('异常'))!
    issuesFilter.click()
    await flush()
    expect([...container.querySelectorAll<HTMLElement>('article[id^="upload-record-"]')].map(item => item.id))
      .toEqual(['upload-record-4', 'upload-record-2'])
    expect(container.textContent).toContain('发布异常：同步失败')
    expect(container.textContent).toContain('退回原因：目录不合适')
  })
})
