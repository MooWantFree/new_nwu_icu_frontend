<template>
  <section class="min-w-0 rounded-xl border border-zinc-200 bg-white shadow-sm" aria-labelledby="upload-history-title">
    <div class="flex items-start justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <h2 id="upload-history-title" class="text-lg font-semibold tracking-tight text-zinc-950">我的分享</h2>
          <span class="inline-flex h-5 items-center rounded-md border border-zinc-200 px-1.5 text-xs font-medium tabular-nums text-zinc-600">
            {{ records.length }}
          </span>
        </div>
        <p class="mt-1 text-sm leading-6 text-zinc-500">查看审核进度，管理你分享的资料。</p>
      </div>
      <button
        type="button"
        class="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        :disabled="loading"
        @click="emit('refresh')"
      >
        <RefreshCw class="h-3.5 w-3.5" :class="{ 'animate-spin': loading }" />
        刷新
      </button>
    </div>

    <div class="px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
      <div class="grid grid-cols-4 gap-1 rounded-lg bg-zinc-100 p-1 sm:inline-grid" role="group" aria-label="投稿记录筛选">
        <button
          v-for="option in filterOptions"
          :key="option.value"
          type="button"
          class="inline-flex h-8 min-w-0 items-center justify-center gap-1 rounded-md px-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 sm:gap-1.5 sm:px-3 sm:text-sm"
          :class="filter === option.value ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'"
          :aria-pressed="filter === option.value"
          @click="emit('update:filter', option.value)"
        >
          {{ option.label }}
          <span class="text-[11px] tabular-nums" :class="filter === option.value ? 'text-zinc-500' : 'text-zinc-400'">
            {{ filterCounts[option.value] }}
          </span>
        </button>
      </div>

      <div
        v-if="loading && !records.length"
        class="mt-5 flex min-h-44 flex-col items-center justify-center gap-3 rounded-lg border border-zinc-200 text-sm text-zinc-500"
        role="status"
      >
        <Loader2 class="h-5 w-5 animate-spin" />
        正在加载投稿记录…
      </div>
      <div v-else-if="error" class="mt-5 rounded-lg border border-red-200 p-4" role="alert">
        <div class="flex items-start gap-2.5">
          <AlertCircle class="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <div class="min-w-0">
            <p class="text-sm font-medium text-red-700">投稿记录加载失败</p>
            <p class="mt-1 break-words text-sm leading-6 text-zinc-500">{{ error }}</p>
            <button
              type="button"
              class="mt-3 inline-flex h-8 items-center justify-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              :disabled="loading"
              @click="emit('refresh')"
            >
              重新加载
            </button>
          </div>
        </div>
      </div>
      <div v-else-if="!filteredRecords.length" class="mt-5 flex min-h-44 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 px-4 py-8 text-center">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500">
          <Archive class="h-5 w-5" />
        </div>
        <p class="mt-3 text-sm font-medium text-zinc-900">
          {{ records.length ? '当前筛选条件下没有投稿' : '还没有投稿记录' }}
        </p>
        <p class="mt-1 text-xs leading-5 text-zinc-500">
          {{ records.length ? '可以重新选择上方状态筛选' : '你的第一份分享会显示在这里' }}
        </p>
      </div>
      <div v-else class="mt-5 overflow-hidden rounded-lg border border-zinc-200" :aria-busy="loading">
        <article
          v-for="record in filteredRecords"
          :id="`upload-record-${record.id}`"
          :key="record.id"
          class="min-w-0 border-b border-zinc-200 p-4 transition-colors last:border-b-0 sm:p-5"
          :class="highlightedRequestId === record.id ? 'bg-zinc-50' : ''"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex min-w-0 items-start gap-2.5">
              <div class="hidden h-9 w-9 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 text-zinc-500 sm:flex">
                <Folder class="h-4 w-4" />
              </div>
              <div class="min-w-0">
                <p class="break-all text-sm font-semibold leading-6 text-zinc-900" :title="record.target_path">
                  {{ record.target_path }}
                </p>
                <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
                  <span>投稿 #{{ record.id }}</span>
                  <span aria-hidden="true">·</span>
                  <span>{{ record.files.length }} 个文件</span>
                  <span aria-hidden="true">·</span>
                  <span>{{ record.total_size_display }}</span>
                </div>
              </div>
            </div>
            <span
              class="mt-0.5 inline-flex h-6 shrink-0 items-center gap-1.5 rounded-md border px-2 text-xs font-medium"
              :class="statusMeta[record.status].badgeClass"
            >
              <span class="h-1.5 w-1.5 rounded-full" :class="statusMeta[record.status].dotClass"></span>
              {{ statusMeta[record.status].label }}
            </span>
          </div>

          <div class="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 text-zinc-500">
            <span>提交 <Time :time="record.created_at" /></span>
            <template v-if="record.reviewed_at">
              <span aria-hidden="true">·</span>
              <span>审核 <Time :time="record.reviewed_at" /></span>
            </template>
          </div>
          <div
            v-if="record.status === 'rejected' && record.rejection_reason"
            class="mt-3 flex items-start gap-2 rounded-md border border-red-200 px-3 py-2.5 text-xs leading-5 text-red-700"
          >
            <AlertCircle class="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p class="min-w-0 whitespace-pre-line break-words">退回原因：{{ record.rejection_reason }}</p>
          </div>
          <div
            v-if="record.status === 'publish_failed' && record.publish_error"
            class="mt-3 flex items-start gap-2 rounded-md border border-amber-200 px-3 py-2.5 text-xs leading-5 text-amber-800"
          >
            <AlertCircle class="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p class="min-w-0 whitespace-pre-line break-words">发布异常：{{ record.publish_error }}</p>
          </div>
          <p v-if="record.files_deleted_at" class="mt-3 rounded-md bg-zinc-100 px-3 py-2 text-xs leading-5 text-zinc-500">
            暂存文件已清理，投稿记录仅供查看。
          </p>
          <p v-else-if="record.files_expires_at" class="mt-3 text-xs leading-5 text-zinc-500">
            暂存文件将在 <Time :time="record.files_expires_at" /> 后清理。
          </p>

          <div class="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
              :aria-expanded="expandedRecordIds.includes(record.id)"
              :aria-controls="`upload-record-files-${record.id}`"
              @click="emit('toggle-files', record.id)"
            >
              <ChevronRight class="h-3.5 w-3.5 transition-transform" :class="expandedRecordIds.includes(record.id) ? 'rotate-90' : ''" />
              {{ expandedRecordIds.includes(record.id) ? '收起文件' : '查看文件' }}
            </button>
            <button
              v-if="record.can_edit"
              type="button"
              class="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
              @click="emit('edit', record)"
            >
              <Pencil class="h-3.5 w-3.5" />
              编辑投稿
            </button>
            <a
              v-if="record.status === 'approved' && toSafeExternalUrl(record.resource_url)"
              :href="toSafeExternalUrl(record.resource_url) ?? undefined"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-zinc-950 px-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
            >
              <ExternalLink class="h-3.5 w-3.5" />
              在资料站查看
            </a>
          </div>
          <ul
            v-if="expandedRecordIds.includes(record.id)"
            :id="`upload-record-files-${record.id}`"
            class="mt-3 max-h-52 divide-y divide-zinc-200 overflow-y-auto rounded-md border border-zinc-200 bg-zinc-50"
            aria-label="投稿文件"
          >
            <li v-for="file in record.files" :key="file.id" class="flex min-w-0 items-center gap-2.5 px-3 py-2.5 text-xs">
              <FileText class="h-3.5 w-3.5 shrink-0 text-zinc-400" />
              <span class="min-w-0 flex-1 truncate font-medium text-zinc-700" :title="file.relative_path">{{ file.relative_path }}</span>
              <span class="shrink-0 tabular-nums text-zinc-500">{{ file.size_display }}</span>
            </li>
          </ul>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AlertCircle, Archive, ChevronRight, ExternalLink, FileText, Folder, Loader2, Pencil, RefreshCw } from 'lucide-vue-next'
