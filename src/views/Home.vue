<template>
  <AppPageLayout>
      <div class="grid items-stretch gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <section
          aria-labelledby="latest-reviews-title"
          class="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <header class="flex items-center justify-between gap-4 px-5 pb-3 pt-5 sm:px-7 sm:pt-7">
            <div class="flex min-w-0 items-center gap-3">
              <MessageSquareText class="h-7 w-7 shrink-0 text-blue-700" aria-hidden="true" />
              <h1 id="latest-reviews-title" class="text-xl font-bold text-slate-900 sm:text-2xl">
                最近评价
              </h1>
            </div>
          </header>

          <div class="min-h-0 flex-1 overflow-hidden">
            <HomeReviewPreview />
          </div>

          <div class="border-t border-slate-200 px-5 py-4 text-center sm:px-7">
            <RouterLink
              to="/review/timeline"
              class="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg px-3 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              查看全部评价
              <ChevronRight class="h-4 w-4" aria-hidden="true" />
            </RouterLink>
          </div>
        </section>

        <section
          aria-labelledby="guestbook-title"
          class="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <header class="flex items-center gap-3 px-5 pb-3 pt-5 sm:px-7 sm:pt-7">
            <MessagesSquare class="h-7 w-7 shrink-0 text-blue-700" aria-hidden="true" />
            <h2 id="guestbook-title" class="text-xl font-bold text-slate-900 sm:text-2xl">
              留言板
            </h2>
          </header>

          <div class="min-h-0 flex-1 overflow-hidden">
            <GuestbookPreview />
          </div>

          <div class="border-t border-slate-200 px-5 py-4 text-center sm:px-7">
            <RouterLink
              to="/guestbook"
              class="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg px-3 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              查看更多
              <ChevronRight class="h-4 w-4" aria-hidden="true" />
            </RouterLink>
          </div>
        </section>
      </div>

      <details open class="group mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <summary
          class="flex min-h-16 cursor-pointer list-none items-center gap-3 rounded-2xl px-5 text-base font-semibold text-slate-800 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:px-7 [&::-webkit-details-marker]:hidden"
        >
          <School class="h-5 w-5 text-slate-700" aria-hidden="true" />
          <span>常用校内入口</span>
          <ChevronDown
            class="ml-auto h-5 w-5 text-slate-500 transition-transform duration-200 group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div class="border-t border-slate-200 px-5 py-5 sm:px-7">
          <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <a
              v-for="service in campusServices"
              :key="service.label"
              :href="service.url"
              target="_blank"
              rel="noopener noreferrer"
              class="flex min-h-11 items-center rounded-lg px-3 text-sm text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {{ service.label }}
              <ExternalLink class="ml-auto h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </details>
  </AppPageLayout>
</template>

<script setup lang="ts">
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  MessagesSquare,
  MessageSquareText,
  School,
} from 'lucide-vue-next'
import HomeReviewPreview from '@/components/courseReview/HomeReviewPreview.vue'
import GuestbookPreview from '@/components/guestbook/GuestbookPreview.vue'
import AppPageLayout from '@/components/layout/AppPageLayout.vue'

const campusServices = [
  { label: '教务管理系统', url: 'https://jwgl.nwu.edu.cn/sso/jziotlogin' },
  { label: '图书馆自助打印', url: 'https://weixinprinthost.woquyun.com/wq-web/#/index' },
  { label: '西大邮箱', url: 'https://mail.stumail.nwu.edu.cn/' },
  { label: 'WEB VPN', url: 'https://webvpn.nwu.edu.cn/' },
  { label: '彩虹体育馆预约', url: 'http://cgzx.nwu.edu.cn:8080/venues/auth' },
  {
    label: '图书馆馆藏检索',
    url: 'https://agentdockingopac.featurelib.libsou.com/showhome/search/showSearch?schoolId=25',
  },
  { label: '班车时刻表', url: 'https://hqjt.nwu.edu.cn/fwdt/bcsk.htm' },
  { label: '西大电话', url: 'https://www.nwu.edu.cn/ggzy/xddh.htm' },
  { label: '正版软件', url: 'https://zhengban.nwu.edu.cn/' },
]
</script>
