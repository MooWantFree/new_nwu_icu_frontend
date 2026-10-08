<template>
  <main class="home-page min-h-[calc(100vh-7rem)] bg-zinc-50 text-zinc-950">
    <div class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <header class="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">校园日常</h1>

        <div class="flex flex-wrap items-center gap-2">
          <RouterLink to="/review/course" class="home-button home-button-primary">
            <BookOpen class="h-4 w-4" aria-hidden="true" />
            浏览课程
            <ArrowRight class="h-4 w-4" aria-hidden="true" />
          </RouterLink>
          <RouterLink to="/disk" class="home-button home-button-outline">
            <FolderDown class="h-4 w-4" aria-hidden="true" />
            查找资料
          </RouterLink>
        </div>
      </header>

      <div class="grid items-stretch gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
        <section aria-labelledby="latest-reviews-title" class="home-card flex min-w-0 flex-col overflow-hidden">
          <header class="flex items-center justify-between gap-4 border-b border-zinc-100 px-5 py-5 sm:px-6">
            <h2 id="latest-reviews-title" class="text-base font-semibold tracking-tight">最近评价</h2>
            <span class="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-500">
              <Clock3 class="h-3 w-3" aria-hidden="true" />
              最新
            </span>
          </header>

          <div class="min-h-0 flex-1 overflow-hidden">
            <HomeReviewPreview />
          </div>

          <div class="border-t border-zinc-100 px-5 py-3 sm:px-6">
            <RouterLink to="/review/timeline" class="home-footer-link">
              查看全部评价
              <ArrowRight class="h-3.5 w-3.5" aria-hidden="true" />
            </RouterLink>
          </div>
        </section>

        <section aria-labelledby="guestbook-title" class="home-card flex min-w-0 flex-col overflow-hidden">
          <header class="flex items-center justify-between gap-4 border-b border-zinc-100 px-5 py-5 sm:px-6">
            <h2 id="guestbook-title" class="text-base font-semibold tracking-tight">留言板</h2>
            <MessagesSquare class="h-4 w-4 text-zinc-400" aria-hidden="true" />
          </header>

          <div class="min-h-0 flex-1 overflow-hidden">
            <GuestbookPreview />
          </div>

          <div class="border-t border-zinc-100 px-5 py-3 sm:px-6">
            <RouterLink to="/guestbook" class="home-footer-link">
              查看更多留言
              <ArrowRight class="h-3.5 w-3.5" aria-hidden="true" />
            </RouterLink>
          </div>
        </section>
      </div>

      <div class="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
        <section aria-labelledby="announcement-title" class="home-card min-w-0 overflow-hidden">
          <header class="flex items-center justify-between gap-4 border-b border-zinc-100 px-5 py-5 sm:px-6">
            <div class="flex items-center gap-2.5">
              <Megaphone class="h-4 w-4 text-zinc-500" aria-hidden="true" />
              <h2 id="announcement-title" class="text-base font-semibold tracking-tight">公告栏</h2>
            </div>
            <RouterLink to="/announcements" class="home-footer-link text-xs">
              全部公告
              <ArrowUpRight class="h-3.5 w-3.5" aria-hidden="true" />
            </RouterLink>
          </header>
          <AnnouncementPreview />
        </section>

        <details open class="home-card group min-w-0 overflow-hidden">
          <summary class="flex min-h-16 cursor-pointer list-none items-center gap-2.5 px-5 py-5 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400 sm:px-6 [&::-webkit-details-marker]:hidden">
            <School class="h-4 w-4 text-zinc-500" aria-hidden="true" />
            <span class="text-base font-semibold tracking-tight">常用校内入口</span>
            <ChevronDown class="ml-auto h-4 w-4 text-zinc-400 transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div class="border-t border-zinc-100 px-4 pb-4 pt-3 sm:px-5">
            <div class="grid grid-cols-2 gap-1">
              <a
                v-for="service in campusServices"
                :key="service.label"
                :href="service.url"
                target="_blank"
                rel="noopener noreferrer"
                class="flex min-h-11 min-w-0 items-center gap-2 rounded-md px-2 text-xs text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
              >
                <span>{{ service.label }}</span>
                <ArrowUpRight class="ml-auto h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden="true" />
              </a>
            </div>
          </div>
        </details>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  Clock3,
  FolderDown,
  Megaphone,
  MessagesSquare,
  School,
} from 'lucide-vue-next'
import HomeReviewPreview from '@/components/courseReview/HomeReviewPreview.vue'
import AnnouncementPreview from '@/components/guestbook/AnnouncementPreview.vue'
import GuestbookPreview from '@/components/guestbook/GuestbookPreview.vue'

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

<style scoped>
.home-card {
  border: 1px solid #e4e4e7;
  border-radius: 0.75rem;
  background: #fff;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.025);
}

.home-button {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 150ms, box-shadow 150ms;
}

.home-button-primary {
  background: #18181b;
  color: #fafafa;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
}

.home-button-primary:hover {
  background: #3f3f46;
}

.home-button-outline {
  border-color: #e4e4e7;
  background: #fff;
  color: #18181b;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.025);
}

.home-button-outline:hover {
  background: #f4f4f5;
}

.home-footer-link {
  display: inline-flex;
  min-height: 2rem;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.25rem;
  color: #52525b;
  font-size: 0.8125rem;
  font-weight: 500;
  transition: color 150ms;
}

.home-footer-link:hover {
  color: #09090b;
}

.home-page a:focus-visible {
  outline: 2px solid #a1a1aa;
  outline-offset: 3px;
}
</style>
