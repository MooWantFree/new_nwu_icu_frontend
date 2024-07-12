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

<script lang="ts">
import {defineComponent, onMounted, ref} from 'vue'
import {NumberAnimationInst} from 'naive-ui'

export default defineComponent({
  setup () {
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

    return {
      numberAnimationInstRef,
      daysAlive
    }
  }
})
</script>

<style scoped>
.counter {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh; /* 可选：如果需要整个视口高度居中 */
}
</style>
