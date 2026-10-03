<template>
  <main class="timeline-page min-h-[calc(100vh-7rem)] bg-zinc-50 text-zinc-950">
    <div class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <header v-if="showHeader" class="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">时间线</h1>
          <span v-if="loading" class="h-5 w-20 rounded-md bg-zinc-200 motion-safe:animate-pulse" aria-hidden="true" />
          <span v-else class="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-500">
            {{ totalReviewCount }} 条评价
          </span>
        </div>

        <nav aria-label="课程评价导航" class="inline-flex w-fit items-center gap-1 rounded-lg bg-zinc-100 p-1">
          <RouterLink
            v-for="item in directoryLinks"
            :key="item.to"
            :to="item.to"
            :aria-current="item.to === '/review/timeline' ? 'page' : undefined"
            class="inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors"
            :class="item.to === '/review/timeline' ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-500 hover:bg-white/70 hover:text-zinc-950'"
          >
            <component :is="item.icon" class="h-4 w-4" aria-hidden="true" />
            {{ item.label }}
          </RouterLink>
        </nav>
      </header>

      <section aria-labelledby="timeline-reviews-title" class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgb(0_0_0_/_0.025)]">
        <header class="flex items-center gap-2.5 border-b border-zinc-100 px-5 py-4 sm:px-6">
          <MessageSquareText class="h-4 w-4 text-zinc-500" aria-hidden="true" />
          <h2 id="timeline-reviews-title" class="text-sm font-semibold">最新评价</h2>
        </header>

        <div v-if="loading" class="divide-y divide-zinc-200" aria-label="正在加载课程评价" role="status">
          <span class="sr-only">正在加载课程评价</span>
          <review-item-skeleton v-for="index in pageSize" :key="index" />
        </div>
        <div v-else-if="reviews.length" class="divide-y divide-zinc-200">
          <review-item v-for="review in reviews" :key="review.id" :review="review" />
        </div>
        <div v-else class="px-5 py-16 text-center text-sm text-zinc-500 sm:px-6">
          暂时还没有课程评价。
        </div>

        <div v-if="totalReviewCount > 0 && showHeader" class="border-t border-zinc-200 px-4 py-5 sm:px-6">
          <n-pagination
            :page="currentPage"
            :item-count="totalReviewCount"
            :page-slot="5"
            :page-size="pageSize"
            :page-sizes="pageSizeOptions"
            :show-size-picker="true"
            :theme-overrides="timelinePaginationTheme"
            @update:page="onPageUpdate"
            @update:page-size="onPageSizeUpdate"
            show-quick-jumper
          />
        </div>
      </section>
    </div>
  </main>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage, type GlobalThemeOverrides } from 'naive-ui'
import { BookOpen, Clock3, MessageSquareText, UsersRound } from 'lucide-vue-next'
import { api } from '@/lib/requests'
import ReviewItem from '@/components/courseReview/timeline/ReviewItem.vue'
import ReviewItemSkeleton from '@/components/courseReview/timeline/ReviewItemSkeleton.vue'
import { APILatestReviews } from '@/types/api/courseReview/review'

const props = defineProps({
  showHeader: {
    type: Boolean,
    default: true,
  },
  pageSize: {
    type: Number,
    default: 8,
  },
})

const message = useMessage()
const router = useRouter()
const route = useRoute()

const directoryLinks = [
  { label: '时间线', to: '/review/timeline', icon: Clock3 },
  { label: '课程', to: '/review/course', icon: BookOpen },
  { label: '教师', to: '/review/teacher', icon: UsersRound },
] as const

const timelinePaginationTheme: NonNullable<GlobalThemeOverrides['Pagination']> = {
  itemTextColor: '#52525b',
  itemTextColorHover: '#18181b',
  itemTextColorActive: '#fafafa',
  itemColorHover: '#f4f4f5',
  itemColorActive: '#18181b',
  itemColorActiveHover: '#3f3f46',
  itemBorderHover: '1px solid #a1a1aa',
  itemBorderActive: '1px solid #18181b',
  itemBorderRadius: '6px',
  buttonBorder: '1px solid #e4e4e7',
  buttonBorderHover: '1px solid #a1a1aa',
  buttonColorHover: '#f4f4f5',
  peers: {
    Input: {
      borderHover: '1px solid #a1a1aa',
      borderFocus: '1px solid #a1a1aa',
      boxShadowFocus: '0 0 0 2px rgb(161 161 170 / 20%)',
      caretColor: '#18181b',
    },
    Select: {
      peers: {
        InternalSelection: {
          borderHover: '1px solid #a1a1aa',
          borderActive: '1px solid #a1a1aa',
          borderFocus: '1px solid #a1a1aa',
          boxShadowActive: '0 0 0 2px rgb(161 161 170 / 20%)',
          boxShadowFocus: '0 0 0 2px rgb(161 161 170 / 20%)',
          caretColor: '#18181b',
        },
        InternalSelectMenu: {
          optionTextColorActive: '#18181b',
          optionCheckColor: '#18181b',
        },
      },
    },
  },
}

const reviews = ref<APILatestReviews['response']['results']>([])
const totalReviewCount = ref(0)
const loading = ref(true)
const currentPage = computed(() => {
  const page = Number(route.query.page)
  return Number.isSafeInteger(page) && page > 0 ? page : 1
})
const pageSizeOptions = [8, 20, 50]
const pageSize = computed(() => {
  const size = Number(route.query.pageSize)
  return pageSizeOptions.includes(size) ? size : props.pageSize
})

const fetchReviews = async (isCurrent: () => boolean) => {
  loading.value = true
  reviews.value = []
  totalReviewCount.value = 0
  const searchParams = {
    page: currentPage.value,
    pageSize: pageSize.value,
    desc: 1,
  }
  try {
    const { status, content, errors } = await api.get({
      url: '/api/assessment/latest-review/',
      query: searchParams,
    })
    if (!isCurrent()) return

    if (status !== 200) {
      throw new Error(errors ? errors.map(err => err.err_msg).join(', ') : '获取点评失败，请重试')
    }

    reviews.value = content.results
    totalReviewCount.value = content.count
  } catch (error) {
    if (!isCurrent()) return
    console.error('Error fetching reviews:', error)
    message.error(error instanceof Error ? error.message : '获取点评失败，请重试')
  } finally {
    if (isCurrent()) loading.value = false
  }
}

const onPageUpdate = async (page: number) => {
  await router.push({
    query: {
      ...route.query,
      page: page.toString(),
      pageSize: pageSize.value.toString(),
    },
  })
}

const onPageSizeUpdate = async (size: number) => {
  await router.push({
    query: {
      ...route.query,
      page: '1',
      pageSize: size.toString(),
    },
  })
}

watch([currentPage, pageSize], (_state, _oldState, onCleanup) => {
  let current = true
  onCleanup(() => { current = false })
  void fetchReviews(() => current)
}, { immediate: true })
</script>

<style scoped>
.timeline-page a:focus-visible {
  outline: 2px solid #a1a1aa;
  outline-offset: 3px;
}

.timeline-page :deep(.n-pagination) {
  flex-wrap: wrap;
  justify-content: center;
  row-gap: 12px;
}
</style>
