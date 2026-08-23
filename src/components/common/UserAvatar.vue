<template>
  <img :src="source" :alt="alt" v-bind="$attrs" @error="handleError" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  createAvatarPlaceholderDataUrl,
  createIdenticonDataUrl,
} from '@/lib/identicon'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    avatar?: string | null
    uuid?: string | null
    hasAvatar?: boolean
    alt?: string
  }>(),
  {
    avatar: null,
    uuid: null,
    hasAvatar: false,
    alt: '用户头像',
  }
)

const uploadedAvatarFailed = ref(false)

watch(
  () => [props.avatar, props.hasAvatar],
  () => {
    uploadedAvatarFailed.value = false
  }
)

const fallbackSource = computed(() =>
  props.uuid
    ? createIdenticonDataUrl(props.uuid)
    : createAvatarPlaceholderDataUrl()
)

const source = computed(() => {
  if (props.hasAvatar && props.avatar && !uploadedAvatarFailed.value) {
    return `/api/download/${props.avatar}/`
  }
  return fallbackSource.value
})

function handleError() {
  if (props.hasAvatar && props.avatar && !uploadedAvatarFailed.value) {
    uploadedAvatarFailed.value = true
  }
}
</script>
