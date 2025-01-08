<template>
  <div>
    <div class="bg-white shadow-md rounded-lg p-6">
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex relative">
          <button
            v-for="tab in tabs"
            :key="tab.name"
            @click="setActiveTab(tab.name)"
            :class="[
              'w-1/2 py-4 px-1 text-center font-medium text-sm transition-colors duration-200',
              activeTab === tab.name
                ? 'text-indigo-600'
                : 'text-gray-500 hover:text-gray-700',
            ]"
          >
            {{ tab.label }}
          </button>
          <div
            class="absolute bottom-0 w-1/2 h-0.5 bg-indigo-500 transition-transform duration-300 ease-in-out"
            :style="{
              transform: `translateX(${
                activeTab === 'reviews' ? '0%' : '100%'
              })`,
            }"
          ></div>
        </nav>
      </div>
      <div class="mt-4">
        <transition name="fade" mode="out-in">
          <div v-if="activeTab === 'reviews'" key="reviews">
            <div v-if="data && data.results.length > 0">
              <div
                v-for="review in data.results"
                :key="review.id"
                class="mb-6 p-4 bg-gray-50 rounded-lg shadow"
              >
                <div class="flex justify-between items-center mb-2">
                  <router-link
                    :to="`/review/course/${review.course.id}`"
                    class="text-lg font-bold text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
                  >
                    {{ review.course.name }}
                  </router-link>
                  <span class="text-sm text-gray-500">{{
                    new Date(review.datetime).toLocaleDateString()
                  }}</span>
                </div>
                <div class="flex items-center mb-2">
                  <span class="mr-2 text-sm text-gray-600">评分:</span>
                  <div class="flex items-center">
                    <span class="text-lg font-bold text-yellow-500 mr-2">
                      {{ review.rating.rating.toFixed(1) }}
                    </span>
                    <n-rate
                      :value="review.rating.rating"
                      :size="16"
                      readonly
                      allow-half
                      class="text-yellow-400"
                    />
                  </div>
                </div>
                <p class="text-gray-700 mb-2">
                  <ReviewPlainText :content="review.content.current_content" />
                </p>
                <!-- TODO: Which version is better? -->
                <!-- <div class="flex flex-wrap text-sm text-gray-600">
                  <span class="mr-4">难度: {{ review.rating.difficulty }}</span>
                  <span class="mr-4">给分: {{ review.rating.grade }}</span>
                  <span class="mr-4">作业量: {{ review.rating.homework }}</span>
                  <span>收获: {{ review.rating.reward }}</span>
                </div> -->
                <div class="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span class="flex items-center">
                    <span class="font-medium mr-1">难度:</span>
                    <n-rate
                      :value="review.rating.difficulty"
                      size="small"
                      readonly
                    />
                  </span>
                  <span class="flex items-center">
                    <span class="font-medium mr-1">给分:</span>
                    <n-rate
                      :value="review.rating.grade"
                      size="small"
                      readonly
                    />
                  </span>
                  <span class="flex items-center">
                    <span class="font-medium mr-1">作业量:</span>
                    <n-rate
                      :value="review.rating.homework"
                      size="small"
                      readonly
                    />
                  </span>
                  <span class="flex items-center">
                    <span class="font-medium mr-1">收获:</span>
                    <n-rate
                      :value="review.rating.reward"
                      size="small"
                      readonly
                    />
                  </span>
                </div>
                <div class="mt-2 flex justify-between items-center">
                  <div class="flex items-center text-sm text-gray-500">
                    <span class="mr-4"
                      ><ThumbsUp class="inline-block w-4 h-4 mr-1" />
                      {{ review.like.like }}</span
                    >
                    <span
                      ><ThumbsDown class="inline-block w-4 h-4 mr-1" />
                      {{ review.like.dislike }}</span
                    >
                  </div>
                  <button
                    class="px-3 py-1 text-sm text-indigo-600 border border-indigo-600 rounded hover:bg-indigo-600 hover:text-white transition-colors duration-200"
                    @click="
                      $router.push(
                        `/review/course/${review.course.id}#review-${review.id}`
                      )
                    "
                  >
                    更多
                  </button>
                </div>
              </div>
              <div class="mt-6 flex justify-center items-center">
                <n-pagination
                  v-model:page="currentPage"
                  :page-count="data.max_page"
                  :on-update:page="handlePageChange"
                  :page-sizes="[10, 20, 30, 40]"
                  :show-size-picker="true"
                  @update:page-size="handlePageSizeChange"
                >
                  <template #prefix>
                    第 {{ (currentPage - 1) * pageSize + 1 }} -
                    {{ Math.min(currentPage * pageSize, data.count) }} 条，共
                    {{ data.count }} 条
                  </template>
                </n-pagination>
              </div>
            </div>
            <div
              v-else-if="data && data.results.length === 0"
              class="text-center py-8"
            >
              <p class="text-gray-500">暂无评价</p>
            </div>
            <div v-else class="flex justify-center items-center h-32">
              <LoaderCircle class="w-8 h-8 text-indigo-500 animate-spin" />
              <span class="ml-2 text-gray-600">加载中...</span>
            </div>
          </div>
          <div v-else-if="activeTab === 'comments'" key="comments">
            <div v-if="data">
              <div
                v-for="comment in data.results"
                :key="comment.id"
                class="mb-4"
              >
                <p>内容: {{ comment.content }}</p>
                <p>时间: {{ new Date(comment.created_at).toLocaleString() }}</p>
              </div>
            </div>
            <div v-else class="flex justify-center items-center h-32">
              <LoaderCircle class="w-8 h-8 text-indigo-500 animate-spin" />
              <span class="ml-2 text-gray-600">加载中...</span>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { api } from '@/lib/requests'
import { APIUserOwnReview } from '@/types/api/user/profilePage'
import { ref, watchEffect } from 'vue'
import { useMessage, NRate } from 'naive-ui'
import { LoaderCircle, ThumbsUp, ThumbsDown } from 'lucide-vue-next'
import ReviewPlainText from '@/components/tinyComponents/ReviewPlainText.vue'

const message = useMessage()

const { id } = defineProps<{
  id: string
}>()

// Tabs
const tabs = [
  { name: 'reviews', label: '评价' },
  { name: 'comments', label: '评论' },
]

const activeTab = ref('reviews')
const setActiveTab = (tabName: string) => {
  activeTab.value = tabName
}

const data = ref<APIUserOwnReview['response'] | null>(null)
const currentPage = ref(1)
const pageSize = ref(10)

const fetchData = async () => {
  try {
    const resp = await api.get({
      url: '/api/assessment/my/review/',
      params: {
        userId: parseInt(id),
        page: currentPage.value,
        page_size: pageSize.value,
      },
    })
    if (resp.status === 200) {
      data.value = resp.content
    } else {
      message.error('获取用户信息失败，请稍后重试')
    }
  } catch (error) {
    message.error('获取用户信息失败，请稍后重试')
  }
}

watchEffect(fetchData)

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchData()
}

const handlePageSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  fetchData()
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
