<template>
  <form @submit.prevent="handleSignUp" class="space-y-4">
    <CustomInput id="register-username" label="用户名" v-model="formData.username"
      @update:model-value="checkUsernameAvailability" placeholder="请输入用户名" required :error="errors.username"
      :loading="checkingUsername" />

    <CustomInput id="register-email" label="邮箱" v-model="formData.email" placeholder="请输入邮箱" required
      :error="errors.email" :loading="loading" />

    <div class="space-y-1">
      <CustomInput id="register-password" label="密码" v-model="formData.password" placeholder="请输入密码"
        :type="showPassword ? 'text' : 'password'" required :error="errors.password"
        :append-icon="showPassword ? 'eye-slash' : 'eye'" @icon-click="togglePasswordVisibility"
        @update:model-value="checkPasswordAvailability" :loading="loading" />
      <div v-if="formData.password" class="mt-1">
        <div class="flex items-center space-x-2">
          <div class="h-1 flex-grow rounded-full overflow-hidden bg-gray-200">
            <div :class="passwordStrengthBarClass" :style="{ width: `${passwordStrength * 25}%` }"
              class="h-full transition-all duration-300"></div>
          </div>
          <span :class="passwordStrengthTextClass" class="text-xs font-medium">{{ passwordStrengthText }}</span>
        </div>
        <div class="text-xs text-gray-500 mt-1">
          密码必须包含至少一个大写字母、一个小写字母和一个数字，长度在8-30个字符之间
        </div>
      </div>
    </div>

    <div class="space-y-1">
      <CustomInput id="register-repeat-password" label="重复密码" v-model="formData.repeatPassword" placeholder="请重复密码"
        :type="showPassword ? 'text' : 'password'" required :error="errors.repeatPassword"
        :append-icon="showPassword ? 'eye-slash' : 'eye'" @icon-click="togglePasswordVisibility"
        @update:model-value="checkPasswordsMatch" :loading="loading" />
      <div v-if="formData.repeatPassword && formData.password" class="flex items-center mt-1 text-xs">
        <span v-if="passwordsMatch" class="text-green-500 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          密码匹配
        </span>
        <span v-else class="text-red-500 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          密码不匹配
        </span>
      </div>
    </div>

    <CaptchaInput id="register-captcha" label="验证码" v-model="formData.captcha" placeholder="请输入验证码" required
      :error="errors.captcha" :image-url="captchaInfo.imageUrl" @refresh="updateCaptcha" />

    <button type="submit"
      class="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all flex justify-center items-center"
      :disabled="loading">
      <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg"
        fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
        </path>
      </svg>
      注册
    </button>

    <div v-if="errors.general" class="text-red-600 text-sm text-center p-2 bg-red-50 rounded-md">
      {{ errors.general }}
    </div>
  </form>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { debounce } from 'lodash-es';
import CustomInput from './CustomInput.vue';
import CaptchaInput from './CaptchaInput.vue';
import { api } from '@/lib/requests';
import { usernameSchema, basePasswordSchema } from '@/types/common/userBasicInfo';
import { z } from 'zod';

defineProps({
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['register-success', 'update:loading']);

const checkingUsername = ref(false);
const showPassword = ref(false);
const passwordsMatch = ref(false);

const formData = reactive({
  username: '',
  email: '',
  password: '',
  repeatPassword: '',
  captcha: ''
});

const errors = reactive({
  username: '',
  email: '',
  password: '',
  repeatPassword: '',
  captcha: '',
  general: ''
});

const captchaInfo = ref({
  key: '',
  imageUrl: ''
});

const updateCaptcha = async () => {
  captchaInfo.value = {
    key: '',
    imageUrl: ''
  }
  try {
    const { status, content } = await api.get({
      url: '/api/captcha/',
    });

    if (status === 200) {
      captchaInfo.value = {
        key: content.key,
        imageUrl: content.image_url
      };
    }
  } catch (error) {
    console.error('Failed to fetch captcha:', error);
    errors.general = '获取验证码失败，请刷新页面重试';
  }
};


// Check if passwords match
const validatePasswordMatch = (): boolean => {
  return formData.password === formData.repeatPassword;
};

// Update password match status in real-time
const checkPasswordsMatch = () => {
  passwordsMatch.value = validatePasswordMatch();
  if (!passwordsMatch.value && formData.repeatPassword) {
    errors.repeatPassword = '两次输入密码不一致';
  } else {
    errors.repeatPassword = '';
  }
};

// Check username availability with debounce
const checkUsernameAvailability = debounce(async () => {
  try {
    usernameSchema.parse(formData.username);
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.username = error.errors[0].message;
      return
    }
  }

  checkingUsername.value = true;

  try {
    const { status } = await api.post({
      url: '/api/user/username/',
      query: { username: formData.username }
    });

    if (status === 200) {
      errors.username = ''
    } else {
      errors.username = '用户名已存在';
    }
  } catch (error) {
    console.error('Failed to check username:', error);
    errors.general = '检查用户名失败，请稍后重试';
  } finally {
    checkingUsername.value = false;
  }
}, 500);


