<template>
  <nav class="flex mb-5" aria-label="Breadcrumb">
    <ol class="inline-flex items-center space-x-1 md:space-x-3">
      <li class="inline-flex items-center">
        <router-link to="/disk" class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
          <House class="w-4 h-4 mr-1" />
          主目录
        </router-link>
      </li>
      <li v-for="(segment, index) in pathSegments" :key="index" aria-current="page">
        <div class="flex items-center">
          <ChevronRight class="w-4 h-4 text-gray-500" />
          <router-link :to="`/disk${getPathUpToIndex(index)}`"
            class="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2">
            {{ segment }}
          </router-link>
        </div>
      </li>
    </ol>
  </nav>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { ChevronRight, House } from 'lucide-vue-next';

const { path } = defineProps<{
  path: string // split by '/'
}>()

const decodedPath = computed(()=>decodeURIComponent(path))

const pathSegments = computed(() => {
  return decodedPath.value.split('/').filter(segment => segment !== '')
})

const getPathUpToIndex = (index: number) => {
  return '/' + pathSegments.value.slice(0, index + 1).join('/')
}
</script>
