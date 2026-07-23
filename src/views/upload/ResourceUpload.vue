<template>
  <div class="min-h-screen bg-slate-50">
    <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <section class="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-9 text-white shadow-xl sm:px-10">
        <div class="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl"></div>
        <div class="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl"></div>
        <div class="relative max-w-3xl">
          <div class="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm text-blue-100">
            <Upload class="h-4 w-4" />
            资料共建计划
          </div>
          <h1 class="text-3xl font-bold tracking-tight sm:text-4xl">
            分享一份资料，让后来者少走一点弯路
          </h1>
          <p class="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            选择文件和目标目录后提交。管理员审核通过后，资料会出现在资料站中。
          </p>
          <div class="mt-6 flex flex-wrap gap-x-7 gap-y-3 text-sm text-slate-300">
            <span class="flex items-center gap-2">
              <CheckCircle2 class="h-4 w-4 text-emerald-400" />
              单个文件不超过 100 MB
            </span>
            <span class="flex items-center gap-2">
              <CheckCircle2 class="h-4 w-4 text-emerald-400" />
              每次最多 20 个文件
            </span>
            <span class="flex items-center gap-2">
              <CheckCircle2 class="h-4 w-4 text-emerald-400" />
              支持常见资料与压缩格式
            </span>
          </div>
        </div>
      </section>

      <section class="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm font-semibold text-blue-600">第一步</p>
              <h2 class="mt-1 text-xl font-bold text-slate-900">选择投稿文件</h2>
              <p class="mt-1 text-sm text-slate-500">可拖入文件或整个文件夹，文件夹结构会被保留。</p>
            </div>
            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {{ selectedFiles.length }} / 20
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
        </div>

        <aside class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div>
            <p class="text-sm font-semibold text-blue-600">第二步</p>
            <h2 class="mt-1 text-xl font-bold text-slate-900">选择目标目录</h2>
            <p class="mt-1 text-sm text-slate-500">资料审核通过后会归档到此位置。</p>
          </div>

          <div class="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <div class="flex min-h-12 items-center gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50 px-3 py-2">
              <button
                type="button"
                class="shrink-0 rounded-md p-1.5 text-slate-500 transition hover:bg-white hover:text-blue-600"
                aria-label="返回根目录"
                @click="openDirectory('/')"
              >
                <Home class="h-4 w-4" />
              </button>
              <template v-for="crumb in breadcrumbs" :key="crumb.path">
                <ChevronRight class="h-3.5 w-3.5 shrink-0 text-slate-300" />
                <button
                  type="button"
                  class="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-white hover:text-blue-600"
                  @click="openDirectory(crumb.path)"
                >
                  {{ crumb.name }}
                </button>
              </template>
            </div>

            <div class="min-h-64 p-2">
              <div v-if="directoryLoading" class="flex min-h-60 flex-col items-center justify-center text-slate-500">
                <Loader2 class="h-6 w-6 animate-spin text-blue-600" />
                <p class="mt-3 text-sm">正在读取目录…</p>
              </div>
              <div v-else-if="directoryError" class="flex min-h-60 flex-col items-center justify-center px-5 text-center">
                <AlertCircle class="h-8 w-8 text-amber-500" />
                <p class="mt-3 text-sm font-medium text-slate-700">{{ directoryError }}</p>
                <button
                  type="button"
                  class="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  @click="loadDirectories"
                >
                  <RefreshCw class="h-4 w-4" />
                  重新加载
                </button>
              </div>
              <div v-else-if="!directories.length" class="flex min-h-60 flex-col items-center justify-center text-center text-slate-500">
                <Folder class="h-9 w-9 text-slate-300" />
                <p class="mt-3 text-sm">当前目录下没有子文件夹</p>
                <p class="mt-1 text-xs">可以直接选择当前目录</p>
              </div>
              <ul v-else class="space-y-1">
                <li v-for="directory in directories" :key="directory.path">
                  <button
                    type="button"
                    class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    @click="openDirectory(directory.path)"
                  >
                    <Folder class="h-5 w-5 shrink-0 fill-blue-100 text-blue-600" />
                    <span class="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
                      {{ directory.name }}
                    </span>
                    <ChevronRight class="h-4 w-4 shrink-0 text-slate-300" />
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div class="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <p class="text-xs font-medium text-blue-600">当前选择</p>
            <p class="mt-1 break-all text-sm font-semibold text-blue-950">{{ finalTargetPath }}</p>
            <p v-if="rootUploadBlocked" class="mt-2 text-xs font-medium text-amber-700">
              不能直接投稿到根目录，请先选择一个子目录，或勾选下方选项新建文件夹。
            </p>
          </div>

          <label class="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 transition hover:bg-slate-50">
            <input v-model="createNewFolder" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            <span class="flex flex-1 items-center gap-2 text-sm font-medium text-slate-700">
              <FolderPlus class="h-4 w-4 text-slate-500" />
              在此处新建文件夹
            </span>
          </label>
          <div v-if="createNewFolder" class="mt-3">
            <label for="new-folder-name" class="sr-only">新文件夹名称</label>
            <input
              id="new-folder-name"
              v-model.trim="newFolderName"
              type="text"
              maxlength="255"
              placeholder="输入新文件夹名称"
              class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              @input="submitError = ''"
            />
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
            class="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            :disabled="!canSubmit"
            @click="submitUpload"
          >
            <Loader2 v-if="isSubmitting" class="h-5 w-5 animate-spin" />
            <Upload v-else class="h-5 w-5" />
            {{ isSubmitting ? `正在上传 ${uploadProgress}%` : '提交审核' }}
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
        </aside>
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

        <div class="mt-5 flex flex-wrap items-center gap-2">
          <span class="mr-1 text-sm font-medium text-slate-500">筛选：</span>
          <button
            v-for="option in statusFilterOptions"
            :key="option.value"
            type="button"
            class="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition"
            :class="selectedStatuses.includes(option.value)
              ? option.activeClass
              : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-600'"
            @click="toggleStatusFilter(option.value)"
          >
            <span
              class="flex h-4 w-4 items-center justify-center rounded border"
              :class="selectedStatuses.includes(option.value) ? 'border-current' : 'border-slate-300'"
            >
              <Check v-if="selectedStatuses.includes(option.value)" class="h-3 w-3" />
            </span>
            {{ option.label }}
            <span class="font-normal opacity-70">{{ statusCounts[option.value] }}</span>
          </button>
        </div>

        <div v-if="historyLoading && !uploadHistory.length" class="flex min-h-40 items-center justify-center text-sm text-slate-500">
          <Loader2 class="mr-2 h-5 w-5 animate-spin text-blue-600" />
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
        <div v-else class="mt-6 grid gap-3 md:grid-cols-2">
          <article
            v-for="record in filteredUploadHistory"
            :key="record.id"
            class="rounded-xl border border-slate-200 p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-xs font-semibold text-slate-400">投稿 #{{ record.id }}</p>
                <p class="mt-1 truncate text-sm font-semibold text-slate-800" :title="record.target_path">
                  {{ record.target_path }}
                </p>
              </div>
              <span
                class="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                :class="statusMeta[record.status].className"
              >
                <component :is="statusMeta[record.status].icon" class="h-3.5 w-3.5" />
                {{ statusMeta[record.status].label }}
              </span>
            </div>
            <div class="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>{{ record.files.length }} 个文件 · {{ record.total_size_display }}</span>
              <time :datetime="record.created_at">{{ formatDate(record.created_at) }}</time>
            </div>
            <div
              v-if="record.status === 'rejected' && record.rejection_reason"
              class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs leading-5 text-red-700"
            >
              退回原因：{{ record.rejection_reason }}
            </div>
            <button
              v-if="record.status === 'pending' || record.status === 'rejected'"
              type="button"
              class="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              @click="openEditDialog(record)"
            >
              <Pencil class="h-3.5 w-3.5" />
              编辑投稿
            </button>
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
              <p class="text-xs font-semibold text-blue-600">投稿 #{{ editingRequest.id }}</p>
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
                      ? 'text-slate-500 hover:bg-white hover:text-blue-600'
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
                <span class="text-xs font-semibold text-slate-500">{{ editResultFileCount }} / 20</span>
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
                  <component :is="getFileIcon(item.file.name)" class="h-4 w-4 shrink-0 text-blue-600" />
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

              <div class="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                <div class="flex min-h-12 items-center gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50 px-3 py-2">
                  <button
                    type="button"
                    class="shrink-0 rounded-md p-1.5 text-slate-500 hover:bg-white hover:text-blue-600"
                    aria-label="返回根目录"
                    @click="openEditDirectory('/')"
                  >
                    <Home class="h-4 w-4" />
                  </button>
                  <template v-for="crumb in editBreadcrumbs" :key="crumb.path">
                    <ChevronRight class="h-3.5 w-3.5 shrink-0 text-slate-300" />
                    <button
                      type="button"
                      class="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-white hover:text-blue-600"
                      @click="openEditDirectory(crumb.path)"
                    >
                      {{ crumb.name }}
                    </button>
                  </template>
                </div>
                <div class="min-h-52 p-2">
                  <div v-if="editDirectoryLoading" class="flex min-h-48 items-center justify-center text-sm text-slate-500">
                    <Loader2 class="mr-2 h-5 w-5 animate-spin text-blue-600" />
                    正在读取目录…
                  </div>
                  <div v-else-if="editDirectoryError" class="flex min-h-48 flex-col items-center justify-center px-4 text-center">
                    <p class="text-sm text-amber-700">{{ editDirectoryError }}</p>
                    <button type="button" class="mt-3 text-sm font-semibold text-blue-600" @click="loadEditDirectories">重试</button>
                  </div>
                  <div v-else-if="!editDirectories.length" class="flex min-h-48 items-center justify-center text-sm text-slate-400">
                    当前目录下没有子文件夹
                  </div>
                  <ul v-else class="space-y-1">
                    <li v-for="directory in editDirectories" :key="directory.path">
                      <button
                        type="button"
                        class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-blue-50"
                        @click="openEditDirectory(directory.path)"
                      >
                        <Folder class="h-5 w-5 fill-blue-100 text-blue-600" />
                        <span class="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">{{ directory.name }}</span>
                        <ChevronRight class="h-4 w-4 text-slate-300" />
                      </button>
                    </li>
                  </ul>
                </div>
              </div>

              <div class="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <p class="text-xs font-medium text-blue-600">新的目标目录</p>
                <p class="mt-1 break-all text-sm font-semibold text-blue-950">{{ editFinalTargetPath }}</p>
              </div>

              <label class="mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50">
                <input v-model="editCreateNewFolder" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span class="text-sm font-medium text-slate-700">在此处新建文件夹</span>
              </label>
              <input
                v-if="editCreateNewFolder"
                v-model.trim="editNewFolderName"
                type="text"
                maxlength="255"
                placeholder="输入新文件夹名称"
                class="mt-3 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              <div class="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-sm">
                <div class="flex items-center justify-between">
                  <span class="text-slate-500">保存后文件</span>
                  <span class="font-semibold text-slate-800">{{ editResultFileCount }} 个 · {{ editTotalSizeDisplay }}</span>
                </div>
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
              {{ editSubmitting ? `保存中 ${editUploadProgress}%` : '保存修改' }}
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useMessage } from 'naive-ui'
import {
  AlertCircle,
  Archive,
  Check,
  CheckCircle2,
  ChevronRight,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderPlus,
  Home,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  X,
  XCircle,
  Clock3,
} from 'lucide-vue-next'
import { api } from '@/lib/requests'
import type { ResourceUploadRequest, ResourceUploadFile } from '@/types/api/resourceUpload'

