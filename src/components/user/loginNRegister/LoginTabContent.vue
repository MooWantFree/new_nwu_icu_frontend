<template>
  <form @submit.prevent="handleLogin" class="space-y-4">
    <CustomInput
      id="login-username"
      label="用户名"
      v-model="formData.username"
      placeholder="请输入用户名或邮箱"
      required
      :loading="loading"
      :error="errors.username"
    />
    
    <CustomInput
      id="login-password"
      label="密码"
      v-model="formData.password"
      placeholder="请输入密码"
      type="password"
      required
      :loading="loading"
      :error="errors.password"
    />
    
    <div class="flex justify-between items-center">
      <div></div>
      <button 
        type="button" 
        class="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
        @click="goToForgotPassword"
      >
        忘记密码？
      </button>
    </div>
    
    <button
      type="submit"
      class="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all flex justify-center items-center"
      :disabled="loading"
    >
      <LoaderCircle v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
      登录
    </button>
  </form>
</template>

<script lang="ts" setup>
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import CustomInput from './CustomInput.vue';
import { LoaderCircle } from 'lucide-vue-next'
import { api } from '@/lib/requests';

defineProps<{
  loading: boolean
}>();

const emit = defineEmits(['login-success', 'update:loading','close-modal']);

const router = useRouter();

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
    errors.username = '请输入用户名或邮箱';
    isValid = false;
  }
  
  if (!formData.password) {
    errors.password = '请输入密码';
    isValid = false;
  }
  
  return isValid;
};

const handleLogin = async () => {
  if (!validateForm()) return;
  
  emit('update:loading', true);
  
  try {
    const { status, content, errors: apiErrors } = await api.post({
      url: '/api/user/login/',
      query: {
        username: formData.username,
        password: formData.password,
      },
    });

    if (!status.toString().startsWith('2')) {
      for (const error of apiErrors || []) {
        if (error.field === 'user') {
          errors.username = error.err_msg;
        } else if (error.field === 'password') {
          errors.password = error.err_msg;
        } else {
          errors.general = error.err_msg;
        }
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
    emit('update:loading', false);
  }
};

const goToForgotPassword = () => {
  emit('close-modal');
  router.push({ name: 'forgetPassword' })
}
</script>
