<template>
  <div class="min-h-screen">
    <main class="container mx-auto py-12 px-6">
      <div class="flex flex-col md:flex-row">
        <div class="flex-grow">
          <div>
            <span :class="['text-3xl font-bold pb-2 text-gray-600 inline-block']">Welcome to&nbsp;</span><span
            :class="['text-3xl font-bold pb-2 text-gray-600 inline-block', { 'animate__animated animate__rubberBand': showAnimation }]"
          > NWU.ICU</span>
          </div>
          <div v-for="section in sections" :key="section.title"
               class="bg-white/50 backdrop-blur-md rounded-lg shadow-md p-6 flex flex-col">
            <div class="flex items-center gap-4 mb-4">
              <div class="bg-primary rounded-full p-2">
                <BookIcon class="w-6 h-6 text-primary-foreground" />
              </div>
              <h2 class="text-lg font-semibold">{{ section.title }}</h2>
            </div>
            <div class="grid grid-cols-2 gap-4 auto-rows-fr">
              <a v-for="item in section.items" :key="item.label" :href="item.url" target="_blank"
                 rel="noopener noreferrer"
                 class="bg-white/50 backdrop-blur-md rounded-lg shadow-md p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-500 hover:text-slate-50 transition-colors">
                <component :is="item.icon" class="w-8 h-8" />
                <span>{{ item.label }}</span>
              </a>
            </div>
          </div>
        </div>

        <div class="flex-col">
          <router-link :to="'/review/timeline'" class="block">
            <h1
              class="text-3xl underline font-bold text-gray-900 px-4 pb-4 sm:px-6 lg:px-8 hover:text-primary transition-colors mt-8 md:mt-0">
              最近评价</h1>
          </router-link>

          <ReviewTimeline :showHeader="false" :pageSize="3" />
        </div>
      </div>

    </main>
  </div>
</template>

<script setup lang="ts">
import { Bike, BookOpenText, Bus, Laptop, Library, Mail, Phone, Printer, Waypoints } from 'lucide-vue-next'
import ReviewTimeline from '@/views/courseReview/ReviewTimeline.vue'
import { onMounted, ref } from 'vue'

const showAnimation = ref(false)

onMounted(() => {
  setTimeout(() => {
    showAnimation.value = true
  }, 200)
})

const sections = [
  {
    title: '西大服务',
    color: 'primary',
    items: [
      { label: '教务管理系统', icon: BookOpenText, url: 'https://jwgl.nwu.edu.cn/sso/jziotlogin' },
      { label: '图书馆自助打印', icon: Printer, url: 'https://weixinprinthost.woquyun.com/wq-web/#/index' },
      { label: '西大邮箱', icon: Mail, url: 'https://mail.stumail.nwu.edu.cn/' },
      { label: 'WEB VPN', icon: Waypoints, url: 'https://webvpn.nwu.edu.cn/' },
      { label: '彩虹体育馆预约', icon: Bike, url: 'http://cgzx.nwu.edu.cn:8080/venues/auth' },
      {
        label: '图书馆馆藏检索',
        icon: Library,
        url: 'https://agentdockingopac.featurelib.libsou.com/showhome/search/showSearch?schoolId=25',
      },
      {
        label: '班车时刻表',
        icon: Bus,
        url: 'https://hqjt.nwu.edu.cn/fwdt/bcsk.htm',
      },
      {
        label: '西大电话',
        icon: Phone,
        url: 'https://www.nwu.edu.cn/ggzy/xddh.htm',
      },
      {
        label: '正版软件',
        icon: Laptop,
        url: 'https://zhengban.nwu.edu.cn/',
      },
    ],
  },
]
</script>
