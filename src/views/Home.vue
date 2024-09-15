<template>
  <div class="bg-gradient-to-br from-[#f0f0f0] to-[#e0e0e0] min-h-screen">
    <main class="container mx-auto py-12 px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div v-for="section in sections" :key="section.title"
        class="bg-white/50 backdrop-blur-md rounded-lg shadow-md p-6">
        <div class="flex items-center gap-4 mb-4">
          <div class="bg-primary rounded-full p-2">
            <BookIcon class="w-6 h-6 text-primary-foreground" />
          </div>
          <h2 class="text-lg font-semibold">{{ section.title }}</h2>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <a v-for="item in section.items" :key="item.label"
            class="bg-white/50 backdrop-blur-md rounded-lg shadow-md p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-500 hover:text-slate-50 transition-colors">
            <component :is="item.icon" class="w-8 h-8" />
            <span>{{ item.label }}</span>
          </a>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'

const TempIcon = (props: { class?: string }) => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  class: props.class
}, [
  h('rect', { width: 18, height: 18, x: 3, y: 3, rx: 2, ry: 2 }),
  h('path', { d: 'M12 8v8' }),
  h('path', { d: 'M8 12h8' })
])

const sections = [
  {
    title: 'Academics',
    color: 'primary',
    icon: TempIcon,
    items: [
      { label: 'Colleges', icon: TempIcon },
      { label: 'Departments', icon: TempIcon },
      { label: 'Academic Calendar', icon: TempIcon },
      { label: 'Academic Calendar', icon: TempIcon },
      { label: 'Courses', icon: TempIcon }
    ]
  },
  {
    title: 'Campus',
    color: 'secondary',
    icon: TempIcon,
    items: [
      { label: 'Campus Map', icon: TempIcon },
      { label: 'IT Services', icon: TempIcon },
      { label: 'Career Services', icon: TempIcon },
      { label: 'Student Life', icon: TempIcon }
    ]
  },
  {
    title: 'Quick Links',
    color: 'muted',
    icon: TempIcon,
    items: [
      { label: 'News', icon: TempIcon },
      { label: 'Events', icon: TempIcon },
      { label: 'Contact', icon: TempIcon },
      { label: 'Administration', icon: TempIcon }
    ]
  },
  {
    title: 'Research',
    color: 'card',
    icon: TempIcon,
    items: [
      { label: 'Labs', icon: TempIcon },
      { label: 'Grants', icon: TempIcon },
      { label: 'Publications', icon: TempIcon },
      { label: 'Facilities', icon: TempIcon }
    ]
  }
]
</script>