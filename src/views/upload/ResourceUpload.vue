<template>
  <AppPageLayout title="资料投稿" description="分享一份资料，让后来者少走一点弯路。">
      <section class="mx-auto max-w-4xl">
        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm font-semibold text-blue-700">第一步</p>
              <h2 class="mt-1 text-xl font-bold text-slate-900">选择投稿文件</h2>
              <p class="mt-1 text-sm text-slate-500">可拖入文件或整个文件夹，文件夹结构会被保留。</p>
            </div>
            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {{ selectedFiles.length }} / {{ maxFileCount }}
            </span>
          </div>

          <input
            ref="fileInput"
            class="hidden"
            type="file"
            multiple
            :accept="acceptExtensions"
            @change="handleFileInput"
          />
          <input
            ref="folderInput"
            class="hidden"
            type="file"
            multiple
            webkitdirectory
            @change="handleFileInput"
          />

          <div
            class="mt-6 flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-10 text-center outline-none transition"
            :class="isDragging
              ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-100'
              : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/40 focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-100'"
            role="button"
            tabindex="0"
            aria-label="选择要投稿的文件"
            @click="fileInput?.click()"
            @keydown.enter.prevent="fileInput?.click()"
            @keydown.space.prevent="fileInput?.click()"
            @dragenter.prevent="isDragging = true"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="handleDragLeave"
            @drop.prevent="handleDrop"
          >
            <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <Upload class="h-8 w-8" />
            </div>
            <p class="mt-5 text-base font-semibold text-slate-900">拖放文件或文件夹到这里</p>
            <p class="mt-2 text-sm text-slate-500">图片、PDF、Office、文本与常见压缩包</p>
            <div class="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs leading-5 text-slate-500">
              <span>单个文件不超过 {{ formatBytes(maxFileSize) }}</span>
              <span class="hidden text-slate-300 sm:inline">·</span>
              <span>每次最多 {{ maxFileCount }} 个文件</span>
              <span class="hidden text-slate-300 sm:inline">·</span>
              <span>支持常见资料与压缩格式</span>
            </div>
            <div class="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                class="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
                @click.stop="fileInput?.click()"
              >
                选择文件
              </button>
              <button
                type="button"
                class="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100"
                @click.stop="folderInput?.click()"
              >
                选择文件夹
              </button>
            </div>
          </div>

          <div
            v-if="fileError"
            class="mt-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
            <span>{{ fileError }}</span>
          </div>

          <div v-if="selectedFiles.length" class="mt-6">
            <div class="mb-3 flex items-center justify-between">
              <h3 class="text-sm font-semibold text-slate-800">已选择的文件</h3>
              <button
                type="button"
                class="text-xs font-medium text-slate-500 transition hover:text-red-600"
                @click="clearFiles"
              >
                清空全部
              </button>
            </div>
            <ul class="max-h-80 space-y-2 overflow-y-auto pr-1">
              <li
                v-for="item in selectedFiles"
                :key="item.id"
                class="group flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-3"
              >
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <component :is="getFileIcon(item.file.name)" class="h-5 w-5" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-slate-800" :title="item.relativePath">
                    {{ item.relativePath }}
                  </p>
                  <p class="mt-0.5 text-xs text-slate-500">{{ formatBytes(item.file.size) }}</p>
                </div>
                <button
                  type="button"
                  class="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-100"
                  :aria-label="`移除 ${item.relativePath}`"
                  @click="removeFile(item.id)"
                >
                  <X class="h-4 w-4" />
                </button>
              </li>
            </ul>
            <div class="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
              <span class="text-slate-500">合计</span>
              <span class="font-semibold text-slate-800">
                {{ selectedFiles.length }} 个文件 · {{ formatBytes(totalSize) }}
              </span>
            </div>
          </div>

          <div class="mt-7 border-t border-slate-200 pt-6">
            <div class="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div class="min-w-0">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">目标目录</p>
                <p
                  class="mt-1 break-all text-sm font-semibold"
                  :class="targetConfirmed ? 'text-slate-900' : 'text-slate-500'"
                >
                  {{ targetConfirmed ? finalTargetPath : '尚未选择目录' }}
                </p>
                <p class="mt-1 text-xs text-slate-500">
                  {{ targetConfirmed ? '资料审核通过后会归档到此位置。' : '添加文件后请选择资料最终归档的位置。' }}
                </p>
              </div>
              <button
                type="button"
                class="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="isSubmitting || !selectedFiles.length"
                @click="openDirectoryModal"
              >
                <Folder class="h-4 w-4" />
                {{ targetConfirmed ? '更改目录' : '选择目录' }}
              </button>
            </div>

            <div
              v-if="submitError"
              class="mt-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
              <span>{{ submitError }}</span>
            </div>

            <button
              type="button"
              class="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              :disabled="!canSubmit"
              @click="submitUpload"
            >
              <Loader2 v-if="isSubmitting" class="h-5 w-5 animate-spin" />
              <Upload v-else class="h-5 w-5" />
              {{ submitButtonText }}
            </button>

            <div v-if="isSubmitting" class="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                class="h-full rounded-full bg-blue-600 transition-all duration-300"
                :style="{ width: `${uploadProgress}%` }"
              ></div>
            </div>
            <p class="mt-3 text-center text-xs leading-5 text-slate-400">
              提交即表示你确认资料不含隐私信息，并同意由管理员审核后公开。
            </p>
          </div>
        </div>
      </section>

      <NModal
        :show="directoryModalOpen"
        :mask-closable="!isSubmitting"
        :close-on-esc="!isSubmitting"
        @update:show="handleDirectoryModalShow"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="directory-modal-title"
          class="flex max-h-[calc(100dvh-0.75rem)] w-[calc(100vw-0.75rem)] max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:w-[calc(100vw-3rem)]"
        >
          <div class="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
            <div>
              <p class="text-xs font-semibold text-blue-700">第二步</p>
              <h2 id="directory-modal-title" class="mt-1 text-xl font-bold text-slate-900">选择目标目录</h2>
              <p class="mt-1 text-sm text-slate-500">确认后还可以在提交前再次更改。</p>
            </div>
            <button
              type="button"
              class="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-200"
              aria-label="关闭目录选择窗口"
              :disabled="isSubmitting"
              @click="cancelDirectorySelection"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            <ResourceDirectoryPicker
              v-model:path="directoryDraftPath"
              v-model:create-new-folder="directoryDraftCreateNewFolder"
              v-model:new-folder-name="directoryDraftNewFolderName"
              :preview-relative-paths="selectedRelativePaths"
              input-id="submission-new-folder-name"
            />
          </div>

          <div class="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
            <button
              type="button"
              class="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-200"
              :disabled="isSubmitting"
              @click="cancelDirectorySelection"
            >
              取消
            </button>
            <button
              type="button"
              class="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-300"
              :disabled="!canConfirmDirectory || isSubmitting"
              @click="confirmDirectorySelection"
            >
              确认目录
            </button>
          </div>
        </div>
      </NModal>

      <section
        v-if="lastSubmittedRequest"
        class="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm sm:p-6"
      >
        <div class="flex items-start gap-3">
          <CheckCircle2 class="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
          <div>
            <h2 class="font-bold text-emerald-950">投稿 #{{ lastSubmittedRequest.id }} 已提交</h2>
            <p class="mt-1 text-sm leading-6 text-emerald-800">
              共 {{ lastSubmittedRequest.files.length }} 个文件，将提交到
              <span class="break-all font-semibold">{{ lastSubmittedRequest.target_path }}</span>。
              管理员审核后会通过站内信和邮件告知结果；待审核期间仍可在下方编辑。
            </p>
          </div>
        </div>
      </section>

      <section class="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-xl font-bold text-slate-900">我的投稿记录</h2>
            <p class="mt-1 text-sm text-slate-500">查看审核进度与退回原因。</p>
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
            :disabled="historyLoading"
            @click="loadUploadHistory"
          >
            <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': historyLoading }" />
            刷新
          </button>
        </div>

        <div class="mt-5 grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1" aria-label="投稿记录筛选">
          <button
            v-for="option in historyFilterOptions"
            :key="option.value"
            type="button"
            class="inline-flex min-w-0 items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-300 sm:gap-2 sm:px-3"
            :class="selectedHistoryFilter === option.value
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'"
            :aria-pressed="selectedHistoryFilter === option.value"
            @click="selectedHistoryFilter = option.value"
          >
            {{ option.label }}
            <span class="font-normal text-slate-400">{{ historyFilterCounts[option.value] }}</span>
          </button>
        </div>

        <div v-if="historyLoading && !uploadHistory.length" class="flex min-h-40 items-center justify-center text-sm text-slate-500">
          <Loader2 class="mr-2 h-5 w-5 animate-spin text-blue-700" />
          正在加载投稿记录…
        </div>
        <div v-else-if="historyError" class="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {{ historyError }}
        </div>
        <div v-else-if="!filteredUploadHistory.length" class="mt-6 flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
          <Archive class="h-8 w-8 text-slate-300" />
          <p class="mt-3 text-sm font-medium text-slate-600">
            {{ uploadHistory.length ? '当前筛选条件下没有投稿' : '还没有投稿记录' }}
          </p>
          <p class="mt-1 text-xs text-slate-400">
            {{ uploadHistory.length ? '可以重新选择上方状态筛选' : '你的第一份分享会显示在这里' }}
          </p>
        </div>
        <div v-else class="mt-6 divide-y divide-slate-200 border-y border-slate-200">
          <article
            v-for="record in filteredUploadHistory"
            :key="record.id"
            :id="`upload-record-${record.id}`"
            class="px-1 py-5 transition sm:px-3"
            :class="highlightedRequestId === record.id ? 'bg-blue-50/60' : ''"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="break-all text-sm font-semibold text-slate-900" :title="record.target_path">
                  {{ record.target_path }}
                </p>
                <div class="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                  <span>投稿 #{{ record.id }}</span>
                  <span aria-hidden="true">·</span>
                  <span>{{ record.files.length }} 个文件</span>
                  <span aria-hidden="true">·</span>
                  <span>{{ record.total_size_display }}</span>
                </div>
              </div>
              <span
                class="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600"
              >
                <span class="h-1.5 w-1.5 rounded-full" :class="statusMeta[record.status].dotClass"></span>
                {{ statusMeta[record.status].label }}
              </span>
            </div>
            <div class="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
              <span>
                提交 <Time :time="record.created_at" />
              </span>
              <template v-if="record.reviewed_at">
                <span aria-hidden="true">·</span>
                <span>审核 <Time :time="record.reviewed_at" /></span>
              </template>
            </div>
            <div
              v-if="record.status === 'rejected' && record.rejection_reason"
              class="mt-3 rounded-r-lg border-l-2 border-red-300 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700"
            >
              退回原因：{{ record.rejection_reason }}
            </div>
            <div v-if="record.status === 'publish_failed' && record.publish_error" class="mt-3 rounded-r-lg border-l-2 border-orange-300 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700">
              发布异常：{{ record.publish_error }}
            </div>
            <div v-if="record.files_deleted_at" class="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-xs leading-5 text-slate-600">
              暂存文件已清理，投稿记录仅供查看。
            </div>
            <div v-else-if="record.files_expires_at" class="mt-3 text-xs text-slate-500">
              暂存文件将在 <Time :time="record.files_expires_at" /> 后清理。
            </div>
            <div class="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                @click="toggleRecordFiles(record.id)"
              >
                <ChevronRight
                  class="h-3.5 w-3.5 transition"
                  :class="expandedRecordIds.includes(record.id) ? 'rotate-90' : ''"
                />
                {{ expandedRecordIds.includes(record.id) ? '收起文件' : '查看文件' }}
              </button>
              <button
                v-if="record.can_edit"
                type="button"
                class="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                @click="openEditDialog(record)"
              >
                <Pencil class="h-3.5 w-3.5" />
                编辑投稿
              </button>
              <a
                v-if="record.status === 'approved' && toSafeExternalUrl(record.resource_url)"
                :href="toSafeExternalUrl(record.resource_url) ?? undefined"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-100"
              >
                <ExternalLink class="h-3.5 w-3.5" />
                在资料站查看
              </a>
            </div>
            <ul
              v-if="expandedRecordIds.includes(record.id)"
              class="mt-3 max-h-48 space-y-2 overflow-y-auto rounded-lg bg-slate-50 p-3"
            >
              <li v-for="file in record.files" :key="file.id" class="flex items-start justify-between gap-3 text-xs">
                <span class="min-w-0 break-all font-medium text-slate-700">{{ file.relative_path }}</span>
                <span class="shrink-0 text-slate-400">{{ file.size_display }}</span>
              </li>
            </ul>
          </article>
        </div>
      </section>

      <div
        v-if="editingRequest"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-upload-title"
        @click.self="closeEditDialog"
      >
        <div class="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
          <div class="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-7">
            <div>
              <p class="text-xs font-semibold text-blue-700">投稿 #{{ editingRequest.id }}</p>
              <h2 id="edit-upload-title" class="mt-1 text-xl font-bold text-slate-900">编辑投稿</h2>
              <p class="mt-1 text-sm text-slate-500">
                {{ editingRequest.status === 'rejected' ? '保存后将重新进入待审核状态。' : '保存后会更新当前待审核内容。' }}
              </p>
            </div>
            <button
              type="button"
              class="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="关闭编辑窗口"
              :disabled="editSubmitting"
              @click="closeEditDialog"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="grid gap-7 p-5 sm:p-7 lg:grid-cols-2">
            <section>
              <div class="flex items-center justify-between gap-3">
                <div>
                  <h3 class="font-bold text-slate-900">之前上传的文件</h3>
                  <p class="mt-1 text-xs text-slate-500">点击删除可将文件标记为移除，再次点击可以撤销。</p>
                </div>
                <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  保留 {{ keptExistingFileCount }}
                </span>
              </div>

              <ul class="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
                <li
                  v-for="file in editingRequest.files"
                  :key="file.id"
                  class="flex items-center gap-3 rounded-xl border px-3 py-3 transition"
                  :class="removedExistingFileIds.includes(file.id)
                    ? 'border-red-100 bg-red-50/70 opacity-65'
                    : 'border-slate-200 bg-white'"
                >
                  <component :is="getFileIcon(file.original_name)" class="h-5 w-5 shrink-0 text-slate-500" />
                  <div class="min-w-0 flex-1">
                    <p
                      class="truncate text-sm font-medium"
                      :class="removedExistingFileIds.includes(file.id) ? 'text-red-500 line-through' : 'text-slate-800'"
                      :title="file.relative_path"
                    >
                      {{ file.relative_path }}
                    </p>
                    <p class="mt-0.5 text-xs text-slate-400">{{ file.size_display }}</p>
                  </div>
                  <button
                    type="button"
                    class="rounded-lg p-2 transition"
                    :class="removedExistingFileIds.includes(file.id)
                      ? 'text-slate-500 hover:bg-white hover:text-blue-700'
                      : 'text-slate-400 hover:bg-red-50 hover:text-red-600'"
                    :aria-label="removedExistingFileIds.includes(file.id) ? `撤销删除 ${file.relative_path}` : `删除 ${file.relative_path}`"
                    @click="toggleExistingFileRemoval(file.id)"
                  >
                    <RotateCcw v-if="removedExistingFileIds.includes(file.id)" class="h-4 w-4" />
                    <Trash2 v-else class="h-4 w-4" />
                  </button>
                </li>
              </ul>

              <div class="mt-6 flex items-center justify-between gap-3">
                <div>
                  <h3 class="font-bold text-slate-900">追加新文件</h3>
                  <p class="mt-1 text-xs text-slate-500">可选择文件或整个文件夹。</p>
                </div>
                <span class="text-xs font-semibold text-slate-500">{{ editResultFileCount }} / {{ maxFileCount }}</span>
              </div>

              <input
                ref="editFileInput"
                class="hidden"
                type="file"
                multiple
                :accept="acceptExtensions"
                @change="handleEditFileInput"
              />
              <input
                ref="editFolderInput"
                class="hidden"
                type="file"
                multiple
                webkitdirectory
                @change="handleEditFileInput"
              />
              <div class="mt-3 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  class="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                  @click="editFileInput?.click()"
                >
                  <Plus class="h-4 w-4" />
                  添加文件
                </button>
                <button
                  type="button"
                  class="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  @click="editFolderInput?.click()"
                >
                  <FolderPlus class="h-4 w-4" />
                  添加文件夹
                </button>
              </div>

              <ul v-if="editSelectedFiles.length" class="mt-3 max-h-52 space-y-2 overflow-y-auto pr-1">
                <li
                  v-for="item in editSelectedFiles"
                  :key="item.id"
                  class="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/50 px-3 py-2.5"
                >
                  <component :is="getFileIcon(item.file.name)" class="h-4 w-4 shrink-0 text-blue-700" />
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium text-slate-800" :title="item.relativePath">{{ item.relativePath }}</p>
                    <p class="text-xs text-slate-400">{{ formatBytes(item.file.size) }}</p>
                  </div>
                  <button
                    type="button"
                    class="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-red-600"
                    @click="removeEditFile(item.id)"
                  >
                    <X class="h-4 w-4" />
                  </button>
                </li>
              </ul>
              <p v-if="editFileError" class="mt-3 text-sm text-red-600">{{ editFileError }}</p>
            </section>

            <section>
              <h3 class="font-bold text-slate-900">修改上传目录</h3>
              <p class="mt-1 text-xs text-slate-500">请选择资料审核通过后要归档的位置。</p>
              <div class="mt-4">
                <ResourceDirectoryPicker
                  v-model:path="editCurrentPath"
                  v-model:create-new-folder="editCreateNewFolder"
                  v-model:new-folder-name="editNewFolderName"
                  compact
                  input-id="edit-new-folder-name"
                />
              </div>

              <div class="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-sm">
                <div class="flex items-center justify-between">
                  <span class="text-slate-500">保存后文件</span>
                  <span class="font-semibold text-slate-800">{{ editResultFileCount }} 个 · {{ editTotalSizeDisplay }}</span>
                </div>
                <div class="mt-2 grid grid-cols-2 gap-2 border-t border-slate-200 pt-2 text-xs">
                  <span class="text-slate-500">删除 {{ removedExistingFileIds.length }} 个</span>
                  <span class="text-right text-slate-500">新增 {{ editSelectedFiles.length }} 个</span>
                </div>
                <div class="mt-2 border-t border-slate-200 pt-2 text-xs">
                  <p class="text-slate-400">目录变更</p>
                  <p class="mt-1 break-all text-slate-600">{{ editingRequest.target_path }}</p>
                  <p class="my-1 text-slate-400">↓</p>
                  <p class="break-all font-semibold text-slate-800">{{ editFinalTargetPath }}</p>
                </div>
                <p v-if="editingRequest.status === 'rejected'" class="mt-2 border-t border-slate-200 pt-2 text-xs font-medium text-amber-700">
                  保存后将清除原退回原因，并重新进入待审核状态。
                </p>
              </div>
              <p v-if="editSubmitError" class="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ editSubmitError }}</p>
            </section>
          </div>

          <div class="sticky bottom-0 flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-7">
            <button
              type="button"
              class="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              :disabled="editSubmitting"
              @click="closeEditDialog"
            >
              取消
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              :disabled="!canSaveEdit"
              @click="saveEdit"
            >
              <Loader2 v-if="editSubmitting" class="h-4 w-4 animate-spin" />
              <Save v-else class="h-4 w-4" />
              {{ editSubmitButtonText }}
            </button>
          </div>
        </div>
      </div>
  </AppPageLayout>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { toSafeExternalUrl } from '@/lib/security'
