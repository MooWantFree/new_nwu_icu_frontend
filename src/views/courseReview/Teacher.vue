<template>
  <main class="min-h-[calc(100vh-7rem)] bg-zinc-50 text-zinc-950">
    <div class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <nav aria-label="面包屑" class="mb-6 flex items-center gap-2 text-sm text-zinc-500">
        <RouterLink to="/review/teacher" class="inline-flex items-center gap-1.5 rounded-md transition-colors hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2">
          <ArrowLeft class="h-4 w-4" aria-hidden="true" />
          教师目录
        </RouterLink>
        <span aria-hidden="true">/</span>
        <span class="text-zinc-700">教师详情</span>
      </nav>
      <component
        v-if="errorMsg.component"
        :is="errorMsg.component"
        :detail="errorMsg.detail"
      />
      <TeacherSkeleton v-else-if="loading" />
      <div v-else-if="teacher">
        <header class="mb-6 flex flex-col gap-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div class="flex min-w-0 items-center gap-4">
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-500">
              <UsersRound class="h-6 w-6" aria-hidden="true" />
            </div>
            <div class="min-w-0">
              <h1 class="break-words text-3xl font-semibold tracking-tight sm:text-4xl">
                {{ teacher.teacher_info.name }}
              </h1>
              <p class="mt-2 break-words text-sm text-zinc-500">{{ teacher.teacher_info.school || '学院待补充' }}</p>
            </div>
          </div>
          <dl class="grid shrink-0 grid-cols-2 gap-6 border-t border-zinc-100 pt-4 sm:gap-8 sm:border-t-0 sm:pt-0">
            <div>
              <dt class="text-xs text-zinc-500">教授课程</dt>
              <dd class="mt-1 text-2xl font-semibold tabular-nums">{{ teacher.course_list.length }}</dd>
            </div>
            <div>
              <dt class="text-xs text-zinc-500">课程评价</dt>
              <dd class="mt-1 text-2xl font-semibold tabular-nums">{{ totalReviewCount }}</dd>
            </div>
          </dl>
        </header>

        <AddCourseModal v-model="showTeacherSelectorModal" :init-value="{ teacher: teacher.teacher_info }" />
        <section aria-labelledby="teacher-courses-title">
          <header class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="teacher-courses-title" class="text-lg font-semibold tracking-tight">教授课程</h2>
            <button
              type="button"
              :disabled="checkingLogin"
              class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
              @click="handleAddCourseButtonClick"
            >
              <PlusCircle class="h-4 w-4" aria-hidden="true" />
              添加课程
            </button>
          </header>
          <div v-if="teacher.course_list.length" class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <RouterLink
              v-for="course in teacher.course_list"
              :key="course.course.id"
              :to="`/review/course/${course.course.id}`"
              class="group flex min-w-0 flex-col rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
            >
              <div class="flex min-w-0 items-start justify-between gap-3">
                <div class="min-w-0">
                  <h3 :title="course.course.name" class="line-clamp-2 break-words text-base font-semibold leading-6 underline-offset-4 group-hover:underline">{{ course.course.name }}</h3>
                  <p :title="course.course.semester" class="mt-1.5 line-clamp-2 break-words text-xs leading-5 text-zinc-500">{{ course.course.semester || '学期待补充' }}</p>
                </div>
                <ChevronRight class="mt-1 h-4 w-4 shrink-0 text-zinc-400 transition-colors group-hover:text-zinc-600" aria-hidden="true" />
              </div>
              <div class="mt-auto pt-4">
                <dl class="grid grid-cols-2 gap-3 border-t border-zinc-100 pt-3">
                  <div>
                    <dt class="text-xs text-zinc-500">平均评分</dt>
                    <dd class="mt-1 flex items-center gap-1.5 text-base font-semibold tabular-nums">
                      <Star class="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                      {{ course.rating_avg.toFixed(1) }}
                    </dd>
                  </div>
                  <div class="text-right">
                    <dt class="text-xs text-zinc-500">归一化评分</dt>
                    <dd class="mt-1 text-base font-semibold tabular-nums text-zinc-700">{{ course.normalized_rating_avg.toFixed(2) }}</dd>
                  </div>
                </dl>
                <div class="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-zinc-500">
                  <span class="min-w-0 break-words">课程编号：{{ course.course.code || '待补充' }}</span>
                  <span class="shrink-0">{{ course.review_count }} 条评价</span>
                </div>
              </div>
            </RouterLink>
          </div>
          <div v-else class="rounded-xl border border-zinc-200 bg-white px-5 py-16 text-center">
            <BookOpen class="mx-auto mb-3 h-8 w-8 text-zinc-400" aria-hidden="true" />
            <p class="font-medium text-zinc-900">暂时还没有课程</p>
            <p class="mt-1 text-sm text-zinc-500">可以添加这位教师教授的课程。</p>
          </div>
        </section>
      </div>
      <div v-else class="text-center text-zinc-500">
        <Page404 />
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, BookOpen, ChevronRight, PlusCircle, Star, UsersRound } from 'lucide-vue-next'
import { api } from '@/lib/requests'
import TeacherSkeleton from '@/components/courseReview/teacher/TeacherSkeleton.vue'
import { APITeacherInfo } from '@/types/api/courseReview/teacher'
import AddCourseModal from '@/components/courseReview/course/AddCourseModal.vue'
import Page404 from '@/components/infoNErrors/404.vue'
import Page500 from '@/components/infoNErrors/500.vue'
import { useCreationLogin } from '@/lib/useCreationLogin'

const route = useRoute()
const { checkingLogin, requireLogin } = useCreationLogin()

const errorMsg = shallowRef<{
  component: typeof Page404 | typeof Page500 | null,
  detail: string,
}>({
  component: null,
  detail: '',
})
const teacher = ref<APITeacherInfo['response'] | null>(null)
const totalReviewCount = computed(() => teacher.value?.course_list.reduce((total, course) => total + course.review_count, 0) ?? 0)
const loading = ref(true)
const showTeacherSelectorModal = ref(false)

const handleAddCourseButtonClick = async () => {
  if (await requireLogin('添加课程')) showTeacherSelectorModal.value = true
}

const fetchTeacherData = async (teacherId: number, isCurrent: () => boolean) => {
  try {
    const { status, content } = await api.get({
      url: '/api/assessment/teacher/:id/',
      params: { id: teacherId },
    })
    if (!isCurrent()) return
    if (status === 200) {
      teacher.value = content
    } else if (status === 404) {
      errorMsg.value = {
        component: Page404,
        detail: '教师信息不存在',
      }
      return
    } else {
      throw new Error('Failed to fetch teacher data')
    }
  } catch (error) {
    if (!isCurrent()) return
    console.error('Error fetching teacher data:', error)
    if (error instanceof Error) {
      errorMsg.value = {
        component: Page500,
        detail: error.toString(),
      }
    }
  } finally {
    if (isCurrent()) loading.value = false
  }
}

watch(() => route.params.id, (id, _oldId, onCleanup) => {
  let current = true
  onCleanup(() => { current = false })
  teacher.value = null
  errorMsg.value = { component: null, detail: '' }
  showTeacherSelectorModal.value = false
  loading.value = true
  void fetchTeacherData(Number(id), () => current)
}, { immediate: true })
</script>