import Time from '@/components/tinyComponents/Time.vue'
import { toSafeExternalUrl } from '@/lib/security'
import type { ResourceUploadRequest } from '@/types/api/resourceUpload'

type UploadHistoryFilter = 'all' | 'processing' | 'approved' | 'issues'

const props = defineProps<{
  records: ResourceUploadRequest[]
  loading: boolean
  error: string
  filter: UploadHistoryFilter
  highlightedRequestId: number | null
  expandedRecordIds: number[]
}>()

const emit = defineEmits<{
  'update:filter': [value: UploadHistoryFilter]
  refresh: []
  'toggle-files': [id: number]
  edit: [record: ResourceUploadRequest]
}>()

const filterOptions: { value: UploadHistoryFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'processing', label: '处理中' },
  { value: 'approved', label: '已通过' },
  { value: 'issues', label: '异常' },
]

const matchesFilter = (record: ResourceUploadRequest, filter: UploadHistoryFilter) => {
  if (filter === 'all') return true
  if (filter === 'processing') return record.status === 'pending' || record.status === 'publishing'
  if (filter === 'approved') return record.status === 'approved'
  return record.status === 'rejected' || record.status === 'publish_failed'
}

const filteredRecords = computed(() =>
  props.records
    .filter((record) => matchesFilter(record, props.filter))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
)

const filterCounts = computed<Record<UploadHistoryFilter, number>>(() => ({
  all: props.records.length,
  processing: props.records.filter((record) => matchesFilter(record, 'processing')).length,
  approved: props.records.filter((record) => matchesFilter(record, 'approved')).length,
  issues: props.records.filter((record) => matchesFilter(record, 'issues')).length,
}))

const statusMeta = {
  pending: { label: '待审核', badgeClass: 'border-zinc-200 bg-zinc-100 text-zinc-700', dotClass: 'bg-zinc-400' },
  publishing: { label: '发布中', badgeClass: 'border-zinc-200 bg-white text-zinc-700', dotClass: 'bg-zinc-700' },
  approved: { label: '已通过', badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700', dotClass: 'bg-emerald-500' },
  rejected: { label: '已退回', badgeClass: 'border-red-200 bg-red-50 text-red-700', dotClass: 'bg-red-500' },
  publish_failed: { label: '发布异常', badgeClass: 'border-amber-200 bg-amber-50 text-amber-800', dotClass: 'bg-amber-500' },
}
</script>
