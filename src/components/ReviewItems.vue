<template>
    <n-thing>
      <template #avatar>
        <n-avatar
            round
            size="medium"
            :src="props.author.avatar_url"
            fallback-src="https://www.loliapi.com/acg/pp/"
        />
      </template>
      <template #header>
        <template v-if="props.author.id < 0">
          {{ props.author.name }}
        </template>
        <template v-else>
          <router-link :to="`/user/${props.author.id}`" #="{ navigate, href }">
            <n-a :href="href" @click="navigate">
              {{ props.author.name }}
            </n-a>
          </router-link>
        </template>
        {{ props.edited ? '修改' : '新增' }}了对
        <n-a :href="`/review/course/${props.course.course_id}`">
          {{ props.course.course_name }}
        </n-a>
        的评价
      </template>
      <template #header-extra>
        <n-tooltip
          placement="bottom"
          trigger="hover"
          >
          <template #trigger>
            <n-time :time="new Date(props.datetime)" type="relative" />
          </template>
          <span>{{ new Date(props.datetime).toLocaleString() }}</span>
        </n-tooltip>
      </template>
      <template #description>
        任课老师:
        <template v-for="(teacher,index) in props.teachers">
          <n-a :href="`/review/teacher/${teacher.teacher_id}`">
            {{ teacher.teacher_name }}
          </n-a>
          {{ index < props.teachers.length -1 ? ',' : '' }}
        </template>
      </template>
      {{ props.content }}
    </n-thing>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
let operation: String = "添加"
const props = defineProps<{
  author: {
    id: number,
    name: string,
    avatar_url: string,
  };
  datetime: string;
  course: {
    course_name: string;
    course_id: number;
  };
  content: string;
  teachers: {
    teacher_name: string;
    teacher_id: number;
  }[];
  edited: boolean;
}>();
if (props.edited) {
  operation = "编辑"
}
</script>

<style scoped>
</style>
