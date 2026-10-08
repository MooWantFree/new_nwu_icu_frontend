<template>
  <button
    type="button"
    aria-label="刷新验证码"
    :aria-busy="busy"
    :disabled="busy || disabled"
    class="relative h-10 flex-shrink-0 cursor-pointer overflow-hidden border focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-wait"
    :class="appearance === 'shadcn' ? 'focus:ring-zinc-400' : 'focus:ring-blue-500'"
    @click="refresh"
  >
    <img
      v-if="imageUrl && !loading && !imageFailed"
      :key="imageVersion"
      ref="imageElement"
      :src="imageUrl"
      alt=""
      class="h-full w-full"
      :class="[imageFit === 'cover' ? 'object-cover' : 'object-contain', { invisible: !imageLoaded }]"
      @load="handleLoad"
      @error="handleError"
    />
    <span
      v-if="busy"
      role="status"
      aria-label="正在刷新"
      class="absolute inset-0 flex items-center justify-center"
    >
      <LoaderCircle aria-hidden="true" class="h-5 w-5 animate-spin" :class="appearance === 'shadcn' ? 'text-zinc-500' : 'text-blue-700'" />
    </span>
    <span v-else-if="!imageLoaded" class="absolute inset-0 flex items-center justify-center">
      <RefreshCw aria-hidden="true" class="h-5 w-5" :class="appearance === 'shadcn' ? 'text-zinc-500' : 'text-gray-500'" />
    </span>
    <slot v-else />
  </button>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { LoaderCircle, RefreshCw } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  imageUrl: string
  loading?: boolean
  imageFit?: 'cover' | 'contain'
  appearance?: 'default' | 'shadcn'
  disabled?: boolean
}>(), {
  loading: false,
  imageFit: 'contain',
  appearance: 'default',
  disabled: false,
})

const emit = defineEmits<{
  (event: 'refresh'): void
  (event: 'error'): void
}>()

const imageElement = ref<HTMLImageElement | null>(null)
const imageLoaded = ref(false)
const imageFailed = ref(false)
const imageVersion = ref(0)
const busy = computed(() => props.loading || Boolean(props.imageUrl && !imageLoaded.value && !imageFailed.value))

watch(() => [props.imageUrl, props.loading], () => {
  imageLoaded.value = false
  imageFailed.value = false
  imageVersion.value += 1
}, { immediate: true, flush: 'sync' })

function isCurrentImage(event: Event) {
  return !props.loading && event.target === imageElement.value
    && imageElement.value?.getAttribute('src') === props.imageUrl
}

function handleLoad(event: Event) {
  if (!isCurrentImage(event)) return
  imageLoaded.value = true
}

function handleError(event: Event) {
  if (!isCurrentImage(event) || imageFailed.value) return
  imageFailed.value = true
  imageLoaded.value = false
  emit('error')
}

function refresh() {
  if (!busy.value && !props.disabled) emit('refresh')
}
</script>
