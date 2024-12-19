<template>
  <div class="course-rating-trend bg-white p-6 rounded-lg shadow-md">
    <h2 class="text-2xl font-bold mb-4 text-gray-800">课程评分趋势</h2>
    <div class="trend-chart h-64 mb-6">
      <apexchart
        type="line"
        height="100%"
        :options="chartOptions"
        :series="chartSeries"
      />
    </div>
    <div class="trend-summary flex justify-between text-gray-600">
      <p>
        平均评分: <span class="font-semibold">{{ averageRating }}</span>
      </p>
      <p>
        趋势: <span class="font-semibold">{{ trend }}</span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

interface RatingData {
  date: string
  rating: number
}

const props = defineProps<{
  ratingData: RatingData[]
}>()

const averageRating = ref(0)
const trend = ref('')

const calculateAverageRating = (data: RatingData[]): number => {
  const sum = data.reduce((acc, curr) => acc + curr.rating, 0)
  return Number((sum / data.length).toFixed(1))
}

const calculateTrend = (data: RatingData[]): string => {
  if (data.length < 2) return '没有足够的数据'

  const firstRating = data[0].rating
  const lastRating = data[data.length - 1].rating

  if (lastRating > firstRating) return '上升'
  if (lastRating < firstRating) return '下降'
  return '稳定'
}

const sortedRatingData = computed(() => {
  return [...props.ratingData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
})

const chartSeries = computed(() => [
  {
    name: '课程评分',
    data: sortedRatingData.value.map((item) => item.rating),
  },
])

const chartOptions = computed(() => ({
  chart: {
    type: 'line',
    height: '100%',
    toolbar: {
      show: false,
    },
  },
  xaxis: {
    categories: sortedRatingData.value.map((item) => item.date),
    type: 'datetime',
  },
  yaxis: {
    title: {
      text: '评分',
    },
  },
  title: {
    text: '课程评分趋势',
    align: 'left',
  },
}))

onMounted(() => {
  averageRating.value = calculateAverageRating(props.ratingData)
  trend.value = calculateTrend(props.ratingData)
})
</script>
