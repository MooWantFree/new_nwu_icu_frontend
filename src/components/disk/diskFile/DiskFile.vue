<template>
  <div class="flex flex-col items-center justify-center p-8 bg-white min-h-[50vh]">
    <div class="text-center">
      <File class="h-32 w-32 text-blue-500 mx-auto mb-6" />

      <!-- File Name -->
      <h1 class="text-2xl font-semibold text-gray-800 mb-2">{{ file.name }}</h1>

      <!-- File Metadata -->
      <p class="text-sm text-gray-500 mb-8">
        <span>{{ formatSize(file.size) }}</span>
        <span class="mx-1">·</span>
        <span>{{ formatDate(file.updated_at) }}</span>
      </p>

      <!-- Action Buttons -->
      <div class="flex space-x-4 justify-center">
        <button 
          @click="copyLink"
          class="px-6 py-3 bg-purple-100 text-purple-700 font-medium rounded-lg hover:bg-purple-200 transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
        >
          Copy link
        </button>
        <button 
          @click="downloadFile"
          class="px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Download
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { FsGet } from '@/types/api/disk/fs'; // Assuming this type is still relevant
import { File } from 'lucide-vue-next'

const props = defineProps<{ data: FsGet['data'] }>()

// Placeholder for file data structure. Adapt based on your actual FsGet['data'] structure.
const file = computed(() => {
  // props.data directly contains the file information based on FsGet['data'] type
  return {
    name: props.data.name || 'Unknown File.ext',
    size: props.data.size || 0, // in bytes
    updated_at: props.data.modified || new Date().toISOString(), // Use 'modified' field for date
    download_url: props.data.raw_url || '#', // Use 'raw_url' for download link
    // Construct a share_url. Using 'sign' or 'hashinfo' for a unique identifier.
    share_url: window.location.href,
  };
});

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString(undefined, options).replace(/\//g, '-');
};

const copyLink = () => {
  navigator.clipboard.writeText(file.value.share_url)
    .then(() => {
      alert('Link copied to clipboard!'); // Replace with a more sophisticated notification if available
    })
    .catch(err => {
      console.error('Failed to copy link: ', err);
      alert('Failed to copy link.');
    });
};

const downloadFile = () => {
  if (file.value.download_url && file.value.download_url !== '#') {
    window.open(file.value.download_url, '_blank');
  } else {
    alert('Download link not available.');
  }
};

</script>

<style scoped>
/* You can add component-specific styles here if needed, though Tailwind is preferred */
</style>