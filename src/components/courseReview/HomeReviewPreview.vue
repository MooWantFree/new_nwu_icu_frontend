<template>
  <div v-if="loading" class="divide-y divide-zinc-200" aria-label="正在加载最近评价" role="status">
    <span class="sr-only">正在加载最近评价</span>
    <article v-for="index in pageSize" :key="index" class="min-h-[116px] px-5 py-5 sm:px-6">
      <div class="flex gap-3 motion-safe:animate-pulse" aria-hidden="true">
        <div class="h-9 w-9 shrink-0 rounded-lg bg-zinc-100" />
        <div class="min-w-0 flex-1">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div class="flex min-w-0 flex-1 items-center gap-3">
              <div class="h-4 w-1/2 max-w-56 rounded bg-zinc-200" />
              <div class="h-4 w-16 shrink-0 rounded bg-zinc-100" />
            </div>
            <div class="flex items-center gap-3 sm:justify-end">
              <div class="h-4 w-16 rounded bg-zinc-200" />
              <div class="h-4 w-12 rounded bg-zinc-100" />
            </div>
          </div>
          <div class="mt-3 h-4 w-4/5 rounded bg-zinc-100" />
        </div>
      </div>
    </article>
  </div>

  <div v-else-if="failed" class="px-5 py-16 text-center sm:px-6" role="alert">
    <p class="text-sm text-zinc-500">最近评价加载失败。</p>
    <button
      type="button"
      class="mt-3 min-h-10 rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
      @click="load"
    >
      重新加载
    </button>
  </div>

  <div v-else-if="reviews.length" class="divide-y divide-zinc-200">
    <article v-for="review in reviews" :key="review.id" class="min-h-[116px] px-5 py-5 transition-colors hover:bg-zinc-50 sm:px-6">
      <div class="flex gap-3">
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200/70 bg-zinc-100 text-zinc-600">
          <BookOpen class="h-4 w-4" aria-hidden="true" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                <RouterLink
                  :to="{
                    name: 'courseReviewItem',
                    params: { id: review.course.id },
                    hash: `#review-${review.id}`,
                  }"
                  class="rounded-sm break-words text-sm font-semibold leading-6 text-zinc-950 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
                >
                  {{ review.course.name }}
                </RouterLink>
                <span class="flex flex-wrap gap-1 text-xs text-zinc-600">
                  <template v-for="teacher in review.teachers" :key="teacher.id">
                    <RouterLink
                      :to="`/review/teacher/${teacher.id}`"
                      class="rounded-md bg-zinc-100 px-2 py-0.5 underline-offset-4 hover:text-zinc-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
                    >{{ teacher.name }}</RouterLink>
                  </template>
                </span>
              </div>
            </div>

            <div class="flex shrink-0 items-center gap-2 text-xs text-zinc-500 sm:justify-end">
              <RouterLink
                v-if="review.author.id > 0"
                :to="`/user/${review.author.id}`"
                class="max-w-36 rounded-sm truncate text-zinc-600 underline-offset-4 hover:text-zinc-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
              >
                {{ review.author.nickname }}
              </RouterLink>
              <span v-else class="max-w-36 truncate text-zinc-600">{{ review.author.nickname }}</span>
              <Time :time="review.datetime" class="whitespace-nowrap" />
            </div>
          </div>

          <ReviewPlainText
            :content="review.content"
            :lines="1"
            class="mt-2.5 text-sm leading-6 text-zinc-500"
          />
        </div>
      </div>
    </article>
  </div>

  <div v-else class="px-5 py-16 text-center text-sm text-zinc-500 sm:px-6">
    暂时还没有课程评价。
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { BookOpen } from 'lucide-vue-next'
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
    reviews.value = content.results.slice(0, pageSize)
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
:deep(.app-time) { color: #71717a; }
:deep(.app-time:hover) { color: #18181b; }
</style>
