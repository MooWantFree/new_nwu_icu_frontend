<template>
  <nav
    aria-label="课程评价目录"
    class="inline-flex rounded-xl bg-gray-100 p-1"
  >
    <RouterLink
      v-for="item in items"
      :key="item.key"
      :to="item.to"
      :aria-current="active === item.key ? 'page' : undefined"
      :class="[
        'inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors',
        active === item.key
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-600 hover:bg-white/70 hover:text-gray-900',
      ]"
    >
      <component :is="item.icon" class="h-4 w-4" aria-hidden="true" />
      {{ item.label }}
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
import { BookOpen, UsersRound } from 'lucide-vue-next'

defineProps<{
  active: 'course' | 'teacher'
}>()

const items = [
  { key: 'course', label: '课程', to: '/review/course', icon: BookOpen },
  { key: 'teacher', label: '教师', to: '/review/teacher', icon: UsersRound },
] as const
</script>
