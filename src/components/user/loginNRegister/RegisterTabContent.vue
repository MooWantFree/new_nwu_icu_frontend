<template>
  <form @submit.prevent="handleSignUp" class="space-y-5" novalidate>
    <CustomInput :id="`${idPrefix}register-username`" label="用户名" v-model="formData.username"
      @update:model-value="checkUsernameAvailability" placeholder="请输入用户名" required :error="errors.username"
      autocomplete="username" :disabled="loading" :loading="checkingUsername" />

    <CustomInput :id="`${idPrefix}register-email`" label="邮箱" v-model="formData.email" placeholder="请输入邮箱" type="email" required
      autocomplete="email" :disabled="loading" :error="errors.email" :loading="loading" />

    <div class="space-y-1">
      <CustomInput :id="`${idPrefix}register-password`" label="密码" v-model="formData.password" placeholder="请输入密码"
        type="password" required :error="errors.password" autocomplete="new-password" :disabled="loading"
        @update:model-value="checkPasswordAvailability" :loading="loading" />
      <div v-if="formData.password" class="mt-1">
        <div class="flex items-center space-x-2">
          <div class="h-1 flex-grow rounded-full overflow-hidden bg-zinc-100">
            <div :class="passwordStrengthBarClass" :style="{ width: `${passwordStrength * 25}%` }"
              class="h-full transition-all duration-300"></div>
          </div>
          <span :class="passwordStrengthTextClass" class="text-xs font-medium">{{ passwordStrengthText }}</span>
        </div>
        <div class="text-xs leading-5 text-zinc-500 mt-1">
          密码必须包含至少一个大写字母、一个小写字母和一个数字，长度在8-30个字符之间
        </div>
      </div>
    </div>

    <div class="space-y-1">
      <CustomInput :id="`${idPrefix}register-repeat-password`" label="确认密码" v-model="formData.repeatPassword" placeholder="再次输入密码"
        type="password" required :error="errors.repeatPassword" autocomplete="new-password" :disabled="loading"
        @update:model-value="checkPasswordsMatch" :loading="loading" />
      <div v-if="formData.repeatPassword && formData.password" class="flex items-center mt-1 text-xs">
        <span v-if="passwordsMatch" class="text-emerald-700 flex items-center">
          <Check class="h-4 w-4 mr-1" />
          密码匹配
        </span>
        <span v-else class="text-red-600 flex items-center">
          <X class="h-4 w-4 mr-1" />
          密码不匹配
        </span>
      </div>
    </div>

    <CaptchaInput :id="`${idPrefix}register-captcha`" label="验证码" v-model="formData.captcha" placeholder="请输入验证码" required
      :error="errors.captcha" :image-url="captchaInfo.imageUrl" :loading="isLoadingCaptcha" :disabled="loading" @refresh="updateCaptcha"
      @error="errors.captcha = '验证码加载失败，请重试'" />

    <button type="submit"
      class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-50"
      :disabled="loading">
      <LoaderCircle v-if="loading" class="h-4 w-4 animate-spin" aria-hidden="true" />
      {{ loading ? '注册中…' : '创建账号' }}
    </button>

    <div v-if="errors.general" role="alert" aria-live="polite" class="grid grid-cols-[1rem_1fr] items-start gap-x-3 gap-y-1 rounded-lg border border-red-200 bg-white p-4 text-sm text-red-700">
      <CircleAlert class="mt-0.5 h-4 w-4" aria-hidden="true" />
      <p class="font-medium leading-5">注册失败</p>
      <p class="col-start-2 whitespace-pre-line leading-5">{{ errors.general }}</p>
    </div>
  </form>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { Check, X, CircleAlert, LoaderCircle } from 'lucide-vue-next';
import { debounce } from 'lodash-es';
import CustomInput from './CustomInput.vue';
import CaptchaInput from './CaptchaInput.vue';
import { api } from '@/lib/requests';
import { usernameSchema, basePasswordSchema } from '@/types/common/userBasicInfo';
import { z } from 'zod';

const props = defineProps({
  idPrefix: { type: String, default: '' },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['register-success', 'update:loading']);

const checkingUsername = ref(false);
const submitting = ref(false);
const passwordsMatch = ref(false);
const isLoadingCaptcha = ref(false);

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
  if (isLoadingCaptcha.value) return;
  isLoadingCaptcha.value = true;
  if (errors.captcha === '验证码加载失败，请重试') errors.captcha = '';
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
    } else {
      errors.general = '获取验证码失败，请刷新页面重试';
    }
  } catch (error) {
    console.error('Failed to fetch captcha:', error);
    errors.general = '获取验证码失败，请刷新页面重试';
  } finally {
    isLoadingCaptcha.value = false;
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
  if (props.loading || submitting.value) return;
  if (!validateForm()) return;
  submitting.value = true;
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
    submitting.value = false;
    emit('update:loading', false);
  }
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
    case 0: return 'bg-zinc-300';
    case 1: return 'bg-red-500';
    case 2: return 'bg-amber-500';
    case 3: return 'bg-zinc-600';
    case 4: return 'bg-emerald-600';
    default: return 'bg-zinc-300';
  }
});

// Password strength text class
const passwordStrengthTextClass = computed(() => {
  switch (passwordStrength.value) {
    case 0: return 'text-zinc-500';
    case 1: return 'text-red-500';
    case 2: return 'text-amber-700';
    case 3: return 'text-zinc-600';
    case 4: return 'text-emerald-700';
    default: return 'text-zinc-500';
  }
});

onMounted(async () => {
  await updateCaptcha();
});
</script>
