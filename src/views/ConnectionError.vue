<template>
  <main class="mx-auto max-w-xl px-4 py-16">
    <LoadError message="暂时无法连接，请重试" :busy="busy" @retry="retry">
      <RouterLink to="/" class="rounded-md px-4 py-2 text-sm text-zinc-600 underline">返回首页</RouterLink>
    </LoadError>
  </main>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { resolveLoginContext } from '@/lib/loginRedirect'
import LoadError from '@/components/common/LoadError.vue'

const route = useRoute()
const router = useRouter()
const busy = ref(false)
const destination = computed(() => resolveLoginContext(router, route.query.redirect, undefined).redirect)
async function retry() {
  if (busy.value) return
  busy.value = true
  try { await router.replace(destination.value) }
  finally { busy.value = false }
}
</script>
