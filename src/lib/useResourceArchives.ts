import { computed, onBeforeUnmount, onMounted, reactive, watch, type Ref } from 'vue'
import { useShadcnToast } from '@/lib/useShadcnToast'
import { api } from '@/lib/requests'
import type { ResourceEntry } from '@/lib/resourceBrowser'
import type { ArchiveConfig, ArchiveTask } from '@/types/api/resourceArchives'

export const activeArchive = (task: ArchiveTask) => ['queued', 'running', 'cancelling'].includes(task.status)
export function archiveLabel(task: ArchiveTask): string {
  if (task.status === 'queued') return task.message || `正在排队，前方还有 ${task.ahead} 个任务`
  if (task.status === 'running') return `正在打包，已处理 ${task.processed_files} / ${task.file_count} 个文件`
  return ({ cancelling: '正在取消，请稍候', ready: '资料包已准备好', failed: task.message || '打包失败，请重试',
    cancelled: '已取消', expired: '资料包已过期', evicted: '资料包已因缓存空间不足被清理' })[task.status]
}

export function useResourceArchives(entries: Ref<ResourceEntry[]>, context: Ref<string>) {
  const selectionMessages = useShadcnToast()
  const state = reactive({
    selecting: false, panel: false, busy: false, loading: false, selected: [] as ResourceEntry[],
    tasks: [] as ArchiveTask[], error: '', message: '',
    config: null as ArchiveConfig | null,
  })
  let poll: ReturnType<typeof setTimeout> | undefined
  let disposed = false
  let requestKey: string | undefined
  let requestPaths = ''
  let revision = 0
  const selectedBytes = computed(() => state.selected.reduce((sum, file) => sum + (file.size || 0), 0))
  const pageFiles = computed(() => entries.value.filter(e => e.type === 'file'))
  const pageSelected = computed(() => pageFiles.value.length > 0 && pageFiles.value.every(e => state.selected.some(s => s.path === e.path)))
  const pagePartiallySelected = computed(() => !pageSelected.value && pageFiles.value.some(e => state.selected.some(s => s.path === e.path)))
  const running = computed(() => state.tasks.find(activeArchive))

  function fail(error: unknown) { state.error = error instanceof Error ? error.message : '请求失败，请稍后重试。' }
  function schedule() {
    clearTimeout(poll)
    if (!disposed && state.panel && state.tasks.some(activeArchive)) {
      poll = setTimeout(() => { void refresh() }, document.hidden ? 15000 : 2000)
    }
  }
  async function loadConfig() {
    if (state.config) return
    const response = await api.get({ url: '/api/resources/archives/config/' })
    if (response.status !== 200) throw new Error(response.errors?.[0]?.err_msg || '批量打包暂时不可用。')
    state.config = response.content
  }
  async function refresh() {
    const id = state.tasks[0]?.id
    if (!state.panel || !id || state.loading || disposed) return
    state.loading = true
    const version = revision
    try {
      const response = await api.get({ url: '/api/resources/archives/:id/', params: { id } })
      if (response.status !== 200) throw new Error(response.errors?.[0]?.err_msg || '暂时无法获取资料包，请重试。')
      if (!disposed && version === revision) state.tasks = [response.content.task]
    } catch (error) { if (state.panel && version === revision) fail(error) }
    finally { state.loading = false; schedule() }
  }
  async function startSelection() {
    state.error = ''; state.message = ''
    try { await loadConfig(); state.selecting = true } catch (error) { fail(error) }
  }
  function allowed(files: ResourceEntry[]) {
    const cfg = state.config
    if (!cfg) return false
    if (files.length > cfg.max_files || files.reduce((sum, f) => sum + (f.size || 0), 0) > cfg.max_bytes) {
      selectionMessages.warning(`每次最多 ${cfg.max_files} 个文件、${cfg.max_bytes / 1024 ** 2} MiB，请分批选择。`, { duration: 4000 })
      return false
    }
    return true
  }
  function toggle(file: ResourceEntry) {
    if (file.type !== 'file' || state.busy) return
    state.error = ''
    const existing = state.selected.some(e => e.path === file.path)
    const next = existing ? state.selected.filter(e => e.path !== file.path) : [...state.selected, file]
    if (allowed(next)) state.selected = next
  }
  function selectPage() {
    if (state.busy) return
    state.error = ''
    const paths = new Set(pageFiles.value.map(e => e.path))
    const next = pageSelected.value ? state.selected.filter(e => !paths.has(e.path))
      : [...state.selected.filter(e => !paths.has(e.path)), ...pageFiles.value]
    if (allowed(next)) state.selected = next
  }
  async function submit(paths = state.selected.map(e => e.path)) {
    if (!paths.length || state.busy) return
    const version = ++revision
    state.tasks = []
    state.busy = true; state.error = ''; state.message = ''; state.panel = true
    const signature = JSON.stringify([...paths].sort())
    if (!requestKey || requestPaths !== signature) { requestKey = crypto.randomUUID(); requestPaths = signature }
    try {
      const response = await api.post({ url: '/api/resources/archives/', query: { paths, request_key: requestKey } })
      if (response.status !== 200) throw new Error(response.errors?.[0]?.err_msg || response.data.message || '未能创建资料包，请稍后重试。')
      requestKey = undefined
      if (disposed || version !== revision) return
      state.message = response.content.result === 'active' ? '你已有一个资料包正在准备中，请查看任务。'
        : ''
      state.tasks = [response.content.task]
      schedule()
    } catch (error) { if (!disposed && version === revision) fail(error) }
    finally { state.busy = false }
  }
  async function cancel(task: ArchiveTask) {
    if (state.busy) return
    state.busy = true; state.error = ''
    try {
      const response = await api.post({ url: '/api/resources/archives/:id/cancel/', params: { id: task.id } })
      if (response.status !== 200) throw new Error(response.errors?.[0]?.err_msg || '取消失败，请重试。')
      revision++
      state.tasks = state.tasks.map(t => t.id === task.id ? response.content.task : t)
      await refresh()
    } catch (error) { fail(error) }
    finally { state.busy = false }
  }
  async function download(task: ArchiveTask) {
    if (state.busy) return
    state.busy = true; state.error = ''
    try {
      const response = await api.post({ url: '/api/resources/archives/:id/authorize/', params: { id: task.id } })
      if (response.status !== 200) throw new Error(response.errors?.[0]?.err_msg || '下载授权失败，请重新打包。')
      revision++
      const link = document.createElement('a')
      link.href = response.content.url; link.download = task.filename
      document.body.appendChild(link); link.click(); link.remove()
      state.tasks = state.tasks.map(t => t.id === task.id ? response.content.task : t)
      state.message = '已发起下载，请查看浏览器下载记录。'
    } catch (error) { fail(error) }
    finally { state.busy = false }
  }
  function visibility() { if (!document.hidden && state.panel) void refresh() }
  watch(context, () => { state.selected = []; state.error = ''; requestKey = undefined })
  watch(() => state.panel, (open) => {
    if (!open) {
      revision++
      state.tasks = []
    }
    schedule()
  }, { flush: 'sync' })
  onMounted(() => {
    document.addEventListener('visibilitychange', visibility)
  })
  onBeforeUnmount(() => { disposed = true; clearTimeout(poll); document.removeEventListener('visibilitychange', visibility) })
  return reactive({ state, selectedBytes, pageSelected, pagePartiallySelected, running, startSelection, toggle, selectPage, submit, cancel, download, refresh })
}
export type ArchiveController = ReturnType<typeof useResourceArchives>
