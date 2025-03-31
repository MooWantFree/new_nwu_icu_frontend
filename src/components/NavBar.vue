<template>
  <header class="sticky top-0 z-40 w-full bg-white border-b border-gray-200 shadow-sm">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo component -->  
        <Logo @showMessage="showMessage" />

        <!-- Desktop Navigation Menu -->  
        <div class="hidden md:flex md:items-center md:justify-between md:flex-1 md:ml-10">
          <NavMenu :menuItems="menuOptions" />
          
          <div class="flex items-center space-x-4">
            <!-- Action Buttons (Search, Notifications) -->  
            <ActionButtons @showSearchModal="showSearchModal = true" />
            
            <!-- User Menu -->  
            <UserMenu 
              :isLoggedIn="isLoggedIn" 
              :isLoading="isLoading" 
              :userInfo="userInfo"
              @showLoginModal="showLoginPopup = true"
              @logout="logout"
              @showMessage="showMessage"
            />
          </div>
        </div>
        
        <!-- Mobile Menu -->  
        <div class="flex md:hidden items-center space-x-2">
          <button
            @click="showSearchModal = true"
            class="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            title="搜索"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          <MobileMenu
            :menuItems="menuOptions"
            :isLoggedIn="isLoggedIn"
            @showLoginModal="showLoginPopup = true"
            @logout="logout"
            @showMessage="showMessage"
          />
        </div>
      </div>
    </div>
  </header>
  
  <!-- Modals -->  
  <LoginModal 
    :isOpen="showLoginPopup" 
    @close="showLoginPopup = false"
    @loginSuccess="handleLoginSuccess"
  />
  
  <SearchModal v-if="showSearchModal" @close="showSearchModal = false" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useUser } from '@/lib/useUser'
import { APILogin } from '@/types/api/user/user'

// Import components
import Logo from '@/components/navbar/Logo.vue'
import NavMenu from '@/components/navbar/NavMenu.vue'
import ActionButtons from '@/components/navbar/ActionButtons.vue'
import UserMenu from '@/components/navbar/UserMenu.vue'
import MobileMenu from '@/components/navbar/MobileMenu.vue'
import LoginModal from '@/components/navbar/LoginModal.vue'
import SearchModal from '@/components/search/SearchModal.vue'

type UserProfile = APILogin['response']



// User state
const { isLoggedIn, login, logout, userInfo, isLoading } = useUser()

// Modal states
const showLoginPopup = ref(false)
const showSearchModal = ref(false)

// Responsive design
const pageWidth = ref(window.innerWidth)
const onPageWidthUpdate = () => {
  pageWidth.value = window.innerWidth
}

// Event handlers
const handleLoginSuccess = (data: UserProfile) => {
  login(data)
  const displayName = data?.nickname ?? data?.username ?? ''
  showMessage(`欢迎${displayName}，已成功登录`, 'success')
  showLoginPopup.value = false
}

// Custom message handler (replacing NaiveUI message)
const showMessage = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
  // This is a simple implementation - in a real app, you might want to use a toast library
  // or implement a custom toast component
  const toast = document.createElement('div')
  toast.className = `fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-md shadow-md z-50 transition-opacity duration-300 ${
    type === 'success' ? 'bg-green-500' : 
    type === 'error' ? 'bg-red-500' : 'bg-blue-500'
  } text-white`
  toast.textContent = text
  document.body.appendChild(toast)
  toast.style.opacity = '0'
  // Fade in
  setTimeout(() => {
    toast.style.opacity = '1'
  }, 10)
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.style.opacity = '0'
    setTimeout(() => {
      document.body.removeChild(toast)
    }, 300)
  }, 3000)
}

// Menu Options
const menuOptions = [
    {
    key: 'home',
    text: '主页',
    path: '/',
  },
  {
    key: 'courseReview',
    text: '课程评价',
    children: [
      {
        key: 'reviewTimeline',
        text: '时间线',
        path: '/review/timeline',
      },
      {
        key: 'reviewCourse',
        text: '课程',
        path: '/review/course',
      },
      {
        key: 'reviewTeacher',
        text: '教师',
        path: '/review/teacher',
      },
    ],
  },
  {
    key: 'resourceDownload',
    text: '资料下载',
    onclick: () => {
      const shouldOpen = confirm('在新的标签页打开资料下载页面（虽然也是我们的）')
      if (shouldOpen) {
        window.open('https://resour.nwu.icu', '_blank')
      }
    },
  },
  {
    key: 'about',
    text: '关于',
    path: '/about',
  },
]

// Event listeners for responsive design
onMounted(() => {
  window.addEventListener('resize', onPageWidthUpdate)
})

onUnmounted(() => {
  window.removeEventListener('resize', onPageWidthUpdate)
})
</script>
