<template>
  <form @submit.prevent="handleLogin" class="space-y-4">
    <CustomInput
      id="login-username"
      label="用户名"
      v-model="formData.username"
      placeholder="请输入用户名或邮箱"
      required
      :error="errors.username"
    />
    
    <CustomInput
      id="login-password"
      label="密码"
      v-model="formData.password"
      placeholder="请输入密码"
      type="password"
      required
      :error="errors.password"
    />
    
    <div class="flex justify-between items-center">
      <div class="flex items-center">
        <!-- <input
          id="remember-me"
          v-model="rememberMe"
          type="checkbox"
          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label for="remember-me" class="ml-2 block text-sm text-gray-700">
          记住我
        </label> -->
      </div>
      
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
      <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      登录
    </button>
  </form>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import CustomInput from './CustomInput.vue';
import { api } from '@/lib/requests';

defineProps({
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['login-success', 'update:loading']);

const router = useRouter();
const rememberMe = ref(false);

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
  router.push({ name: 'forgot-password' });
};
</script>
