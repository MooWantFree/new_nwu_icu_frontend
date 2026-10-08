<template>
  <div role="status" aria-label="正在加载教师详情" class="space-y-6">
    <span class="sr-only">正在加载教师详情</span>
    <div aria-hidden="true" class="flex flex-col gap-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm motion-safe:animate-pulse sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div class="flex min-w-0 items-center gap-4">
        <div class="h-12 w-12 shrink-0 rounded-xl bg-zinc-100" />
        <div class="min-w-0">
          <div class="h-8 w-36 rounded bg-zinc-200 sm:h-10" />
          <div class="mt-2 h-4 w-28 rounded bg-zinc-100" />
        </div>
      </div>
      <div class="grid shrink-0 grid-cols-2 gap-6 border-t border-zinc-100 pt-4 sm:gap-8 sm:border-t-0 sm:pt-0">
        <div v-for="index in 2" :key="index">
          <div class="h-3 w-16 rounded bg-zinc-100" />
          <div class="mt-2 h-7 w-10 rounded bg-zinc-200" />
        </div>
      </div>
    </div>
    <div aria-hidden="true">
      <div class="mb-4 flex items-center justify-between gap-3 motion-safe:animate-pulse">
        <div class="h-6 w-24 rounded bg-zinc-200" />
        <div class="h-11 w-28 rounded-lg bg-zinc-200" />
      </div>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div v-for="index in 6" :key="index" class="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm motion-safe:animate-pulse">
          <div class="h-5 w-3/4 rounded bg-zinc-200" />
          <div class="mt-2 h-4 w-1/2 rounded bg-zinc-100" />
          <div class="mt-4 grid grid-cols-2 gap-3 border-t border-zinc-100 pt-3">
            <div v-for="metric in 2" :key="metric" :class="{ 'flex flex-col items-end': metric === 2 }">
              <div class="h-3 w-16 rounded bg-zinc-100" />
              <div class="mt-2 h-5 w-12 rounded bg-zinc-200" />
            </div>
          </div>
          <div class="mt-3 flex justify-between gap-3">
            <div class="h-3 w-24 rounded bg-zinc-100" />
            <div class="h-3 w-16 rounded bg-zinc-100" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