import { NModal, useMessage } from 'naive-ui'
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  ChevronRight,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderPlus,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-vue-next'
import { api } from '@/lib/requests'
import type { ResourceUploadRequest, ResourceUploadFile } from '@/types/api/resourceUpload'
import Time from '@/components/tinyComponents/Time.vue'
import AppPageLayout from '@/components/layout/AppPageLayout.vue'
import ResourceDirectoryPicker from '@/components/upload/ResourceDirectoryPicker.vue'

const message = useMessage()
const DEFAULT_MAX_FILE_COUNT = 20
const DEFAULT_MAX_FILE_SIZE = 100 * 1024 * 1024
const DEFAULT_ALLOWED_EXTENSIONS = new Set([
  '.7z', '.avif', '.bmp', '.bz2', '.csv', '.doc', '.docx', '.gif', '.gz',
  '.heic', '.heif', '.ico', '.jfif', '.jpeg', '.jpg', '.md', '.ods', '.odp',
  '.odt', '.pdf', '.png', '.ppt', '.pptx', '.rar', '.svg', '.tar', '.tif',
  '.tiff', '.txt', '.webp', '.xls', '.xlsx', '.xz', '.zip',
])

type SelectedFile = {
  id: string
  file: File
  relativePath: string
}

type UploadStage = 'idle' | 'uploading' | 'confirming'
type UploadHistoryFilter = 'all' | 'processing' | 'approved' | 'issues'

