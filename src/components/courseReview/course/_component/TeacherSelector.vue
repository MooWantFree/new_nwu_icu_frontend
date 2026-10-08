<template>
  <ShadcnFormDialog
    :show="modelValue"
    title="选择教师"
    :busy="checkingLogin"
    :suspended="showAddTeacherModal"
    @close="closeModal"
  >
    <div class="space-y-4">
      <div class="flex flex-col gap-2 sm:flex-row">
        <div class="relative min-w-0 flex-1">
          <Search class="pointer-events-none absolute left-3 top-3 h-4 w-4 text-zinc-400" aria-hidden="true" />
          <input
            v-model="searchQuery"
            type="search"
            :disabled="checkingLogin || showAddTeacherModal"
            aria-label="搜索教师"
            placeholder="搜索教师姓名"
            class="h-10 w-full rounded-md border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-950 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
            @keydown.enter.prevent="searchNow"
          />
        </div>
        <button
          type="button"
          :disabled="checkingLogin || showAddTeacherModal"
          class="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          @click="handleAddTeacher"
        >
          <LoaderCircle v-if="checkingLogin" class="h-4 w-4 animate-spin" aria-hidden="true" />
          <Plus v-else class="h-4 w-4" aria-hidden="true" />
          添加教师
        </button>
      </div>

      <div v-if="draftTeachers.length" class="space-y-2" role="group" aria-label="已选择教师">
        <p class="text-xs font-medium text-zinc-500">已选择 {{ draftTeachers.length }} 位教师</p>
        <div class="flex flex-wrap gap-2">
          <span v-for="teacher in draftTeachers" :key="teacher.id" class="inline-flex max-w-full items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 py-1 pl-2 text-sm text-zinc-950">
            <span class="truncate">{{ teacher.name }}</span>
            <button
              type="button"
              :aria-label="`取消选择${teacher.name}`"
              :disabled="checkingLogin || showAddTeacherModal"
              class="mr-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-zinc-500 hover:bg-zinc-200 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
              @click="removeTeacher(teacher.id)"
            >
              <X class="h-3 w-3" aria-hidden="true" />
            </button>
          </span>
        </div>
      </div>

      <div
        v-if="searchLoading"
        class="flex min-h-48 items-center justify-center gap-2 text-sm text-zinc-500"
        role="status"
      >
        <LoaderCircle class="h-4 w-4 animate-spin" aria-hidden="true" />
        搜索中…
      </div>
      <div v-else-if="teachers.length" class="rounded-md border border-zinc-200">
        <div class="max-h-[min(45vh,360px)] divide-y divide-zinc-100 overflow-y-auto" role="region" aria-label="教师搜索结果" @scroll="handleScroll">
          <button
            v-for="teacher in teachers"
            :key="teacher.id"
            type="button"
            :aria-pressed="selectedIds.has(teacher.id)"
            :disabled="checkingLogin || showAddTeacherModal"
            class="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-950"
            :class="selectedIds.has(teacher.id) ? 'bg-zinc-50' : 'bg-white'"
            @click="toggleTeacher(teacher)"
          >
            <span class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 text-sm font-medium text-zinc-600">
              <img
                v-if="teacher.avatar_uuid && !failedAvatars.has(teacher.avatar_uuid)"
                :src="`/api/download/${teacher.avatar_uuid}/`"
                alt=""
                class="h-full w-full object-cover"
                @error="failedAvatars.add(teacher.avatar_uuid)"
              />
              <span v-else>{{ teacher.name.charAt(0) }}</span>
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-medium text-zinc-950">{{ teacher.name }}</span>
              <span class="mt-0.5 block truncate text-xs text-zinc-500">{{ teacher.school }}</span>
            </span>
            <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border" :class="selectedIds.has(teacher.id) ? 'border-zinc-950 bg-zinc-950 text-white' : 'border-zinc-300 bg-white'" aria-hidden="true">
              <Check v-if="selectedIds.has(teacher.id)" class="h-3 w-3" />
            </span>
          </button>
          <div v-if="scrollLoading" class="flex items-center justify-center gap-2 py-4 text-xs text-zinc-500" role="status">
            <LoaderCircle class="h-4 w-4 animate-spin" aria-hidden="true" />
            加载更多…
          </div>
        </div>
        <div v-if="searchError" class="flex items-center justify-between gap-3 border-t border-zinc-200 px-3 py-3 text-sm" role="alert">
          <span class="text-zinc-500">{{ searchError }}</span>
          <button type="button" class="shrink-0 font-medium text-zinc-950 underline underline-offset-4" @click="handleSearch(true)">重试</button>
        </div>
      </div>
      <div v-else-if="searchError" class="rounded-md border border-zinc-200 px-4 py-8 text-center" role="alert">
        <p class="text-sm text-zinc-500">{{ searchError }}</p>
        <button type="button" class="mt-3 inline-flex h-9 items-center justify-center rounded-md border border-zinc-200 px-3 text-sm font-medium text-zinc-950 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2" @click="searchNow">重新加载</button>
      </div>
      <div v-else-if="!searchQuery.trim()" class="rounded-md border border-dashed border-zinc-200 px-4 py-8 text-center">
        <Search class="mx-auto h-5 w-5 text-zinc-400" aria-hidden="true" />
        <p class="mt-3 text-sm font-medium text-zinc-950">输入教师姓名开始搜索</p>
        <p class="mt-1 text-xs text-zinc-500">也可以直接添加一位新教师。</p>
      </div>
      <div v-else class="rounded-md border border-dashed border-zinc-200 px-4 py-8 text-center">
        <Search class="mx-auto h-5 w-5 text-zinc-400" aria-hidden="true" />
        <p class="mt-3 text-sm font-medium text-zinc-950">未找到教师</p>
        <p class="mt-1 text-xs text-zinc-500">试试其他姓名，或添加一位新教师。</p>
        <button type="button" :disabled="checkingLogin || showAddTeacherModal" class="mt-3 inline-flex h-9 items-center justify-center gap-2 rounded-md border border-zinc-200 px-3 text-sm font-medium text-zinc-950 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" @click="handleAddTeacher">
          <Plus class="h-4 w-4" aria-hidden="true" />
          添加新教师
        </button>
      </div>
    </div>
    <template #footer>
      <button type="button" :disabled="checkingLogin || showAddTeacherModal" class="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-950 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" @click="closeModal">取消</button>
      <button type="button" :disabled="checkingLogin || showAddTeacherModal" class="inline-flex h-10 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" @click="confirmSelection">确认选择</button>
    </template>
  </ShadcnFormDialog>
  <AddTeacherModal v-if="modelValue && showAddTeacherModal" v-model="showAddTeacherModal" @add="handleTeacherAdded" />
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { Check, LoaderCircle, Plus, Search, X } from 'lucide-vue-next'
import ShadcnFormDialog from '@/components/common/ShadcnFormDialog.vue'
import { api } from '@/lib/requests'
import { useCreationLogin } from '@/lib/useCreationLogin'
import { useShadcnToast } from '@/lib/useShadcnToast'
import type { TeacherSearchResult } from '@/types/api/search/search'
import AddTeacherModal from '../AddTeacherModal.vue'

