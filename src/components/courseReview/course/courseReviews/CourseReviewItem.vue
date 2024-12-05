<template>
  <div class="bg-gray-100 rounded-lg shadow-md p-6" ref="courseReviewItem">
    <div class="flex items-center justify-between mb-4">
      <div>
        <div class="flex items-center">
          <router-link v-if="review.author.id > 0" :to="`/user/profile/${review.author.id}`">
            <img
              :src="`/api/download/${review.author.avatar}`"
              alt="Avatar"
              class="w-8 h-8 rounded-full mr-2"
            />
          </router-link>
          <img
            v-else
            :src="`/api/download/${review.author.avatar}`"
            alt="Avatar"
            class="w-8 h-8 rounded-full mr-2"
          />
          <h3 class="text-xl font-bold text-gray-900">
            <router-link v-if="review.author.id > 0" :to="`/user/profile/${review.author.id}`" class="text-blue-600 hover:underline">
              {{ review.author.nickname }}
            </router-link>
            <span v-else>匿名用户</span>
          </h3>
        </div>
        <div class="flex items-center space-x-2 mt-1">
          <div class="flex items-center">
            <n-rate readonly allow-half :default-value="review.rating" />
          </div>
          <div class="text-sm text-gray-600">{{ review.semester }}</div>
        </div>
      </div>
    </div>
    <div class="text-gray-700 mb-4">
      <p class="space-x-4">
        <div class="flex flex-wrap gap-4">
          <span class="flex items-center">
            <span class="mr-2">课程难度：</span>
            <div class="flex">
              <svg v-for="i in 3" :key="i" class="w-4 h-4" :class="i <= review.difficulty ? 'text-yellow-400' : 'text-gray-300'" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </span>
          <span class="flex items-center">
            <span class="mr-2">作业多少：</span>
            <div class="flex">
              <svg v-for="i in 3" :key="i" class="w-4 h-4" :class="i <= review.homework ? 'text-yellow-400' : 'text-gray-300'" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </span>
          <span class="flex items-center">
            <span class="mr-2">给分好坏：</span>
            <div class="flex">
              <svg v-for="i in 3" :key="i" class="w-4 h-4" :class="i <= review.grade ? 'text-yellow-400' : 'text-gray-300'" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </span>
          <span class="flex items-center">
            <span class="mr-2">收获大小：</span>
            <div class="flex">
              <svg v-for="i in 3" :key="i" class="w-4 h-4" :class="i <= review.reward ? 'text-yellow-400' : 'text-gray-300'" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </span>
        </div>
      </p>
    </div>
    <div class="text-gray-800 mb-4">
      <Viewer :value="review.content" />
    </div>
    <div class="flex items-center justify-between text-sm text-gray-500">
      <!-- Dropdown Menu -->
      <div
        v-if="isAuthor"
        class="relative inline-block text-left"
        ref="dropdownMenu"
      >
        <button
          @click="toggleDropdownMenu"
          id="dropdownButton"
          type="button"
          class="inline-flex items-center p-2 text-sm font-medium text-gray-700 bg-white rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          aria-expanded="true"
          aria-haspopup="true"
        >
          <span class="sr-only">打开下拉菜单</span>
          <svg
            class="w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"
            />
          </svg>
        </button>

        <div
          v-if="showDropdownMenu"
          id="dropdownMenu"
          class="z-50 origin-top-right absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="dropdownButton"
          tabindex="-1"
        >
          <div class="py-1" role="none">
            <button
              @click="handleEdit"
              class="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
              role="menuitem"
              tabindex="-1"
              id="editButton"
            >
              <svg
                class="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
                />
              </svg>
              编辑评价
            </button>
            <button
              @click="handleDelete"
              class="group flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-100 hover:text-red-900 w-full text-left"
              role="menuitem"
              tabindex="-1"
              id="deleteButton"
            >
              <svg
                class="mr-3 h-5 w-5 text-red-400 group-hover:text-red-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
              删除评价
            </button>
          </div>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <Time :time="new Date(review.created_time)" />
        <div v-if="review.edited">
          <span
            >(最后修改于:
            <n-time :time="new Date(review.modified_time)" />)</span
          >
        </div>
      </div>
    </div>
    <div class="mt-4">
      <div
        class="flex justify-between items-center mb-2"
        v-if="review.reply && review.reply.length > 0"
      >
        <h3 class="font-semibold text-gray-900 text-lg">评论</h3>
        <!-- TODO: Change color -->
        <div>
          <span>排序：</span>
          <n-button
            text
            @click="toggleReplyOrder"
            class="text-blue-600 hover:text-blue-800"
          >
            {{ reverseReplies ? "最新回复" : "最早回复" }}
          </n-button>
        </div>
      </div>
      <div class="space-y-2">
        <div
          v-for="(reply, index) in orderedReplies"
          ref="replies"
          :key="reply.id"
          :data-id="reply.id"
          class="bg-gray-50 p-3 rounded-md flex justify-between items-start relative group"
        >
          <div>
            <p class="text-sm text-gray-700">
              <span>
                <router-link
                  v-if="reply.created_by.id > 0"
                  :to="`/user/${reply.created_by.id}`"
                  class="text-blue-600 hover:underline"
                >
                  {{ reply.created_by.name }}
                </router-link>
                <span v-else>
                  {{ reply.created_by.name }}
                </span>
              </span>
              <span v-if="reply.parent > 0">
                回复了
                <router-link
                  v-if="
                    orderedReplies.find((it) => it.id === reply.parent)
                      ?.created_by.id > 0
                  "
                  :to="`/user/${
                    orderedReplies.find((it) => it.id === reply.parent)
                      ?.created_by.id
                  }`"
                  class="text-blue-600 hover:underline"
                >
                  {{
                    orderedReplies.find((it) => it.id === reply.parent)
                      ?.created_by.name
                  }}
                </router-link>
                (
                <button
                  class="text-blue-600 hover:underline"
                  @click="
                    handleJmpClick(reply.parent)
                  "
                >
                  #{{ orderedReplies.find((it) => it.id === reply.parent)?.floorNumber }}
                </button>
                )
              </span>
              <span class="text-gray-800 break-words whitespace-normal"> : {{ reply.content }}</span>
            </p>
            <p class="text-xs text-gray-500 mt-1">
              <Time type="relative" :time="new Date(reply.created_time)" />
              &nbsp;
              <n-button
                v-if="isAuthor"
                text
                @click="() => handleDeleteReply(reply.id)"
                class="text-red-600 hover:text-red-800"
              >
                <!-- FIXME: Why hover become green? -->
                删除
              </n-button>
            </p>
          </div>
          <div v-if="isLoggedIn" class="relative mx-1 z-50">
            <span class="text-sm text-gray-500 ml-2 transition-opacity duration-300 group-hover:opacity-0">
              #{{ reply.floorNumber }}
            </span>
            <button
              @click="() => toggleReply(reply.id)"
              class="absolute top-0 right-0 text-sm text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pl-2 whitespace-nowrap"
            >
              回复
            </button>
          </div>
          <span v-else class="text-sm text-gray-500 ml-2 transition-opacity duration-300 group-hover:opacity-0 z-50">
              #{{ reply.floorNumber }}
            </span>
        </div>
      </div>
    </div>
    <div class="flex justify-end mt-2 mx-2">
      <n-button
        v-if="isLoggedIn"
        text
        @click="() => toggleReply()"
        class="text-blue-600 hover:text-blue-800"
      >
        {{ showReply ? "取消回复" : "回复" }}
      </n-button>
      <span v-else> 登录以后才能回复 </span>
    </div>
    <CourseReviewItemReply
      ref="replyTextArea"
      v-if="isLoggedIn && showReply"
      :review="review"
      :reply-to="replyTarget"
      :reply-target-floor="orderedReplies.find((it) => it.id === replyTarget)?.floorNumber"
      @close="toggleReply"
      class="mt-4"
      @replySubmitted="onReplySubmitted"
    />
  </div>
</template>

<script lang="ts" setup>
import { Review } from "@/types/courses";
import {
  onMounted,
  onUnmounted,
  ref,
  computed,
  watch,
  useTemplateRef,
  nextTick,
} from "vue";
import { useRoute } from "vue-router";
import { NButton, useMessage, useDialog } from "naive-ui";
import { useUser } from "@/lib/useUser";
import { api } from "@/lib/requests";
import Time from "@/components/shortcuts/Time.vue";
import Viewer from "@/components/tiptap/viewer/Viewer.vue";
import CourseReviewItemReply from "./CourseReviewItemReply.vue";
import type { ReplyDeleteResponse } from "@/types/api/course";

const props = defineProps<{
  review: Review;
}>();

const emit = defineEmits<{
  (e: "reviewDeleted", id: number): void;
  (e: "reviewEdit"): void;
}>();

const message = useMessage();
const dialog = useDialog();
const route = useRoute();
const courseReviewItem = useTemplateRef("courseReviewItem");

// Scroll if has hash
onMounted(async () => {
  const hash = route.hash;
  if (hash && hash.includes(`review-${props.review.id}`)) {
    await nextTick();
    if (courseReviewItem.value) {
      courseReviewItem.value.scrollIntoView({ behavior: "smooth" });
    }
  }
});

// Display the reply box or not
const showReply = ref(false);
const isAuthor = computed(() => {
  return props.review.author.id === userInfo.value?.id;
});

const replyTarget = ref(0);
const replyTextArea = useTemplateRef("replyTextArea");
const toggleReply = (replyTo: number = 0) => {
  replyTarget.value = replyTo;
  if (replyTo !== 0) {
    if (!showReply.value) {
      showReply.value = !showReply.value;
    }
  } else {
    showReply.value = !showReply.value;
  }
  if (showReply.value) {
    nextTick(() => {
      replyTextArea.value?.focus();
    });
  }
};

const reverseReplies = ref(false);

const toggleReplyOrder = () => {
  reverseReplies.value = !reverseReplies.value;
};

const orderedReplies = computed(() => {
  const replies = [...props.review.reply].reverse().map((it, index) => {
    return {
      ...it,
      floorNumber: index + 1,
    };
  });
  
  return reverseReplies.value ? replies.reverse() : replies;
});

const { userInfo, isLoggedIn } = useUser();
const onReplySubmitted = (content: string, parent: number, replyId: number) => {
  toggleReply();
  // Push the new reply to the review's replies array
  props.review.reply.unshift({
    id: replyId,
    parent,
    content,
    created_time: new Date().toISOString(),
    created_by: {
      id: userInfo.value.id,
      name: userInfo.value.nickname ?? userInfo.value.username,
      avatar: userInfo.value.avatar,
    },
    like: {
      like: 0,
      dislike: 0,
      user_option: 0,
    },
  });
};

// Dropdown menu
const dropdownMenuRef = useTemplateRef("dropdownMenu");
const showDropdownMenu = ref(false);
const toggleDropdownMenu = () => {
  handleDropdownMenuOpened();
  showDropdownMenu.value = !showDropdownMenu.value;
};
const handleClickEvent = (e: MouseEvent) => {
  if (dropdownMenuRef && !dropdownMenuRef.value.contains(e.target as Node)) {
    showDropdownMenu.value = false;
  }
};
const handleDropdownMenuClosed = () => {
  document.removeEventListener("click", handleClickEvent);
};
const handleDropdownMenuOpened = () => {
  document.addEventListener("click", handleClickEvent);
};
onUnmounted(() => {
  document.removeEventListener("click", handleClickEvent);
});
watch(showDropdownMenu, (newValue) => {
  if (!newValue) {
    handleDropdownMenuClosed();
  }
});

const handleEdit = () => {
  emit("reviewEdit");
  showDropdownMenu.value = false;
};

const handleDelete = () => {
  // FIXME: Still not able to work
  dialog.warning({
    title: "确认删除",
    content: "你确定你想要删除这条评价吗？删除以后不可恢复！",
    positiveText: "确定",
    negativeText: "取消",
    onPositiveClick: async () => {
      try {
        const response = await api.delete<ReplyDeleteResponse>(
          `/api/assessment/reply/`
        );
        if (response.status === 200) {
          message.success("评价已成功删除");
          // TODO: Handle the reply delete item
        } else {
          throw new Error(
            response.errors.reduce(
              (acc, cur) => acc + cur.field + ": " + cur.err_msg + "\n",
              ""
            )
          );
        }
      } catch (error) {
        console.error("Error deleting reply:", error);
        message.error("删除评价失败，请稍后重试\n" + error);
      }
    },
  });
};

const handleDeleteReply = async (repyId: number) => {
  if (confirm(`你确定要删掉这条回复吗？！`)) {
    // TODO
  }
};

const repliesRefs = useTemplateRef("replies");

const handleJmpClick = (targetReplyId: number) => {
  if (repliesRefs.value) {
    const targetElement = repliesRefs.value.find(
      (el) => el.getAttribute("data-id") === targetReplyId.toString()
    );
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      targetElement.classList.add('transition-transform', 'duration-300', 'scale-110');
      setTimeout(() => {
        targetElement.classList.remove('scale-110');
        targetElement.classList.add('scale-100');
      }, 300);
      setTimeout(() => {
        targetElement.classList.remove('transition-transform', 'duration-300', 'scale-100');
      }, 600);
    }
  }
};
</script>