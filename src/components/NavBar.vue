<template>
  <header class="app-nav sticky top-0 z-40 w-full bg-white border-b border-zinc-200">
    <div class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo component -->  
        <div class="flex shrink-0 items-center gap-2">
          <Logo @showMessage="showMessage" />
          <RouterLink to="/" aria-label="NWU.ICU 主页" class="flex flex-col rounded-md">
            <span class="text-[15px] font-semibold leading-5 tracking-tight text-zinc-950">NWU.ICU</span>
            <span class="hidden text-[10px] leading-4 tracking-wide text-zinc-500 sm:block">Campus community</span>
          </RouterLink>
        </div>

        <!-- Desktop Navigation Menu -->  
        <div class="hidden lg:flex lg:items-center lg:justify-between lg:flex-1 lg:ml-8">
          <NavMenu :menuItems="menuOptions" :class="{ 'review-nav-active': isReviewRoute }" />
          
          <div class="flex items-center space-x-4">
            <!-- Action Buttons (Search, Notifications) -->  
            <ActionButtons @showSearchModal="showSearchModal = true" />
            
            <!-- User Menu -->  
            <UserMenu 
              class="app-account"
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
        <div class="app-mobile flex items-center space-x-2 lg:hidden">
          <button
            type="button"
            @click="showSearchModal = true"
            class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-500 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
            aria-label="打开全局搜索"
            aria-haspopup="dialog"
            title="全局搜索"
          >
            <Search class="h-4 w-4" aria-hidden="true" />
          </button>

          <MobileMenu
            :class="{ 'review-nav-active': isReviewRoute }"
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
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUser } from '@/lib/useUser'
import { useShadcnToast } from '@/lib/useShadcnToast'
import { APILogin } from '@/types/api/user/user'
import { Search } from 'lucide-vue-next'

// Import components
import Logo from '@/components/navbar/Logo.vue'
import NavMenu from '@/components/navbar/NavMenu.vue'
import ActionButtons from '@/components/navbar/ActionButtons.vue'
import UserMenu from '@/components/navbar/UserMenu.vue'
import MobileMenu from '@/components/navbar/MobileMenu.vue'
import LoginModal from '@/components/navbar/LoginModal.vue'
import SearchModal from '@/components/search/SearchModal.vue'

type UserProfile = APILogin['response']
const route = useRoute()
const toast = useShadcnToast()
const isReviewRoute = computed(() => route.path === '/review' || route.path.startsWith('/review/'))

// User state
const { isLoggedIn, logout, userInfo, isLoading, fetchUserInfo } = useUser()

// Modal states
const showLoginPopup = ref(false)
const showSearchModal = ref(false)

// Responsive design
const pageWidth = ref(window.innerWidth)
const onPageWidthUpdate = () => {
  pageWidth.value = window.innerWidth
}

// Event handlers
const handleLoginSuccess = async (data: UserProfile) => {
  await fetchUserInfo()
  const displayName = data?.nickname ?? data?.username ?? ''
  showMessage(`欢迎${displayName}，已成功登录`, 'success')
  showLoginPopup.value = false
}

const showMessage = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
  toast[type](text)
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
    path: '/review/timeline',
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
    key: 'guestbook',
    text: '留言板',
    path: '/guestbook',
  },
  {
    key: 'resourceDownload',
    text: '资料下载',
    path: '/disk',
  },
  {
    key: 'announcements',
    text: '公告栏',
    path: '/announcements',
  },
  {
    key: 'about',
    text: '关于本站',
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

<style scoped>
.app-nav {
  border-color: #e4e4e7;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: none;
  backdrop-filter: blur(12px);
}

.app-nav :deep(nav) {
  font-size: 13px;
  font-weight: 500;
}

.app-nav :deep(nav ul) {
  gap: 2px;
}

.app-nav :deep(nav li + li) {
  margin-left: 0;
}

.app-nav :deep(nav a:hover),
.app-nav :deep(nav button:hover),
.app-nav :deep(nav li > div:hover),
.app-nav :deep(.app-mobile a:hover),
.app-nav :deep(.app-mobile button:hover) {
  color: #18181b;
  background-color: #f4f4f5;
}

.app-nav :deep(nav a.router-link-exact-active),
.app-nav :deep(nav li > div:has(> a.router-link-exact-active)),
.app-nav :deep(nav.review-nav-active li.group:has(a[href="/review/timeline"]) > div.flex),
.app-nav :deep(.app-mobile .review-nav-active .items-stretch:has(> a[href="/review/timeline"])),
.app-nav :deep(.app-mobile .items-stretch:has(> a.router-link-exact-active)),
.app-nav :deep(.app-mobile a.router-link-exact-active) {
  color: #18181b;
  background-color: #f4f4f5;
}

.app-nav :deep(button:focus-visible),
.app-nav :deep(a:focus-visible) {
  outline: 2px solid #71717a;
  outline-offset: 3px;
  --tw-ring-color: #71717a;
}

.app-nav :deep(.app-mobile > .md\:hidden) {
  display: block;
}

.app-nav :deep(.app-mobile .shadow-lg),
.app-nav :deep(nav .shadow-lg),
.app-nav :deep(.app-account .shadow-lg) {
  border: 1px solid #e4e4e7;
  box-shadow: 0 4px 12px rgb(24 24 27 / 8%);
}
</style>
