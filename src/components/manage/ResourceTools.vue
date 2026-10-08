<template>
  <section v-if="active && availableTabs.length" class="overflow-hidden rounded-xl border border-zinc-200 bg-white text-zinc-950" aria-label="资料维护工具">
    <div class="p-4 sm:p-5" :class="{ 'border-b border-zinc-200': tab }">
      <div class="flex flex-wrap items-center justify-between gap-3"><h3 class="text-base font-semibold tracking-tight">资料维护</h3><button v-if="tab" type="button" :disabled="busy" aria-label="关闭资料维护" class="inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:opacity-40" @click="selectTab(null)"><X class="h-4 w-4" aria-hidden="true" /></button></div>
      <nav class="mt-4 inline-flex max-w-full flex-wrap gap-1 rounded-lg bg-zinc-100 p-1" aria-label="资料维护">
        <button v-for="item in availableTabs" :id="`resource-tools-tab-${item.id}`" :key="item.id" type="button" :aria-pressed="tab === item.id" :aria-controls="tab === item.id ? `resource-tools-panel-${item.id}` : undefined" :disabled="busy" class="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40" :class="tab === item.id ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-500 hover:text-zinc-950'" @click="selectTab(item.id)">{{ item.label }}</button>
      </nav>
    </div>
    <div v-if="tab" class="p-4 sm:p-5">
      <div v-if="error" role="alert" class="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><p>{{ error }}</p></div>
      <div v-if="message" role="status" class="mb-4 flex items-start gap-2.5 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700"><CheckCircle2 class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><p>{{ message }}</p></div>
      <p v-if="busy" role="status" class="mb-4 flex items-center gap-2 text-sm text-zinc-500"><LoaderCircle class="h-4 w-4 animate-spin" aria-hidden="true" />正在处理…</p>
      <fieldset :id="`resource-tools-panel-${tab}`" :aria-labelledby="`resource-tools-tab-${tab}`" :disabled="busy" class="min-w-0 space-y-5 disabled:opacity-60">
        <template v-if="tab === 'access'">
          <div class="grid gap-5 lg:grid-cols-2">
            <section class="overflow-hidden rounded-lg border border-zinc-200 bg-white" aria-label="访问权限目录">
              <div class="border-b border-zinc-200 px-4 py-3"><h4 class="text-sm font-medium">浏览目录</h4></div>
              <div class="flex flex-wrap items-center gap-2 border-b border-zinc-200 bg-zinc-50/50 p-3">
                <button type="button" :class="ghostButtonClass" :disabled="busy || accessPath === '/'" @click="navigateAccess('/')"><House class="h-4 w-4" aria-hidden="true" />根目录</button>
                <button type="button" :class="ghostButtonClass" :disabled="busy || accessPath === '/'" @click="navigateAccess(accessParent)"><CornerLeftUp class="h-4 w-4" aria-hidden="true" />上一级</button>
                <span class="min-w-0 flex-1 break-all px-1 text-xs leading-5 text-zinc-500">{{ accessPath }}</span>
                <button type="button" :class="outlineButtonClass" :disabled="busy" aria-label="刷新访问权限" @click="load"><RefreshCw class="h-4 w-4" aria-hidden="true" />刷新</button>
              </div>
              <p v-if="busy && !access" role="status" class="flex min-h-32 items-center justify-center gap-2 p-6 text-sm text-zinc-500"><LoaderCircle class="h-4 w-4 animate-spin" aria-hidden="true" />正在读取目录与权限…</p>
              <ul v-else-if="access && accessDirectories.length" class="max-h-80 divide-y divide-zinc-100 overflow-y-auto overscroll-contain">
                <li v-for="directory in accessDirectories" :key="directory.path"><button type="button" :disabled="busy" :aria-label="`进入目录 ${directory.name}`" class="flex min-h-12 w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400 disabled:opacity-40" @click="navigateAccess(directory.path)"><Folder class="h-4 w-4 shrink-0 fill-zinc-100 text-zinc-500" aria-hidden="true" /><span class="min-w-0 flex-1 break-all">{{ directory.name }}</span><ChevronRight class="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" /></button></li>
              </ul>
              <p v-else-if="access" class="p-8 text-center text-sm text-zinc-500">当前目录下没有子文件夹。</p>
              <div v-else class="p-6 text-center"><button type="button" :class="outlineButtonClass" @click="load">重新加载目录</button></div>
            </section>
            <section v-if="access" class="space-y-4 rounded-lg border border-zinc-200 bg-white p-4" aria-label="当前目录访问权限">
              <div><h4 class="text-sm font-medium">当前目录权限</h4><p class="mt-2 break-all text-xs leading-5 text-zinc-500">{{ access.path }}（含全部子目录与文件）</p></div>
              <div class="space-y-2"><label for="resource-access-mode" class="block text-sm font-medium">目录规则</label><ShadcnSelect id="resource-access-mode" :value="mode" :options="accessOptions" :disabled="busy" aria-label="目录规则" @update:value="updateMode" /></div>
              <p class="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm leading-6 text-zinc-600">当前实际权限：{{ effectiveModeLabels[access.effective] }}。子目录不能放宽上级限制；浏览、搜索和下载使用相同规则。</p>
              <button type="button" :class="primaryButtonClass" :disabled="busy || mode === access.mode" @click="saveAccess">保存访问权限</button>
            </section>
          </div>
          <p class="text-xs leading-5 text-zinc-500">点击文件夹可查看下级目录，并设置该目录的访问权限。修改后点击保存才会生效。</p>
          <details v-if="access" class="rounded-lg border border-zinc-200 text-sm"><summary class="cursor-pointer px-4 py-3 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400">已设置的限制（{{ access.rules.length }}）</summary><ul v-if="access.rules.length" class="divide-y divide-zinc-100 border-t border-zinc-200"><li v-for="rule in access.rules" :key="rule.path" class="flex flex-wrap items-center justify-between gap-2 px-4 py-3"><button type="button" :disabled="busy" :aria-label="`查看权限 ${rule.path}`" :class="linkClass" class="min-w-0 break-all" @click="navigateAccess(rule.path)">{{ rule.path }}</button><span class="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs">{{ modeLabels[rule.mode] }}</span></li></ul><p v-else class="border-t border-zinc-200 px-4 py-4 text-zinc-500">所有目录目前均公开。</p></details>
        </template>
        <template v-if="tab === 'index'">
          <div class="rounded-lg border border-zinc-200 bg-zinc-50 p-4"><div class="flex items-center gap-2"><Database class="h-4 w-4 text-zinc-500" aria-hidden="true" /><h4 class="text-sm font-medium">目录索引</h4></div><p class="mt-2 text-sm leading-6 text-zinc-600">搜索使用目录索引。通过本站修改会自动更新；在服务器或 Dropbox 中增删资料后，可在这里重新扫描。</p><template v-if="index"><p class="mt-4 text-sm text-zinc-700">索引更新时间：{{ index.updated_at ? date(index.updated_at) : '尚未建立' }}</p><p v-if="index.summary" class="mt-2 text-sm text-zinc-500">{{ index.summary.directory_count }} 个目录 · {{ index.summary.file_count }} 个文件 · {{ formatResourceSize(index.summary.total_file_size) }}</p></template></div>
          <button type="button" :class="primaryButtonClass" @click="reindex"><RefreshCw class="h-4 w-4" aria-hidden="true" />重新扫描并更新索引</button>
        </template>
        <template v-if="tab === 'audit'">
          <form class="flex flex-wrap gap-3" @submit.prevent="loadAudit(1)"><div class="relative min-w-0 flex-1 sm:min-w-60"><Search class="pointer-events-none absolute left-3 top-3 h-4 w-4 text-zinc-400" aria-hidden="true" /><input v-model="search" aria-label="搜索操作记录" placeholder="文件路径或操作人" :class="inputClass" class="h-10 w-full pl-9" /></div><ShadcnSelect :value="actionFilter" :options="auditOptions" :disabled="busy" aria-label="操作类型" class="w-full sm:w-44" @update:value="updateActionFilter" /><button :class="outlineButtonClass">查询</button></form>
          <template v-if="auditData">
            <p class="text-sm text-zinc-500"><span class="font-medium text-zinc-700">{{ auditData.count }} 条记录</span> · 从此功能启用后开始记录</p>
            <ul class="divide-y divide-zinc-100 rounded-lg border border-zinc-200"><li v-for="item in auditData.results" :key="item.id" class="px-4 py-4 text-sm"><div class="flex flex-wrap items-center justify-between gap-2"><span class="font-medium">{{ actionLabels[item.action] || item.action }} · {{ item.actor }}</span><time class="text-xs text-zinc-400">{{ date(item.created_at) }}</time></div><p class="mt-2 break-all text-zinc-600">{{ item.path }}<template v-if="item.destination"> → {{ item.destination }}</template></p><p v-if="item.action === 'access'" class="mt-1 text-zinc-500">设置为：{{ modeLabels[item.detail.mode as AccessMode] }}</p></li></ul>
            <p v-if="!auditData.count" class="py-8 text-center text-sm text-zinc-500">暂无操作记录。</p><ReviewPagination v-if="auditData.count > 50" :page="auditData.page" :page-count="Math.ceil(auditData.count / 50)" @update:page="loadAudit" />
          </template>
        </template>
        <template v-if="tab === 'statistics'">
          <div class="flex flex-wrap items-center justify-between gap-3"><p class="text-sm text-zinc-500">下载统计从功能启用后开始积累。</p><div class="flex items-center gap-3"><label for="resource-statistics-days" class="shrink-0 text-sm font-medium">时间范围</label><ShadcnSelect id="resource-statistics-days" :value="days" :options="dayOptions" :disabled="busy" class="w-36" @update:value="updateDays" /></div></div>
          <form class="grid gap-4 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 sm:grid-cols-2" @submit.prevent="applyStatisticsFilters">
            <label class="text-sm font-medium">IP 地址<input v-model="statsIp" placeholder="IPv4 或 IPv6，精确匹配" :class="inputClass" class="mt-2 block h-10 w-full font-normal" /></label>
            <label class="text-sm font-medium">用户 ID<input v-model="statsUser" type="number" min="1" step="1" placeholder="仅此登录用户" :class="inputClass" class="mt-2 block h-10 w-full font-normal" /></label>
            <label class="text-sm font-medium">User-Agent<input v-model="statsUa" maxlength="2048" placeholder="例如 Chrome、Firefox、Android" :class="inputClass" class="mt-2 block h-10 w-full font-normal" /></label>
            <label class="text-sm font-medium">文件路径<input v-model="statsPath" maxlength="200" placeholder="按路径关键词筛选" :class="inputClass" class="mt-2 block h-10 w-full font-normal" /></label>
            <div class="flex flex-wrap gap-2 sm:col-span-2"><button :class="primaryButtonClass">筛选统计</button><button type="button" :class="outlineButtonClass" @click="resetStatisticsFilters">重置筛选</button></div>
          </form>
          <p v-if="statisticsFilterLabel" class="break-all rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">当前报表筛选：{{ statisticsFilterLabel }}</p>
          <template v-if="statistics">
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-3"><div v-for="item in [{ label: '下载次数', value: statistics.total }, { label: '游客下载', value: statistics.guest }, { label: '登录用户下载', value: statistics.authenticated }, { label: '独立 IP', value: statistics.unique_ips }, { label: '登录用户数', value: statistics.unique_users }, { label: '不同 UA', value: statistics.unique_uas }]" :key="item.label" class="rounded-lg border border-zinc-200 bg-white p-4"><p class="text-xs text-zinc-500">{{ item.label }}</p><p class="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{{ item.value.toLocaleString() }}</p></div></div>
            <p class="text-xs leading-5 text-zinc-500">统计成功发起的文件下载，不代表下载完成。预览、HEAD、失败请求及非起始分段不计入；同一用户或匿名访问标识在每个 5 分钟时间段内下载同一文件计一次，IP 与 UA 取首次计数时的值。共享网络可能合并匿名计数。</p>
            <p v-if="statistics.unknown_ip || statistics.unknown_ua || statistics.unknown_user" class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">未记录 IP：{{ statistics.unknown_ip }} 次；未记录 UA：{{ statistics.unknown_ua }} 次；未关联账号的登录下载：{{ statistics.unknown_user }} 次。历史缺失字段无法补填，不计入对应排行。</p>
            <section class="rounded-lg border border-zinc-200 p-4"><h4 class="text-sm font-medium">每日下载</h4><div class="mt-4 max-h-64 space-y-3 overflow-y-auto"><div v-for="item in daily" :key="item.date" class="flex items-center gap-3 text-xs"><span class="w-20 shrink-0 text-zinc-500">{{ item.date }}</span><div class="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100"><div class="h-2 rounded-full bg-zinc-800" :style="{ width: `${item.count / maxDaily * 100}%` }" /></div><span class="w-12 text-right tabular-nums">{{ item.count }}</span></div></div></section>
            <section class="overflow-hidden rounded-lg border border-zinc-200"><h4 class="border-b border-zinc-200 px-4 py-3 text-sm font-medium">热门文件 · 前 50 项</h4><div class="overflow-x-auto"><table :class="tableClass"><thead><tr><th>下载时的文件路径</th><th class="whitespace-nowrap text-right">下载次数</th></tr></thead><tbody><tr v-for="item in statistics.files" :key="item.path"><td class="break-all">{{ item.path }}</td><td class="text-right tabular-nums">{{ item.count }}</td></tr></tbody></table><p v-if="!statistics.files.length" class="py-8 text-center text-sm text-zinc-500">此时间段暂无下载记录。</p></div></section>
            <div class="grid gap-5 xl:grid-cols-2">
              <section class="min-w-0 overflow-hidden rounded-lg border border-zinc-200"><h4 class="border-b border-zinc-200 px-4 py-3 text-sm font-medium">IP 下载排行 · 前 50 项</h4><div class="max-h-80 overflow-auto"><table :class="tableClass"><thead><tr><th>IP 地址</th><th class="text-right">次数</th></tr></thead><tbody><tr v-for="item in statistics.ips" :key="item.ip_address"><td class="break-all"><button type="button" :class="linkClass" :aria-label="`筛选 IP ${item.ip_address}`" @click="filterDimension('ip', item.ip_address)">{{ item.ip_address }}</button></td><td class="text-right tabular-nums">{{ item.count }}</td></tr></tbody></table><p v-if="!statistics.ips.length" class="px-4 py-8 text-sm text-zinc-500">暂无已记录 IP。</p></div></section>
              <section class="min-w-0 overflow-hidden rounded-lg border border-zinc-200"><h4 class="border-b border-zinc-200 px-4 py-3 text-sm font-medium">登录用户排行 · 前 50 项</h4><div class="max-h-80 overflow-auto"><table :class="tableClass"><thead><tr><th>用户名 / ID</th><th class="text-right">次数</th></tr></thead><tbody><tr v-for="item in statistics.users" :key="item.user_id"><td class="break-all"><button type="button" :class="linkClass" :aria-label="`筛选用户 ${item.user_id}`" @click="filterDimension('user_id', item.user_id)">{{ item.username }} <span class="text-zinc-400">#{{ item.user_id }}</span></button></td><td class="text-right tabular-nums">{{ item.count }}</td></tr></tbody></table><p v-if="!statistics.users.length" class="px-4 py-8 text-sm text-zinc-500">暂无已关联用户。</p></div></section>
            </div>
            <section class="overflow-hidden rounded-lg border border-zinc-200"><h4 class="border-b border-zinc-200 px-4 py-3 text-sm font-medium">User-Agent 下载排行 · 前 50 项</h4><div class="max-h-80 overflow-auto"><table :class="tableClass" class="table-fixed"><thead><tr><th>User-Agent</th><th class="w-16 text-right">次数</th></tr></thead><tbody><tr v-for="item in statistics.uas" :key="item.user_agent"><td class="break-all"><button type="button" :class="linkClass" class="text-xs" @click="filterDimension('ua', item.user_agent)">{{ item.user_agent }}</button></td><td class="text-right tabular-nums">{{ item.count }}</td></tr></tbody></table><p v-if="!statistics.uas.length" class="px-4 py-8 text-sm text-zinc-500">暂无已记录 UA。</p></div></section>
            <section aria-label="下载记录明细" class="overflow-hidden rounded-lg border border-zinc-200"><div class="border-b border-zinc-200 px-4 py-3"><h4 class="text-sm font-medium">下载明细 · {{ statistics.events.count }} 条</h4><p class="mt-1 text-xs leading-5 text-zinc-500">用户名为下载时的记录；排行按用户 ID 合并。点击排行可进一步筛选。</p></div><ul class="divide-y divide-zinc-100"><li v-for="item in statistics.events.results" :key="item.id" class="space-y-2 px-4 py-4 text-sm"><div class="flex flex-wrap items-center justify-between gap-2"><span class="font-medium">{{ item.authenticated ? (item.user_id ? `${item.username} #${item.user_id}` : '登录用户（历史未关联）') : '游客' }}</span><time class="text-xs text-zinc-400">{{ date(item.created_at) }}</time></div><p class="break-all text-zinc-700">{{ item.path }}</p><p class="break-all text-xs text-zinc-500">IP：{{ item.ip_address || '未记录' }}</p><details class="text-xs text-zinc-500"><summary class="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400">User-Agent</summary><p class="mt-2 break-all">{{ item.user_agent || '未记录' }}</p></details></li></ul><p v-if="!statistics.events.count" class="py-8 text-center text-sm text-zinc-500">没有匹配的下载记录。</p><ReviewPagination v-if="statistics.events.count > statistics.events.page_size" class="border-t border-zinc-200 px-4 py-4" :page="statistics.events.page" :page-count="Math.ceil(statistics.events.count / statistics.events.page_size)" @update:page="loadStatisticsPage" /></section>
          </template>
        </template>
        <ResourceUploadBlacklist v-if="tab === 'blacklist'" @session-expired="emit('session-expired')" />
      </fieldset>
    </div>
  </section>