const message = useMessage()
const MAX_FILE_COUNT = 20
const MAX_FILE_SIZE = 100 * 1024 * 1024
const ALLOWED_EXTENSIONS = new Set([
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

type UploadStatus = ResourceUploadRequest['status']

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
const directories = ref<{ name: string; path: string; modified: string | null }[]>([])
const directoryLoading = ref(false)
const directoryError = ref('')
const createNewFolder = ref(false)
const newFolderName = ref('')
const isSubmitting = ref(false)
const uploadProgress = ref(0)
const submitError = ref('')
const uploadHistory = ref<ResourceUploadRequest[]>([])
const historyLoading = ref(false)
const historyError = ref('')
const selectedStatuses = ref<UploadStatus[]>(['approved', 'pending', 'rejected'])

const editingRequest = ref<ResourceUploadRequest | null>(null)
const removedExistingFileIds = ref<number[]>([])
const editSelectedFiles = ref<SelectedFile[]>([])
const editFileError = ref('')
const editFileInput = ref<HTMLInputElement | null>(null)
const editFolderInput = ref<HTMLInputElement | null>(null)
const editCurrentPath = ref('/')
const editDirectories = ref<{ name: string; path: string; modified: string | null }[]>([])
const editDirectoryLoading = ref(false)
const editDirectoryError = ref('')
const editCreateNewFolder = ref(false)
const editNewFolderName = ref('')
const editSubmitting = ref(false)
const editUploadProgress = ref(0)
const editSubmitError = ref('')

const acceptExtensions = [...ALLOWED_EXTENSIONS].join(',')
const totalSize = computed(() => selectedFiles.value.reduce((sum, item) => sum + item.file.size, 0))
const breadcrumbs = computed(() => {
  const parts = currentPath.value.split('/').filter(Boolean)
  return parts.map((name, index) => ({
    name,
    path: `/${parts.slice(0, index + 1).join('/')}`,
  }))
})
const finalTargetPath = computed(() => {
  if (!createNewFolder.value || !newFolderName.value) return currentPath.value
  return `${currentPath.value === '/' ? '' : currentPath.value}/${newFolderName.value}`
})
const rootUploadBlocked = computed(
  () => currentPath.value === '/' && (!createNewFolder.value || !newFolderName.value),
)
const canSubmit = computed(
  () => !isSubmitting.value && selectedFiles.value.length > 0 && !rootUploadBlocked.value,
)
const statusPriority: Record<UploadStatus, number> = {
  rejected: 0,
  pending: 1,
  approved: 2,
}
const filteredUploadHistory = computed(() =>
  uploadHistory.value
    .filter((record) => selectedStatuses.value.includes(record.status))
    .sort((a, b) =>
      statusPriority[a.status] - statusPriority[b.status]
      || new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    ),
)
const statusCounts = computed<Record<UploadStatus, number>>(() => ({
  approved: uploadHistory.value.filter((record) => record.status === 'approved').length,
  pending: uploadHistory.value.filter((record) => record.status === 'pending').length,
  rejected: uploadHistory.value.filter((record) => record.status === 'rejected').length,
}))
const statusFilterOptions: {
  value: UploadStatus
  label: string
  activeClass: string
}[] = [
  { value: 'approved', label: '已通过', activeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  { value: 'pending', label: '待审核', activeClass: 'border-amber-200 bg-amber-50 text-amber-700' },
  { value: 'rejected', label: '已退回', activeClass: 'border-red-200 bg-red-50 text-red-700' },
]

const editBreadcrumbs = computed(() => {
  const parts = editCurrentPath.value.split('/').filter(Boolean)
  return parts.map((name, index) => ({
    name,
    path: `/${parts.slice(0, index + 1).join('/')}`,
  }))
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
    && editResultFileCount.value <= MAX_FILE_COUNT
    && !editFolderNameInvalid.value
    && !editRootUploadBlocked.value,
)

const statusMeta = {
  pending: {
    label: '待审核',
    icon: Clock3,
    className: 'bg-amber-50 text-amber-700',
  },
  approved: {
    label: '已通过',
    icon: CheckCircle2,
    className: 'bg-emerald-50 text-emerald-700',
  },
  rejected: {
    label: '已退回',
    icon: XCircle,
    className: 'bg-red-50 text-red-700',
  },
}

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}
const editTotalSizeDisplay = computed(() => formatBytes(editTotalSize.value))

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))

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
  const existing = new Set(next.map((item) => item.relativePath))
  const rejected: string[] = []

  for (const incomingItem of incoming) {
    const file = incomingItem.file
    const relativePath = (incomingItem.relativePath || file.name).replaceAll('\\', '/').replace(/^\/+/, '')
    if (next.length >= MAX_FILE_COUNT) {
      rejected.push(`每次最多选择 ${MAX_FILE_COUNT} 个文件`)
      break
    }
    if (file.size > MAX_FILE_SIZE) {
      rejected.push(`${file.name} 超过 100 MB`)
      continue
    }
    if (!ALLOWED_EXTENSIONS.has(getExtension(file.name))) {
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
}

const handleFileInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || []).map((file) => ({
    file,
    relativePath: (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name,
  }))
  addFiles(files)
  input.value = ''
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
      const withEntry = item as DataTransferItem & { webkitGetAsEntry?: () => FileSystemEntryLike | null }
      return withEntry.webkitGetAsEntry?.() || null
    })
    .filter((entry): entry is FileSystemEntryLike => Boolean(entry))

  if (entries.length) {
    const nested = await Promise.all(entries.map((entry) => readEntry(entry)))
    addFiles(nested.flat())
    return
  }
  addFiles(Array.from(event.dataTransfer?.files || []).map((file) => ({ file, relativePath: file.name })))
}

