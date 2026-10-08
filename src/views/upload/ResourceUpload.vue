<template>
  <AppPageLayout title="分享资料" description="上传学习资料，审核通过后会发布到资料站。" appearance="shadcn" width="reading">
    <template #actions>
      <a href="/disk" target="_blank" rel="noopener noreferrer" :class="secondaryButtonClass">
        <ArrowUpRight class="h-4 w-4" aria-hidden="true" />浏览资料
      </a>
    </template>

    <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <section class="min-w-0 rounded-xl border border-zinc-200 bg-white shadow-sm" aria-labelledby="upload-files-title">
        <header class="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
          <div>
            <h2 id="upload-files-title" class="flex items-center gap-2.5 text-base font-semibold tracking-tight">
              <span class="inline-flex h-6 w-6 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-xs text-zinc-600" aria-hidden="true">1</span>
              选择文件
            </h2>
            <p class="mt-2 text-sm leading-6 text-zinc-500">支持文件夹上传，保留原有目录结构。</p>
          </div>
          <span class="shrink-0 rounded-md border border-zinc-200 px-2 py-0.5 text-xs tabular-nums text-zinc-500">{{ selectedFiles.length }} / {{ maxFileCount }}</span>
        </header>

        <div class="p-5 sm:p-6">
          <input ref="fileInput" class="hidden" type="file" multiple :accept="acceptExtensions" :disabled="isSubmitting" @change="handleFileInput" />
          <input ref="folderInput" class="hidden" type="file" multiple webkitdirectory :disabled="isSubmitting" @change="handleFileInput" />
          <div
            class="flex min-h-60 flex-col items-center justify-center rounded-lg border border-dashed px-4 py-8 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
            :class="[isDragging ? 'border-zinc-500 bg-zinc-100' : 'border-zinc-300 bg-zinc-50/50', isSubmitting ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-zinc-400 hover:bg-zinc-50']"
            role="button" :tabindex="isSubmitting ? -1 : 0" :aria-disabled="isSubmitting" aria-label="选择要投稿的文件"
            @click="chooseFiles()" @keydown.enter.self.prevent="chooseFiles()" @keydown.space.self.prevent="chooseFiles()"
            @dragenter.prevent="isDragging = !isSubmitting" @dragover.prevent="isDragging = !isSubmitting" @dragleave.prevent="handleDragLeave" @drop.prevent="handleDrop"
          >
            <span class="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 shadow-sm"><Upload class="h-5 w-5" aria-hidden="true" /></span>
            <p class="mt-4 text-sm font-medium text-zinc-950">拖放文件或文件夹到这里</p>
            <p class="mt-1.5 text-xs leading-5 text-zinc-500">图片、PDF、Office、文本与常见压缩文件</p>
            <div class="mt-5 flex flex-wrap justify-center gap-2">
              <button type="button" :class="primaryButtonClass" :disabled="isSubmitting" @click.stop="chooseFiles()">选择文件</button>
              <button type="button" :class="secondaryButtonClass" :disabled="isSubmitting" @click.stop="chooseFiles(true)"><Folder class="h-4 w-4" aria-hidden="true" />选择文件夹</button>
            </div>
          </div>
          <p class="mt-3 text-xs leading-5 text-zinc-500">单个文件不超过 {{ formatBytes(maxFileSize) }}，每次最多 {{ maxFileCount }} 个文件。</p>
          <div v-if="fileError" role="alert" class="mt-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50/40 p-3 text-sm leading-5 text-red-600">
            <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><p class="min-w-0 break-words">{{ fileError }}</p>
          </div>

          <div v-if="selectedFiles.length" class="mt-6">
            <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 class="text-sm font-medium">已选择的文件</h3>
              <button type="button" class="inline-flex h-8 items-center justify-center rounded-md px-2 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:opacity-50" :disabled="isSubmitting" @click="clearFiles">清空全部</button>
            </div>
            <ul class="max-h-80 divide-y divide-zinc-100 overflow-y-auto overscroll-contain rounded-lg border border-zinc-200" aria-label="已选择的文件">
              <li v-for="item in selectedFiles" :key="item.id" class="flex items-center gap-3 px-3 py-3">
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-500"><component :is="getFileIcon(item.file.name)" class="h-4 w-4" aria-hidden="true" /></span>
                <div class="min-w-0 flex-1"><p class="truncate text-sm font-medium" :title="item.relativePath">{{ item.relativePath }}</p><p class="mt-0.5 text-xs tabular-nums text-zinc-500">{{ formatBytes(item.file.size) }}</p></div>
                <button type="button" class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:opacity-50" :disabled="isSubmitting" :aria-label="`移除 ${item.relativePath}`" @click="removeFile(item.id)"><X class="h-4 w-4" aria-hidden="true" /></button>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <aside class="min-w-0 space-y-4 lg:sticky lg:top-24">
        <section class="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="upload-submit-title" :aria-busy="isSubmitting">
          <h2 id="upload-submit-title" class="flex items-center gap-2.5 text-base font-semibold tracking-tight"><span class="inline-flex h-6 w-6 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-xs text-zinc-600" aria-hidden="true">2</span>提交审核</h2>
          <div class="mt-5">
            <p class="text-xs font-medium text-zinc-500">目标目录</p>
            <div class="mt-2 flex items-start gap-2.5 rounded-md border border-zinc-200 bg-zinc-50/50 px-3 py-3">
              <Folder class="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
              <p class="min-w-0 break-all text-sm" :class="targetConfirmed ? 'font-medium text-zinc-950' : 'text-zinc-500'">{{ targetConfirmed ? finalTargetPath : '尚未选择目录' }}</p>
            </div>
            <button type="button" :class="[secondaryButtonClass, 'mt-2 w-full']" :disabled="isSubmitting || !selectedFiles.length" @click="openDirectoryModal">{{ targetConfirmed ? '更改目录' : '选择目录' }}</button>
          </div>
          <dl class="mt-5 space-y-2.5 border-t border-zinc-100 pt-4 text-sm">
            <div class="flex items-baseline justify-between gap-3"><dt class="text-zinc-500">已选文件</dt><dd class="font-medium tabular-nums">{{ selectedFiles.length }} 个</dd></div>
            <div class="flex items-baseline justify-between gap-3"><dt class="text-zinc-500">合计大小</dt><dd class="font-medium tabular-nums">{{ formatBytes(totalSize) }}</dd></div>
          </dl>
          <div v-if="totalSize > quotaRemaining" role="alert" class="mt-4 rounded-md border border-red-200 bg-red-50/40 px-3 py-2 text-xs leading-5 text-red-600">所选文件超过剩余上传额度，请减少文件后重试。</div>
          <div v-if="submitError" role="alert" class="mt-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50/40 p-3 text-sm leading-5 text-red-600"><AlertCircle class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><p class="min-w-0 break-words">{{ submitError }}</p></div>
          <button type="button" :class="[primaryButtonClass, 'mt-5 min-h-10 h-auto w-full py-2.5']" :disabled="!canSubmit" @click="submitUpload"><Loader2 v-if="isSubmitting" class="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" /><span class="min-w-0">{{ submitButtonText }}</span></button>
          <div v-if="isSubmitting" class="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-100" role="progressbar" :aria-valuenow="uploadProgress" :aria-valuemin="0" :aria-valuemax="100" aria-label="文件上传进度"><div class="h-full rounded-full bg-zinc-950 transition-all duration-300" :style="{ width: `${uploadProgress}%` }"></div></div>
          <p class="mt-3 text-xs leading-5 text-zinc-500">提交后由管理员审核。请确认资料不含隐私信息，并可公开分享。</p>
        </section>
        <section class="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm" aria-labelledby="upload-quota-title">
          <h2 id="upload-quota-title" class="text-sm font-medium">上传额度</h2>
          <div class="mt-3 flex items-baseline justify-between gap-2 text-xs tabular-nums"><span class="text-zinc-500">已用 {{ formatBytes(quotaUsed) }}</span><span class="text-zinc-500">共 {{ formatBytes(quotaLimit) }}</span></div>
          <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100" role="meter" :aria-valuenow="quotaUsed" :aria-valuemin="0" :aria-valuemax="quotaLimit" aria-label="已使用上传额度"><div class="h-full rounded-full bg-zinc-500" :style="{ width: `${quotaLimit > 0 ? Math.min(100, quotaUsed / quotaLimit * 100) : 0}%` }"></div></div>
          <p class="mt-3 text-xs text-zinc-500">剩余 <span class="font-medium tabular-nums text-zinc-950">{{ formatBytes(quotaRemaining) }}</span></p>
        </section>
      </aside>
    </div>

    <section v-if="lastSubmittedRequest" role="status" class="mt-6 flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-4 text-sm shadow-sm">
      <CheckCircle2 class="mt-0.5 h-5 w-5 shrink-0 text-zinc-600" aria-hidden="true" />
      <div class="min-w-0"><p class="font-medium text-zinc-950">投稿 #{{ lastSubmittedRequest.id }} 已提交</p><p class="mt-1 break-words text-sm leading-6 text-zinc-500">共 {{ lastSubmittedRequest.files.length }} 个文件，将归档到 <span class="break-all text-zinc-700">{{ lastSubmittedRequest.target_path }}</span>。审核结果会通过站内信和邮件告知，待审核期间可在下方编辑。</p></div>
    </section>

    <ResourceUploadHistory class="mt-8" :records="uploadHistory" :loading="historyLoading" :error="historyError" v-model:filter="selectedHistoryFilter" :highlighted-request-id="highlightedRequestId" :expanded-record-ids="expandedRecordIds" @refresh="loadUploadHistory" @toggle-files="toggleRecordFiles" @edit="openEditDialog" />

      <ShadcnModal
        :show="directoryModalOpen"
        :mask-closable="!isSubmitting"
        :close-on-esc="!isSubmitting"
        title="选择目标目录"
        @update:show="handleDirectoryModalShow"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="directory-modal-title"
          class="flex max-h-[calc(100dvh-0.75rem)] w-[calc(100vw-0.75rem)] max-w-2xl flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg sm:max-h-[calc(100dvh-3rem)] sm:w-[calc(100vw-3rem)]"
        >
          <div class="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-200 px-4 py-4 sm:px-6">
            <div>

              <h2 id="directory-modal-title" class="text-lg font-semibold tracking-tight text-zinc-950">选择目标目录</h2>
              <p class="mt-1 text-sm text-zinc-500">确认后还可以在提交前再次更改。</p>
            </div>
            <button
              type="button"
              class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:opacity-50"
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
              :preview-relative-paths="selectedRelativePaths" :disabled="isSubmitting"
              input-id="submission-new-folder-name"
            />
          </div>

          <div class="flex shrink-0 items-center justify-end gap-3 border-t border-zinc-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
            <button
              type="button"
              :class="secondaryButtonClass"
              :disabled="isSubmitting"
              @click="cancelDirectorySelection"
            >
              取消
            </button>
            <button
              type="button"
              :class="primaryButtonClass"
              :disabled="!canConfirmDirectory || isSubmitting"
              @click="confirmDirectorySelection"
            >
              确认目录
            </button>
          </div>
        </div>
      </ShadcnModal>

      <ShadcnModal
        :show="Boolean(editingRequest)"
        :mask-closable="!editSubmitting"
        :close-on-esc="!editSubmitting"
        title="编辑投稿"
        @update:show="show => { if (!show) closeEditDialog() }"
      >
        <div v-if="editingRequest" class="flex max-h-[calc(100dvh-0.75rem)] w-[calc(100vw-0.75rem)] max-w-4xl flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg sm:max-h-[calc(100dvh-3rem)] sm:w-[calc(100vw-3rem)]" :aria-busy="editSubmitting">
          <div class="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-200 bg-white px-4 py-4 sm:px-6">
            <div>
              <p class="text-xs text-zinc-500">投稿 #{{ editingRequest.id }}</p>
              <h2 id="edit-upload-title" class="mt-1 text-lg font-semibold tracking-tight text-zinc-950">编辑投稿</h2>
              <p class="mt-1 text-sm text-zinc-500">
                {{ editingRequest.status === 'rejected' ? '保存后将重新进入待审核状态。' : '保存后会更新当前待审核内容。' }}
              </p>
            </div>
            <button
              type="button"
              class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:opacity-50"
              aria-label="关闭编辑窗口"
              :disabled="editSubmitting"
              @click="closeEditDialog"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6"><fieldset :disabled="editSubmitting" class="grid min-w-0 gap-6 lg:grid-cols-2 disabled:opacity-70">
            <section>
              <div class="flex items-center justify-between gap-3">
                <div>
                  <h3 class="text-sm font-medium text-zinc-950">之前上传的文件</h3>
                  <p class="mt-1 text-xs text-zinc-500">点击删除可将文件标记为移除，再次点击可以撤销。</p>
                </div>
                <span class="shrink-0 rounded-md border border-zinc-200 px-2 py-0.5 text-xs tabular-nums text-zinc-500">
                  保留 {{ keptExistingFileCount }}
                </span>
              </div>

              <ul class="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
                <li
                  v-for="file in editingRequest.files"
                  :key="file.id"
                  class="flex items-center gap-3 rounded-md border px-3 py-3 transition"
                  :class="removedExistingFileIds.includes(file.id)
                    ? 'border-red-100 bg-red-50/70 opacity-65'
                    : 'border-zinc-200 bg-white'"
                >
                  <component :is="getFileIcon(file.original_name)" class="h-5 w-5 shrink-0 text-zinc-500" />
                  <div class="min-w-0 flex-1">
                    <p
                      class="truncate text-sm font-medium"
                      :class="removedExistingFileIds.includes(file.id) ? 'text-red-500 line-through' : 'text-zinc-800'"
                      :title="file.relative_path"
                    >
                      {{ file.relative_path }}
                    </p>
                    <p class="mt-0.5 text-xs text-zinc-400">{{ file.size_display }}</p>
                  </div>
                  <button
                    type="button"
                    class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:opacity-50"
                    :class="removedExistingFileIds.includes(file.id)
                      ? 'text-zinc-500 hover:bg-white hover:text-zinc-800'
                      : 'text-zinc-400 hover:bg-red-50 hover:text-red-600'"
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
                  <h3 class="text-sm font-medium text-zinc-950">追加新文件</h3>
                  <p class="mt-1 text-xs text-zinc-500">可选择文件或整个文件夹。</p>
                </div>
                <span class="text-xs font-semibold text-zinc-500">{{ editResultFileCount }} / {{ maxFileCount }}</span>
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
              <div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  :class="secondaryButtonClass"
                  @click="chooseEditFiles()"
                >
                  <Plus class="h-4 w-4" />
                  添加文件
                </button>
                <button
                  type="button"
                  :class="secondaryButtonClass"
                  @click="chooseEditFiles(true)"
                >
                  <FolderPlus class="h-4 w-4" />
                  添加文件夹
                </button>
              </div>

              <ul v-if="editSelectedFiles.length" class="mt-3 max-h-52 space-y-2 overflow-y-auto pr-1">
                <li
                  v-for="item in editSelectedFiles"
                  :key="item.id"
                  class="flex items-center gap-3 rounded-md border border-zinc-100 bg-zinc-50/50 px-3 py-2.5"
                >
                  <component :is="getFileIcon(item.file.name)" class="h-4 w-4 shrink-0 text-zinc-800" />
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium text-zinc-800" :title="item.relativePath">{{ item.relativePath }}</p>
                    <p class="text-xs text-zinc-400">{{ formatBytes(item.file.size) }}</p>
                  </div>
                  <button
                    type="button"
                    class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-400 hover:bg-white hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:opacity-50" :aria-label="`移除 ${item.relativePath}`"
                    @click="removeEditFile(item.id)"
                  >
                    <X class="h-4 w-4" />
                  </button>
                </li>
              </ul>
              <p v-if="editFileError" role="alert" class="mt-3 rounded-md border border-red-200 px-3 py-2 text-sm leading-5 text-red-600">{{ editFileError }}</p>
            </section>

            <section>
              <h3 class="text-sm font-medium text-zinc-950">修改上传目录</h3>
              <p class="mt-1 text-xs text-zinc-500">请选择资料审核通过后要归档的位置。</p>
              <div class="mt-4">
                <ResourceDirectoryPicker
                  v-model:path="editCurrentPath"
                  v-model:create-new-folder="editCreateNewFolder"
                  v-model:new-folder-name="editNewFolderName" :disabled="editSubmitting"
                  compact
                  input-id="edit-new-folder-name"
                />
              </div>

              <div class="mt-5 rounded-md border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="text-zinc-500">保存后文件</span>
                  <span class="font-medium tabular-nums text-zinc-950">{{ editResultFileCount }} 个 · {{ editTotalSizeDisplay }}</span>
                </div>
                <div class="mt-2 grid grid-cols-2 gap-2 border-t border-zinc-200 pt-2 text-xs">
                  <span class="text-zinc-500">删除 {{ removedExistingFileIds.length }} 个</span>
                  <span class="text-right text-zinc-500">新增 {{ editSelectedFiles.length }} 个</span>
                </div>
                <div class="mt-2 border-t border-zinc-200 pt-2 text-xs">
                  <p class="text-zinc-400">目录变更</p>
                  <p class="mt-1 break-all text-zinc-600">{{ editingRequest.target_path }}</p>
                  <p class="my-1 text-zinc-400">↓</p>
                  <p class="break-all font-medium text-zinc-950">{{ editFinalTargetPath }}</p>
                </div>
                <p v-if="editingRequest.status === 'rejected'" class="mt-2 border-t border-zinc-200 pt-2 text-xs font-medium text-amber-700">
                  保存后将清除原退回原因，并重新进入待审核状态。
                </p>
              </div>
              <p v-if="editTotalSize > editQuotaRemaining" role="alert" class="mt-3 rounded-md border border-red-200 px-3 py-2 text-sm leading-5 text-red-600">修改后文件超过可用上传额度，请减少文件后重试。</p>
              <p v-if="editSubmitError" role="alert" class="mt-3 rounded-md border border-red-200 px-3 py-2 text-sm leading-5 text-red-600">{{ editSubmitError }}</p>
            </section>
          </fieldset>
          </div>

          <div class="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-zinc-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
            <button
              type="button"
              :class="secondaryButtonClass"
              :disabled="editSubmitting"
              @click="closeEditDialog"
            >
              取消
            </button>
            <button
              type="button"
              :class="[primaryButtonClass, 'min-h-10 h-auto py-2']"
              :disabled="!canSaveEdit"
              @click="saveEdit"
            >
              <Loader2 v-if="editSubmitting" class="h-4 w-4 animate-spin" />
              <Save v-else class="h-4 w-4" />
              {{ editSubmitButtonText }}
            </button>
          </div>
        </div>
      </ShadcnModal>
  </AppPageLayout>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import ShadcnModal from '@/components/common/ShadcnModal.vue'
