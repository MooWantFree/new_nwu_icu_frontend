<template>
  <section ref="replySection" class="mt-4 min-w-0" aria-label="评价回复">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-3">
        <h3 class="text-base font-semibold text-gray-900">回复 <span class="text-sm font-normal text-gray-500">{{ review.reply.length }}</span></h3>
        <button v-if="isLoggedIn" type="button" class="text-sm text-blue-700 hover:text-blue-800" :aria-expanded="replyTarget === 0" @click="toggleReply(0)">
          {{ replyTarget === 0 ? '取消回复' : '回复评价' }}
        </button>
      </div>
      <button v-if="thread.roots.length > 1" type="button" class="text-xs text-gray-500 hover:text-blue-700" @click="reverseReplies = !reverseReplies">
        {{ reverseReplies ? '最新回复' : '最早回复' }}
      </button>
    </div>
    <ReviewReplyInput v-if="isLoggedIn && replyTarget === 0" :review="review" :reply-to="0" class="mb-4"
      @close="replyTarget = null" @reply-submitted="onReplySubmitted" />
    <div class="space-y-3">
      <ReviewReplyThreadNode v-for="node in thread.roots" :key="node.reply.id" :node="node" :review="review"
        :depth="0" :collapsed-ids="collapsedIds" :reply-target="replyTarget" :user-id="isLoggedIn ? userInfo?.id : undefined"
        :deleting-ids="deletingIds" @toggle-collapse="toggleCollapse" @reply="toggleReply" @delete="handleDeleteReply"
        @close="replyTarget = null" @reply-submitted="onReplySubmitted" />
    </div>
    <p v-if="!isLoggedIn" class="mt-3 text-sm text-gray-500">登录以后才能回复</p>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useUser } from '@/lib/useUser'
import { api } from '@/lib/requests'
import { buildReviewReplyThread } from '@/lib/reviewReplyThread'
import { focusCourseReviewTarget } from '@/lib/focusCourseReviewTarget'
import type { Review } from '@/types/courseReview'
import ReviewReplyInput from './ReviewReplyInput.vue'
import ReviewReplyThreadNode from './ReviewReplyThreadNode.vue'

const { review } = defineProps<{ review: Review }>()
const emit = defineEmits<{ (e: 'replyDeleted', reviewId: number, replyId: number): void }>()
const { userInfo, isLoggedIn } = useUser()
const message = useMessage()
const route = useRoute()
const replySection = useTemplateRef('replySection')
const replyTarget = ref<number | null>(null)
const collapsedIds = ref(new Set<number>())
const deletingIds = ref(new Set<number>())
const reverseReplies = ref(false)
const thread = computed(() => buildReviewReplyThread(review.reply, reverseReplies.value))

const toggleReply = (id: number) => { replyTarget.value = replyTarget.value === id ? null : id }
const toggleCollapse = (id: number) => {
  if (collapsedIds.value.has(id)) collapsedIds.value.delete(id)
  else collapsedIds.value.add(id)
}

const handleDeleteReply = async (id: number) => {
  if (deletingIds.value.has(id) || !confirm('删除后将保留“回复已删除”的占位，下级回复不会被删除。确定删除吗？')) return
  deletingIds.value.add(id)
  try {
    const response = await api.delete({ url: '/api/assessment/reply/', query: { reply_id: id, review_id: review.id } })
    if (response.status !== 200) throw new Error('删除回复失败')
    const reply = review.reply.find((item) => item.id === id)
    if (reply) { reply.is_deleted = true; reply.content = '回复已删除' }
    if (replyTarget.value === id) replyTarget.value = null
    message.success('回复已成功删除')
    emit('replyDeleted', review.id, id)
  } catch {
    message.error('删除回复失败，请稍后重试')
  } finally { deletingIds.value.delete(id) }
}

const onReplySubmitted = (content: string, parent: number, id: number) => {
  replyTarget.value = null
  if (!userInfo.value || thread.value.byId.has(id)) return
  review.reply.push({
    id, parent, content,
    created_time: new Date().toISOString(),
    created_by: {
      id: userInfo.value.id,
      name: userInfo.value.nickname ?? userInfo.value.username,
      avatar: userInfo.value.avatar,
      uuid: userInfo.value.uuid,
      has_avatar: userInfo.value.has_avatar,
    },
    floor_number: Math.max(0, ...review.reply.map((reply) => reply.floor_number || 0)) + 1,
    like: { like: 0, dislike: 0, user_option: 0 },
    is_deleted: false,
  })
  let ancestor: number | undefined = parent
  while (ancestor !== undefined) {
    collapsedIds.value.delete(ancestor)
    ancestor = thread.value.parents.get(ancestor)
  }
}

// Keep incoming notification/profile links usable; replies have no in-thread jump controls.
const linkedReplyId = computed(() => Number(/^#reply-(\d+)$/.exec(route.hash)?.[1]) || null)
let stopFocusAnimation: (() => void) | undefined
watch([linkedReplyId, () => thread.value.byId.has(linkedReplyId.value ?? -1)], async ([id, exists]) => {
  if (!id || !exists) return
  let ancestor: number | undefined = id
  while (ancestor !== undefined) {
    collapsedIds.value.delete(ancestor)
    ancestor = thread.value.parents.get(ancestor)
  }
  await nextTick()
  const element = replySection.value?.querySelector<HTMLElement>(`[data-reply-card="${id}"]`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    stopFocusAnimation?.()
    stopFocusAnimation = focusCourseReviewTarget(element)
  }
}, { immediate: true, flush: 'post' })
onUnmounted(() => stopFocusAnimation?.())
</script>
