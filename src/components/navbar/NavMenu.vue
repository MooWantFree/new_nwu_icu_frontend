<template>
  <nav ref="navigation" class="hidden items-center text-[13px] font-medium md:flex" aria-label="主导航" @focusout="handleFocusOut">
    <ul class="flex items-center gap-0.5">
      <li v-for="item in menuItems" :key="item.key" class="relative group">
        <template v-if="item.children">
          <div class="flex items-stretch rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
            :class="{ 'bg-zinc-100 text-zinc-950': isItemActive(item) }">
            <RouterLink v-if="item.path" :to="item.path"
              class="flex h-9 items-center rounded-l-md pl-3 pr-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
              @click="closeAllSubmenus">{{ item.text }}</RouterLink>
            <span v-else class="flex h-9 items-center pl-3 pr-1">{{ item.text }}</span>
            <button type="button" class="flex h-9 items-center rounded-r-md px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
              :data-submenu-trigger="item.key" :aria-label="'展开' + item.text + '菜单'" aria-haspopup="menu"
              :aria-controls="submenuId(item.key)" :aria-expanded="openSubmenus.includes(item.key)"
              @click="toggleSubmenu(item.key)" @keydown.down.stop.prevent="openSubmenu(item.key)"
              @keydown.up.stop.prevent="openSubmenu(item.key, true)" @keydown.esc.stop.prevent="closeAndRestore(item.key)">
              <ChevronDown class="h-3.5 w-3.5 transition-transform" :class="{ 'rotate-180': openSubmenus.includes(item.key) }" aria-hidden="true" />
            </button>
          </div>
          <div v-show="openSubmenus.includes(item.key)" :id="submenuId(item.key)" role="menu" :aria-label="item.text"
            class="absolute left-0 z-50 mt-1.5 w-44 rounded-md border border-zinc-200 bg-white p-1 text-sm text-zinc-700 shadow-md"
            @keydown="handleMenuKeydown($event, item.key)">
            <RouterLink v-for="child in item.children" :key="child.key" :to="child.path" role="menuitem" tabindex="-1"
              class="flex min-h-8 items-center rounded-md px-2 py-1.5 text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:bg-zinc-100 focus-visible:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400"
              :class="{ 'bg-zinc-100 text-zinc-950': isPathActive(child.path) }" @click="closeAllSubmenus">{{ child.text }}</RouterLink>
          </div>
        </template>
        <RouterLink v-else-if="item.path" :to="item.path"
          class="flex h-9 items-center rounded-md px-3 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
          :class="{ 'bg-zinc-100 text-zinc-950': isPathActive(item.path) }" @click="closeAllSubmenus">{{ item.text }}</RouterLink>
        <button v-else-if="item.onclick" type="button"
          class="flex h-9 items-center rounded-md px-3 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
          @click="handleCustomClick(item)">{{ item.text }}</button>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, useId } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronDown } from 'lucide-vue-next'

interface MenuItem {
  key: string
  text: string
  icon?: any
  path?: string
  onclick?: () => void
  children?: { key: string; text: string; path: string }[]
}
defineProps<{ menuItems: MenuItem[] }>()
const route = useRoute()
const navigation = ref<HTMLElement | null>(null)
const instanceId = 'navigation-' + useId()
const openSubmenus = ref<string[]>([])
const submenuId = (key: string) => instanceId + '-' + key
const isPathActive = (path: string) => route.path === path || (path !== '/' && route.path.startsWith(path + '/'))
const isItemActive = (item: MenuItem) => Boolean(item.path && isPathActive(item.path))
  || Boolean(item.children?.some(child => isPathActive(child.path)))
const submenuItems = (key: string) => Array.from(document.getElementById(submenuId(key))?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
const closeAllSubmenus = () => { openSubmenus.value = [] }
const closeAndRestore = (key: string) => {
  closeAllSubmenus()
  Array.from(navigation.value?.querySelectorAll<HTMLButtonElement>('[data-submenu-trigger]') ?? [])
    .find(button => button.dataset.submenuTrigger === key)?.focus()
}
const openSubmenu = async (key: string, last = false) => {
  openSubmenus.value = [key]
  await nextTick()
  if (!openSubmenus.value.includes(key)) return
  const items = submenuItems(key)
  const target = last ? items.at(-1) : items[0]
  target?.focus()
}
const toggleSubmenu = (key: string) => {
  if (openSubmenus.value.includes(key)) closeAllSubmenus()
  else void openSubmenu(key)
}
const handleCustomClick = (item: MenuItem) => {
  closeAllSubmenus()
  item.onclick?.()
}
const handleMenuKeydown = (event: KeyboardEvent, key: string) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    closeAndRestore(key)
    return
  }
  const items = submenuItems(key)
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
  if (event.relatedTarget instanceof Node && !navigation.value?.contains(event.relatedTarget)) closeAllSubmenus()
}
const handleClickOutside = (event: MouseEvent) => {
  if (event.target instanceof Node && !navigation.value?.contains(event.target)) closeAllSubmenus()
}
onMounted(() => { document.addEventListener('click', handleClickOutside) })
onUnmounted(() => { document.removeEventListener('click', handleClickOutside) })
</script>
