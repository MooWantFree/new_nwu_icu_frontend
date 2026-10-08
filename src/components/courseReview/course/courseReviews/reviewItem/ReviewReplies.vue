<template>
  <section v-show="expanded" :id="`review-replies-${review.id}`" ref="replySection" class="mt-4 min-w-0" aria-label="评价回复">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-3">
        <h3 class="text-sm font-semibold text-zinc-900">回复 <span class="ml-1 text-xs font-normal text-zinc-500">{{ review.reply_count }}</span></h3>
        <button v-if="!review.is_deleted" type="button" class="rounded-sm text-xs text-zinc-600 underline-offset-4 hover:text-zinc-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2" :aria-expanded="replyTarget === 0" @click="toggleReply(0)">
          {{ replyTarget === 0 ? '取消回复' : '回复评价' }}
        </button>
      </div>
      <button v-if="thread.roots.length > 1 && nextCursor === null" type="button" class="rounded-sm text-xs text-zinc-500 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2" @click="reverseReplies = !reverseReplies">
        {{ reverseReplies ? '最新回复' : '最早回复' }}
      </button>
    </div>
    <ReviewReplyInput v-if="isLoggedIn && userInfo && !review.is_deleted && replyTarget === 0" :review="review" :reply-to="0" :user-id="userInfo.id" class="mb-4"
      @close="replyTarget = null" @reply-submitted="onReplySubmitted" />
    <div :id="`review-reply-list-${review.id}`" class="space-y-3">
      <ReviewReplyThreadNode v-for="node in thread.roots" :key="node.reply.id" :node="node" :review="review"
        :depth="0" :collapsed-ids="collapsedIds" :reply-target="replyTarget" :user-id="isLoggedIn ? userInfo?.id : undefined"
        :deleting-ids="deletingIds" :visible-ids="visibleIds" @toggle-collapse="toggleCollapse" @reply="toggleReply" @delete="handleDeleteReply"
        @close="replyTarget = null" @reply-submitted="onReplySubmitted" />
    </div>
    <button v-if="hasMoreLoadedReplies" type="button" class="mt-3 inline-flex min-h-9 items-center rounded-md px-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2" :aria-expanded="showAllReplies" :aria-controls="`review-reply-list-${review.id}`" @click="showAllReplies = !showAllReplies">
      {{ showAllReplies ? '收起多余回复' : `展开更多回复（另 ${thread.byId.size - visibleReplyLimit} 条）` }}
    </button>
    <button v-if="nextCursor !== null && (showAllReplies || !hasMoreLoadedReplies)" type="button" class="mt-3 inline-flex min-h-9 items-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:opacity-50" :disabled="loadingMore" @click="loadMoreReplies">
      {{ loadingMore ? '加载中…' : `加载更多（已显示 ${review.reply.length}/${review.reply_count}）` }}
    </button>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useShadcnToast } from '@/lib/useShadcnToast'
import { useShadcnDialog } from '@/lib/useShadcnDialog'
import { useUser } from '@/lib/useUser'
import { api } from '@/lib/requests'
import { buildReviewReplyThread } from '@/lib/reviewReplyThread'
import { focusCourseReviewTarget } from '@/lib/focusCourseReviewTarget'
import type { Review } from '@/types/courseReview'
import ReviewReplyInput from './ReviewReplyInput.vue'
import ReviewReplyThreadNode from './ReviewReplyThreadNode.vue'

const { review } = defineProps<{ review: Review }>()
const expanded = defineModel<boolean>('expanded', { default: false })
const emit = defineEmits<{ (e: 'replyDeleted', reviewId: number, replyId: number): void }>()
const { userInfo, isLoggedIn } = useUser()
const message = useShadcnToast()
const dialog = useShadcnDialog()
const route = useRoute()
const replySection = useTemplateRef('replySection')
const replyTarget = ref<number | null>(null)
const collapsedIds = ref(new Set<number>())
const deletingIds = ref(new Set<number>())
const reverseReplies = ref(false)
const nextCursor = ref<number | null>(review.reply_next_cursor)
const loadingMore = ref(false)
const thread = computed(() => buildReviewReplyThread(review.reply, reverseReplies.value))
const visibleReplyLimit = 5
const showAllReplies = ref(false)
const hasMoreLoadedReplies = computed(() => thread.value.byId.size > visibleReplyLimit)
const visibleIds = computed(() => {
  if (showAllReplies.value) return undefined
  const ids = new Set<number>()
  const pending = [...thread.value.roots].reverse()
  while (pending.length && ids.size < visibleReplyLimit) {
    const node = pending.pop()!
    ids.add(node.reply.id)
    pending.push(...[...node.children].reverse())
  }
  return ids
})

