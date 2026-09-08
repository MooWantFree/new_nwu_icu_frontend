<template>
  <div class="min-w-0" :data-reply-id="node.reply.id">
    <div v-show="!collapsed" class="flex min-w-0 items-stretch" :data-reply-branch="node.reply.id">
      <button type="button" class="group relative w-5 shrink-0 self-stretch rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        :aria-label="`折叠第${node.reply.floor_number}楼回复`" :aria-expanded="!collapsed" @click="emit('toggleCollapse', node.reply.id)">
        <span aria-hidden="true" class="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gray-200 transition-colors group-hover:bg-gray-400 group-focus-visible:bg-blue-600" />
      </button>
      <div class="min-w-0 flex-1 space-y-3" :class="depth < 2 ? 'pl-1 sm:pl-2' : ''">
        <article :id="`reply-${node.reply.id}`" :data-reply-card="node.reply.id" class="min-w-0 rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
          <div class="flex items-start justify-between gap-2 text-sm">
            <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <RouterLink v-if="node.reply.created_by.id > 0" :to="`/user/${node.reply.created_by.id}`" class="break-all font-semibold text-blue-700 hover:underline">{{ node.reply.created_by.name }}</RouterLink>
              <span v-else class="break-all font-semibold text-gray-700">{{ node.reply.created_by.name }}</span>
              <span v-if="parentName" class="text-xs text-gray-500">回复 {{ parentName }}</span>
            </div>
            <span class="shrink-0 text-xs text-gray-400">#{{ node.reply.floor_number }}</span>
          </div>
          <p class="mt-2 whitespace-pre-wrap break-words text-sm leading-6 [overflow-wrap:anywhere]" :class="node.reply.is_deleted ? 'text-gray-400' : 'text-gray-700'">{{ node.reply.is_deleted ? '回复已删除' : node.reply.content }}</p>
          <div class="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
            <Time :time="node.reply.created_time" />
            <div v-if="userId && !node.reply.is_deleted" class="flex items-center gap-3">
              <button v-if="node.reply.created_by.id === userId" type="button" :disabled="deletingIds.has(node.reply.id)" class="hover:text-red-600 disabled:opacity-50" @click="emit('delete', node.reply.id)">{{ deletingIds.has(node.reply.id) ? '删除中…' : '删除' }}</button>
              <button type="button" class="inline-flex items-center gap-1 hover:text-blue-700" :aria-expanded="replyTarget === node.reply.id" @click="emit('reply', node.reply.id)">
                <MessageCircle class="h-3.5 w-3.5" aria-hidden="true" />{{ replyTarget === node.reply.id ? '取消回复' : '回复' }}
              </button>
            </div>
          </div>
        </article>
        <ReviewReplyInput v-if="userId && replyTarget === node.reply.id && !node.reply.is_deleted" :review="review" :reply-to="node.reply.id" :reply-target-name="node.reply.created_by.name"
          @close="emit('close')" @reply-submitted="(content, parent, id) => emit('replySubmitted', content, parent, id)" />
        <div v-if="node.children.length" class="space-y-3" :class="depth >= 2 ? '-ml-5' : ''">
          <ReviewReplyThreadNode v-for="child in node.children" :key="child.reply.id" :node="child" :review="review" :depth="depth + 1" :parent-name="node.reply.created_by.name"
            :collapsed-ids="collapsedIds" :reply-target="replyTarget" :user-id="userId" :deleting-ids="deletingIds"
            @toggle-collapse="emit('toggleCollapse', $event)" @reply="emit('reply', $event)" @delete="emit('delete', $event)" @close="emit('close')"
            @reply-submitted="(content, parent, id) => emit('replySubmitted', content, parent, id)" />
        </div>
      </div>
    </div>
    <div v-if="collapsed" class="flex min-h-8 min-w-0 items-center gap-2 py-1 text-sm">
      <button type="button" class="shrink-0 rounded-full text-gray-700 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        :aria-label="`展开第${node.reply.floor_number}楼回复`" :aria-expanded="false" @click="emit('toggleCollapse', node.reply.id)"><CirclePlus class="h-5 w-5" aria-hidden="true" /></button>
      <span class="truncate font-semibold text-gray-700">{{ node.reply.created_by.name }}</span>
      <span class="shrink-0 text-xs text-gray-400">#{{ node.reply.floor_number }}</span>
      <Time :time="node.reply.created_time" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CirclePlus, MessageCircle } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import Time from '@/components/tinyComponents/Time.vue'
import ReviewReplyInput from './ReviewReplyInput.vue'
import type { Review } from '@/types/courseReview'
import type { ReviewReplyNode } from '@/lib/reviewReplyThread'

defineOptions({ name: 'ReviewReplyThreadNode' })
const props = defineProps<{
  node: ReviewReplyNode
  review: Review
  depth: number
  parentName?: string
  collapsedIds: Set<number>
  replyTarget: number | null
  userId?: number
  deletingIds: Set<number>
}>()
const emit = defineEmits<{
  (e: 'toggleCollapse' | 'reply' | 'delete', id: number): void
  (e: 'close'): void
  (e: 'replySubmitted', content: string, parent: number, id: number): void
}>()
const collapsed = computed(() => props.collapsedIds.has(props.node.reply.id))
</script>
