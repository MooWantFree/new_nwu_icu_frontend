import { computed, onBeforeUnmount, ref, watch } from 'vue'

const openModals = ref<symbol[]>([])

export function useModalLayer(show: () => boolean) {
  const id = Symbol('modal')
  const remove = () => { openModals.value = openModals.value.filter(candidate => candidate !== id) }
  watch(show, visible => {
    if (visible && !openModals.value.includes(id)) openModals.value.push(id)
    else if (!visible) remove()
  }, { immediate: true, flush: 'sync' })
  onBeforeUnmount(remove)
  return computed(() => 50 + Math.max(0, openModals.value.indexOf(id)) * 2)
}
