<template>
  <div class="counter">
    <n-statistic label="本站已经存活了" tabular-nums>
      <n-number-animation ref="numberAnimationInstRef" :from="0" :to="daysAlive" />
      <template #suffix>
        天
      </template>
    </n-statistic>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NumberAnimationInst } from 'naive-ui'

const numberAnimationInstRef = ref<NumberAnimationInst | null>(null)

// 计算从2019-06-08到今天的天数
const calculateDaysAlive = (): number => {
  const startDate = new Date('2019-06-08')
  const diffTime = Math.abs(new Date().getTime() - startDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

const daysAlive = ref(calculateDaysAlive())

onMounted(() => {
  numberAnimationInstRef.value?.play()
})
</script>

<style scoped>
.counter {
  margin-top: 0 !important;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50vh; /* 可选：如果需要整个视口高度居中 */
}
</style>