const props = defineProps<{ modelValue: boolean; selectedTeachers?: TeacherSearchResult[] }>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', teachers: TeacherSearchResult[]): void
}>()

const message = useShadcnToast()
const { checkingLogin, requireLogin } = useCreationLogin()
const searchQuery = ref('')
const teachers = ref<TeacherSearchResult[]>([])
const draftTeachers = ref<TeacherSearchResult[]>([])
const selectedIds = computed(() => new Set(draftTeachers.value.map(teacher => teacher.id)))
const searchLoading = ref(false)
const scrollLoading = ref(false)
const searchError = ref('')
const currentPage = ref(0)
const totalPage = ref(1)
const showAddTeacherModal = ref(false)
const failedAvatars = reactive(new Set<string>())
let requestId = 0
let openSession = 0
let unmounted = false
let debounceTimer: ReturnType<typeof setTimeout> | undefined

const cancelDebounce = () => {
  clearTimeout(debounceTimer)
  debounceTimer = undefined
}

const resetSearch = () => {
  ++requestId
  teachers.value = []
  searchError.value = ''
  searchLoading.value = false
  scrollLoading.value = false
  currentPage.value = 0
  totalPage.value = 1
}

const handleSearch = async (loadMore = false) => {
  if (!props.modelValue || unmounted || (loadMore && (searchLoading.value || scrollLoading.value))) return
  const keyword = searchQuery.value.trim()
  if (!keyword) {
    resetSearch()
    return
  }
  const id = ++requestId
  const page = loadMore ? currentPage.value + 1 : 1
  searchError.value = ''
  if (loadMore) {
    scrollLoading.value = true
  } else {
    searchLoading.value = true
    scrollLoading.value = false
    teachers.value = []
    currentPage.value = 0
  }
  const isCurrent = () => !unmounted && props.modelValue && id === requestId
  try {
    const query = { keyword, type: 'teacher' as const, current_page: page, page_size: 10 }
    const response = await api.post({ url: '/api/search/', query })
    if (!isCurrent()) return
    if (response.status !== 200) throw new Error('Search failed')
    const contents = response.content ?? response.data.contents
    const results = contents.search_result.filter((result): result is TeacherSearchResult => 'school' in result && 'name' in result)
    teachers.value = loadMore ? [...teachers.value, ...results] : results
    currentPage.value = contents.current_page || page
    totalPage.value = contents.total_pages || 1
  } catch {
    if (!isCurrent()) return
    searchError.value = loadMore ? '加载更多教师失败' : '搜索教师失败，请稍后重试'
    message.error(searchError.value)
  } finally {
    if (isCurrent()) {
      searchLoading.value = false
      scrollLoading.value = false
    }
  }
}

