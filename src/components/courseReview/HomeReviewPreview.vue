<template>
  <div v-if="loading" class="divide-y divide-slate-200" aria-label="正在加载最近评价">
    <div v-for="index in pageSize" :key="index" class="animate-pulse px-5 py-6 sm:px-7">
      <div class="flex items-center gap-3">
        <div class="h-4 w-4 rounded-full bg-slate-200" />
        <div class="h-5 w-2/5 rounded bg-slate-200" />
        <div class="ml-auto h-4 w-20 rounded bg-slate-100" />
      </div>
      <div class="mt-4 space-y-2 sm:pl-7">
        <div class="h-4 rounded bg-slate-100" />
        <div class="h-4 w-5/6 rounded bg-slate-100" />
        <div class="h-4 w-2/3 rounded bg-slate-100" />
      </div>
    </div>
  </div>

  <div v-else-if="failed" class="px-5 py-16 text-center sm:px-7" role="alert">
    <p class="text-sm text-slate-500">最近评价加载失败。</p>
    <button
      type="button"
      class="mt-3 min-h-11 rounded-lg px-4 text-sm font-medium text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      @click="load"
    >
      重新加载
    </button>
  </div>

  <div v-else-if="reviews.length" class="divide-y divide-slate-200">
    <article v-for="review in reviews" :key="review.id" class="px-5 py-6 sm:px-7">
      <div class="flex gap-3">
        <Circle class="mt-1.5 h-3 w-3 shrink-0 fill-current text-blue-600" aria-hidden="true" />
        <div class="min-w-0 flex-1">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div class="min-w-0">
              <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <RouterLink
                  :to="{
                    name: 'courseReviewItem',
                    params: { id: review.course.id },
                    hash: `#review-${review.id}`,
                  }"
                  class="break-words text-base font-semibold text-blue-700 underline-offset-4 hover:text-blue-900 hover:underline sm:text-lg"
                >
                  {{ review.course.name }}
                </RouterLink>
                <span class="text-sm text-slate-500">
                  <template v-for="(teacher, index) in review.teachers" :key="teacher.id">
                    <RouterLink
                      :to="`/review/teacher/${teacher.id}`"
                      class="hover:text-blue-700 hover:underline"
                    >{{ teacher.name }}</RouterLink><span v-if="index < review.teachers.length - 1">、</span>
                  </template>
                </span>
              </div>
            </div>

            <div class="flex shrink-0 items-center gap-3 text-sm text-slate-500 sm:justify-end">
              <RouterLink
                v-if="review.author.id > 0"
                :to="`/user/${review.author.id}`"
                class="max-w-36 truncate text-slate-700 hover:text-blue-700 hover:underline"
              >
                {{ review.author.nickname }}
              </RouterLink>
              <span v-else class="max-w-36 truncate text-slate-700">{{ review.author.nickname }}</span>
              <Time :time="review.datetime" class="whitespace-nowrap text-xs" />
            </div>
          </div>

          <ReviewPlainText :content="review.content" class="mt-3 text-sm leading-7 text-slate-600" />
        </div>
      </div>
    </article>
  </div>

  <div v-else class="px-5 py-16 text-center text-sm text-slate-500 sm:px-7">
    暂时还没有课程评价。
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Circle } from 'lucide-vue-next'
import ReviewPlainText from '@/components/tinyComponents/ReviewPlainText.vue'
import Time from '@/components/tinyComponents/Time.vue'
import { api } from '@/lib/requests'
import type { APILatestReviews } from '@/types/api/courseReview/review'

const pageSize = 3
const reviews = ref<APILatestReviews['response']['results']>([])
const loading = ref(true)
const failed = ref(false)

const load = async () => {
  loading.value = true
  failed.value = false

  try {
    const { status, content } = await api.get({
      url: '/api/assessment/latest-review/',
      query: { page: 1, pageSize, desc: 1 },
    })

    if (status !== 200) throw new Error('获取最近评价失败')
    reviews.value = content.results
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
