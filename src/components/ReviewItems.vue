<template>
  <n-list>
    <n-list-item>
      <template #prefix>
        <n-image src="https://www.loliapi.com/acg/pp/"/>
      </template>
      <template #suffix>
        <n-button>Suffix</n-button>
      </template>
      <n-thing title="Thing" title-extra="extra" description="description">
        Biu<br>
        Biu<br>
        Biu<br>
      </n-thing>
    </n-list-item>
    <n-list-item>
      <n-thing title="Thing" title-extra="extra" description="description" />
    </n-list-item>
  </n-list>
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
