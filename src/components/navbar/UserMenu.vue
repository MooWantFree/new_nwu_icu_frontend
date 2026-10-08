<template>
  <div ref="menuRoot" class="relative" @keydown.esc.stop.prevent="closeMenu(true)" @focusout="handleFocusOut">
    <button v-if="!isLoggedIn" type="button" :disabled="isLoading"
      class="inline-flex h-9 w-9 items-center justify-center rounded-md bg-zinc-950 text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      aria-label="登录或注册" title="登录或注册" @click="emit('showLoginModal')">
      <LogIn class="h-4 w-4" aria-hidden="true" />
    </button>

    <div v-else class="relative">
      <button ref="menuTrigger" type="button" aria-label="打开个人菜单" aria-haspopup="menu"
        :aria-expanded="isDropdownOpen" :aria-controls="menuId" :disabled="loggingOut"
        class="inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        @click="toggleMenu" @keydown.down.stop.prevent="openMenu()" @keydown.up.stop.prevent="openMenu(true)">
        <UserAvatar :avatar="userInfo?.avatar" :uuid="userInfo?.uuid" :has-avatar="userInfo?.has_avatar"
          alt="用户头像" class="h-9 w-9 rounded-full border border-zinc-200 object-cover" />
      </button>

      <div v-if="isDropdownOpen" :id="menuId" ref="menuPanel" role="menu" aria-label="个人菜单"
        class="absolute right-0 z-50 mt-2 w-48 rounded-md border border-zinc-200 bg-white p-1 text-sm text-zinc-700 shadow-md"
        @keydown="handleMenuKeydown">
        <RouterLink to="/user/me" role="menuitem" tabindex="-1" :class="menuItemClass" @click="closeMenu()">
          <User class="h-4 w-4 shrink-0 text-zinc-500" aria-hidden="true" />用户资料
        </RouterLink>
        <RouterLink to="/user/settings/profile" role="menuitem" tabindex="-1" :class="menuItemClass" @click="closeMenu()">
          <Pencil class="h-4 w-4 shrink-0 text-zinc-500" aria-hidden="true" />编辑用户资料
        </RouterLink>
        <div class="my-1 h-px bg-zinc-100" role="separator" />
        <button type="button" role="menuitem" tabindex="-1" :disabled="loggingOut" :class="menuItemClass" @click="handleLogout">
          <LogOut class="h-4 w-4 shrink-0 text-zinc-500" aria-hidden="true" />{{ loggingOut ? '正在退出…' : '退出登录' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, useId } from 'vue'
import { api } from '@/lib/requests'
import { User, Pencil, LogIn, LogOut } from 'lucide-vue-next'
import type { APILogin } from '@/types/api/user/user'
import UserAvatar from '@/components/common/UserAvatar.vue'

type UserProfile = APILogin['response']
defineProps<{ isLoggedIn: boolean; isLoading: boolean; userInfo: UserProfile | null }>()
const emit = defineEmits<{
  (e: 'showLoginModal'): void
  (e: 'logout'): void
  (e: 'showMessage', message: string, type: 'success' | 'error' | 'info'): void
}>()
const menuRoot = ref<HTMLElement | null>(null)
const menuTrigger = ref<HTMLButtonElement | null>(null)
const menuPanel = ref<HTMLElement | null>(null)
const menuId = 'account-menu-' + useId()
const isDropdownOpen = ref(false)
const loggingOut = ref(false)
const menuItemClass = 'flex min-h-8 w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:bg-zinc-100 focus-visible:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50'

const menuItems = () => Array.from(menuPanel.value?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
  .filter(item => !item.matches(':disabled'))

const openMenu = async (last = false) => {
  if (loggingOut.value) return
  isDropdownOpen.value = true
  await nextTick()
  if (!isDropdownOpen.value) return
  const items = menuItems()
  const target = last ? items.at(-1) : items[0]
  target?.focus()
}
const closeMenu = (restoreFocus = false) => {
  isDropdownOpen.value = false
  if (restoreFocus) menuTrigger.value?.focus()
}
const toggleMenu = () => {
  if (isDropdownOpen.value) closeMenu()
  else void openMenu()
}
const handleMenuKeydown = (event: KeyboardEvent) => {
  const items = menuItems()
  const index = items.indexOf(document.activeElement as HTMLElement)
  let target: HTMLElement | undefined
  if (event.key === 'ArrowDown') target = items[(index + 1) % items.length]
  else if (event.key === 'ArrowUp') target = items[(index - 1 + items.length) % items.length]
  else if (event.key === 'Home') target = items[0]
  else if (event.key === 'End') target = items.at(-1)
  else if (event.key === ' ' && event.target instanceof HTMLAnchorElement) {
    event.preventDefault()
    event.target.click()
  }
  if (target) {
    event.preventDefault()
    target.focus()
  }
}
const handleFocusOut = (event: FocusEvent) => {
  if (event.relatedTarget instanceof Node && !menuRoot.value?.contains(event.relatedTarget)) closeMenu()
}
const handleLogout = async () => {
  if (loggingOut.value || !window.dispatchEvent(new CustomEvent('guestbook:before-logout', { cancelable: true }))) return
  loggingOut.value = true
  try {
    const { status } = await api.post({ url: '/api/user/logout/' })
    if (status !== 200) {
      emit('showMessage', '退出登录失败，请稍后再试', 'error')
      emit('logout')
      return
    }
    emit('logout')
    emit('showMessage', '成功退出登录，欢迎你下次再来', 'success')
  } catch {
    emit('showMessage', '退出登录失败，请稍后再试', 'error')
    emit('logout')
  } finally {
    loggingOut.value = false
    closeMenu()
  }
}
const handleClickOutside = (event: MouseEvent) => {
  if (isDropdownOpen.value && event.target instanceof Node && !menuRoot.value?.contains(event.target)) closeMenu()
}
onMounted(() => { document.addEventListener('click', handleClickOutside) })
onUnmounted(() => { document.removeEventListener('click', handleClickOutside) })
</script>