const searchNow = () => {
  cancelDebounce()
  void handleSearch()
}

watch(searchQuery, () => {
  cancelDebounce()
  ++requestId
  if (!props.modelValue) return
  if (!searchQuery.value.trim()) {
    resetSearch()
    return
  }
  searchError.value = ''
  teachers.value = []
  searchLoading.value = true
  scrollLoading.value = false
  debounceTimer = setTimeout(searchNow, 300)
})

watch(() => props.modelValue, (show) => {
  ++openSession
  ++requestId
  cancelDebounce()
  showAddTeacherModal.value = false
  if (show) {
    draftTeachers.value = [...new Map((props.selectedTeachers ?? []).map(teacher => [teacher.id, teacher])).values()]
    searchNow()
  } else {
    draftTeachers.value = []
    searchLoading.value = false
    scrollLoading.value = false
  }
}, { immediate: true })

const handleScroll = (event: Event) => {
  const container = event.currentTarget as HTMLElement
  if (container.scrollHeight - container.scrollTop - container.clientHeight < 50 && !searchError.value && currentPage.value < totalPage.value) {
    void handleSearch(true)
  }
}

const handleAddTeacher = async () => {
  if (!props.modelValue || showAddTeacherModal.value || checkingLogin.value) return
  const session = openSession
  if (await requireLogin('添加教师') && !unmounted && props.modelValue && session === openSession) {
    showAddTeacherModal.value = true
  }
}

function toggleTeacher(teacher: TeacherSearchResult) {
  if (!props.modelValue || showAddTeacherModal.value || checkingLogin.value) return
  if (selectedIds.value.has(teacher.id)) {
    removeTeacher(teacher.id)
  } else {
    draftTeachers.value.push(teacher)
  }
}

function removeTeacher(id: number) {
  if (!props.modelValue || showAddTeacherModal.value || checkingLogin.value) return
  draftTeachers.value = draftTeachers.value.filter(teacher => teacher.id !== id)
}

function confirmSelection() {
  if (!props.modelValue || showAddTeacherModal.value || checkingLogin.value) return
  emit('select', [...draftTeachers.value])
  closeModal()
}

function handleTeacherAdded(teacher: TeacherSearchResult) {
  if (!props.modelValue || !showAddTeacherModal.value) return
  if (!selectedIds.value.has(teacher.id)) draftTeachers.value.push(teacher)
  showAddTeacherModal.value = false
}

function closeModal() {
  if (!props.modelValue || checkingLogin.value || showAddTeacherModal.value) return
  cancelDebounce()
  ++requestId
  draftTeachers.value = []
  showAddTeacherModal.value = false
  emit('update:modelValue', false)
}

onBeforeUnmount(() => {
  unmounted = true
  ++requestId
  cancelDebounce()
})
</script>