type FileSystemEntryLike = {
  isFile: boolean
  isDirectory: boolean
  name: string
  file?: (callback: (file: File) => void, error?: () => void) => void
  createReader?: () => {
    readEntries: (callback: (entries: FileSystemEntryLike[]) => void, error?: () => void) => void
  }
}

const fileInput = ref<HTMLInputElement | null>(null)
const folderInput = ref<HTMLInputElement | null>(null)
const selectedFiles = ref<SelectedFile[]>([])
const fileError = ref('')
const isDragging = ref(false)
const currentPath = ref('/')
const createNewFolder = ref(false)
const newFolderName = ref('')
const targetConfirmed = ref(false)
const directoryModalOpen = ref(false)
const directoryDraftPath = ref('/')
const directoryDraftCreateNewFolder = ref(false)
const directoryDraftNewFolderName = ref('')
const isSubmitting = ref(false)
const uploadProgress = ref(0)
const uploadStage = ref<UploadStage>('idle')
const submitError = ref('')
const uploadHistory = ref<ResourceUploadRequest[]>([])
const historyLoading = ref(false)
const historyError = ref('')
const selectedHistoryFilter = ref<UploadHistoryFilter>('all')
const expandedRecordIds = ref<number[]>([])
const lastSubmittedRequest = ref<ResourceUploadRequest | null>(null)
const highlightedRequestId = ref<number | null>(null)

