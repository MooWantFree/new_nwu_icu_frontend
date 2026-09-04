<template>
  <div
    class="timeline-review"
    :class="align === 'right' ? 'timeline-review--right' : 'timeline-review--left'"
  >
    <n-tooltip trigger="hover">
      <template #trigger>
        <div class="timeline-review__avatar">
          <UserAvatar
            v-if="review.author.id > 0"
            :avatar="review.author.avatar_uuid"
            :uuid="review.author.uuid"
            :has-avatar="review.author.has_avatar"
            :alt="review.author.nickname"
            class="h-full w-full rounded-full object-cover"
          />
          <n-avatar
            v-else
            round
            :size="40"
            :src="`/api/download/${review.author.avatar_uuid}`"
          />
        </div>
      </template>
      <span>{{ review.author.is_student ? '西大邮箱认证用户' : '普通用户' }}</span>
    </n-tooltip>

    <article class="timeline-review__bubble">
      <header class="timeline-review__meta">
        <router-link
          v-if="review.author.id > 0"
          :to="`/user/${review.author.id}`"
          class="timeline-review__author text-link"
        >
          {{ review.author.nickname }}
        </router-link>
        <span v-else class="timeline-review__author text-gray-700">
          {{ review.author.nickname }}
        </span>

        <span class="timeline-review__verb">点评了</span>

        <span class="timeline-review__subject">
          <router-link
            :to="`/review/course/${review.course.id}`"
            class="timeline-review__course text-link"
            :title="review.course.name"
          >
            {{ review.course.name }}
          </router-link>

          <span v-if="review.teachers[0]" class="timeline-review__teacher">
            <span aria-hidden="true">（</span>
            <router-link
              :to="`/review/teacher/${review.teachers[0].id}`"
              class="text-link"
            >
              {{ review.teachers[0].name }}
            </router-link>
            <span v-if="review.teachers.length > 1" aria-label="以及其他老师">…</span>
            <span aria-hidden="true">）</span>
          </span>
        </span>

        <Time class="timeline-review__time" :time="review.datetime" />
      </header>

      <p ref="excerptRef" class="timeline-review__copy">
        {{ plainTextContent }}
      </p>

      <footer v-if="showFooter" class="timeline-review__footer">
        <button
          v-if="review.like.like > 0"
          type="button"
          class="timeline-review__like"
          :class="{ 'timeline-review__like--active': review.like.user_option === 1 }"
          :disabled="likePending"
          :aria-pressed="review.like.user_option === 1"
          :aria-label="review.like.user_option === 1 ? '取消点赞' : '点赞'"
          @click="toggleLike"
        >
          <ThumbsUp class="h-4 w-4" />
          <span>{{ review.like.like }}</span>
        </button>

        <button
          v-if="isOverflowing"
          type="button"
          class="timeline-review__details"
          @click="openDetails"
        >
          展开全文
        </button>
      </footer>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ThumbsUp } from 'lucide-vue-next'
import { useMessage } from 'naive-ui'
import { useRouter } from 'vue-router'
import UserAvatar from '@/components/common/UserAvatar.vue'
import Time from '@/components/tinyComponents/Time.vue'
import { api } from '@/lib/requests'
import { sanitizeUserRichText } from '@/lib/richText'
import { useUser } from '@/lib/useUser'
import type { ReviewTimeline } from '@/types/courseReview'

const props = withDefaults(defineProps<{
  review: ReviewTimeline
  align?: 'left' | 'right'
}>(), {
  align: 'left',
})

const router = useRouter()
const message = useMessage()
const { isLoggedIn } = useUser(false)
const excerptRef = ref<HTMLElement | null>(null)
const isOverflowing = ref(false)
const likePending = ref(false)
let resizeObserver: ResizeObserver | null = null

