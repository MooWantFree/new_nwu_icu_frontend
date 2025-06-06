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

<script lang="tsx" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import DiskHeader from '@/components/disk/DiskHeader.vue';
import { useMessage } from 'naive-ui';
import { Public } from '@/types/api/disk/public';
import { FsGet, DirList } from '@/types/api/disk/fs';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import DiskFolder from '@/components/disk/diskFolder/DiskFolder.vue';
import DiskFile from '@/components/disk/diskFile/DiskFile.vue';
import { Me } from '@/types/api/disk/auth';

const ALIST_URL = "https://resour.nwu.icu"

const route = useRoute();
const message = useMessage()
const diskPath = computed(() => route.path.replace(/^\/disk/, ''));
const judgePathType = (path: string) => path.split('/').at(-1)?.includes('.') ? 'file' : 'folder';
const initPathType = judgePathType(route.path);
const purify = DOMPurify(window)

const siteSettings = ref<Public['data'] | null>(null)
const meSettings = ref<Me['data'] | null>(null)
const pathType = ref<'file' | 'folder'>(initPathType); // Just for skeleton
const loading = ref(true);
const page = ref(1);
const perPage = ref(100);
const metaData = ref<FsGet['data'] | null>(null);
const folderData = ref<DirList['data'] | null>(null);
const hasReadme = ref(false);
const readme = ref<string>("");
const rawHeader = ref<string>("");

// Get site settings on mount
onMounted(async () => {
  const apiMe = fetch('/api/disk/me')
  const apiSettings = fetch('/api/disk/public/settings')
  const [meResp, settingsResp] = await Promise.all([apiMe, apiSettings])
  const meData = await meResp.json() as Me
  const settingsData = await settingsResp.json() as Public

  if (settingsData.code !== 200 || meData.code !== 200) {
    message.error(settingsData.message)
    return
  }

  siteSettings.value = settingsData.data
  meSettings.value = meData.data
})

const loadFolderContents = async () => {
  loading.value = true;

  const dirResp = await fetch('/api/disk/fs/list', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json; charset=UTF-8'
    },
    body: JSON.stringify({
      path: decodeURIComponent(diskPath.value),
      page: page.value,
      per_page: perPage.value
    })
  })
  const dirData = await dirResp.json() as DirList;

  if (dirData.code !== 200) {
    message.error(dirData.message);
    return
  }

  folderData.value = dirData.data;
  loading.value = false;
}

const handlePageChange = (newPage: number) => {
  page.value = newPage;
}

// Update on path change
watch(
  diskPath,
  async () => {
    pathType.value = judgePathType(diskPath.value);
    loading.value = true;
    readme.value = "";
    page.value = 1;

    // Loads the API
    const fsResp = await fetch('/api/disk/fs/get', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json; charset=UTF-8'
      },
      body: JSON.stringify({
        path: decodeURIComponent(diskPath.value),
      })
    })
    const fsData = await fsResp.json() as FsGet;

    if (fsData.code !== 200) {
      // TODO: Handle 404
      message.error(fsData.message)
      return
    }

    metaData.value = fsData.data;
    rawHeader.value = purify.sanitize(await marked.parse(fsData.data.header));
    hasReadme.value = !!fsData.data.readme;
    readme.value = fsData.data.readme ? purify.sanitize(await marked.parse(fsData.data.readme)) : "";


    pathType.value = fsData.data.is_dir ? 'folder' : 'file';
    if (pathType.value === 'file') {
      loading.value = false;
      return
    }

    // Handle folder
    await loadFolderContents();

    // FIXME: If meSettings is null, it will be error. How to wait for meSettings to be loaded?
    if (folderData.value?.content.find(it => it.name.toLowerCase() === 'readme.md')) {
      const readmeFilePath = new URL(`/p${meSettings.value?.base_path}/${diskPath.value}/readme.md?t=${new Date().getTime()}`, ALIST_URL)
      const readmeResp = await fetch(readmeFilePath)
      const readmeData = await readmeResp.text()
      if (!readmeData) {
        message.error('读取 README.md 失败')
        return
      }
      readme.value = purify.sanitize(await marked.parse(readmeData));
      hasReadme.value = true;
    }
    return
  },
  { immediate: true }
)

watch(
  page,
  async () => {
    if (pathType.value === 'folder') {
      await loadFolderContents();
    }
  }
)
</script>