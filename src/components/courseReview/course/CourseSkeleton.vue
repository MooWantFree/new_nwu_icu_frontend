<template>
  <main class="min-h-screen bg-gray-100">
    <div class="container mx-auto pt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="lg:col-span-2">
        <div class="p-6 bg-white rounded-md shadow-md h-60">
          <n-skeleton text size="large" width="30%" />
          <n-skeleton :repeat="6" text />
        </div>
        <div class="p-6 mt-6 bg-white rounded-md shadow-md h-full">
          <n-skeleton text size="large" width="30%" />
          <n-skeleton text size="medium" class="mt-5" />
          <div class="mt-3" />
          <n-skeleton :repeat="18" class="" />
          <br />
          <n-skeleton :repeat="20" class="" />
        </div>
      </div>
      <aside class="space-y-6">
        <div class="p-6 bg-white rounded-md shadow-md h-96">
          <n-skeleton :repeat="16" text />
        </div>
        <div class="p-6 bg-white rounded-md shadow-md h-96">
          <n-skeleton :repeat="16" text />
        </div>
      </aside>
    </div>
  </main>
</template>