</template>
<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref, watch } from 'vue'
import { routeLocationKey, routerKey } from 'vue-router'
import { AlertCircle, CheckCircle2, ChevronRight, CornerLeftUp, Database, Folder, House, LoaderCircle, RefreshCw, Search, X } from 'lucide-vue-next'
import ShadcnSelect from '@/components/common/ShadcnSelect.vue'
import ReviewPagination from '@/components/courseReview/ReviewPagination.vue'
import ResourceUploadBlacklist from '@/components/upload/ResourceUploadBlacklist.vue'
import { api } from '@/lib/requests'
import { formatResourceSize } from '@/lib/resourceBrowser'
import type { AccessData, AccessMode, AuditData, IndexData, StatisticsData, StatisticsQuery } from '@/types/api/resourceTools'
import type { ManagedResourceFile } from '@/types/api/management'

const props = withDefaults(defineProps<{ path: string; canManageFiles?: boolean; canReviewUploads?: boolean; active?: boolean }>(), { canManageFiles: true, canReviewUploads: false, active: true })
const emit = defineEmits<{ (event: 'session-expired'): void; (event: 'changed'): void }>()
const router = inject(routerKey, undefined)
const route = inject(routeLocationKey, undefined)
const tabs = [{ id: 'access', label: '访问权限' }, { id: 'index', label: '目录索引' }, { id: 'audit', label: '操作记录' }, { id: 'statistics', label: '下载统计' }, { id: 'blacklist', label: '投稿文件夹黑名单' }] as const
type Tab = typeof tabs[number]['id']
const availableTabs = computed(() => tabs.filter(item => item.id === 'blacklist' ? props.canReviewUploads : props.canManageFiles))
const localTab = ref<Tab | null>(null)
const usesRoute = computed(() => Boolean(router && route?.path === '/manage/files'))
const allowedTab = (value: unknown): Tab | null => availableTabs.value.find(item => item.id === value)?.id ?? null
const tab = computed(() => props.active ? allowedTab(usesRoute.value ? route?.query.tool : localTab.value) : null)
const localAccessPath = ref(props.path)
const accessPath = computed(() => usesRoute.value ? (typeof route?.query.path === 'string' && route.query.path.startsWith('/') ? route.query.path : props.path) : localAccessPath.value)
const accessParent = computed(() => accessPath.value.slice(0, accessPath.value.lastIndexOf('/')) || '/')
const selectedPath = computed(() => tab.value === 'access' ? accessPath.value : props.path)
const buttonClass = 'inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40'
const primaryButtonClass = `${buttonClass} bg-zinc-900 text-white hover:bg-zinc-800`
const outlineButtonClass = `${buttonClass} border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-100`
const ghostButtonClass = `${buttonClass} text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950`
const inputClass = 'rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-950 shadow-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40'
const linkClass = 'rounded-sm text-left text-zinc-700 underline underline-offset-4 decoration-zinc-300 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400'
const tableClass = 'w-full text-left text-sm [&_thead]:bg-zinc-50 [&_th]:px-4 [&_th]:py-3 [&_th]:text-xs [&_th]:font-medium [&_th]:text-zinc-500 [&_td]:px-4 [&_td]:py-3 [&_tbody_tr]:border-t [&_tbody_tr]:border-zinc-100 [&_tbody_tr]:hover:bg-zinc-50'
const busy = ref(false), error = ref(''), message = ref('')
const access = ref<AccessData>(), index = ref<IndexData>(), auditData = ref<AuditData>(), statistics = ref<StatisticsData>()
const accessDirectories = ref<ManagedResourceFile[]>([])
const mode = ref<AccessMode>('public'), search = ref(''), actionFilter = ref(''), days = ref(30)
const statsIp = ref(''), statsUser = ref(''), statsUa = ref(''), statsPath = ref('')
const statisticsFilters = ref<Omit<StatisticsQuery, 'days' | 'page'>>({})
const statisticsFilterLabel = computed(() => Object.entries(statisticsFilters.value).map(([key, value]) => `${({ ip: 'IP', user_id: '用户 ID', ua: 'UA', search: '路径' } as Record<string, string>)[key]}：${value}`).join('；'))
const modeLabels: Record<AccessMode, string> = { public: '公开 / 继承上级', login: '仅登录用户', admin: '仅资料管理员' }
const effectiveModeLabels: Record<AccessMode, string> = { public: '公开', login: '仅登录用户', admin: '仅资料管理员' }
const actionLabels: Record<string, string> = { upload: '上传', rename: '重命名', move: '移动', delete: '移入回收站', restore: '恢复', mkdir: '新建目录', readme: '编辑目录说明', access: '修改权限', reindex: '刷新索引', purge: '永久删除', purge_requested: '请求永久删除' }
const accessOptions = Object.entries(modeLabels).map(([value, label]) => ({ value, label }))
const auditOptions = [{ value: '', label: '全部操作' }, ...Object.entries(actionLabels).map(([value, label]) => ({ value, label }))]
const dayOptions = [7, 30, 90].map(value => ({ value, label: `近 ${value} 天` }))
function updateMode(value: string | number | null) { if (value === 'public' || value === 'login' || value === 'admin') mode.value = value }
function updateActionFilter(value: string | number | null) { if (typeof value === 'string') actionFilter.value = value }
function updateDays(value: string | number | null) { if (typeof value === 'number' && [7, 30, 90].includes(value)) { days.value = value; void load() } }
const date = (value: string) => new Date(value).toLocaleString('zh-CN')
let generation = 0, pendingLoad = false
function check(result: { status: number; errors?: { err_msg: string }[] }) {
  if ([401, 403].includes(result.status)) emit('session-expired')
  if (result.status !== 200) throw new Error(result.errors?.[0]?.err_msg || '操作失败，请刷新后重试。')
}
async function run(operation: () => Promise<void>, current = generation) {
  if (busy.value) return
  busy.value = true; error.value = ''; message.value = ''
  try { await operation() } catch (cause) { if (current === generation) error.value = cause instanceof Error ? cause.message : '操作失败。' }
  finally { busy.value = false; if (pendingLoad) { pendingLoad = false; void load() } }
}
async function load() {
  const selected = tab.value
  if (!selected || selected === 'blacklist') return
  if (busy.value) { pendingLoad = true; return }
  const current = ++generation, path = selectedPath.value
  if (selected === 'access') { access.value = undefined; accessDirectories.value = [] }
  await run(async () => {
    if (selected === 'access') {
      const [permission, directory] = await Promise.all([
        api.get({ url: '/api/management/resources/access/', query: { path } }),
        api.get({ url: '/api/management/resources/', query: { path } }),
      ])
      check(permission); check(directory)
      if (current === generation) {
        access.value = permission.content; mode.value = permission.content.mode
        accessDirectories.value = directory.content.entries.filter(entry => entry.type === 'directory')
      }
    } else if (selected === 'index') {
      const r = await api.get({ url: '/api/management/resources/index/' }); check(r); if (current === generation) index.value = r.content
    } else if (selected === 'audit') { await fetchAudit(1, current) }
    else { await fetchStatistics(1, current) }
  }, current)
}
function selectTab(value: Tab | null) {
  if (!props.active || busy.value || (value && !allowedTab(value))) return
  if (usesRoute.value && router && route) {
    const query = { ...route.query }
    query.view = 'maintenance'
    delete query.trash
    if (value) query.tool = value
    else delete query.tool
    void router.push({ path: route.path, query, hash: route.hash })
  } else { localTab.value = value }
}
async function saveAccess() {
  if (!props.canManageFiles || !access.value || busy.value) return
  const current = generation
  const query = { path: access.value.path, mode: mode.value }
  await run(async () => {
    const r = await api.post({ url: '/api/management/resources/access/', query }); check(r)
    if (current !== generation) return
    const fresh = await api.get({ url: '/api/management/resources/access/', query: { path: query.path } }); check(fresh)
    if (current === generation) { access.value = fresh.content; mode.value = fresh.content.mode; message.value = '访问权限已保存。' }
  }, current)
}
function navigateAccess(path: string) {
  if (busy.value || !props.canManageFiles || tab.value !== 'access') return
  if (path === accessPath.value) { void load(); return }
  if (usesRoute.value && router && route) {
    const query = { ...route.query }
    query.path = path; query.view = 'maintenance'; query.tool = 'access'
    delete query.trash
    void router.push({ path: route.path, query, hash: route.hash })
  } else { localAccessPath.value = path }
}
async function reindex() {
  if (!props.canManageFiles) return
  await run(async () => { const r = await api.post({ url: '/api/management/resources/index/' }); check(r); index.value = r.content; message.value = '目录索引已更新。'; emit('changed') })
}
async function fetchAudit(page: number, current = generation) { const r = await api.get({ url: '/api/management/resources/audit/', query: { page, action: actionFilter.value, search: search.value } }); check(r); if (current === generation) auditData.value = r.content }
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
watch(() => props.path, path => { localAccessPath.value = path })
watch([tab, selectedPath], () => { generation++; error.value = ''; message.value = ''; if (tab.value && tab.value !== 'blacklist') void load() }, { immediate: true })
onBeforeUnmount(() => { generation++; pendingLoad = false })
</script>
