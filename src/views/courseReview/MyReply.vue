<template>
  <n-infinite-scroll class="h-37.5" :distance="10" @load="handleLoad">
    <template v-if="myReplies">
      <div v-for="reply in myReplyArray" class="item">
        <MyReplyItems :reply="reply" />

        <div class="w-23/24 mx-auto h-0.1 pb-8">
          <n-divider
            class="border-b border-dashed border-customGray"
            :dashed="true"
          />
        </div>
      </div>
    </template>
    <template v-else>
      <div v-for="n in 5" :key="n" class="flex mb-2.5 flex-col">
        <div class="pr-4 pl-4 pt-4">
          <n-skeleton text :repeat="5" />
          <br />
          <div class="w-23/24 mx-auto h-0.1 pb-8">
            <n-divider
              class="border-b border-dashed border-customGray"
              :dashed="true"
            />
          </div>
        </div>
      </div>
    </template>
  </n-infinite-scroll>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import type { Replies, Reply } from '@/types/myReply'
import MyReplyItems from '@/components/courseReview/MyReplyItems.vue'

const myReplies = ref<Replies | null>(null)
const myReplyArray = ref<Reply[] | null>(null)
let counter = ref<number>(6)
const myReviewsReq = async () => {
  try {
    const resp = await fetch(`/api/review/my-review-reply/`)
    myReplies.value = await resp.json()
    myReplyArray.value =
      myReplies.value.message.length > 0
        ? myReplies.value.message.slice(0, counter.value)
        : [null]
  } catch (error) {
    console.error('Failed to load reviews:', error)
  }
}
const handleLoad = () => {
  counter.value = counter.value + 1
  if (counter.value > myReplies.value.message.length) {
    console.log('no more data')
  } else {
    myReplyArray.value.push(myReplies.value.message[counter.value])
  }
}

onMounted(() => {
  myReviewsReq()
})
</script>

<style scoped>
.item {
  display: flex;
  margin-bottom: 10px;
  flex-direction: column;
}

.item:last-child {
  margin-bottom: 0;
}
</style>