const editingRequest = ref<ResourceUploadRequest | null>(null)
const removedExistingFileIds = ref<number[]>([])
const editSelectedFiles = ref<SelectedFile[]>([])
const editFileError = ref('')
const editFileInput = ref<HTMLInputElement | null>(null)
const editFolderInput = ref<HTMLInputElement | null>(null)
const editCurrentPath = ref('/')
const editCreateNewFolder = ref(false)
const editNewFolderName = ref('')
const editSubmitting = ref(false)
const editUploadProgress = ref(0)
const editUploadStage = ref<UploadStage>('idle')
const editSubmitError = ref('')
const maxFileCount = ref(DEFAULT_MAX_FILE_COUNT)
const maxFileSize = ref(DEFAULT_MAX_FILE_SIZE)
const allowedExtensions = ref(DEFAULT_ALLOWED_EXTENSIONS)
let uploadHistoryRefreshTimer: ReturnType<typeof setInterval> | undefined
let highlightTimer: ReturnType<typeof setTimeout> | undefined

const acceptExtensions = computed(() => [...allowedExtensions.value].join(','))
const totalSize = computed(() => selectedFiles.value.reduce((sum, item) => sum + item.file.size, 0))
const selectedRelativePaths = computed(() => selectedFiles.value.map((item) => item.relativePath))
const finalTargetPath = computed(() => {
  if (!createNewFolder.value || !newFolderName.value) return currentPath.value
  return `${currentPath.value === '/' ? '' : currentPath.value}/${newFolderName.value}`
})
const rootUploadBlocked = computed(
  () => currentPath.value === '/' && (!createNewFolder.value || !newFolderName.value),
)
const directoryDraftFolderNameInvalid = computed(() =>
  directoryDraftCreateNewFolder.value
  && (
    !directoryDraftNewFolderName.value.trim()
    || directoryDraftNewFolderName.value.trim() === '.'
    || directoryDraftNewFolderName.value.trim() === '..'
    || /[\\/]/.test(directoryDraftNewFolderName.value)
  ),
)
const directoryDraftRootBlocked = computed(
  () => directoryDraftPath.value === '/'
    && (!directoryDraftCreateNewFolder.value || !directoryDraftNewFolderName.value.trim()),
)
const canConfirmDirectory = computed(
  () => selectedFiles.value.length > 0
    && !directoryDraftFolderNameInvalid.value
    && !directoryDraftRootBlocked.value,
)
const canSubmit = computed(
  () => !isSubmitting.value
    && selectedFiles.value.length > 0
    && targetConfirmed.value
    && !rootUploadBlocked.value,
)
const submitButtonText = computed(() => {
  if (!isSubmitting.value) return '提交审核'
  if (uploadStage.value === 'confirming') return '文件已上传，正在创建投稿记录…'
  return `正在上传 ${uploadProgress.value}%`
})
const historyFilterOptions: { value: UploadHistoryFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'processing', label: '处理中' },
  { value: 'approved', label: '已通过' },
  { value: 'issues', label: '异常' },
]
const matchesHistoryFilter = (record: ResourceUploadRequest, filter: UploadHistoryFilter) => {
  if (filter === 'all') return true
  if (filter === 'processing') return record.status === 'pending' || record.status === 'publishing'
  if (filter === 'approved') return record.status === 'approved'
  return record.status === 'rejected' || record.status === 'publish_failed'
}
const filteredUploadHistory = computed(() =>
  uploadHistory.value
    .filter((record) => matchesHistoryFilter(record, selectedHistoryFilter.value))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
)
const historyFilterCounts = computed<Record<UploadHistoryFilter, number>>(() => ({
  all: uploadHistory.value.length,
  processing: uploadHistory.value.filter((record) => matchesHistoryFilter(record, 'processing')).length,
  approved: uploadHistory.value.filter((record) => matchesHistoryFilter(record, 'approved')).length,
  issues: uploadHistory.value.filter((record) => matchesHistoryFilter(record, 'issues')).length,
}))
const editFinalTargetPath = computed(() => {
  if (!editCreateNewFolder.value || !editNewFolderName.value) return editCurrentPath.value
  return `${editCurrentPath.value === '/' ? '' : editCurrentPath.value}/${editNewFolderName.value}`
})
const keptExistingFiles = computed<ResourceUploadFile[]>(() =>
  editingRequest.value?.files.filter((file) => !removedExistingFileIds.value.includes(file.id)) || [],
)
const keptExistingFileCount = computed(() => keptExistingFiles.value.length)
const editResultFileCount = computed(() => keptExistingFileCount.value + editSelectedFiles.value.length)
const editTotalSize = computed(() =>
  keptExistingFiles.value.reduce((total, file) => total + file.size, 0)
  + editSelectedFiles.value.reduce((total, item) => total + item.file.size, 0),
)
const editFolderNameInvalid = computed(() =>
  editCreateNewFolder.value
  && (
    !editNewFolderName.value
    || editNewFolderName.value === '.'
    || editNewFolderName.value === '..'
    || /[\\/]/.test(editNewFolderName.value)
  ),
)
const editRootUploadBlocked = computed(
  () => editCurrentPath.value === '/' && (!editCreateNewFolder.value || !editNewFolderName.value),
)
const canSaveEdit = computed(
  () => !editSubmitting.value
    && editResultFileCount.value > 0
    && editResultFileCount.value <= maxFileCount.value
    && !editFolderNameInvalid.value
    && !editRootUploadBlocked.value,
)
const editSubmitButtonText = computed(() => {
  if (!editSubmitting.value) return '保存修改'
  if (editUploadStage.value === 'confirming') return '文件已上传，正在保存修改…'
  return `正在上传 ${editUploadProgress.value}%`
})

