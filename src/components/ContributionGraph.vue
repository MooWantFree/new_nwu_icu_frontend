<template>
  <div class="max-w-4xl mx-auto p-4">
<!--    <h2 class="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">-->
<!--      {{ totalContributions }} contributions in the last year-->
<!--    </h2>-->

    <div class="relative overflow-x-auto" role="grid" aria-label="Contribution graph">
<!--      <div class="flex text-xs text-gray-500 mb-1 justify-between">-->
<!--        <div v-for="month in months" :key="month" class="w-8 text-center">-->
<!--          {{ month }}-->
<!--        </div>-->
<!--      </div>-->

      <div class="flex">
        <!-- Days of week -->
<!--        <div class="flex flex-col text-xs text-gray-500 mr-2 space-y-[11.5px] pt-2">-->
<!--          <span>Mon</span>-->
<!--          <span>Wed</span>-->
<!--          <span>Fri</span>-->
<!--        </div>-->

        <!-- Contribution grid -->
        <div class="grid grid-cols-52 gap-[3px]">
          <div
            v-for="(week, weekIndex) in contributionData"
            :key="weekIndex"
            class="grid grid-rows-7 gap-[3px]"
          >
            <div
              v-for="(day, dayIndex) in week"
              :key="`${weekIndex}-${dayIndex}`"
              class="w-[10px] h-[10px] rounded-sm transition-colors duration-200"
              :class="getContributionClass(day.count)"
              @mouseenter="showTooltip(day, $event)"
              @mouseleave="hideTooltip"
              role="gridcell"
              :aria-label="`${day.count} contributions on ${day.date}`"
            ></div>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="flex items-center justify-end mt-4 text-xs text-gray-500 space-x-2">
        <span>Less</span>
        <div class="flex space-x-[3px]">
          <div
            v-for="level in 5"
            :key="level"
            class="w-[10px] h-[10px] rounded-sm"
            :class="getContributionClass(level - 1)"
          ></div>
        </div>
        <span>More</span>
      </div>

      <!-- Tooltip -->
      <div
        v-if="tooltip.show"
        class="fixed bg-gray-900 text-white px-3 py-2 rounded-md text-xs"
        :style="{ top: `${tooltip.y}px`, left: `${tooltip.x}px` }"
        role="tooltip"
      >
        {{ tooltip.count }} contributions on {{ tooltip.date }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface DayContribution {
  date: string;
  count: number;
}

// Generate sample contribution data
const generateContributionData = (): DayContribution[][] => {
  const weeks = 52
  const days = 7
  const data: DayContribution[][] = []

  const today = new Date()
  let date = new Date(today.getFullYear(), 0, 1)
  date.setFullYear(date.getFullYear() - 1)
  const asciiPicture = [
    [20, 0, 0, 20, 0, 0, 20, 20, 20, 20, 0, 0, 20, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 20, 20, 20, 20, 0, 0, 0, 0, 20, 0, 0, 20, 0, 0, 20, 0, 20, 0, 20, 0, 0, 20, 0, 0, 20, 0, 0, 0],
    [20, 0, 0, 20, 0, 0, 20, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 20, 0, 0, 20, 0, 0, 0, 0, 20, 20, 0, 20, 0, 0, 20, 0, 20, 0, 20, 0, 0, 20, 0, 0, 20, 0, 0, 0],
    [20, 0, 0, 20, 0, 0, 20, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 20, 0, 0, 20, 0, 0, 0, 0, 20, 20, 0, 20, 0, 0, 20, 0, 20, 0, 20, 0, 0, 20, 0, 0, 20, 0, 0, 0],
    [20, 20, 20, 20, 0, 0, 20, 20, 20, 20, 0, 0, 20, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 20, 0, 0, 20, 0, 0, 0, 0, 20, 20, 0, 20, 0, 0, 20, 0, 20, 0, 20, 0, 0, 20, 0, 0, 20, 0, 0, 0],
    [20, 0, 0, 20, 0, 0, 20, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 20, 0, 0, 20, 0, 0, 0, 0, 20, 0, 20, 20, 0, 0, 20, 20, 0, 20, 20, 0, 0, 20, 0, 0, 20, 0, 0, 0],
    [20, 0, 0, 20, 0, 0, 20, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 20, 0, 0, 20, 0, 0, 20, 0, 20, 0, 20, 20, 0, 0, 20, 20, 0, 20, 20, 0, 0, 20, 0, 0, 20, 0, 0, 0],
    [20, 0, 0, 20, 0, 0, 20, 20, 20, 20, 0, 0, 20, 20, 20, 20, 0, 0, 20, 20, 20, 20, 0, 0, 20, 20, 20, 20, 0, 20, 0, 0, 20, 0, 20, 20, 0, 0, 20, 0, 0, 0, 20, 0, 0, 20, 20, 20, 20, 0, 0, 0]]
  for (let w = 0; w < weeks; w++) {
    const week: DayContribution[] = []
    for (let d = 0; d < days; d++) {
      const count = asciiPicture[d][w] + Math.floor(Math.random() * 5)

      week.push({
        date: new Date(date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        count,
      })
      date.setDate(date.getDate() + 1)
    }
    data.push(week)
  }

  return data
}

const contributionData = ref<DayContribution[][]>(generateContributionData())

// Calculate total contributions
const totalContributions = computed(() => {
  return contributionData.value.reduce((total, week) => {
    return total + week.reduce((weekTotal, day) => weekTotal + day.count, 0)
  }, 0)
})

// Month labels
const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

// Tooltip state
const tooltip = ref({
  show: false,
  x: 0,
  y: 0,
  count: 0,
  date: '',
})

// Show tooltip
const showTooltip = (day: DayContribution, event: MouseEvent) => {
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  tooltip.value = {
    show: true,
    x: rect.left + window.pageXOffset,
    y: rect.top + window.pageYOffset - 40,
    count: day.count,
    date: day.date,
  }
}

// Hide tooltip
const hideTooltip = () => {
  tooltip.value.show = false
}

// Get contribution cell class based on count
const getContributionClass = (count: number): string => {
  if (count <= 0) return 'bg-gray-100 dark:bg-gray-800'
  if (count <= 3) return 'bg-green-100 dark:bg-green-800'
  if (count <= 6) return 'bg-green-300 dark:bg-green-600'
  if (count <= 9) return 'bg-green-500 dark:bg-green-400'
  return 'bg-green-700 dark:bg-green-200'
}
</script>

<style scoped>
.grid-cols-52 {
  grid-template-columns: repeat(52, minmax(0, 1fr));
}
</style>