import { useShadcnToast } from '@/lib/useShadcnToast'
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderPlus,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-vue-next'
import { api } from '@/lib/requests'
import type { ResourceUploadRequest, ResourceUploadFile } from '@/types/api/resourceUpload'
import AppPageLayout from '@/components/layout/AppPageLayout.vue'
import ResourceDirectoryPicker from '@/components/upload/ResourceDirectoryPicker.vue'
import ResourceUploadHistory from '@/components/upload/ResourceUploadHistory.vue'

const message = useShadcnToast()
const primaryButtonClass = 'inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
const secondaryButtonClass = 'inline-flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-950 shadow-sm transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
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
const quotaLimit = ref(1024 ** 3)
const quotaUsed = ref(0)
const quotaRemaining = ref(1024 ** 3)
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
    && !rootUploadBlocked.value
    && totalSize.value <= quotaRemaining.value,
)
const submitButtonText = computed(() => {
  if (!isSubmitting.value) return '提交审核'
  if (uploadStage.value === 'confirming') return '文件已上传，正在创建投稿记录…'
  return `正在上传 ${uploadProgress.value}%`
})
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
const editQuotaRemaining = computed(() => quotaRemaining.value + (editingRequest.value?.total_size || 0))
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
    && !editRootUploadBlocked.value
    && editTotalSize.value <= editQuotaRemaining.value,
)
const editSubmitButtonText = computed(() => {
  if (!editSubmitting.value) return '保存修改'
  if (editUploadStage.value === 'confirming') return '文件已上传，正在保存修改…'
  return `正在上传 ${editUploadProgress.value}%`
})

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
  if (isSubmitting.value) return 0
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
  if (!canConfirmDirectory.value || isSubmitting.value) return
  currentPath.value = directoryDraftPath.value
  createNewFolder.value = directoryDraftCreateNewFolder.value
  newFolderName.value = directoryDraftNewFolderName.value.trim()
  targetConfirmed.value = true
  submitError.value = ''
  directoryModalOpen.value = false
}

