<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none"
  >
    <div class="relative w-full max-w-3xl mx-auto my-6 px-4 sm:px-0">
      <div
        class="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-lg outline-none focus:outline-none max-h-[90vh]"
      >
        <div
          class="flex items-start justify-between p-4 sm:p-5 border-b border-solid border-gray-300 rounded-t"
        >
          <h3 class="text-xl sm:text-2xl font-semibold">
            {{ initContent?.content ? "编辑" : "新建" }}评价
          </h3>
          <button
            class="p-1 ml-auto bg-transparent border-0 text-black float-right text-3xl leading-none font-semibold outline-none focus:outline-none hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center w-8 h-8"
            @click="closeModal"
          >
            <span
              class="bg-transparent text-black block outline-none focus:outline-none"
            >
              ×
            </span>
          </button>
        </div>
        <div
          v-if="!loading"
          class="relative p-4 sm:p-6 flex-auto overflow-y-auto"
        >
          <div class="mt-4 border rounded-lg shadow-sm overflow-hidden">
            <div class="bg-gray-50 p-2 border-b">
              <h4 class="text-sm font-medium text-gray-700">评价详情</h4>
            </div>
            <div class="p-4 space-y-4">
              <div class="flex flex-col sm:flex-row justify-between gap-4">
                <div class="flex-1">
                  <label for="rating" class="block mb-1 text-sm font-medium text-gray-700">总体评分</label>
                  <Rate :max="5" v-model="rating" class="w-full" />
                </div>
                <div class="flex-1">
                  <label for="semester" class="block mb-1 text-sm font-medium text-gray-700">学期</label>
                  <n-select
                    id="semester"
                    v-model:value="selectedSemester"
                    :options="semesterOptions"
                    class="w-full"
                  />
                </div>
              </div>
              <div class="flex flex-col sm:flex-row justify-between gap-4">
                <div class="flex-1">
                  <label for="difficulty" class="block mb-1 text-sm font-medium text-gray-700">课程难度</label>
                  <Rate
                    id="difficulty"
                    v-model="difficulty"
                    :max="3"
                  />
                </div>
                <div class="flex-1">
                  <label for="homework" class="block mb-1 text-sm font-medium text-gray-700">作业多少</label>
                  <Rate
                    id="homework"
                    v-model="homework"
                    :max="3"
                  />
                </div>
              </div>
              <div class="flex flex-col sm:flex-row justify-between gap-4">
                <div class="flex-1">
                  <label for="grade" class="block mb-1 text-sm font-medium text-gray-700">给分好坏</label>
                  <Rate
                    id="grade"
                    v-model="grade"
                    :max="3"
                  />
                </div>
                <div class="flex-1">
                  <label for="reward" class="block mb-1 text-sm font-medium text-gray-700">收获大小</label>
                  <Rate
                    id="reward"
                    v-model="reward"
                    :max="3"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="mt-4 border rounded-lg shadow-sm overflow-hidden">
            <div class="bg-gray-50 p-2 border-b">
              <h4 class="text-sm font-medium text-gray-700">评价内容</h4>
            </div>
            <div class="p-4">
              <Editor
                v-model="content"
                :allowEdit="true"
                :withToolbar="true"
                class="min-h-[200px]"
              />
            </div>
          </div>
        </div>
        <div v-else class="relative p-4 sm:p-6 flex-auto overflow-y-auto">
          <div class="flex items-center justify-center h-full">
            <div className="flex flex-col items-center">
              <div
                className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
                role="status"
              >
                <span className="sr-only">加载中...</span>
              </div>
              <p className="mt-2 text-center font-medium">加载中</p>
            </div>
          </div>
        </div>
        <div
          class="flex flex-col sm:flex-row items-center justify-end p-4 sm:p-6 border-t border-solid border-gray-300 rounded-b"
        >
          <button
            class="w-full sm:w-auto px-6 py-2 mb-2 sm:mb-0 sm:mr-2 text-sm font-bold text-red-500 uppercase transition-all duration-150 ease-linear outline-none background-transparent focus:outline-none"
            type="button"
            @click="closeModal"
            :disabled="submitting || loading"
          >
            关闭
          </button>
          <div class="flex items-center">
            <input
              type="checkbox"
              id="anonymous"
              v-model="isAnonymous"
              class="mr-2"
            />
            <label for="anonymous" class="mr-4">匿名发布</label>
            <button
              class="w-full sm:w-auto px-6 py-3 text-sm font-bold text-white uppercase transition-all duration-150 ease-linear rounded shadow outline-none bg-blue-500 hover:bg-blue-600 active:bg-blue-700 focus:outline-none disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center"
              type="button"
              @click="submitReview"
              :disabled="submitting || loading"
            >
              <div
                v-if="submitting"
                class="mr-2 w-5 h-5 border-t-2 border-white rounded-full animate-spin"
              ></div>
              {{ submitting ? "提交中..." : "提交" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="fixed inset-0 z-40 bg-black opacity-25"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch, computed, ref } from "vue";
import Editor from "@/components/tiptap/editor/Editor.vue";
import { NewReviewRequest } from "@/types/api/review";
import { CourseData } from "@/types/courses";
import { SemesterListResponse } from "@/types/api/course";
import { api } from "@/lib/requests";
import Rate from "@/components/tinyComponents/Rate.vue";

const props = defineProps<{
  courseData: CourseData;
  modelValue: boolean;
  submitting: boolean;
  initContent: NewReviewRequest | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "submit", content: NewReviewRequest): void;
}>();

const content = ref(props.initContent?.content || "");
const isAnonymous = ref(props.initContent?.anonymous || false);
const rating = ref(props.initContent?.rating || 3);
const selectedSemester = ref(props.initContent?.semester || null);
const difficulty = ref(props.initContent?.difficulty || 2);
const homework = ref(props.initContent?.homework || 2);
const grade = ref(props.initContent?.grade || 2);
const reward = ref(props.initContent?.reward || 2);
const semesterData = ref<SemesterListResponse["success"] | null>(null);

const semesterListRequest = api.get<SemesterListResponse>(
  "/api/assessment/semester/"
);

const loading = ref(true);
onMounted(async () => {
  const response = await semesterListRequest;
  semesterData.value = response.content;
  loading.value = false;
});

const semesterOptions = computed(() => {
  if (!semesterData.value) return [];
  return Object.entries(semesterData.value)
    .reverse()
    .map(([key, value]) => ({
      label: value,
      value: Number(key),
    }));
});

const submitReview = async () => {
  const reviewData: NewReviewRequest = {
    course: props.courseData.id,
    content: content.value,
    rating: rating.value,
    anonymous: isAnonymous.value,
    difficulty: difficulty.value,
    grade: grade.value,
    homework: homework.value,
    reward: reward.value,
    semester: selectedSemester.value,
  };
  emit("submit", reviewData);
};

const closeModal = () => {
  if (
    content.value.trim() &&
    content.value.trim() !== "<p></p>" &&
    content.value !== props.initContent?.content
  ) {
    if (confirm("你有未保存的内容。确定要关闭吗？")) {
      emit("update:modelValue", false);
    }
  } else {
    emit("update:modelValue", false);
  }
};

const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  if (content.value.trim()) {
    event.preventDefault();
  }
};

onMounted(() => {
  window.addEventListener("beforeunload", handleBeforeUnload);
});

onUnmounted(() => {
  window.removeEventListener("beforeunload", handleBeforeUnload);
});

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    } else {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  }
);
</script>
