<template>
  <div class="comment-container">
    <a-comment>
      <template #author><a>{{ author }}</a> {{ operation }}了 <a>{{ course }}</a></template>
      <template #avatar>
        <a-avatar src="https://www.loliapi.com/acg/pp/" alt="Han Solo"/>
      </template>
      <template #content>
        <p>
          {{ content }}
        </p>
      </template>
      <template #datetime>
        <a-tooltip :title="dayjs().format('YYYY-MM-DD HH:mm:ss')">
          <span>{{ datetime }}</span>
        </a-tooltip>
      </template>
    </a-comment>
  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
let operation: String = "添加"
const props = defineProps({
  author: {
    type: String,
    required: true,
  },
  course: {
    type: String,
    required: true,
  },
  datetime: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  edited: {
    type: Boolean,
    required: true,
  },
});
if (props.edited) {
  operation = "编辑"
}
</script>

<style scoped>
.comment-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 16px;
  margin-bottom: 16px;
}
</style>
