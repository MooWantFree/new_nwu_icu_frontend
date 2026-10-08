<template>
  <article :id="`guestbook-${entry.id}`" class="discussion-entry rounded-xl border border-zinc-200 bg-white shadow-sm"
    :class="[
      entry.parent_id === null ? 'px-5 py-5 sm:px-6' : 'p-4 sm:p-5',
      highlighted ? 'ring-2 ring-zinc-300' : '',
    ]">
    <div class="flex gap-3">
      <template v-if="showAvatar">
        <img v-if="entry.anonymous" :src="`/api/download/${entry.author.avatar}/`" alt="匿名用户头像" class="h-10 w-10 shrink-0 rounded-full border border-zinc-200" />
        <UserAvatar v-else :avatar="entry.author.avatar" :uuid="entry.author.uuid" :has-avatar="entry.author.has_avatar" class="h-10 w-10 shrink-0 rounded-full" />
      </template>
      <div class="min-w-0 flex-1">
        <div v-if="isAnnouncementRoot">
          <h2 class="break-words text-xl font-semibold leading-snug tracking-tight text-zinc-950">
            <RouterLink v-if="linkTitle" :to="`/announcements/${entry.id}`" class="rounded-sm hover:underline hover:underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400">{{ entry.title || '公告' }}</RouterLink>
            <template v-else>{{ entry.title || '公告' }}</template>
          </h2>
          <div class="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
            <RouterLink v-if="entry.author.id" :to="`/user/${entry.author.id}`" class="min-w-0 break-words rounded-sm hover:text-zinc-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400">{{ entry.author.nickname }}</RouterLink>
            <span v-else class="min-w-0 break-words">{{ entry.author.nickname }}</span>
            <span aria-hidden="true" class="text-zinc-300">·</span>
            <span class="inline-flex items-center gap-1">更新于 <Time :time="entry.updated_at" /></span>
            <span v-if="entry.is_deleted" class="text-xs">已删除</span>
          </div>
        </div>
        <div v-else class="flex flex-wrap items-start justify-between gap-3">
          <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <RouterLink v-if="entry.author.id" :to="`/user/${entry.author.id}`" class="break-words rounded-sm text-sm font-semibold text-zinc-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400">{{ entry.author.nickname }}</RouterLink>
            <span v-else class="break-words text-sm font-semibold text-zinc-700">{{ entry.author.nickname }}</span>
            <span v-if="entry.is_deleted" class="text-xs text-zinc-500">已删除</span>
          </div>
          <Time :time="entry.created_at" class="shrink-0" />
        </div>
        <div class="guestbook-content mt-5 break-words text-sm leading-7 text-zinc-700" v-html="isAnnouncementRoot ? sanitizeAnnouncementHtml(entry.content) : sanitizeGuestbookHtml(entry.content)" />
        <div class="mt-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-t border-zinc-100 pt-3 text-sm text-zinc-500">
          <div class="flex flex-wrap items-center gap-1">
            <button v-if="!entry.is_deleted" type="button" :disabled="likePending" :aria-pressed="entry.liked_by_me" aria-label="点赞" class="inline-flex items-center gap-1 disabled:cursor-not-allowed disabled:opacity-50" :class="[actionClass, entry.liked_by_me ? 'bg-zinc-100 text-zinc-950' : '']" @click="$emit('like', entry)">
              <ThumbsUp class="h-4 w-4" aria-hidden="true" /> {{ entry.like_count }}
            </button>
            <button v-if="!entry.is_deleted" type="button" :disabled="likePending" class="inline-flex items-center gap-1" :class="actionClass" @click="$emit('reply', entry)"><MessageCircle class="h-4 w-4" aria-hidden="true" /> 回复</button>
            <span v-if="entry.parent_id === null && (entry.reply_count || 0) > 0" class="inline-flex items-center gap-1 px-2 text-xs"><MessagesSquare class="h-4 w-4" aria-hidden="true" /> {{ entry.reply_count }} 条回复</span>
          </div>
          <div v-if="!entry.is_deleted && !isAnnouncementRoot" ref="actionsMenu" class="relative ml-auto" @keydown="onMenuKeydown" @focusout="onMenuFocusOut">
            <button :id="`${menuId}-trigger`" ref="menuTrigger" type="button" :disabled="likePending || confirmPending" aria-label="更多操作" aria-haspopup="menu" :aria-expanded="showMenu" :aria-controls="showMenu ? menuId : undefined"
              class="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              @click="toggleMenu" @keydown="onTriggerKeydown">
              <MoreHorizontal class="h-4 w-4" aria-hidden="true" />
            </button>
            <div v-if="showMenu" :id="menuId" ref="menuPanel" role="menu" aria-orientation="vertical" :aria-labelledby="`${menuId}-trigger`"
              class="absolute right-0 z-50 w-40 rounded-md border border-zinc-200 bg-white p-1 shadow-md" :class="menuAbove ? 'bottom-full mb-1' : 'top-full mt-1'">
              <button type="button" role="menuitem" tabindex="-1" :aria-expanded="showReport" :aria-controls="`guestbook-report-${entry.id}`"
                class="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-100 focus:bg-zinc-100 focus:outline-none"
                @click="openReport">
                <Flag class="h-4 w-4" aria-hidden="true" />举报
              </button>
              <button v-if="entry.is_me" type="button" role="menuitem" tabindex="-1"
                class="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 focus:bg-red-50 focus:outline-none"
                @click="selectDelete">
                <Trash2 class="h-4 w-4" aria-hidden="true" />删除
              </button>
            </div>
          </div>
        </div>
        <div v-if="showReport && !entry.is_deleted" :id="`guestbook-report-${entry.id}`" ref="reportPanel" class="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm">
          <span class="text-zinc-500">举报原因：</span>
          <button v-for="reason in reportReasons" :key="reason.value" type="button" class="rounded border border-zinc-200 bg-white px-2 py-1 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400" @click="report(reason.value)">{{ reason.label }}</button>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, useTemplateRef, watch } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { Flag, MessageCircle, MessagesSquare, MoreHorizontal, ThumbsUp, Trash2 } from 'lucide-vue-next'
