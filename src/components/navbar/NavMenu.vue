<template>
  <nav class="hidden md:flex items-center">
    <ul class="flex space-x-2">
      <li v-for="item in menuItems" :key="item.key" class="relative group">
        <!-- Menu item with children -->
        <template v-if="item.children">
          <button 
            class="flex items-center px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-md transition-colors"
            @click="toggleSubmenu(item.key)"
          >
            <span class="mr-2">{{ item.text }}</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              class="h-4 w-4 transition-transform" 
              :class="{ 'rotate-180': openSubmenus.includes(item.key) }"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <!-- Dropdown menu -->
          <div 
            v-show="openSubmenus.includes(item.key)"
            class="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-10"
          >
            <router-link 
              v-for="child in item.children" 
              :key="child.key"
              :to="child.path"
              class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
              @click="closeAllSubmenus"
            >
              {{ child.text }}
            </router-link>
          </div>
        </template>
        
        <!-- Menu item without children -->
        <template v-else-if="item.path">
          <router-link 
            :to="item.path" 
            class="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            {{ item.text }}
          </router-link>
        </template>
        
        <!-- Menu item with custom click handler -->
        <template v-else-if="item.onclick">
          <button 
            @click="item.onclick" 
            class="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            {{ item.text }}
          </button>
        </template>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface MenuItem {
  key: string
  text: string
  icon?: any
  path?: string
  onclick?: () => void
  children?: {
    key: string
    text: string
    path: string
  }[]
}

// Define props
defineProps<{
  menuItems: MenuItem[]
}>()

// Track open submenus
const openSubmenus = ref<string[]>([])

// Toggle submenu visibility
const toggleSubmenu = (key: string) => {
  if (openSubmenus.value.includes(key)) {
    openSubmenus.value = openSubmenus.value.filter(k => k !== key)
  } else {
    openSubmenus.value.push(key)
  }
}

// Close all submenus
const closeAllSubmenus = () => {
  openSubmenus.value = []
}

// Close submenus when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (openSubmenus.value.length > 0) {
    const target = event.target as HTMLElement
    if (!target.closest('.group')) {
      closeAllSubmenus()
    }
  }
}

// Add and remove event listener
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<script lang="ts">
import { onMounted, onUnmounted } from 'vue'
</script>
