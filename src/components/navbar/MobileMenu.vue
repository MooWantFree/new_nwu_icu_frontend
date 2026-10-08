<template>
  <div ref="menuRoot" class="md:hidden" @keydown.esc.stop.prevent="closeMenu(true)" @focusout="handleFocusOut">
    <button ref="menuTrigger" type="button" aria-label="打开导航菜单" aria-haspopup="menu"
      :aria-expanded="isMenuOpen" :aria-controls="menuId"
      class="inline-flex h-10 w-10 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
      @click="toggleMenu" @keydown.down.stop.prevent="openMenu()" @keydown.up.stop.prevent="openMenu(true)">
      <Menu class="h-5 w-5" aria-hidden="true" />
    </button>

    <div v-if="isMenuOpen" :id="menuId" ref="menuPanel" role="menu" aria-label="移动导航"
      class="absolute right-4 top-16 z-50 max-h-[calc(100dvh-5rem)] w-[min(18rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-md border border-zinc-200 bg-white p-1 text-sm text-zinc-700 shadow-md"
      @keydown="handleMenuKeydown">
      <div v-for="item in menuItems" :key="item.key" role="none">
        <template v-if="item.children">
          <div class="flex items-stretch rounded-md text-zinc-600" :class="{ 'bg-zinc-100 text-zinc-950': isItemActive(item) }" role="none">
            <RouterLink v-if="item.path" :to="item.path" role="menuitem" tabindex="-1"
              class="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-l-md px-3 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400"
              @click="closeMenu()"><component :is="item.icon" v-if="item.icon" class="h-4 w-4 shrink-0" aria-hidden="true" />{{ item.text }}</RouterLink>
            <span v-else class="flex min-h-11 flex-1 items-center gap-2 px-3"><component :is="item.icon" v-if="item.icon" class="h-4 w-4 shrink-0" aria-hidden="true" />{{ item.text }}</span>
            <button type="button" role="menuitem" tabindex="-1" :data-submenu-toggle="item.key" :aria-label="'展开' + item.text + '菜单'"
              :aria-expanded="openSubmenus.includes(item.key)" :aria-controls="submenuId(item.key)"
              class="flex min-h-11 w-11 shrink-0 items-center justify-center rounded-r-md transition-colors hover:bg-zinc-100 focus-visible:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400"
              @click="toggleSubmenu(item.key)">
              <ChevronDown class="h-4 w-4 transition-transform" :class="{ 'rotate-180': openSubmenus.includes(item.key) }" aria-hidden="true" />
            </button>
          </div>
          <div v-if="openSubmenus.includes(item.key)" :id="submenuId(item.key)" :data-submenu-group="item.key" role="group" :aria-label="item.text" class="my-1 ml-3 border-l border-zinc-200 pl-2">
            <RouterLink v-for="child in item.children" :key="child.key" :to="child.path" role="menuitem" tabindex="-1"
              :class="[menuItemClass, { 'bg-zinc-100 text-zinc-950': isPathActive(child.path) }]"
              @click="closeMenu()">{{ child.text }}</RouterLink>
          </div>
        </template>
        <RouterLink v-else-if="item.path" :to="item.path" role="menuitem" tabindex="-1"
          :class="[menuItemClass, { 'bg-zinc-100 text-zinc-950': isPathActive(item.path) }]" @click="closeMenu()">
          <component :is="item.icon" v-if="item.icon" class="h-4 w-4 shrink-0" aria-hidden="true" />{{ item.text }}
        </RouterLink>
        <button v-else-if="item.onclick" type="button" role="menuitem" tabindex="-1" :class="menuItemClass" @click="handleCustomClick(item)">
          <component :is="item.icon" v-if="item.icon" class="h-4 w-4 shrink-0" aria-hidden="true" />{{ item.text }}
        </button>
      </div>

      <div class="my-1 h-px bg-zinc-100" role="separator" />
      <template v-if="isLoggedIn">
        <RouterLink to="/user/me" role="menuitem" tabindex="-1" :class="menuItemClass" @click="closeMenu()">
          <User class="h-4 w-4 shrink-0 text-zinc-500" aria-hidden="true" />用户资料
        </RouterLink>
        <RouterLink to="/message/inbox" role="menuitem" tabindex="-1" :class="menuItemClass" @click="closeMenu()">
          <Mail class="h-4 w-4 shrink-0 text-zinc-500" aria-hidden="true" />消息
        </RouterLink>
        <button type="button" role="menuitem" tabindex="-1" :disabled="loggingOut" :class="menuItemClass" @click="handleLogout">
          <LogOut class="h-4 w-4 shrink-0 text-zinc-500" aria-hidden="true" />{{ loggingOut ? '正在退出…' : '退出登录' }}
        </button>
      </template>
      <button v-else type="button" role="menuitem" tabindex="-1" :class="menuItemClass" @click="emit('showLoginModal'); closeMenu()">
        <LogIn class="h-4 w-4 shrink-0 text-zinc-500" aria-hidden="true" />登录/注册
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, useId } from 'vue'
import { useRoute } from 'vue-router'
import { User, LogOut, LogIn, Mail, Menu, ChevronDown } from 'lucide-vue-next'
import { api } from '@/lib/requests'