const handleDragLeave = (event: DragEvent) => {
  const currentTarget = event.currentTarget as HTMLElement
  const relatedTarget = event.relatedTarget as Node | null
  if (!relatedTarget || !currentTarget.contains(relatedTarget)) isDragging.value = false
}

const removeFile = (id: string) => {
  selectedFiles.value = selectedFiles.value.filter((item) => item.id !== id)
  fileError.value = ''
}

const clearFiles = () => {
  selectedFiles.value = []
  fileError.value = ''
}

const toggleStatusFilter = (status: UploadStatus) => {
  selectedStatuses.value = selectedStatuses.value.includes(status)
    ? selectedStatuses.value.filter((item) => item !== status)
    : [...selectedStatuses.value, status]
}

const resetEditDialog = () => {
  editingRequest.value = null
  removedExistingFileIds.value = []
  editSelectedFiles.value = []
  editFileError.value = ''
  editDirectoryError.value = ''
  editCreateNewFolder.value = false
  editNewFolderName.value = ''
  editSubmitError.value = ''
  editUploadProgress.value = 0
}

const closeEditDialog = () => {
  if (!editSubmitting.value) resetEditDialog()
}

const loadEditDirectories = async () => {
  editDirectoryLoading.value = true
  editDirectoryError.value = ''
  try {
    const response = await api.get({
      url: '/api/upload/directories/',
      query: { path: editCurrentPath.value },
    })
    if (response.status !== 200) {
      editDirectoryError.value = getErrorMessage(response.errors, '目录缓存暂时不可用，请稍后重试')
      return
    }
    editCurrentPath.value = response.content.path
    editDirectories.value = response.content.directories
  } catch {
    editDirectoryError.value = '暂时无法读取本地目录缓存，请稍后重试'
  } finally {
    editDirectoryLoading.value = false
  }
}

