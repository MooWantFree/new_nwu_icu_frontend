<template>
  <form @submit.prevent="handleLogin" class="space-y-5" novalidate>
    <CustomInput
      :id="`${idPrefix}login-username`"
      label="用户名"
      v-model="formData.username"
      placeholder="请输入用户名"
      required
      autocomplete="username"
      :disabled="loading"
      :loading="loading"
      :error="errors.username"
    />
    
    <CustomInput
      :id="`${idPrefix}login-password`"
      label="密码"
      v-model="formData.password"
      placeholder="请输入密码"
      type="password"
      required
      autocomplete="current-password"
      :disabled="loading"
      :loading="loading"
      :error="errors.password"
    >
      <template #label-action>
        <button
          type="button"
          class="shrink-0 rounded-sm text-xs leading-4 text-zinc-500 transition-colors hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:opacity-50"
          :disabled="loading"
          @click="goToForgotPassword"
        >
          忘记密码？
        </button>
      </template>
    </CustomInput>

    <div
      v-if="errors.general"
      role="alert"
      aria-live="polite"
      class="grid grid-cols-[1rem_1fr] items-start gap-x-3 gap-y-1 rounded-lg border border-red-200 bg-white p-4 text-sm text-red-700"
    >
      <CircleAlert class="mt-0.5 h-4 w-4" aria-hidden="true" />
      <p class="font-medium leading-5">登录失败</p>
      <p class="col-start-2 whitespace-pre-line leading-5">{{ errors.general }}</p>
    </div>
    
    <button
      type="submit"
      class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-50"
      :disabled="loading"
    >
      <LoaderCircle v-if="loading" class="h-4 w-4 animate-spin" aria-hidden="true" />
      {{ loading ? '登录中…' : '登录' }}
    </button>
  </form>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import CustomInput from './CustomInput.vue';
import { CircleAlert, LoaderCircle } from 'lucide-vue-next'
import { api } from '@/lib/requests';

const props = withDefaults(defineProps<{
  loading: boolean
  idPrefix?: string
}>(), { idPrefix: '' });

const emit = defineEmits(['login-success', 'update:loading','close-modal']);

const router = useRouter();
const submitting = ref(false);

const formData = reactive({
  username: '',
  password: ''
});

const errors = reactive({
  username: '',
  password: '',
  general: ''
});

const validateForm = () => {
  let isValid = true;
  
  // Reset errors
  errors.username = '';
  errors.password = '';
  errors.general = '';
  
  if (!formData.username.trim()) {
    errors.username = '请输入用户名';
    isValid = false;
  }
  
  if (!formData.password) {
    errors.password = '请输入密码';
    isValid = false;
  }
  
  return isValid;
};

const handleLogin = async () => {
  if (props.loading || submitting.value) return;
  if (!validateForm()) return;
  submitting.value = true;
  emit('update:loading', true);
  
  try {
    const { status, data, content, errors: apiErrors } = await api.post({
      url: '/api/user/login/',
      query: {
        username: formData.username,
        password: formData.password,
      },
    });

    if (!status.toString().startsWith('2')) {
      let displayedError = false;
      for (const error of apiErrors || []) {
        if (error.field === 'user') {
          errors.username = error.err_msg;
        } else if (error.field === 'password') {
          errors.password = error.err_msg;
        } else if (error.field === 'credentials') {
          errors.general = error.err_msg;
        } else {
          errors.general = error.err_msg;
        }
        displayedError = true;
      }

      if (!displayedError) {
        errors.general = status === 403
          ? '登录请求未通过安全校验，请刷新页面后重试'
          : data?.message || '登录失败，请稍后重试';
      }
    } else {
      emit('login-success', content);
    }
  } catch (e) {
    if (e instanceof Error) {
      errors.general = '网络错误，请重试或联系管理员\n' + e.message;
    }
    console.error(e);
  } finally {
    submitting.value = false;
    emit('update:loading', false);
  }
};

const goToForgotPassword = () => {
  emit('close-modal');
  router.push({ name: 'forgetPassword' })
}
</script>