// Email format validation
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateForm = (): boolean => {
  let isValid = true;

  // Reset errors
  Object.keys(errors).forEach(key => {
    errors[key as keyof typeof errors] = '';
  });

  // Username validation using usernameSchema
  try {
    usernameSchema.parse(formData.username);
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.username = error.errors[0].message;
      isValid = false;
    }
  }

  // Email validation
  if (!formData.email.trim()) {
    errors.email = '请输入邮箱';
    isValid = false;
  } else if (!validateEmail(formData.email)) {
    errors.email = '请输入有效的邮箱地址';
    isValid = false;
  }

  // Password validation using basePasswordSchema
  try {
    basePasswordSchema.parse(formData.password);
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.password = error.errors[0].message;
      isValid = false;
    }
  }

  // Repeat password validation
  if (!formData.repeatPassword) {
    errors.repeatPassword = '请重复输入密码';
    isValid = false;
  } else if (!validatePasswordMatch()) {
    errors.repeatPassword = '两次输入密码不一致';
    isValid = false;
  }

  // Captcha validation
  if (!formData.captcha.trim()) {
    errors.captcha = '请输入验证码';
    isValid = false;
  }

  return isValid;
};

const handleSignUp = async () => {
  if (!validateForm()) return;

  emit('update:loading', true);

  try {
    const { status, content, errors: apiErrors } = await api.post({
      url: '/api/user/register/',
      query: {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        repeat_password: formData.repeatPassword,
        captcha_key: captchaInfo.value.key,
        captcha_value: formData.captcha
      },
    });

    if (!status.toString().startsWith('2')) {
      if (apiErrors) {
        for (const error of apiErrors) {
          if (error.field === 'username') {
            errors.username = error.err_msg;
          } else if (error.field === 'email') {
            errors.email = error.err_msg;
          } else if (error.field === 'password') {
            errors.password = error.err_msg;
          } else if (error.field === 'captcha') {
            errors.captcha = error.err_msg;
            // Refresh captcha if invalid
            await updateCaptcha();
          } else {
            errors.general = error.err_msg;
          }
        }
      } else {
        errors.general = '注册失败，请稍后重试';
      }
    } else {
      emit('register-success', content);
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

// Toggle password visibility
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

// Check password availability (complexity requirements)
const checkPasswordAvailability = debounce(() => {
  if (!formData.password) {
    errors.password = '';
    return;
  }

  try {
    basePasswordSchema.parse(formData.password);
    errors.password = '';
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.password = error.errors[0].message;
    }
  }
}, 300);

// Calculate password strength
const passwordStrength = computed(() => {
  const password = formData.password;
  if (!password) return 0;

  let strength = 0;

  // Length check
  if (password.length >= 8) strength += 1;

  // Contains uppercase
  if (/[A-Z]/.test(password)) strength += 1;

  // Contains lowercase
  if (/[a-z]/.test(password)) strength += 1;

  // Contains number
  if (/\d/.test(password)) strength += 1;

  return strength;
});

// Password strength text
const passwordStrengthText = computed(() => {
  switch (passwordStrength.value) {
    case 0: return '非常弱';
    case 1: return '弱';
    case 2: return '中等';
    case 3: return '强';
    case 4: return '非常强';
    default: return '';
  }
});

// Password strength bar class
const passwordStrengthBarClass = computed(() => {
  switch (passwordStrength.value) {
    case 0: return 'bg-gray-300';
    case 1: return 'bg-red-500';
    case 2: return 'bg-yellow-500';
    case 3: return 'bg-blue-500';
    case 4: return 'bg-green-500';
    default: return 'bg-gray-300';
  }
});

// Password strength text class
const passwordStrengthTextClass = computed(() => {
  switch (passwordStrength.value) {
    case 0: return 'text-gray-500';
    case 1: return 'text-red-500';
    case 2: return 'text-yellow-500';
    case 3: return 'text-blue-500';
    case 4: return 'text-green-500';
    default: return 'text-gray-500';
  }
});

onMounted(async () => {
  await updateCaptcha();
});
</script>
