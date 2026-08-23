<template>
  <div class="flex flex-col h-full bg-gray-50 p-4 w-3/5 mx-auto">
    <DiskHeader :rawHeader :path="diskPath" />

    <div v-if="loading" class="flex-grow flex items-center justify-center">
      <div class="flex flex-col items-center justify-center">
        <div class="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p class="text-gray-600 font-medium">加载中...</p>
      </div>
    </div>

    <div v-else class="flex-grow">
      <DiskFolder v-if="pathType === 'folder' && folderData" :data="folderData"
        class="bg-white rounded-lg shadow p-4 mb-4" />
      <DiskFile v-else-if="pathType === 'file' && metaData" :data="metaData" class="bg-white rounded-lg shadow p-4" />

      <div v-if="pathType === 'folder' && folderData && folderData.total > perPage" class="mt-4 flex justify-center">
        <n-pagination v-model:page="page" :page-count="Math.ceil(folderData.total / perPage)" :page-size="perPage"
          @update:page="handlePageChange" />
      </div>
    </div>

    <div v-if="hasReadme" class="mt-4 bg-white rounded-lg shadow p-6 prose max-w-none">
      <div v-html="readme" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import DiskHeader from '@/components/disk/DiskHeader.vue'
import DiskFolder from '@/components/disk/diskFolder/DiskFolder.vue'
import DiskFile from '@/components/disk/diskFile/DiskFile.vue'
import { Public } from '@/types/api/disk/public'
import { FsGet, DirList } from '@/types/api/disk/fs'
import { Me } from '@/types/api/disk/auth'
import { sanitizeMarkdown } from '@/lib/richText'

const ALIST_URL = import.meta.env.VITE_RESOURCE_SERVICE_URL || window.location.origin

const route = useRoute()
const message = useMessage()
const diskPath = computed(() => route.path.replace(/^\/disk/, ''))
const judgePathType = (path: string): 'file' | 'folder' =>
  path.split('/').at(-1)?.includes('.') ? 'file' : 'folder'

const siteSettings = ref<Public['data'] | null>(null)
const meSettings = ref<Me['data'] | null>(null)
const pathType = ref<'file' | 'folder'>(judgePathType(route.path))
const loading = ref(true)
const page = ref(1)
const perPage = 100
const metaData = ref<FsGet['data'] | null>(null)
const folderData = ref<DirList['data'] | null>(null)
const hasReadme = ref(false)
const readme = ref('')
const rawHeader = ref('')
let loadVersion = 0

const decodeDiskPath = (): string => {
  try {
    return decodeURIComponent(diskPath.value)
  } catch {
    throw new Error('路径编码不合法')
  }
}

const parseJsonResponse = async <T,>(response: Response): Promise<T> => {
  if (!response.ok) throw new Error(`请求失败（HTTP ${response.status}）`)
  return response.json() as Promise<T>
}

const settingsPromise = (async () => {
  try {
    const [meResp, settingsResp] = await Promise.all([
      fetch('/api/disk/me'),
      fetch('/api/disk/public/settings'),
    ])
    const [meData, settingsData] = await Promise.all([
      parseJsonResponse<Me>(meResp),
      parseJsonResponse<Public>(settingsResp),
    ])
    if (settingsData.code !== 200 || meData.code !== 200) {
      throw new Error(settingsData.message || meData.message || '读取网盘设置失败')
    }
    siteSettings.value = settingsData.data
    meSettings.value = meData.data
  } catch (error) {
    message.error(error instanceof Error ? error.message : '读取网盘设置失败')
  }
})()

const loadFolderContents = async (version: number): Promise<boolean> => {
  const dirResp = await fetch('/api/disk/fs/list', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({ path: decodeDiskPath(), page: page.value, per_page: perPage }),
  })
  const dirData = await parseJsonResponse<DirList>(dirResp)
  if (dirData.code !== 200) throw new Error(dirData.message)
  if (version !== loadVersion) return false
  folderData.value = dirData.data
  return true
}

const loadPath = async (): Promise<void> => {
  const version = ++loadVersion
  loading.value = true
  readme.value = ''
  rawHeader.value = ''
  hasReadme.value = false
  folderData.value = null
  metaData.value = null

  try {
    const fsResp = await fetch('/api/disk/fs/get', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({ path: decodeDiskPath() }),
    })
    const fsData = await parseJsonResponse<FsGet>(fsResp)
    if (fsData.code !== 200) throw new Error(fsData.message)
    if (version !== loadVersion) return

    metaData.value = fsData.data
    rawHeader.value = await sanitizeMarkdown(fsData.data.header)
    readme.value = fsData.data.readme ? await sanitizeMarkdown(fsData.data.readme) : ''
    hasReadme.value = Boolean(readme.value)
    pathType.value = fsData.data.is_dir ? 'folder' : 'file'
    if (pathType.value === 'file') return

    const loaded = await loadFolderContents(version)
    if (!loaded) return
    await settingsPromise
    if (version !== loadVersion) return

    const loadedFolder = folderData.value as DirList['data'] | null
    const hasReadmeFile = loadedFolder?.content.some(
      (item) => item.name.toLowerCase() === 'readme.md',
    )
    if (hasReadmeFile && meSettings.value?.base_path) {
      const readmePath = `/p${meSettings.value.base_path}/${diskPath.value.replace(/^\/+/, '')}/readme.md`
      const readmeUrl = new URL(readmePath, ALIST_URL)
      readmeUrl.searchParams.set('t', String(Date.now()))
      const readmeResp = await fetch(readmeUrl)
      if (!readmeResp.ok) throw new Error('读取 README.md 失败')
      const readmeData = await readmeResp.text()
      if (version !== loadVersion) return
      readme.value = await sanitizeMarkdown(readmeData)
      hasReadme.value = Boolean(readme.value)
    }
  } catch (error) {
    if (version === loadVersion) {
      message.error(error instanceof Error ? error.message : '网盘内容加载失败')
    }
  } finally {
    if (version === loadVersion) loading.value = false
  }
}

const handlePageChange = (newPage: number) => {
  page.value = newPage
}

watch(diskPath, async () => {
  pathType.value = judgePathType(diskPath.value)
  page.value = 1
  await loadPath()
}, { immediate: true })

watch(page, async (newPage, oldPage) => {
  if (newPage !== oldPage && pathType.value === 'folder') await loadPath()
})
</script>
