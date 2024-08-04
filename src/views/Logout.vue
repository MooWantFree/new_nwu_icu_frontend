<template>
  <h1 v-if="loading">请稍后，正在退出登录...</h1>
  <h1 v-else>您已成功退出登录，期待下次再会，将会在{{ countdownSeconds }}秒后跳转回主页</h1>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, ref} from "vue";
import {useRouter} from "vue-router";

const router = useRouter()
const loading = ref(true)
const countdownSeconds = ref(5)
const countdownRef = ref(null)
const logoutReq = async () => {
  const resp = await fetch("/api/user/logout/", {
    method: "POST",
  })
  if (!resp.ok) {
    // TODO:
    return
  }
  const data = await resp.json()
}
onMounted(async () => {
  await logoutReq()
  loading.value = false
  countdownRef.value = setInterval(() => {
    countdownSeconds.value -= 1
    if (countdownSeconds.value <= 0) {
      router.push('/')
      clearInterval(countdownRef.value)
    }
  }, 1000)
})
onUnmounted(() => {
  clearInterval(countdownRef.value)
})
</script>