const statusMeta = {
  pending: {
    label: '待审核',
    dotClass: 'bg-amber-500',
  },
  publishing: {
    label: '发布中',
    dotClass: 'bg-blue-500',
  },
  publish_failed: {
    label: '发布异常',
    dotClass: 'bg-orange-500',
  },
  approved: {
    label: '已通过',
    dotClass: 'bg-emerald-500',
  },
  rejected: {
    label: '已退回',
    dotClass: 'bg-red-500',
  },
}

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}
const editTotalSizeDisplay = computed(() => formatBytes(editTotalSize.value))

const getExtension = (name: string) => {
  const lastDot = name.lastIndexOf('.')
  return lastDot >= 0 ? name.slice(lastDot).toLowerCase() : ''
}

const getFileIcon = (name: string) => {
  const extension = getExtension(name)
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.tif', '.tiff', '.heic', '.heif', '.avif'].includes(extension)) {
    return FileImage
  }
  if (['.xls', '.xlsx', '.ods', '.csv'].includes(extension)) return FileSpreadsheet
  if (['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz'].includes(extension)) return FileArchive
  return FileText
}

const getErrorMessage = (errors: { err_msg: string }[] | undefined, fallback: string) =>
  errors?.map((error) => error.err_msg).filter(Boolean).join('；') || fallback

