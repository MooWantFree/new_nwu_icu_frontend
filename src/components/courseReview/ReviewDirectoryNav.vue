<template>
  <nav
    aria-label="课程评价目录"
    class="inline-flex w-fit items-center gap-1 rounded-lg bg-zinc-100 p-1"
  >
    <RouterLink
      v-for="item in items"
      :key="item.key"
      :to="item.to"
      :aria-current="active === item.key ? 'page' : undefined"
      :class="[
        'inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2',
        active === item.key
          ? 'bg-white text-zinc-950 shadow-sm'
          : 'text-zinc-500 hover:bg-white/70 hover:text-zinc-950',
      ]"
    >
      <component :is="item.icon" class="h-4 w-4" aria-hidden="true" />
      {{ item.label }}
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
import { BookOpen, Clock3, UsersRound } from 'lucide-vue-next'

defineProps<{
  active: 'timeline' | 'course' | 'teacher'
}>()

const items = [
  { key: 'timeline', label: '时间线', to: '/review/timeline', icon: Clock3 },
  { key: 'course', label: '课程', to: '/review/course', icon: BookOpen },
  { key: 'teacher', label: '教师', to: '/review/teacher', icon: UsersRound },
] as const
</script>
