<template>
  <Teleport to="body">
    <Transition
      enter-active-class="ease-out duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="show" class="fixed inset-0 bg-black bg-opacity-25 z-50">
        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4 text-center">
            <div
              class="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all"
            >
              <h3 class="text-lg font-medium leading-6 text-gray-900">
                外部链接
              </h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500">
                  你即将访问一个外部网站:
                  <span class="font-medium text-gray-700 break-all">{{ url }}</span>
                </p>
              </div>

              <div class="mt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  class="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  @click="$emit('cancel')"
                >
                  取消
                </button>
                <button
                  type="button"
                  class="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  @click="$emit('confirm')"
                >
                  继续
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
  url: string
}>()

defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()
</script>