const addFiles = (incoming: { file: File; relativePath?: string }[]) => {
  fileError.value = ''
  const next = [...selectedFiles.value]
  const initialCount = next.length
  const existing = new Set(next.map((item) => item.relativePath))
  const rejected: string[] = []

  for (const incomingItem of incoming) {
    const file = incomingItem.file
    const relativePath = (incomingItem.relativePath || file.name).replaceAll('\\', '/').replace(/^\/+/, '')
    if (next.length >= maxFileCount.value) {
      rejected.push(`每次最多选择 ${maxFileCount.value} 个文件`)
      break
    }
    if (file.size > maxFileSize.value) {
      rejected.push(`${file.name} 超过 100 MB`)
      continue
    }
    if (!allowedExtensions.value.has(getExtension(file.name))) {
      rejected.push(`${file.name} 的格式暂不支持`)
      continue
    }
    if (existing.has(relativePath)) {
      rejected.push(`${relativePath} 已经在列表中`)
      continue
    }
    existing.add(relativePath)
    next.push({
      id: `${relativePath}-${file.size}-${file.lastModified}`,
      file,
      relativePath,
    })
  }

  selectedFiles.value = next
  if (rejected.length) {
    const visible = rejected.slice(0, 2).join('；')
    fileError.value = rejected.length > 2 ? `${visible}；另有 ${rejected.length - 2} 个文件未添加` : visible
  }
  return next.length - initialCount
}

const openDirectoryModal = () => {
  if (!selectedFiles.value.length || isSubmitting.value) return
  directoryDraftPath.value = currentPath.value
  directoryDraftCreateNewFolder.value = targetConfirmed.value ? createNewFolder.value : false
  directoryDraftNewFolderName.value = targetConfirmed.value ? newFolderName.value : ''
  submitError.value = ''
  directoryModalOpen.value = true
}

const cancelDirectorySelection = () => {
  if (!isSubmitting.value) directoryModalOpen.value = false
}

const handleDirectoryModalShow = (show: boolean) => {
  if (!show) cancelDirectorySelection()
}

const confirmDirectorySelection = () => {
  if (!canConfirmDirectory.value) return
  currentPath.value = directoryDraftPath.value
  createNewFolder.value = directoryDraftCreateNewFolder.value
  newFolderName.value = directoryDraftNewFolderName.value.trim()
  targetConfirmed.value = true
  submitError.value = ''
  directoryModalOpen.value = false
}

const handleFileInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || []).map((file) => ({
    file,
    relativePath: (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name,
  }))
  const addedCount = addFiles(files)
  input.value = ''
  if (addedCount > 0 && !targetConfirmed.value) openDirectoryModal()
}

const readAllDirectoryEntries = async (entry: FileSystemEntryLike): Promise<FileSystemEntryLike[]> => {
  const reader = entry.createReader?.()
  if (!reader) return []
  const allEntries: FileSystemEntryLike[] = []
  while (true) {
    const batch = await new Promise<FileSystemEntryLike[]>((resolve) => reader.readEntries(resolve, () => resolve([])))
    if (!batch.length) break
    allEntries.push(...batch)
  }
  return allEntries
}

const readEntry = async (entry: FileSystemEntryLike, parentPath = ''): Promise<{ file: File; relativePath: string }[]> => {
  const path = parentPath ? `${parentPath}/${entry.name}` : entry.name
  if (entry.isFile && entry.file) {
    const file = await new Promise<File | null>((resolve) => entry.file?.(resolve, () => resolve(null)))
    return file ? [{ file, relativePath: path }] : []
  }
  if (entry.isDirectory) {
    const children = await readAllDirectoryEntries(entry)
    const nested = await Promise.all(children.map((child) => readEntry(child, path)))
    return nested.flat()
  }
  return []
}

const handleDrop = async (event: DragEvent) => {
  isDragging.value = false
  const items = Array.from(event.dataTransfer?.items || [])
  const entries = items
    .map((item) => {
      const withEntry = item as unknown as { webkitGetAsEntry?: () => FileSystemEntryLike | null }
      return withEntry.webkitGetAsEntry?.() || null
    })
    .filter((entry): entry is FileSystemEntryLike => entry !== null)

  if (entries.length) {
    const nested = await Promise.all(entries.map((entry) => readEntry(entry)))
    const addedCount = addFiles(nested.flat())
    if (addedCount > 0 && !targetConfirmed.value) openDirectoryModal()
    return
  }
  const addedCount = addFiles(Array.from(event.dataTransfer?.files || []).map((file) => ({ file, relativePath: file.name })))
  if (addedCount > 0 && !targetConfirmed.value) openDirectoryModal()
}

const handleDragLeave = (event: DragEvent) => {
  const currentTarget = event.currentTarget as HTMLElement
  const relatedTarget = event.relatedTarget as Node | null
  if (!relatedTarget || !currentTarget.contains(relatedTarget)) isDragging.value = false
}

const removeFile = (id: string) => {
  selectedFiles.value = selectedFiles.value.filter((item) => item.id !== id)
  if (!selectedFiles.value.length) {
    targetConfirmed.value = false
    createNewFolder.value = false
    newFolderName.value = ''
    directoryModalOpen.value = false
  }
  fileError.value = ''
}

const clearFiles = () => {
  selectedFiles.value = []
  fileError.value = ''
  targetConfirmed.value = false
  createNewFolder.value = false
  newFolderName.value = ''
  directoryModalOpen.value = false
}

const toggleRecordFiles = (requestId: number) => {
  expandedRecordIds.value = expandedRecordIds.value.includes(requestId)
    ? expandedRecordIds.value.filter((id) => id !== requestId)
    : [...expandedRecordIds.value, requestId]
}

