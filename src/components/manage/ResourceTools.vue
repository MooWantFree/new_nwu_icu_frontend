<template>
  <section class="surface-card p-5" aria-label="资料维护工具">
    <div class="flex flex-wrap gap-2" role="tablist" aria-label="资料维护">
      <button v-for="item in tabs" :key="item.id" role="tab" :aria-selected="tab === item.id" :disabled="busy" class="rounded-lg px-3 py-2 text-sm disabled:opacity-40" :class="tab === item.id ? 'bg-blue-100 text-blue-800' : 'bg-gray-50 text-gray-600'" @click="selectTab(item.id)">{{ item.label }}</button>
    </div>
    <p v-if="error" role="alert" class="mt-4 text-sm text-red-700">{{ error }}</p>
    <p v-if="message" role="status" class="mt-4 text-sm text-emerald-700">{{ message }}</p>
    <p v-if="busy" role="status" class="mt-4 text-sm text-gray-500">正在处理…</p>
    <fieldset :disabled="busy" class="mt-5 min-w-0 space-y-4 disabled:opacity-60">
      <template v-if="tab === 'readme' && readme">
        <p class="break-all text-sm text-gray-500">目录说明：{{ readme.path }} <span v-if="dirty" class="text-amber-700">· 尚未保存</span></p>
        <p v-if="readme.warning" class="text-sm text-amber-700">{{ readme.warning }} 请通过文件管理处理原文件，避免覆盖未加载的内容。</p>
        <p v-if="readme.path !== path" class="text-sm text-amber-700">当前保留的是 {{ readme.path }} 的草稿。保存或放弃后再加载新目录。</p>
        <div class="grid gap-4 xl:grid-cols-2">
          <label class="text-sm font-medium">Markdown 源码<textarea v-model="draft" :disabled="!!readme.warning" rows="12" class="mt-2 block w-full resize-y rounded-lg border border-gray-300 p-3 font-mono text-sm font-normal" aria-label="目录说明 Markdown" /></label>
          <div><p class="text-sm font-medium">预览</p><div class="prose prose-sm mt-2 min-h-64 max-w-none overflow-auto rounded-lg border border-gray-200 p-4" v-html="preview" /></div>
        </div>
        <div class="flex gap-3"><button :disabled="!dirty || !!readme.warning" class="btn-primary disabled:opacity-40" @click="saveReadme">保存目录说明</button><button class="btn-secondary" @click="reloadReadme">{{ dirty ? '放弃草稿并重新加载' : '重新加载' }}</button></div>
      </template>
      <template v-if="tab === 'access' && access">
        <p class="break-all text-sm text-gray-500">访问权限：{{ access.path }}（含全部子目录与文件）</p>
        <label class="block text-sm">目录规则<select v-model="mode" class="ml-3 rounded-lg border border-gray-300 px-3 py-2"><option value="public">公开 / 继承上级</option><option value="login">仅登录用户</option><option value="admin">仅资料管理员</option></select></label>
        <p class="text-sm text-gray-600">当前实际权限：{{ modeLabels[access.effective] }}。子目录不能放宽上级限制；浏览、搜索和下载使用相同规则。</p>
        <button class="btn-primary" :disabled="mode === access.mode" @click="saveAccess">保存访问权限</button>
        <details class="rounded-lg border border-gray-200 p-3 text-sm"><summary class="cursor-pointer">已设置的限制（{{ access.rules.length }}）</summary><ul class="mt-3 space-y-2"><li v-for="rule in access.rules" :key="rule.path" class="break-all">{{ rule.path }} · {{ modeLabels[rule.mode] }}</li></ul><p v-if="!access.rules.length" class="mt-3 text-gray-500">所有目录目前均公开。</p></details>
      </template>
      <template v-if="tab === 'index'">
        <p class="text-sm text-gray-600">搜索使用目录索引。通过本站修改会自动更新；在服务器或 Dropbox 中增删资料后，可在这里重新扫描。</p>
        <template v-if="index"><p class="text-sm">索引更新时间：{{ index.updated_at ? date(index.updated_at) : '尚未建立' }}</p><p v-if="index.summary" class="text-sm text-gray-500">{{ index.summary.directory_count }} 个目录 · {{ index.summary.file_count }} 个文件 · {{ formatResourceSize(index.summary.total_file_size) }}</p></template>
        <button class="btn-primary" @click="reindex">重新扫描并更新索引</button>
      </template>
      <template v-if="tab === 'audit'">
        <form class="flex flex-wrap gap-3" @submit.prevent="loadAudit(1)"><input v-model="search" aria-label="搜索操作记录" placeholder="文件路径或操作人" class="min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm" /><select v-model="actionFilter" aria-label="操作类型" class="rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="">全部操作</option><option v-for="(label, key) in actionLabels" :key="key" :value="key">{{ label }}</option></select><button class="btn-secondary">查询</button></form>
        <template v-if="auditData"><p class="text-sm text-gray-500">{{ auditData.count }} 条记录 · 从此功能启用后开始记录</p><ul class="divide-y divide-gray-100"><li v-for="item in auditData.results" :key="item.id" class="py-3 text-sm"><div class="flex flex-wrap justify-between gap-2"><span>{{ actionLabels[item.action] || item.action }} · {{ item.actor }}</span><time class="text-gray-400">{{ date(item.created_at) }}</time></div><p class="mt-1 break-all text-gray-600">{{ item.path }}<template v-if="item.destination"> → {{ item.destination }}</template></p><p v-if="item.action === 'access'" class="mt-1 text-gray-500">设置为：{{ modeLabels[item.detail.mode as AccessMode] }}</p></li></ul><p v-if="!auditData.count" class="text-sm text-gray-500">暂无操作记录。</p><div v-if="auditData.count > 50" class="flex items-center justify-center gap-4 text-sm"><button :disabled="auditData.page === 1" @click="loadAudit(auditData.page - 1)">上一页</button><span>{{ auditData.page }} / {{ Math.ceil(auditData.count / 50) }}</span><button :disabled="auditData.page * 50 >= auditData.count" @click="loadAudit(auditData.page + 1)">下一页</button></div></template>
      </template>
      <template v-if="tab === 'statistics'">
        <div class="flex flex-wrap items-center justify-between gap-3"><p class="text-sm text-gray-600">下载统计从功能启用后开始积累。</p><label class="text-sm">时间范围<select v-model.number="days" class="ml-2 rounded-lg border border-gray-300 px-3 py-2" @change="load"><option :value="7">近 7 天</option><option :value="30">近 30 天</option><option :value="90">近 90 天</option></select></label></div>
        <form class="grid gap-3 rounded-lg border border-gray-200 p-4 sm:grid-cols-2" @submit.prevent="applyStatisticsFilters">
          <label class="text-sm">IP 地址<input v-model="statsIp" placeholder="IPv4 或 IPv6，精确匹配" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2" /></label>
          <label class="text-sm">用户 ID<input v-model="statsUser" type="number" min="1" step="1" placeholder="仅此登录用户" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2" /></label>
          <label class="text-sm">User-Agent<input v-model="statsUa" maxlength="2048" placeholder="例如 Chrome、Firefox、Android" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2" /></label>
          <label class="text-sm">文件路径<input v-model="statsPath" maxlength="200" placeholder="按路径关键词筛选" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2" /></label>
          <div class="flex gap-3 sm:col-span-2"><button class="btn-primary">筛选统计</button><button type="button" class="btn-secondary" @click="resetStatisticsFilters">重置筛选</button></div>
        </form>
        <p v-if="statisticsFilterLabel" class="break-all text-sm text-blue-700">当前报表筛选：{{ statisticsFilterLabel }}</p>
        <template v-if="statistics"><div class="grid grid-cols-2 gap-3 sm:grid-cols-3"><div v-for="item in [{ label: '下载次数', value: statistics.total }, { label: '游客下载', value: statistics.guest }, { label: '登录用户下载', value: statistics.authenticated }, { label: '独立 IP', value: statistics.unique_ips }, { label: '登录用户数', value: statistics.unique_users }, { label: '不同 UA', value: statistics.unique_uas }]" :key="item.label" class="rounded-lg bg-gray-50 p-4"><p class="text-xs text-gray-500">{{ item.label }}</p><p class="mt-2 text-xl font-semibold">{{ item.value.toLocaleString() }}</p></div></div>
          <p class="text-xs leading-5 text-gray-500">统计成功发起的文件下载，不代表下载完成。预览、HEAD、失败请求及非起始分段不计入；同一用户或匿名访问标识在每个 5 分钟时间段内下载同一文件计一次，IP 与 UA 取首次计数时的值。共享网络可能合并匿名计数。</p>
          <p v-if="statistics.unknown_ip || statistics.unknown_ua || statistics.unknown_user" class="text-xs text-amber-700">未记录 IP：{{ statistics.unknown_ip }} 次；未记录 UA：{{ statistics.unknown_ua }} 次；未关联账号的登录下载：{{ statistics.unknown_user }} 次。历史缺失字段无法补填，不计入对应排行。</p>
          <h4 class="text-sm font-medium">每日下载</h4><div class="max-h-64 space-y-2 overflow-y-auto"><div v-for="item in daily" :key="item.date" class="flex items-center gap-3 text-xs"><span class="w-20 shrink-0 text-gray-500">{{ item.date }}</span><div class="h-3 flex-1 rounded bg-blue-50"><div class="h-3 rounded bg-blue-500" :style="{ width: `${item.count / maxDaily * 100}%` }" /></div><span class="w-12 text-right">{{ item.count }}</span></div></div>
          <h4 class="text-sm font-medium">热门文件 · 前 50 项</h4><div class="overflow-x-auto"><table class="w-full text-left text-sm"><thead><tr class="border-b border-gray-200"><th class="py-2 font-medium">下载时的文件路径</th><th class="whitespace-nowrap py-2 text-right font-medium">下载次数</th></tr></thead><tbody><tr v-for="item in statistics.files" :key="item.path" class="border-b border-gray-100"><td class="break-all py-3 pr-4">{{ item.path }}</td><td class="py-3 text-right">{{ item.count }}</td></tr></tbody></table><p v-if="!statistics.files.length" class="py-6 text-center text-sm text-gray-500">此时间段暂无下载记录。</p></div>
          <div class="grid gap-5 xl:grid-cols-2">
            <section class="min-w-0"><h4 class="text-sm font-medium">IP 下载排行 · 前 50 项</h4><div class="mt-2 max-h-80 overflow-auto"><table class="w-full text-left text-sm"><thead><tr class="border-b border-gray-200"><th class="py-2 font-medium">IP 地址</th><th class="py-2 text-right font-medium">次数</th></tr></thead><tbody><tr v-for="item in statistics.ips" :key="item.ip_address" class="border-b border-gray-100"><td class="break-all py-3 pr-3"><button class="text-left text-blue-700 hover:underline" :aria-label="`筛选 IP ${item.ip_address}`" @click="filterDimension('ip', item.ip_address)">{{ item.ip_address }}</button></td><td class="text-right">{{ item.count }}</td></tr></tbody></table><p v-if="!statistics.ips.length" class="py-5 text-sm text-gray-500">暂无已记录 IP。</p></div></section>
            <section class="min-w-0"><h4 class="text-sm font-medium">登录用户排行 · 前 50 项</h4><div class="mt-2 max-h-80 overflow-auto"><table class="w-full text-left text-sm"><thead><tr class="border-b border-gray-200"><th class="py-2 font-medium">用户名 / ID</th><th class="py-2 text-right font-medium">次数</th></tr></thead><tbody><tr v-for="item in statistics.users" :key="item.user_id" class="border-b border-gray-100"><td class="break-all py-3 pr-3"><button class="text-left text-blue-700 hover:underline" :aria-label="`筛选用户 ${item.user_id}`" @click="filterDimension('user_id', item.user_id)">{{ item.username }} <span class="text-gray-400">#{{ item.user_id }}</span></button></td><td class="text-right">{{ item.count }}</td></tr></tbody></table><p v-if="!statistics.users.length" class="py-5 text-sm text-gray-500">暂无已关联用户。</p></div></section>
          </div>
          <section><h4 class="text-sm font-medium">User-Agent 下载排行 · 前 50 项</h4><div class="mt-2 max-h-80 overflow-auto"><table class="w-full table-fixed text-left text-sm"><thead><tr class="border-b border-gray-200"><th class="py-2 font-medium">User-Agent</th><th class="w-16 py-2 text-right font-medium">次数</th></tr></thead><tbody><tr v-for="item in statistics.uas" :key="item.user_agent" class="border-b border-gray-100"><td class="break-all py-3 pr-3"><button class="text-left text-xs text-blue-700 hover:underline" @click="filterDimension('ua', item.user_agent)">{{ item.user_agent }}</button></td><td class="text-right">{{ item.count }}</td></tr></tbody></table><p v-if="!statistics.uas.length" class="py-5 text-sm text-gray-500">暂无已记录 UA。</p></div></section>
          <section aria-label="下载记录明细"><h4 class="text-sm font-medium">下载明细 · {{ statistics.events.count }} 条</h4><p class="mt-1 text-xs text-gray-500">用户名为下载时的记录；排行按用户 ID 合并。点击排行可进一步筛选。</p><ul class="mt-3 divide-y divide-gray-100"><li v-for="item in statistics.events.results" :key="item.id" class="space-y-2 py-4 text-sm"><div class="flex flex-wrap justify-between gap-2"><span>{{ item.authenticated ? (item.user_id ? `${item.username} #${item.user_id}` : '登录用户（历史未关联）') : '游客' }}</span><time class="text-xs text-gray-400">{{ date(item.created_at) }}</time></div><p class="break-all">{{ item.path }}</p><p class="break-all text-xs text-gray-500">IP：{{ item.ip_address || '未记录' }}</p><details class="text-xs text-gray-500"><summary class="cursor-pointer">User-Agent</summary><p class="mt-2 break-all">{{ item.user_agent || '未记录' }}</p></details></li></ul><p v-if="!statistics.events.count" class="py-6 text-center text-sm text-gray-500">没有匹配的下载记录。</p><div v-if="statistics.events.count > statistics.events.page_size" class="flex items-center justify-center gap-4 text-sm"><button :disabled="statistics.events.page === 1" @click="loadStatisticsPage(statistics.events.page - 1)">上一页</button><span>{{ statistics.events.page }} / {{ Math.ceil(statistics.events.count / statistics.events.page_size) }}</span><button :disabled="statistics.events.page * statistics.events.page_size >= statistics.events.count" @click="loadStatisticsPage(statistics.events.page + 1)">下一页</button></div></section>
        </template>
      </template>
    </fieldset>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { api } from '@/lib/requests'
