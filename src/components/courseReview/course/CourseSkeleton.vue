<template>
  <main class="min-h-[calc(100vh-7rem-6px)] w-full bg-gray-50" aria-busy="true" aria-label="正在加载课程详情" role="status">
    <span class="sr-only">正在加载课程详情</span>
    <div class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <header class="mb-8 min-h-[4.75rem] motion-safe:animate-pulse" aria-hidden="true">
        <div class="flex flex-wrap items-center gap-3">
          <div class="h-9 w-52 max-w-[65vw] rounded-lg bg-slate-200" />
          <div class="h-4 w-28 rounded-md bg-slate-200" />
        </div>
        <div class="mt-3 h-5 w-full max-w-md rounded-md bg-slate-100" />
      </header>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3" aria-hidden="true">
        <div class="min-w-0 lg:col-span-2">
          <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div class="p-5 motion-safe:animate-pulse sm:p-7">
              <div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div class="h-4 w-16 rounded-md bg-slate-100" />
                  <div class="mt-2 flex items-center gap-2">
                    <div class="flex gap-1">
                      <div v-for="index in 5" :key="`rating-${index}`" class="h-5 w-5 rounded bg-slate-200" />
                    </div>
                    <div class="h-7 w-10 rounded-md bg-slate-200" />
                    <div class="h-4 w-16 rounded-md bg-slate-100" />
                  </div>
                </div>
                <div class="flex gap-2">
                  <div class="h-7 w-20 rounded-full bg-slate-100" />
                  <div class="h-7 w-24 rounded-full bg-slate-100" />
                </div>
              </div>

              <div class="mt-6 grid gap-x-8 gap-y-5 border-t border-slate-200 pt-5 sm:grid-cols-2">
                <div v-for="index in 4" :key="`meta-${index}`">
                  <div class="h-4 w-16 rounded-md bg-slate-100" />
                  <div class="mt-2 h-4 w-2/3 rounded-md bg-slate-200" />
                </div>
              </div>

              <div class="mt-6 flex flex-col gap-2 border-t border-slate-200 pt-5 sm:flex-row">
                <div class="h-11 w-full rounded-lg bg-slate-200 sm:w-28" />
                <div class="h-11 w-full rounded-lg bg-slate-100 sm:w-32" />
              </div>
            </div>
          </section>

          <section class="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div class="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 motion-safe:animate-pulse sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div>
                <div class="h-6 w-24 rounded-md bg-slate-200" />
                <div class="mt-2 h-4 w-16 rounded-md bg-slate-100" />
              </div>
              <div class="h-11 w-full rounded-lg bg-slate-200 sm:w-24" />
            </div>

            <div class="px-5 py-5 sm:px-7">
              <div class="-mx-5 -mt-5 flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 motion-safe:animate-pulse sm:-mx-7 sm:flex-row sm:px-7">
                <div v-for="index in 3" :key="`filter-${index}`" class="min-w-0 flex-1 sm:min-w-36">
                  <div class="h-4 w-10 rounded-md bg-slate-200" />
                  <div class="mt-2 h-10 rounded-lg border border-slate-200 bg-white" />
                </div>
              </div>

              <div class="mt-5 divide-y divide-slate-200">
                <article v-for="reviewIndex in 2" :key="`review-${reviewIndex}`" class="py-6 first:pt-0 last:pb-0">
                  <div class="motion-safe:animate-pulse">
                    <div class="flex items-start justify-between gap-4">
                      <div class="flex min-w-0 items-center">
                        <div class="h-10 w-10 shrink-0 rounded-full bg-slate-200" />
                        <div class="ml-3">
                          <div class="h-5 w-24 rounded-md bg-slate-200" />
                          <div class="mt-2 h-4 w-32 rounded-md bg-slate-100" />
                        </div>
                      </div>
                      <div class="h-4 w-14 shrink-0 rounded-md bg-slate-100" />
                    </div>
                    <div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div v-for="metricIndex in 4" :key="`metric-${reviewIndex}-${metricIndex}`" class="h-4 rounded-md bg-slate-100" />
                    </div>
                    <div class="mt-5 space-y-3">
                      <div class="h-4 rounded-md bg-slate-100" />
                      <div class="h-4 w-11/12 rounded-md bg-slate-100" />
                      <div class="h-4 w-2/3 rounded-md bg-slate-100" />
                    </div>
                    <div class="mt-5 flex gap-2">
                      <div class="h-9 w-14 rounded-lg bg-slate-100" />
                      <div class="h-9 w-14 rounded-lg bg-slate-100" />
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </section>
        </div>

        <aside class="space-y-6">
          <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm motion-safe:animate-pulse sm:p-6">
            <div class="h-5 w-24 rounded-md bg-slate-200" />
            <div class="mt-5 space-y-5">
              <div v-for="index in 2" :key="`teacher-${index}`" class="flex items-center border-slate-200 pb-5 last:pb-0 [&:not(:last-child)]:border-b">
                <div class="h-10 w-10 shrink-0 rounded-full bg-slate-200" />
                <div class="ml-3 h-4 w-20 rounded-md bg-slate-200" />
                <div class="ml-auto h-4 w-16 rounded-md bg-slate-100" />
              </div>
            </div>
          </section>

          <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm motion-safe:animate-pulse sm:p-6">
            <div class="h-5 w-24 rounded-md bg-slate-200" />
            <div class="mt-2 h-4 w-3/4 rounded-md bg-slate-100" />
            <div class="mt-5 space-y-3">
              <div class="h-4 w-2/3 rounded-md bg-slate-100" />
              <div class="h-4 w-1/2 rounded-md bg-slate-100" />
            </div>
          </section>

          <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm motion-safe:animate-pulse sm:p-6">
            <div class="h-5 w-2/3 rounded-md bg-slate-200" />
            <div class="mt-5 space-y-3">
              <div class="h-4 w-3/5 rounded-md bg-slate-100" />
              <div class="h-4 w-4/5 rounded-md bg-slate-100" />
            </div>
          </section>
        </aside>
      </div>
    </div>
  </main>
</template>