const chooseFiles = (folder = false) => {
  if (!isSubmitting.value) (folder ? folderInput : fileInput).value?.click()
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
  if (isSubmitting.value) return
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
  if (isSubmitting.value) return
  selectedFiles.value = selectedFiles.value.filter((item) => item.id !== id)
  if (!selectedFiles.value.length) {
    targetConfirmed.value = false
    createNewFolder.value = false
    newFolderName.value = ''
    directoryModalOpen.value = false
  }
  fileError.value = ''
}

const resetSelectedFiles = () => {
  selectedFiles.value = []
  fileError.value = ''
  targetConfirmed.value = false
  createNewFolder.value = false
  newFolderName.value = ''
  directoryModalOpen.value = false
}

const clearFiles = () => {
  if (!isSubmitting.value) resetSelectedFiles()
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
  if (editSubmitting.value) return
  removedExistingFileIds.value = removedExistingFileIds.value.includes(fileId)
    ? removedExistingFileIds.value.filter((id) => id !== fileId)
    : [...removedExistingFileIds.value, fileId]
  editFileError.value = ''
}

const addEditFiles = (incoming: { file: File; relativePath?: string }[]) => {
  if (editSubmitting.value) return
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

const chooseEditFiles = (folder = false) => {
  if (!editSubmitting.value) (folder ? editFolderInput : editFileInput).value?.click()
}

const removeEditFile = (id: string) => {
  if (editSubmitting.value) return
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
    quotaLimit.value = response.content.quota.limit
    quotaUsed.value = response.content.quota.used
    quotaRemaining.value = response.content.quota.remaining
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
  if (isSubmitting.value) return
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

  if (totalSize.value > quotaRemaining.value) {
    submitError.value = '所选文件超过剩余上传额度，请减少文件后重试。'
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
    resetSelectedFiles()
    createNewFolder.value = false
    newFolderName.value = ''
    await completeSubmission(response.content.upload_request)
    await loadUploadConfig()
    message.success(`投稿 #${response.content.upload_request.id} 已提交，请等待管理员审核`)
  } catch (error) {
    await loadUploadHistory()
    const recoveredRequest = uploadHistory.value.find(
      (item) => !existingRequestIds.has(item.id) && item.target_path === finalTargetPath.value,
    )
    if (recoveredRequest) {
      uploadProgress.value = 100
      resetSelectedFiles()
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
  if (!editingRequest.value || editSubmitting.value) return
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
  if (editTotalSize.value > editQuotaRemaining.value) {
    editSubmitError.value = '修改后文件超过可用上传额度，请减少文件后重试。'
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
    await loadUploadConfig()
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
