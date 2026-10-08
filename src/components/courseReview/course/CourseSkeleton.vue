<template>
  <main class="min-h-[calc(100vh-7rem)] w-full bg-zinc-50" aria-busy="true" aria-label="正在加载课程详情" role="status">
    <span class="sr-only">正在加载课程详情</span>
    <div class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <header class="mb-8 motion-safe:animate-pulse" aria-hidden="true">
        <div class="h-9 w-52 max-w-[65vw] rounded-lg bg-zinc-200 sm:h-10" />
        <div class="mt-3 flex items-center gap-2">
          <div class="h-8 w-20 rounded-md bg-zinc-200" />
          <div class="h-4 w-28 rounded-md bg-zinc-200" />
        </div>
      </header>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3" aria-hidden="true">
        <div class="min-w-0 lg:col-span-2">
          <section class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgb(0_0_0_/_0.025)]">
            <div class="border-b border-zinc-100 px-5 py-4 motion-safe:animate-pulse sm:px-6">
              <div class="h-6 w-20 rounded-md bg-zinc-200" />
            </div>
            <div class="p-5 motion-safe:animate-pulse sm:p-6">
              <div class="grid grid-cols-2 gap-5 border-b border-zinc-100 pb-5">
                <div v-for="index in 2" :key="`rating-${index}`">
                  <div class="h-4 w-24 rounded-md bg-zinc-100" />
                  <div class="mt-2 h-9 w-20 rounded-md bg-zinc-200" />
                  <div class="mt-2 flex gap-1">
                    <div v-for="star in 5" :key="star" class="h-5 w-5 rounded bg-zinc-100" />
                  </div>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-x-6 gap-y-4 pt-5">
                <div v-for="index in 4" :key="`meta-${index}`">
                  <div class="h-4 w-16 rounded-md bg-zinc-100" />
                  <div class="mt-2 h-4 w-2/3 rounded-md bg-zinc-200" />
                </div>
                <div class="col-span-2">
                  <div class="h-4 w-16 rounded-md bg-zinc-100" />
                  <div class="mt-2 flex gap-2">
                    <div class="h-6 w-20 rounded-md bg-zinc-100" />
                    <div class="h-6 w-24 rounded-md bg-zinc-100" />
                  </div>
                </div>
              </div>
            </div>
            <div class="flex gap-2 border-t border-zinc-100 px-5 py-4 motion-safe:animate-pulse sm:px-6">
              <div class="h-10 w-28 rounded-lg bg-zinc-200" />
              <div class="h-10 w-32 rounded-lg bg-zinc-100" />
            </div>
          </section>

          <section class="mt-6 min-w-0">
            <div class="mb-4 flex flex-col gap-3 motion-safe:animate-pulse sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div class="h-6 w-24 rounded-md bg-zinc-200" />
                <div class="mt-2 h-4 w-16 rounded-md bg-zinc-100" />
              </div>
              <div class="h-10 w-full rounded-md bg-zinc-200 sm:w-24" />
            </div>
            <div class="grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm motion-safe:animate-pulse sm:grid-cols-3">
              <div v-for="index in 3" :key="`filter-${index}`" class="min-w-0 flex-1">
                <div class="h-4 w-10 rounded-md bg-zinc-200" />
                <div class="mt-2 h-10 rounded-md border border-zinc-200 bg-white" />
              </div>
            </div>
            <div class="mt-4 space-y-4">
              <article v-for="reviewIndex in 2" :key="`review-${reviewIndex}`" class="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm motion-safe:animate-pulse sm:p-5">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex min-w-0 items-center gap-3">
                    <div class="h-10 w-10 shrink-0 rounded-full bg-zinc-200" />
                    <div>
                      <div class="h-5 w-24 rounded-md bg-zinc-200" />
                      <div class="mt-2 h-4 w-32 rounded-md bg-zinc-100" />
                    </div>
                  </div>
                  <div class="h-4 w-14 shrink-0 rounded-md bg-zinc-100" />
                </div>
                <div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div v-for="metricIndex in 4" :key="metricIndex" class="h-4 rounded-md bg-zinc-100" />
                </div>
                <div class="mt-5 space-y-3">
                  <div class="h-4 rounded-md bg-zinc-100" />
                  <div class="h-4 w-11/12 rounded-md bg-zinc-100" />
                  <div class="h-4 w-2/3 rounded-md bg-zinc-100" />
                </div>
                <div class="mt-5 flex gap-2">
                  <div class="h-9 w-14 rounded-lg bg-zinc-100" />
                  <div class="h-9 w-14 rounded-lg bg-zinc-100" />
                </div>
              </article>
            </div>
          </section>
        </div>

        <aside class="min-w-0 space-y-6">
          <section class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgb(0_0_0_/_0.025)] motion-safe:animate-pulse">
            <div class="border-b border-zinc-100 px-5 py-4 sm:px-6">
              <div class="h-6 w-24 rounded-md bg-zinc-200" />
            </div>
            <div class="divide-y divide-zinc-100">
              <div v-for="index in 2" :key="`teacher-${index}`" class="flex items-center gap-3 px-5 py-4 sm:px-6">
                <div class="h-10 w-10 shrink-0 rounded-full bg-zinc-200" />
                <div>
                  <div class="h-4 w-20 rounded-md bg-zinc-200" />
                  <div class="mt-2 h-3 w-28 rounded-md bg-zinc-100" />
                </div>
              </div>
            </div>
          </section>
          <section v-for="index in 2" :key="`related-${index}`" class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgb(0_0_0_/_0.025)] motion-safe:animate-pulse">
            <div class="border-b border-zinc-100 px-5 py-4 sm:px-6">
              <div class="h-6 w-28 rounded-md bg-zinc-200" />
            </div>
            <div class="space-y-4 px-5 py-5 sm:px-6">
              <div class="h-4 w-2/3 rounded-md bg-zinc-100" />
              <div class="h-4 w-4/5 rounded-md bg-zinc-100" />
            </div>
          </section>
        </aside>
      </div>
    </div>
  </main>
</template>