const plainTextContent = computed(() => {
  const safeHtml = sanitizeUserRichText(props.review.content)
  if (typeof document === 'undefined') {
    return safeHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  const container = document.createElement('div')
  container.innerHTML = safeHtml
  return (container.textContent || '').replace(/\s+/g, ' ').trim()
})

const showFooter = computed(() => props.review.like.like > 0 || isOverflowing.value)

const checkOverflow = () => {
  if (!excerptRef.value) return
  isOverflowing.value = excerptRef.value.scrollHeight > excerptRef.value.clientHeight + 1
}

const openDetails = () => {
  router.push({
    name: 'courseReviewItem',
    params: { id: props.review.course.id },
    hash: `#review-${props.review.id}`,
  })
}

const toggleLike = async () => {
  if (likePending.value) return
  if (!isLoggedIn.value) {
    message.error('请先登录')
    return
  }

  likePending.value = true
  try {
    const response = await api.post({
      url: '/api/assessment/reply/like/',
      query: {
        review_id: props.review.id,
        reply_id: 0,
        like_or_dislike: '1',
      },
    })

    if (response.status !== 200) throw new Error('点赞失败')

    props.review.like.like = response.content.like.like
    props.review.like.dislike = response.content.like.dislike
    props.review.like.user_option = props.review.like.user_option === 1 ? 0 : 1
  } catch (error) {
    console.error('Timeline review like failed:', error)
    message.error('点赞失败，请稍后再试')
  } finally {
    likePending.value = false
  }
}

onMounted(async () => {
  await nextTick()
  checkOverflow()
  if (excerptRef.value) {
    resizeObserver = new ResizeObserver(checkOverflow)
    resizeObserver.observe(excerptRef.value)
  }
})

watch(plainTextContent, async () => {
  await nextTick()
  checkOverflow()
})

onBeforeUnmount(() => resizeObserver?.disconnect())
</script>

<style scoped>
.timeline-review {
  display: flex;
  min-width: 0;
  align-items: flex-start;
  gap: 0.75rem;
}

.timeline-review--right {
  flex-direction: row-reverse;
}

.timeline-review__avatar {
  width: 2.5rem;
  height: 2.5rem;
  flex: 0 0 2.5rem;
  overflow: hidden;
  border-radius: 9999px;
  background: #f2f2f7;
  box-shadow: 0 0 0 1px rgb(29 29 31 / 0.08);
}

.timeline-review__bubble {
  position: relative;
  min-width: 0;
  flex: 1 1 auto;
  border: 1px solid #e5e5ea;
  border-radius: 1rem;
  background: #fff;
  padding: 0.875rem 1rem 0.8125rem;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.04);
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

.timeline-review__bubble::before,
.timeline-review__bubble::after {
  position: absolute;
  top: 0.875rem;
  width: 0;
  height: 0;
  border-top: 0.5rem solid transparent;
  border-bottom: 0.5rem solid transparent;
  content: '';
  pointer-events: none;
}

.timeline-review--left .timeline-review__bubble::before {
  left: -0.625rem;
  border-right: 0.625rem solid #e5e5ea;
}

.timeline-review--left .timeline-review__bubble::after {
  left: -0.5rem;
  border-right: 0.5625rem solid #fff;
}

.timeline-review--right .timeline-review__bubble::before {
  right: -0.625rem;
  border-left: 0.625rem solid #e5e5ea;
}

.timeline-review--right .timeline-review__bubble::after {
  right: -0.5rem;
  border-left: 0.5625rem solid #fff;
}

.timeline-review__bubble:hover {
  border-color: #d1d1d6;
  box-shadow: 0 3px 12px rgb(0 0 0 / 0.055);
}

.timeline-review__meta {
  display: grid;
  min-width: 0;
  grid-template-columns: max-content max-content minmax(0, 1fr) max-content;
  align-items: baseline;
  column-gap: 0.45rem;
  overflow: hidden;
  white-space: nowrap;
  font-size: 0.8125rem;
  line-height: 1.25rem;
}

.timeline-review__author,
.timeline-review__time,
.timeline-review__verb {
  flex-shrink: 0;
}

.timeline-review__author {
  overflow: hidden;
  max-width: 8.5rem;
  text-overflow: ellipsis;
  font-weight: 600;
}

.timeline-review__verb,
.timeline-review__time {
  color: #8e8e93;
}

.timeline-review__subject {
  display: flex;
  min-width: 0;
  overflow: hidden;
  align-items: baseline;
}

.timeline-review__course {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
}

.timeline-review__teacher {
  flex-shrink: 0;
  overflow: hidden;
  max-width: 7.5rem;
  text-overflow: ellipsis;
  font-weight: 500;
}

.timeline-review__time {
  justify-self: end;
  padding-left: 0.25rem;
  font-variant-numeric: tabular-nums;
}

.timeline-review__copy {
  display: -webkit-box;
  overflow: hidden;
  margin-top: 0.5rem;
  color: #2c2c2e;
  font-size: 0.9375rem;
  line-height: 1.55;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.timeline-review__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.55rem;
  min-height: 1.75rem;
}

.timeline-review__like,
.timeline-review__details {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  color: #6e6e73;
  font-size: 0.8125rem;
  font-weight: 500;
  transition: background-color 160ms ease, color 160ms ease;
}

.timeline-review__like {
  gap: 0.3rem;
  min-width: 2.75rem;
  min-height: 1.75rem;
  padding: 0.25rem 0.5rem;
}

.timeline-review__like:hover,
.timeline-review__like--active {
  background: #f0f7ff;
  color: #0071e3;
}

.timeline-review__like:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.timeline-review__details {
  margin-left: auto;
  min-height: 1.75rem;
  padding: 0.25rem 0.45rem;
  color: #0066cc;
}

.timeline-review__details:hover {
  background: #f0f7ff;
  color: #0055ad;
}

@media (max-width: 767px) {
  .timeline-review--right {
    flex-direction: row;
  }

  .timeline-review {
    gap: 0.625rem;
  }

  .timeline-review__avatar {
    width: 2.25rem;
    height: 2.25rem;
    flex-basis: 2.25rem;
  }

  .timeline-review__bubble {
    padding: 0.75rem;
  }

  .timeline-review__meta {
    column-gap: 0.3rem;
    font-size: 0.75rem;
  }

  .timeline-review__author {
    max-width: 5.5rem;
  }

  .timeline-review__teacher {
    max-width: 5rem;
  }
}
</style>