const appendReplies = (replies: Review['reply']) => {
  const existingIds = new Set(review.reply.map((item) => item.id))
  review.reply.push(...replies.filter((item) => !existingIds.has(item.id)))
}
const loadReplies = async (query: { after?: number; target?: number }) => {
  const response = await api.get({
    url: '/api/assessment/reply/:id/',
    params: { id: review.id },
    query,
  })
  if (response.status !== 200) throw new Error('加载回复失败')
  appendReplies(response.content.results)
  return response.content
}
const loadMoreReplies = async () => {
  if (nextCursor.value === null || loadingMore.value) return
  loadingMore.value = true
  showAllReplies.value = true
  try {
    const content = await loadReplies({ after: nextCursor.value })
    nextCursor.value = content.next_cursor
  } catch {
    message.error('加载更多回复失败，请稍后重试')
  } finally {
    loadingMore.value = false
  }
}

const requireLogin = () => {
  if (isLoggedIn.value && userInfo.value) return true
  message.error('请先登录后再回复')
  return false
}
const startReply = () => {
  if (review.is_deleted || !requireLogin()) return
  expanded.value = true
  replyTarget.value = 0
}
const toggleReply = (id: number) => {
  if ((id === 0 && review.is_deleted) || !requireLogin()) return
  replyTarget.value = replyTarget.value === id ? null : id
  if (replyTarget.value !== null && id !== 0 && visibleIds.value && !visibleIds.value.has(id)) showAllReplies.value = true
}
defineExpose({ startReply })
const toggleCollapse = (id: number) => {
  if (collapsedIds.value.has(id)) collapsedIds.value.delete(id)
  else collapsedIds.value.add(id)
}

const handleDeleteReply = async (id: number) => {
  if (deletingIds.value.has(id)) return
  deletingIds.value.add(id)
  try {
    if (!(await dialog.confirm({
      title: '删除回复',
      description: '删除后将保留“回复已删除”的占位，下级回复不会被删除。确定删除吗？',
      confirmText: '删除回复',
      destructive: true,
    }))) return
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
  review.reply_count += 1
  if (visibleIds.value && !visibleIds.value.has(id)) showAllReplies.value = true
  let ancestor: number | undefined = parent
  while (ancestor !== undefined) {
    collapsedIds.value.delete(ancestor)
    ancestor = thread.value.parents.get(ancestor)
  }
}

// Keep incoming notification/profile links usable; replies have no in-thread jump controls.
const linkedReplyId = computed(() => Number(/^#reply-(\d+)$/.exec(route.hash)?.[1]) || null)
let stopFocusAnimation: (() => void) | undefined
watch([linkedReplyId, () => thread.value.byId.has(linkedReplyId.value ?? -1)], async ([id, exists], _, onCleanup) => {
  if (!id) return
  let canceled = false
  onCleanup(() => { canceled = true })
  if (!exists) {
    try {
      await loadReplies({ target: id })
    } catch {
      return
    }
  }
  if (canceled || linkedReplyId.value !== id || !thread.value.byId.has(id)) return
  expanded.value = true
  if (visibleIds.value && !visibleIds.value.has(id)) showAllReplies.value = true
  let ancestor: number | undefined = id
  while (ancestor !== undefined) {
    collapsedIds.value.delete(ancestor)
    ancestor = thread.value.parents.get(ancestor)
  }
  await nextTick()
  if (canceled || linkedReplyId.value !== id) return
  const element = replySection.value?.querySelector<HTMLElement>(`[data-reply-card="${id}"]`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    stopFocusAnimation?.()
    stopFocusAnimation = focusCourseReviewTarget(element)
  }
}, { immediate: true, flush: 'post' })
onUnmounted(() => stopFocusAnimation?.())
</script>
