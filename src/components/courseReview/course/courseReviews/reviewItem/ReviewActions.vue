<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger
      :id="`reviewActionsButton-${reviewId}`"
      type="button"
      class="inline-flex h-10 w-10 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
      aria-label="打开评价操作菜单"
    >
      <EllipsisVertical class="h-4 w-4" aria-hidden="true" />
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent
        side="top"
        align="end"
        :side-offset="4"
        :collision-padding="8"
        class="z-50 min-w-40 rounded-md border border-zinc-200 bg-white p-1 shadow-md"
      >
        <DropdownMenuItem
          class="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-sm text-zinc-700 outline-none data-[highlighted]:bg-zinc-100 data-[highlighted]:text-zinc-950"
          @select="emit('reviewEdit')"
        >
          <Pencil class="h-4 w-4 text-zinc-400" aria-hidden="true" />
          编辑评价
        </DropdownMenuItem>
        <DropdownMenuItem
          class="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-sm text-red-700 outline-none data-[highlighted]:bg-red-50"
          @select="emit('reviewDelete')"
        >
          <Trash2 class="h-4 w-4 text-red-400" aria-hidden="true" />
          删除评价
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>

<script setup lang="ts">
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-vue-next'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from 'reka-ui'

defineProps<{ reviewId: number }>()
const emit = defineEmits<{
  (e: 'reviewEdit'): void
  (e: 'reviewDelete'): void
}>()
</script>