const openEditDirectory = async (path: string) => {
  if (editDirectoryLoading.value || path === editCurrentPath.value) return
  editCurrentPath.value = path
  editSubmitError.value = ''
  await loadEditDirectories()
}

const openEditDialog = async (record: ResourceUploadRequest) => {
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
  await loadEditDirectories()
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
    if (keptExistingFileCount.value + next.length >= MAX_FILE_COUNT) {
      rejected.push(`每次最多保留和上传 ${MAX_FILE_COUNT} 个文件`)
      break
    }
    if (file.size > MAX_FILE_SIZE) {
      rejected.push(`${file.name} 超过 100 MB`)
      continue
    }
    if (!ALLOWED_EXTENSIONS.has(getExtension(file.name))) {
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

const loadDirectories = async () => {
  directoryLoading.value = true
  directoryError.value = ''
  try {
    const response = await api.get({
      url: '/api/upload/directories/',
      query: { path: currentPath.value },
    })
    if (response.status !== 200) {
      directoryError.value = getErrorMessage(response.errors, '目录缓存暂时不可用，请稍后重试')
      return
    }
    currentPath.value = response.content.path
    directories.value = response.content.directories
  } catch {
    directoryError.value = '暂时无法读取本地目录缓存，请稍后重试'
  } finally {
    directoryLoading.value = false
  }
}

const openDirectory = async (path: string) => {
  if (directoryLoading.value || path === currentPath.value) return
  currentPath.value = path
  createNewFolder.value = false
  newFolderName.value = ''
  await loadDirectories()
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

const submitUpload = async () => {
  submitError.value = ''
  if (!selectedFiles.value.length) {
    submitError.value = '请先选择要投稿的文件'
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
  const existingRequestIds = new Set(uploadHistory.value.map((item) => item.id))
  try {
    const response = await api.post({
      url: '/api/upload/request/',
      query: formData,
      onUploadProgress: ({ loaded, total }) => {
        if (total) uploadProgress.value = Math.min(99, Math.round((loaded / total) * 100))
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
    uploadHistory.value = [response.content.upload_request, ...uploadHistory.value]
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
      message.success(`投稿 #${recoveredRequest.id} 已提交，请等待管理员审核`)
      return
    }
    submitError.value = error instanceof Error
      ? `上传未完成：${error.message}，请稍后重试`
      : '上传未完成，请稍后重试'
  } finally {
    isSubmitting.value = false
  }
}

const saveEdit = async () => {
  if (!editingRequest.value) return
  editSubmitError.value = ''
  if (!editResultFileCount.value) {
    editSubmitError.value = '请至少保留或新上传一个文件'
    return
  }
  if (editResultFileCount.value > MAX_FILE_COUNT) {
    editSubmitError.value = `每次最多保留和上传 ${MAX_FILE_COUNT} 个文件`
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
  try {
    const response = await api.put({
      url: '/api/upload/request/:requestId/',
      params: { requestId },
      query: formData,
      onUploadProgress: ({ loaded, total }) => {
        if (total) editUploadProgress.value = Math.min(99, Math.round((loaded / total) * 100))
      },
    })
    if (response.status !== 200) {
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
  }
}

onMounted(() => {
  loadDirectories()
  loadUploadHistory()
})
</script>
