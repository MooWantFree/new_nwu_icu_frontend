<template>
  <div class="min-h-screen bg-gradient-to-b">
    <main class="container mx-auto py-10 px-6">
      <div class="flex flex-col md:flex-row gap-10">
        <div class="flex-grow space-y-10">
          <div class="mb-8 text-center md:text-left">
            <div class="flex flex-col md:flex-row items-center md:items-end gap-2">
              <h1 class="text-5xl font-bold text-gray-800">Welcome to</h1>
              <span
                class="text-5xl font-bold text-primary bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600"
                :class="{ 'animate__animated animate__rubberBand': showAnimation }"
              >
                NWU.ICU
              </span>
            </div>
            <!-- <p class="mt-4 text-gray-600 max-w-2xl mx-auto md:mx-0 text-lg">Your comprehensive portal for Northwestern University resources and services.</p> -->
          </div>

          <div
            v-for="section in sections"
            :key="section.title"
            class="bg-white rounded-2xl shadow-sm p-8 transition-all hover:shadow-lg border border-gray-100"
          >
            <div class="flex items-center gap-4 mb-8">
              <div :class="`bg-gradient-to-r  rounded-full p-3 shadow-md ${section.color}`">
                <BookIcon class="w-7 h-7 text-white" />
              </div>
              <h2 class="text-2xl font-bold text-gray-800">{{ section.title }}</h2>
            </div>
            <div class="grid grid-cols-2 gap-5">
              <div v-for="item in section.items" :key="item.label">
                <router-link
                  v-if="item.openIn"
                  :to="item.url"
                  class="bg-gray-50 rounded-xl p-6 flex flex-col items-center justify-center gap-4 hover:bg-gradient-to-r from-blue-300 to-purple-400 hover:text-white transition-all duration-300 group shadow-sm hover:shadow-md border border-gray-100 hover:border-transparent"
                >
                  <component :is="item.icon"
                             class="w-10 h-10 group-hover:scale-110 transition-transform duration-300" />
                  <span class="text-center font-medium">{{ item.label }}</span>
                </router-link>
                <a
                  v-else
                  :href="item.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="bg-gray-50 rounded-xl p-6 flex flex-col items-center justify-center gap-4 hover:bg-gradient-to-r from-blue-300 to-purple-400 hover:text-white transition-all duration-300 group shadow-sm hover:shadow-md border border-gray-100 hover:border-transparent"
                >
                  <component :is="item.icon"
                             class="w-10 h-10 group-hover:scale-110 transition-transform duration-300" />
                  <span class="text-center font-medium">{{ item.label }}</span>
                </a>
              </div>

            </div>
          </div>
        </div>

        <div class="md:w-1/2 bg-white rounded-2xl shadow-sm p-8 border border-gray-100 h-fit sticky top-8">
          <div class="flex items-center justify-between mb-8">
            <router-link :to="'/review/timeline'" class="group">
              <h2 class="text-2xl font-bold text-gray-800 group-hover:text-primary transition-colors">
                最近评价
              </h2>
            </router-link>
            <router-link :to="'/review/timeline'"
                         class="text-primary font-medium hover:underline flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors">
              查看更多
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </router-link>
          </div>
          <ReviewTimeline :showHeader="false" :pageSize="3" />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import {
  Bike,
  BookOpenText,
  Bus,
  Download,
  Laptop,
  Library,
  Mail,
  Phone,
  Printer,
  School,
  Waypoints,
} from 'lucide-vue-next'
import ReviewTimeline from '@/views/courseReview/ReviewTimeline.vue'
import { onMounted, ref } from 'vue'

const showAnimation = ref(false)

onMounted(() => {
  setTimeout(() => {
    showAnimation.value = true
  }, 500)
})

const sections = [
  {
    title: '本站服务',
    color: 'from-blue-500 to-purple-400',
    items: [
      { label: '课程评价', icon: School, url: '/review/timeline', openIn: true },
      { label: '资料下载', icon: Download, url: 'https://resour.nwu.icu', openIn: false },
    ],
  },
  {
    title: '西大服务',
    color: 'from-purple-500 to-blue-400',
    items: [
      { label: '教务管理系统', icon: BookOpenText, url: 'https://jwgl.nwu.edu.cn/sso/jziotlogin', openIn: false },
      {
        label: '图书馆自助打印',
        icon: Printer,
        url: 'https://weixinprinthost.woquyun.com/wq-web/#/index',
        openIn: false,
      },
      { label: '西大邮箱', icon: Mail, url: 'https://mail.stumail.nwu.edu.cn/', openIn: false },
      { label: 'WEB VPN', icon: Waypoints, url: 'https://webvpn.nwu.edu.cn/', openIn: false },
      { label: '彩虹体育馆预约', icon: Bike, url: 'http://cgzx.nwu.edu.cn:8080/venues/auth', openIn: false },
      {
        label: '图书馆馆藏检索',
        icon: Library,
        url: 'https://agentdockingopac.featurelib.libsou.com/showhome/search/showSearch?schoolId=25',
        openIn: false,
      },
      {
        label: '班车时刻表',
        icon: Bus,
        url: 'https://hqjt.nwu.edu.cn/fwdt/bcsk.htm',
        openIn: false,
      },
      {
        label: '西大电话',
        icon: Phone,
        url: 'https://www.nwu.edu.cn/ggzy/xddh.htm',
        openIn: false,
      },
      {
        label: '正版软件',
        icon: Laptop,
        url: 'https://zhengban.nwu.edu.cn/',
        openIn: false,
      },
    ],
  },
]
</script>
