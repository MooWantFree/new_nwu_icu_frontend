<template>
    <n-tooltip placement="bottom" trigger="hover">
        <template #trigger>
            <n-time :time="parsedTime" type="relative" />
        </template>
        <n-time :time="parsedTime" format="yyyy-MM-dd hh:mm:ss" />
    </n-tooltip>
</template>

<script lang="ts" setup>
import { NTime } from 'naive-ui'
import { computed } from 'vue'

const props = defineProps<{
    time: string | Date
}>()

const parsedTime = computed(() => new Date(props.time))
</script>