<template>
<div class="overflow-x-auto">
  <table class="w-full table-auto">
    <thead>
      <tr class="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
        <th class="px-4 py-2 cursor-pointer" @click="sortBy('name')">
          名称
          <span v-if="sortColumn === 'name'" class="ml-1">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
        </th>
        <th class="px-4 py-2 cursor-pointer" @click="sortBy('size')">
          大小
          <span v-if="sortColumn === 'size'" class="ml-1">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
        </th>
        <th class="px-4 py-2 cursor-pointer" @click="sortBy('modified')">
          修改时间
          <span v-if="sortColumn === 'modified'" class="ml-1">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="item in sortedContent" :key="item.name" class="border-b hover:bg-gray-50">
        <td class="px-4 py-3">
          <div class="flex items-center">
            <div class="mr-2">
              <Folder v-if="item.is_dir" class="w-5 h-5 text-yellow-500" />
              <File v-else class="w-5 h-5 text-blue-500" />
            </div>
            <router-link 
              :to="handleLink(item)"
              class="text-blue-600 hover:underline">
              {{ item.name }}
            </router-link>
          </div>
        </td>
        <td class="px-4 py-3 text-sm text-gray-600">
          {{ item.is_dir ? '-' : formatFileSize(item.size) }}
        </td>
        <td class="px-4 py-3 text-sm text-gray-600">
          {{ new Date(item.modified).toLocaleString() }}
        </td>
      </tr>
    </tbody>
  </table>
</div>

</template>

<script lang="ts" setup>
import { DirList } from '@/types/api/disk/fs';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { Folder, File } from 'lucide-vue-next'

const $route = useRoute();
const sortColumn = ref('name');
const sortDirection = ref('asc');

function formatFileSize(size: number) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(2)} ${units[i]}`;
}

// https://stackoverflow.com/questions/29855098/is-there-a-built-in-javascript-function-similar-to-os-path-join
const buildPath = (...args: string[]) => {
  return args.map((part, i) => {
    if (i === 0) {
      return part.trim().replace(/[\/]*$/g, '')
    } else {
      return part.trim().replace(/(^[\/]*|[\/]*$)/g, '')
    }
  }).filter(x=>x.length).join('/')
}

function handleLink(item: DirList['data']['content'][number]) {
  const diskPath = $route.path.replace(/^\/disk/, '')
  if (item.is_dir) {
    return buildPath('/disk', diskPath, item.name)
  } else {
    return buildPath('/disk', diskPath, item.name)
  }
}

const props = defineProps<{ data: DirList['data'] }>();

function sortBy(column: string) {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn.value = column;
    sortDirection.value = 'asc';
  }
}

const sortedContent = computed(() => {
  if (!props.data.content) return [];
  
  // Always put directories first
  const dirs = props.data.content.filter(item => item.is_dir);
  const files = props.data.content.filter(item => !item.is_dir);
  
  // Sort each array separately
  const sortFn = (a: DirList['data']['content'][number], b: DirList['data']['content'][number]) => {
    let comparison = 0;
    
    if (sortColumn.value === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortColumn.value === 'size') {
      comparison = a.size - b.size;
    } else if (sortColumn.value === 'modified') {
      comparison = new Date(a.modified).getTime() - new Date(b.modified).getTime();
    }
    
    return sortDirection.value === 'asc' ? comparison : -comparison;
  };
  
  return [...dirs.sort(sortFn), ...files.sort(sortFn)];
});
</script>