import { formatResourceSize, renderResourceReadme } from '@/lib/resourceBrowser'
import type { AccessData, AccessMode, AuditData, IndexData, ReadmeData, StatisticsData, StatisticsQuery } from '@/types/api/resourceTools'
const props = defineProps<{ path: string }>()
const emit = defineEmits<{ (event: 'session-expired'): void; (event: 'changed'): void }>()
const tabs = [{ id: 'readme', label: '目录说明' }, { id: 'access', label: '访问权限' }, { id: 'index', label: '目录索引' }, { id: 'audit', label: '操作记录' }, { id: 'statistics', label: '下载统计' }] as const
type Tab = typeof tabs[number]['id']
const tab = ref<Tab>('readme')
const busy = ref(false), error = ref(''), message = ref(''), draft = ref(''), preview = ref('')
const readme = ref<ReadmeData>(), access = ref<AccessData>(), index = ref<IndexData>(), auditData = ref<AuditData>(), statistics = ref<StatisticsData>()
const mode = ref<AccessMode>('public'), search = ref(''), actionFilter = ref(''), days = ref(30)
const statsIp = ref(''), statsUser = ref(''), statsUa = ref(''), statsPath = ref('')
const statisticsFilters = ref<Omit<StatisticsQuery, 'days' | 'page'>>({})
const statisticsFilterLabel = computed(() => Object.entries(statisticsFilters.value).map(([key, value]) => `${({ ip: 'IP', user_id: '用户 ID', ua: 'UA', search: '路径' } as Record<string, string>)[key]}：${value}`).join('；'))
const modeLabels: Record<AccessMode, string> = { public: '公开 / 继承上级', login: '仅登录用户', admin: '仅资料管理员' }
const actionLabels: Record<string, string> = { upload: '上传', rename: '重命名', move: '移动', delete: '移入回收站', restore: '恢复', mkdir: '新建目录', readme: '编辑目录说明', access: '修改权限', reindex: '刷新索引', purge: '永久删除', purge_requested: '请求永久删除' }
const dirty = computed(() => !!readme.value && draft.value !== readme.value.content)
const date = (value: string) => new Date(value).toLocaleString('zh-CN')
let generation = 0, previewGeneration = 0
function check(result: { status: number; errors?: { err_msg: string }[] }) {
  if ([401, 403].includes(result.status)) emit('session-expired')
  if (result.status !== 200) throw new Error(result.errors?.[0]?.err_msg || '操作失败，请刷新后重试。')
}
async function run(operation: () => Promise<void>) {
  if (busy.value) return
  busy.value = true; error.value = ''; message.value = ''
  try { await operation() } catch (cause) { error.value = cause instanceof Error ? cause.message : '操作失败。' }
  finally { busy.value = false }
}
async function load() {
  if (tab.value === 'readme' && dirty.value) return
  const current = ++generation, path = props.path, selected = tab.value
  await run(async () => {
    if (selected === 'readme') {
      const r = await api.get({ url: '/api/management/resources/readme/', query: { path } }); check(r)
      if (current === generation) { readme.value = r.content; draft.value = r.content.content }
    } else if (selected === 'access') {
      const r = await api.get({ url: '/api/management/resources/access/', query: { path } }); check(r)
      if (current === generation) { access.value = r.content; mode.value = r.content.mode }
    } else if (selected === 'index') {
      const r = await api.get({ url: '/api/management/resources/index/' }); check(r); if (current === generation) index.value = r.content
    } else if (selected === 'audit') { await fetchAudit(1) }
    else {
      await fetchStatistics(1, current)
    }
  })
  if (path !== props.path && !dirty.value) await load()
}
function selectTab(value: Tab) { tab.value = value; void load() }
async function reloadReadme() {
  if (dirty.value && !window.confirm('放弃尚未保存的目录说明？')) return
  readme.value = undefined; draft.value = ''; await load()
}
async function saveReadme() {
  if (!readme.value || readme.value.warning) return
  const query = { path: readme.value.path, version: readme.value.version, content: draft.value }
  await run(async () => { const r = await api.post({ url: '/api/management/resources/readme/', query }); check(r); readme.value = r.content; draft.value = r.content.content; message.value = '目录说明已保存。'; emit('changed') })
}
async function saveAccess() {
  if (!access.value) return
  const query = { path: access.value.path, mode: mode.value }
  await run(async () => { const r = await api.post({ url: '/api/management/resources/access/', query }); check(r); const fresh = await api.get({ url: '/api/management/resources/access/', query: { path: query.path } }); check(fresh); access.value = fresh.content; mode.value = fresh.content.mode; message.value = '访问权限已保存。' })
}
async function reindex() {
  await run(async () => { const r = await api.post({ url: '/api/management/resources/index/' }); check(r); index.value = r.content; message.value = '目录索引已更新。'; emit('changed') })
}
async function fetchAudit(page: number) { const r = await api.get({ url: '/api/management/resources/audit/', query: { page, action: actionFilter.value, search: search.value } }); check(r); auditData.value = r.content }
function loadAudit(page: number) { return run(() => fetchAudit(page)) }
async function fetchStatistics(page: number, current = generation) {
  const r = await api.get({ url: '/api/management/resources/statistics/', query: { days: days.value, ...statisticsFilters.value, ...(page > 1 ? { page } : {}) } }); check(r)
  if (current === generation) statistics.value = r.content
}
function loadStatisticsPage(page: number) { return run(() => fetchStatistics(page)) }
async function applyStatisticsFilters() {
  const filters = { ...(statsIp.value.trim() ? { ip: statsIp.value.trim() } : {}), ...(statsUser.value ? { user_id: Number(statsUser.value) } : {}), ...(statsUa.value.trim() ? { ua: statsUa.value.trim() } : {}), ...(statsPath.value.trim() ? { search: statsPath.value.trim() } : {}) }
  const previous = statisticsFilters.value
  await run(async () => {
    statisticsFilters.value = filters
    try { await fetchStatistics(1) } catch (cause) { statisticsFilters.value = previous; throw cause }
  })
}
function resetStatisticsFilters() { statsIp.value = ''; statsUser.value = ''; statsUa.value = ''; statsPath.value = ''; return applyStatisticsFilters() }
function filterDimension(key: 'ip' | 'user_id' | 'ua', value: string | number) {
  statsIp.value = statisticsFilters.value.ip || ''; statsUser.value = String(statisticsFilters.value.user_id || ''); statsUa.value = statisticsFilters.value.ua || ''; statsPath.value = statisticsFilters.value.search || ''
  if (key === 'ip') statsIp.value = String(value)
  else if (key === 'user_id') statsUser.value = String(value)
  else statsUa.value = String(value)
  return applyStatisticsFilters()
}
const daily = computed(() => statistics.value?.daily || [])
const maxDaily = computed(() => Math.max(1, ...daily.value.map(item => item.count)))
watch([draft, () => readme.value?.path], async () => { const current = ++previewGeneration; const html = await renderResourceReadme(draft.value, readme.value?.path || props.path); if (current === previewGeneration) preview.value = html })
watch(() => props.path, () => { if (!busy.value) void load() }, { immediate: true })
function warnUnsaved(event: BeforeUnloadEvent) { if (dirty.value) { event.preventDefault(); event.returnValue = '' } }
window.addEventListener('beforeunload', warnUnsaved)
onBeforeUnmount(() => { generation++; previewGeneration++; window.removeEventListener('beforeunload', warnUnsaved) })
</script>