interface MenuItem {
  key: string
  text: string
  icon?: any
  path?: string
  onclick?: () => void
  children?: { key: string; text: string; path: string }[]
}
defineProps<{ menuItems: MenuItem[]; isLoggedIn: boolean }>()
const emit = defineEmits<{
  (e: 'showLoginModal'): void
  (e: 'logout'): void
  (e: 'showMessage', message: string, type: 'success' | 'error' | 'info'): void
}>()
const route = useRoute()
const menuRoot = ref<HTMLElement | null>(null)
const menuTrigger = ref<HTMLButtonElement | null>(null)
const menuPanel = ref<HTMLElement | null>(null)
const menuId = 'mobile-navigation-' + useId()
const isMenuOpen = ref(false)
const loggingOut = ref(false)
const openSubmenus = ref<string[]>([])
const menuItemClass = 'flex min-h-11 w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:bg-zinc-100 focus-visible:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50'
const submenuId = (key: string) => menuId + '-' + key
const isPathActive = (path: string) => route.path === path || (path !== '/' && route.path.startsWith(path + '/'))
const isItemActive = (item: MenuItem) => Boolean(item.path && isPathActive(item.path))
  || Boolean(item.children?.some(child => isPathActive(child.path)))
const menuActions = () => Array.from(menuPanel.value?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
  .filter(item => !item.matches(':disabled'))
const openMenu = async (last = false) => {
  isMenuOpen.value = true
  await nextTick()
  if (!isMenuOpen.value) return
  const items = menuActions()
  const target = last ? items.at(-1) : items[0]
  target?.focus()
}
const closeMenu = (restoreFocus = false) => {
  isMenuOpen.value = false
  openSubmenus.value = []
  if (restoreFocus) menuTrigger.value?.focus()
}
const toggleMenu = () => {
  if (isMenuOpen.value) closeMenu()
  else void openMenu()
}
const toggleSubmenu = (key: string) => {
  openSubmenus.value = openSubmenus.value.includes(key)
    ? openSubmenus.value.filter(item => item !== key) : [...openSubmenus.value, key]
}
const handleMenuKeydown = async (event: KeyboardEvent) => {
  if (event.key === 'ArrowRight' && event.target instanceof HTMLElement && event.target.dataset.submenuToggle) {
    const key = event.target.dataset.submenuToggle
    event.preventDefault()
    if (!openSubmenus.value.includes(key)) openSubmenus.value.push(key)
    await nextTick()
    document.getElementById(submenuId(key))?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
    return
  }
  if (event.key === 'ArrowLeft' && event.target instanceof HTMLElement) {
    const group = event.target.closest<HTMLElement>('[data-submenu-group]')
    const key = group?.dataset.submenuGroup
    if (key) {
      event.preventDefault()
      openSubmenus.value = openSubmenus.value.filter(item => item !== key)
      Array.from(menuPanel.value?.querySelectorAll<HTMLButtonElement>('[data-submenu-toggle]') ?? [])
        .find(button => button.dataset.submenuToggle === key)?.focus()
      return
    }
  }
  const items = menuActions()
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
const handleCustomClick = (item: MenuItem) => {
  closeMenu()
  item.onclick?.()
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
const handleFocusOut = (event: FocusEvent) => {
  if (event.relatedTarget instanceof Node && !menuRoot.value?.contains(event.relatedTarget)) closeMenu()
}
const handleClickOutside = (event: MouseEvent) => {
  if (isMenuOpen.value && event.target instanceof Node && !menuRoot.value?.contains(event.target)) closeMenu()
}
onMounted(() => { document.addEventListener('click', handleClickOutside) })
onUnmounted(() => { document.removeEventListener('click', handleClickOutside) })
</script>