const resetEditDialog = () => {
  editingRequest.value = null
  removedExistingFileIds.value = []
  editSelectedFiles.value = []
  editFileError.value = ''
  editCreateNewFolder.value = false
  editNewFolderName.value = ''
  editSubmitError.value = ''
  editUploadProgress.value = 0
  editUploadStage.value = 'idle'
}

const closeEditDialog = () => {
  if (!editSubmitting.value) resetEditDialog()
}

const openEditDialog = (record: ResourceUploadRequest) => {
  editingRequest.value = record
  removedExistingFileIds.value = []
  editSelectedFiles.value = []
  editFileError.value = ''
  editSubmitError.value = ''
  editUploadProgress.value = 0

  if (record.creates_new_folder) {
    const parts = record.target_path.split('/').filter(Boolean)
    editNewFolderName.value = parts.pop() || ''
    editCurrentPath.value = parts.length ? `/${parts.join('/')}` : '/'
    editCreateNewFolder.value = true
  } else {
    editCurrentPath.value = record.target_path
    editCreateNewFolder.value = false
    editNewFolderName.value = ''
  }
}

const toggleExistingFileRemoval = (fileId: number) => {
  removedExistingFileIds.value = removedExistingFileIds.value.includes(fileId)
    ? removedExistingFileIds.value.filter((id) => id !== fileId)
    : [...removedExistingFileIds.value, fileId]
  editFileError.value = ''
}

const addEditFiles = (incoming: { file: File; relativePath?: string }[]) => {
  editFileError.value = ''
  const next = [...editSelectedFiles.value]
  const existingPaths = new Set([
    ...keptExistingFiles.value.map((file) => file.relative_path),
    ...next.map((item) => item.relativePath),
  ])
  const rejected: string[] = []

  for (const incomingItem of incoming) {
    const file = incomingItem.file
    const relativePath = (incomingItem.relativePath || file.name).replaceAll('\\', '/').replace(/^\/+/, '')
    if (keptExistingFileCount.value + next.length >= maxFileCount.value) {
      rejected.push(`每次最多保留和上传 ${maxFileCount.value} 个文件`)
      break
    }
    if (file.size > maxFileSize.value) {
      rejected.push(`${file.name} 超过 100 MB`)
      continue
    }
    if (!allowedExtensions.value.has(getExtension(file.name))) {
      rejected.push(`${file.name} 的格式暂不支持`)
      continue
    }
    if (existingPaths.has(relativePath)) {
      rejected.push(`${relativePath} 已经在投稿中`)
      continue
    }
    existingPaths.add(relativePath)
    next.push({
      id: `edit-${relativePath}-${file.size}-${file.lastModified}`,
      file,
      relativePath,
    })
  }

  editSelectedFiles.value = next
  if (rejected.length) {
    const visible = rejected.slice(0, 2).join('；')
    editFileError.value = rejected.length > 2
      ? `${visible}；另有 ${rejected.length - 2} 个文件未添加`
      : visible
  }
}

const handleEditFileInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || []).map((file) => ({
    file,
    relativePath: (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name,
  }))
  addEditFiles(files)
  input.value = ''
}

const removeEditFile = (id: string) => {
  editSelectedFiles.value = editSelectedFiles.value.filter((item) => item.id !== id)
  editFileError.value = ''
}

const loadUploadConfig = async () => {
  try {
    const response = await api.get({ url: '/api/upload/config/' })
    if (response.status !== 200) return
    maxFileCount.value = response.content.max_file_count
    maxFileSize.value = response.content.max_file_size
    allowedExtensions.value = new Set(response.content.allowed_extensions)
  } catch {
    // Keep the safe bundled defaults when the configuration endpoint is temporarily unavailable.
  }
}

const loadUploadHistory = async () => {
  historyLoading.value = true
  historyError.value = ''
  try {
    const response = await api.get({ url: '/api/upload/request/' })
    if (response.status !== 200) {
      historyError.value = getErrorMessage(response.errors, '投稿记录加载失败')
      return
    }
    uploadHistory.value = [...response.content.upload_requests].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
  } catch {
    historyError.value = '暂时无法加载投稿记录'
  } finally {
    historyLoading.value = false
  }
}

const completeSubmission = async (uploadRequest: ResourceUploadRequest) => {
  const existingIndex = uploadHistory.value.findIndex((item) => item.id === uploadRequest.id)
  if (existingIndex >= 0) {
    uploadHistory.value = uploadHistory.value.map((item) =>
      item.id === uploadRequest.id ? uploadRequest : item,
    )
  }
  else {
    uploadHistory.value = [uploadRequest, ...uploadHistory.value]
  }
  selectedHistoryFilter.value = 'all'
  lastSubmittedRequest.value = uploadRequest
  highlightedRequestId.value = uploadRequest.id
  if (highlightTimer) clearTimeout(highlightTimer)
  highlightTimer = setTimeout(() => {
    highlightedRequestId.value = null
  }, 6000)
  await nextTick()
  document.getElementById(`upload-record-${uploadRequest.id}`)?.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
  })
}