import UserAvatar from '@/components/common/UserAvatar.vue'
import Time from '@/components/tinyComponents/Time.vue'
import { sanitizeAnnouncementHtml, sanitizeGuestbookHtml } from '@/lib/guestbook'
import { useShadcnDialog } from '@/lib/useShadcnDialog'
import type { DiscussionBoard, GuestbookEntry } from '@/types/api/guestbook'

const props = withDefaults(defineProps<{ entry: GuestbookEntry; highlighted?: boolean; likePending?: boolean; board?: DiscussionBoard; linkTitle?: boolean }>(), { board: 'guestbook', linkTitle: false })
const emit = defineEmits<{
  (event: 'like', entry: GuestbookEntry): void
  (event: 'reply', entry: GuestbookEntry): void
  (event: 'delete', entry: GuestbookEntry): void
  (event: 'report', entry: GuestbookEntry, reason: 'spam' | 'abuse' | 'privacy' | 'other'): void
}>()
const showReport = ref(false)
const showMenu = ref(false)
const menuAbove = ref(false)
const menuId = `discussion-actions-${useId()}`
const actionsMenu = useTemplateRef<HTMLElement>('actionsMenu')
const menuTrigger = useTemplateRef<HTMLButtonElement>('menuTrigger')
const menuPanel = useTemplateRef<HTMLElement>('menuPanel')
const reportPanel = useTemplateRef<HTMLElement>('reportPanel')
const confirmPending = ref(false)
const dialog = useShadcnDialog()
let disposed = false
onBeforeUnmount(() => { disposed = true })
const isAnnouncementRoot = computed(() => props.board === 'announcements' && props.entry.parent_id === null)
const showAvatar = computed(() => !isAnnouncementRoot.value)
const actionClass = 'h-8 rounded-md px-2 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50'
const menuItems = () => Array.from(menuPanel.value?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])
const closeMenu = (restoreFocus = true) => {
  showMenu.value = false
  if (restoreFocus && !menuTrigger.value?.disabled) menuTrigger.value?.focus({ preventScroll: true })
}
const openMenu = async (last = false) => {
  if (props.likePending || confirmPending.value || props.entry.is_deleted || isAnnouncementRoot.value) return
  const trigger = menuTrigger.value?.getBoundingClientRect()
  const menuHeight = props.entry.is_me ? 88 : 48
  menuAbove.value = Boolean(trigger && window.innerHeight - trigger.bottom < menuHeight && trigger.top > menuHeight)
  showMenu.value = true
  await nextTick()
  if (!showMenu.value) return
  const items = menuItems()
  items[last ? items.length - 1 : 0]?.focus({ preventScroll: true })
}
const toggleMenu = () => { if (showMenu.value) closeMenu(); else void openMenu() }
const onTriggerKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
  event.preventDefault()
  event.stopPropagation()
  void openMenu(event.key === 'ArrowUp')
}
const onMenuKeydown = (event: KeyboardEvent) => {
  if (!showMenu.value) return
  if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeMenu(); return }
  if (event.key === 'Tab') { closeMenu(); return }
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  const items = menuItems()
  if (!items.length) return
  const current = items.indexOf(document.activeElement as HTMLButtonElement)
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
    : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
  items[next]?.focus({ preventScroll: true })
}
const onMenuFocusOut = (event: FocusEvent) => {
  if (event.relatedTarget instanceof Node && !actionsMenu.value?.contains(event.relatedTarget)) closeMenu(false)
}
onClickOutside(actionsMenu, () => closeMenu(false))
watch([() => props.entry.id, () => props.board, () => props.entry.is_deleted, () => props.entry.is_me, () => props.likePending], () => {
  closeMenu(false)
  showReport.value = false
})
const openReport = async () => {
  closeMenu()
  showReport.value = !showReport.value
  await nextTick()
  if (showReport.value) reportPanel.value?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true })
}
const selectDelete = () => { closeMenu(); void remove() }
const reportReasons = [
  { label: '垃圾广告', value: 'spam' as const }, { label: '攻击辱骂', value: 'abuse' as const },
  { label: '泄露隐私', value: 'privacy' as const }, { label: '其他', value: 'other' as const },
]
const remove = async () => {
  if (confirmPending.value || props.likePending || props.entry.is_deleted || !props.entry.is_me || isAnnouncementRoot.value) return
  const entry = props.entry
  const board = props.board
  const title = entry.parent_id === null ? '删除留言' : '删除回复'
  confirmPending.value = true
  try {
    const confirmed = await dialog.confirm({
      title,
      description: '删除后其他用户将看到“内容已删除”，下级回复会保留。',
      confirmText: title,
      cancelText: '取消',
      destructive: true,
    })
    if (confirmed && !disposed && props.board === board && props.entry.id === entry.id && !props.entry.is_deleted && props.entry.is_me && !isAnnouncementRoot.value) emit('delete', entry)
  } finally {
    confirmPending.value = false
  }
}
const report = (reason: 'spam' | 'abuse' | 'privacy' | 'other') => {
  emit('report', props.entry, reason)
  showReport.value = false
}
</script>

<style>
.guestbook-content p { margin: 0 0 0.5rem; }
.guestbook-content p:last-child { margin-bottom: 0; }
.guestbook-content a { color: #1d4ed8; text-decoration: underline; text-underline-offset: 0.2em; }
.guestbook-content img { display: block; height: auto; margin: 0.75rem auto; max-width: 100%; border-radius: 0.5rem; }
.guestbook-content img[data-size="25"] { width: 25%; }
.guestbook-content img[data-size="50"] { width: 50%; }
.guestbook-content img[data-size="75"] { width: 75%; }
.guestbook-content img[data-size="100"] { width: 100%; }
article.discussion-entry .guestbook-content a { color: #18181b; }
article.discussion-entry .app-time { color: #71717a; }
article.discussion-entry .app-time:hover { color: #18181b; }
</style>