const submitUpload = async () => {
  submitError.value = ''
  if (!selectedFiles.value.length) {
    submitError.value = '请先选择要投稿的文件'
    return
  }
  if (!targetConfirmed.value) {
    submitError.value = '请先选择并确认目标目录'
    openDirectoryModal()
    return
  }
  if (createNewFolder.value && !newFolderName.value) {
    submitError.value = '请输入新文件夹名称'
    return
  }
  if (currentPath.value === '/' && !createNewFolder.value) {
    submitError.value = '禁止直接投稿到根目录，请选择子目录或新建文件夹'
    return
  }
  if (newFolderName.value === '.' || newFolderName.value === '..' || /[\\/]/.test(newFolderName.value)) {
    submitError.value = '文件夹名称不能包含斜杠，也不能是 . 或 ..'
    return
  }

  const formData = new FormData()
  formData.append('target_path', currentPath.value)
  if (createNewFolder.value) formData.append('new_folder_name', newFolderName.value)
  selectedFiles.value.forEach((item) => {
    formData.append('files', item.file, item.file.name)
    formData.append('relative_paths', item.relativePath)
  })

  isSubmitting.value = true
  uploadProgress.value = 0
  uploadStage.value = 'uploading'
  lastSubmittedRequest.value = null
  const existingRequestIds = new Set(uploadHistory.value.map((item) => item.id))
  try {
    const response = await api.post({
      url: '/api/upload/request/',
      query: formData,
      onUploadProgress: ({ loaded, total }) => {
        if (total) {
          uploadProgress.value = Math.min(100, Math.round((loaded / total) * 100))
          if (loaded >= total) uploadStage.value = 'confirming'
        }
      },
    })
    if (response.status !== 201) {
      submitError.value = getErrorMessage(response.errors, '提交失败，请检查文件后重试')
      return
    }
    uploadProgress.value = 100
    clearFiles()
    createNewFolder.value = false
    newFolderName.value = ''
    await completeSubmission(response.content.upload_request)
    message.success(`投稿 #${response.content.upload_request.id} 已提交，请等待管理员审核`)
  } catch (error) {
    await loadUploadHistory()
    const recoveredRequest = uploadHistory.value.find(
      (item) => !existingRequestIds.has(item.id) && item.target_path === finalTargetPath.value,
    )
    if (recoveredRequest) {
      uploadProgress.value = 100
      clearFiles()
      createNewFolder.value = false
      newFolderName.value = ''
      await completeSubmission(recoveredRequest)
      message.success(`投稿 #${recoveredRequest.id} 已提交，请等待管理员审核`)
      return
    }
    submitError.value = error instanceof Error
      ? `上传未完成：${error.message}，请稍后重试`
      : '上传未完成，请稍后重试'
  } finally {
    isSubmitting.value = false
    uploadStage.value = 'idle'
  }
}

const saveEdit = async () => {
  if (!editingRequest.value) return
  editSubmitError.value = ''
  if (!editResultFileCount.value) {
    editSubmitError.value = '请至少保留或新上传一个文件'
    return
  }
  if (editResultFileCount.value > maxFileCount.value) {
    editSubmitError.value = `每次最多保留和上传 ${maxFileCount.value} 个文件`
    return
  }
  if (editFolderNameInvalid.value) {
    editSubmitError.value = '请输入合法的新文件夹名称，名称不能是 .、.. 或包含斜杠'
    return
  }
  if (editRootUploadBlocked.value) {
    editSubmitError.value = '禁止直接投稿到根目录，请选择子目录或新建文件夹'
    return
  }

  const requestId = editingRequest.value.id
  const formData = new FormData()
  formData.append('expected_revision', String(editingRequest.value.revision))
  formData.append('target_path', editCurrentPath.value)
  if (editCreateNewFolder.value) formData.append('new_folder_name', editNewFolderName.value)
  removedExistingFileIds.value.forEach((fileId) => {
    formData.append('remove_file_ids', String(fileId))
  })
  editSelectedFiles.value.forEach((item) => {
    formData.append('files', item.file, item.file.name)
    formData.append('relative_paths', item.relativePath)
  })

  editSubmitting.value = true
  editUploadProgress.value = 0
  editUploadStage.value = 'uploading'
  try {
    const response = await api.put({
      url: '/api/upload/request/:requestId/',
      params: { requestId },
      query: formData,
      onUploadProgress: ({ loaded, total }) => {
        if (total) {
          editUploadProgress.value = Math.min(100, Math.round((loaded / total) * 100))
          if (loaded >= total) editUploadStage.value = 'confirming'
        }
      },
    })
    if (response.status !== 200) {
      if (response.status === 409) {
        await loadUploadHistory()
        const latestRecord = uploadHistory.value.find((record) => record.id === requestId)
        if (latestRecord?.can_edit) {
          await openEditDialog(latestRecord)
          editSubmitError.value = '投稿内容已更新，已重新载入最新版本；请确认后再次保存。'
        }
        else {
          resetEditDialog()
          message.warning('投稿已进入发布流程或文件已清理，无法继续编辑。')
        }
        return
      }
      editSubmitError.value = getErrorMessage(response.errors, '保存失败，请检查文件和目录后重试')
      return
    }

    editUploadProgress.value = 100
    uploadHistory.value = uploadHistory.value.map((record) =>
      record.id === requestId ? response.content.upload_request : record,
    )
    editSubmitting.value = false
    resetEditDialog()
    message.success(`投稿 #${requestId} 已更新${response.content.upload_request.status === 'pending' ? '，当前为待审核状态' : ''}`)
  } catch (error) {
    editSubmitError.value = error instanceof Error
      ? `保存未完成：${error.message}`
      : '保存未完成，请稍后重试'
  } finally {
    editSubmitting.value = false
    editUploadStage.value = 'idle'
  }
}

const refreshUploadHistoryWhenVisible = () => {
  if (
    document.visibilityState === 'visible'
    && !historyLoading.value
    && uploadHistory.value.some((record) => record.status === 'pending' || record.status === 'publishing')
  ) {
    loadUploadHistory()
  }
}

onMounted(() => {
  loadUploadConfig()
  loadUploadHistory()
  window.addEventListener('focus', refreshUploadHistoryWhenVisible)
  document.addEventListener('visibilitychange', refreshUploadHistoryWhenVisible)
  uploadHistoryRefreshTimer = setInterval(refreshUploadHistoryWhenVisible, 60_000)
})

onUnmounted(() => {
  window.removeEventListener('focus', refreshUploadHistoryWhenVisible)
  document.removeEventListener('visibilitychange', refreshUploadHistoryWhenVisible)
  if (uploadHistoryRefreshTimer) clearInterval(uploadHistoryRefreshTimer)
  if (highlightTimer) clearTimeout(highlightTimer)
})
</script>
