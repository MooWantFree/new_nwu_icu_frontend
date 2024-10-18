<template>
  <n-tabs
      class="card-tabs"
      default-value="sign-in"
      size="large"
      animated
      pane-wrapper-style="margin: 0 -4px"
      pane-style="padding-left: 4px; padding-right: 4px; box-sizing: border-box;"
      ref="tabsRef"
      v-model:value="tabsValueRef"
  >
    <n-tab-pane name="sign-in" tab="登录" :disabled="loadingRef">
      <n-form
          ref="loginFormRef"
          :model="loginFormValue"
          :rules="loginFormRules"
      >
        <n-form-item-row label="用户名" path="username">
          <n-input v-model:value="loginFormValue.username" placeholder="请输入用户名或邮箱"/>
        </n-form-item-row>
        <n-form-item-row label="密码" path="password">
          <n-input
              v-model:value="loginFormValue.password"
              placeholder="请输入密码"
              type="password"
              show-password-on="click"
          />
        </n-form-item-row>
        <div class="flex justify-between items-center mt-2">
          <n-checkbox v-model:checked="rememberMe">记住我</n-checkbox>
          <n-button text type="primary" @click="goToForgotPassword">
            忘记密码？
          </n-button>
        </div>
        <n-button type="primary" block secondary strong @click="handleLoginButtonClick" :loading="loadingRef" class="mt-4">
          登录
        </n-button>
      </n-form>
    </n-tab-pane>
    <n-tab-pane name="sign-up" tab="注册" :disabled="loadingRef">
      <n-form
          ref="signUpFormRef"
          :model="signUpFormValue"
          :rules="signUpFormRules"
      >
        <n-form-item-row label="用户名" path="username">
          <n-input v-model:value="signUpFormValue.username" placeholder="请输入用户名" :loading="checkingUsername"/>
        </n-form-item-row>
        <n-form-item-row label="邮箱" path="email">
          <n-input v-model:value="signUpFormValue.email" placeholder="请输入邮箱"/>
        </n-form-item-row>
        <n-form-item-row label="密码" path="password">
          <n-input v-model:value="signUpFormValue.password" placeholder="请输入密码" type="password"
                   show-password-on="click"/>
        </n-form-item-row>
        <n-form-item-row label="重复密码" path="repeatPassword">
          <n-input v-model:value="signUpFormValue.repeatPassword" placeholder="请重复密码" type="password"
                   show-password-on="click"/>
        </n-form-item-row>
        <!-- TODO: Fix the style -->
        <n-form-item-row label="验证码" path="captcha">
          <div class="flex justify-space">
            <n-input
                v-model:value="signUpFormValue.captcha"
                placeholder="请输入验证码"
            />
            <n-image
                style="margin-left: auto"
                @click="updateCaptcha"
                :src="captchaInfo.imageUrl"
                preview-disabled
            >
              <template #placeholder>
                <n-space justify="center">
                  <n-spin size="medium"/>
                </n-space>
              </template>
            </n-image>
          </div>
        </n-form-item-row>
        <n-button type="primary" block secondary strong @click="handleSignUpButtonClick" :loading="loadingRef">
          注册
        </n-button>
      </n-form>
    </n-tab-pane>
  </n-tabs>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { debounce } from 'lodash-es'
import { FormInst, FormItemRule, FormRules, useMessage } from 'naive-ui'
import { api } from '@/lib/requests'
import { CheckUsernameResponse, LoginResponse, RegisterResponse } from '@/types/api/users'
import { GetCaptchaResponse } from '@/types/api/captcha'
import { UserProfile } from '@/types/userProfile'

// Common parts
const message = useMessage()
const loadingRef = ref<boolean>(false)
const router = useRouter()
const rememberMe = ref(false)
// TODO: How to handle the remember me?

// Login part
const loginFormRef = ref<FormInst | null>(null)
const loginFormValue = ref({
  username: "",
  password: "",
})
const loginFormRules = {
  username: {
    required: true,
    message: "请输入用户名或邮箱",
    trigger: ["blur", "input"],
  },
  password: {
    required: true,
    message: "请输入密码",
    trigger: ["blur", "input"],
  }
}
const handleLoginButtonClick = (e: MouseEvent) => {
  e.preventDefault()
  loadingRef.value = true
  loginFormRef.value?.validate(async (errors) => {
    if (!errors) {
      try {
        const { status, data, content, errors } = await api.post<LoginResponse>("/api/user/login/", {
          username: loginFormValue.value.username,
          password: loginFormValue.value.password,
        })

        if (!status.toString().startsWith('2')) {
          for (const error of errors) {
            message.error(`${error.field}: ${error.err_msg}`)
          }
        } else {
          emit('login-success', content)
        }
      } catch (e) {
        message.error("网络错误，请重试或联系管理员\n" + e.message)
        console.error(e)
      } finally {
        loadingRef.value = false
      }
    } else {
      message.error("信息输入有误")
      loadingRef.value = false
    }
  })
}

// Sign up part
const signUpFormRef = ref<FormInst | null>(null)
const signUpFormValue = ref({
  username: "",
  password: "",
  repeatPassword: "",
  email: "",
  captcha: "",
})
const checkingUsername = ref(false)
const validatePasswordStartWith = (rule: FormItemRule, value: string): boolean => {
  return (
      !!signUpFormValue.value.password
      && signUpFormValue.value.password.startsWith(value)
      && signUpFormValue.value.password.length >= value.length
  )
}
const validatePasswordSame = (rule: FormItemRule, value: string): boolean => value === signUpFormValue.value.password
const validatePasswordStrength = (rule: FormItemRule, value: string) => {
  if (value.length < 8) {
    return new Error("密码长度必须至少为8个字符")
  } else if (!/[A-Z]/.test(value)) {
    return new Error("密码必须包含至少一个大写字母")
  } else if (!/[a-z]/.test(value)) {
    return new Error("密码必须包含至少一个小写字母")
  } else if (!/[0-9]/.test(value)) {
    return new Error("密码必须包含至少一个数字")
  }
  return true
}
const checkUsernameAvailability = debounce(async (rule: FormItemRule, value: string): Promise<void> => {
  checkingUsername.value = true
  if (!value) return
  if (value.length < 8) {
    return
  }
  try {
    const {status, errors} = await api.post<CheckUsernameResponse>('/api/user/username/', { username: value })
    if (status !== 200) {
      throw new Error(errors.map(e=>`${e.field}: ${e.err_msg}`).join(', '))
    }
  } catch (error) {
    console.error('Error checking username availability:', error)
    throw error instanceof Error ? error : new Error('Unknown error')
  } finally {
    checkingUsername.value = false
  }
}, 300)
// FIXME: Fix the error 
/*
LoginForm.vue:204  Uncaught (in promise) Error: 用户名已被使用
    at LoginForm.vue:204:13
*/
const signUpFormRules: FormRules = {
  username: [{
    required: true,
    validator: (rule: FormItemRule, value: string) => {
      if (!value) {
        return new Error("请输入用户名")
      } else if (!/^[A-Za-z0-9_]{8,29}$/.test(value)) {
        return new Error("用户名应只包括字母、数字与下划线，且长度位于8与29之间")
      } else if (/^\d+$/.test(value)) {
        return new Error("用户名不能全为数字")
      }
      return true
    },
    trigger: ["blur", "input"],
  }, 
  {
    validator: checkUsernameAvailability,
    trigger: ["blur", "input"],
  }],
  email: [{
    required: true,
    validator: (rule: FormItemRule, value: string) => {
      if (!value) {
        return new Error("请输入邮箱")
      } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)) {
        return new Error("请输入正确的邮箱地址")
      }
      return true
    },
    trigger: "input"
  }],
  password: [
    {
      required: true,
      message: "请输入密码"
    },
    {
      validator: validatePasswordStrength,
      trigger: ["blur", "input"],
    }
  ],
  repeatPassword: [
    {
      required: true,
      message: "请再次输入密码",
    },
    {
      validator: validatePasswordStartWith,
      message: "两次密码输入不一致",
      trigger: 'input',
    },
    {
      validator: validatePasswordSame,
      message: "两次密码输入不一致",
      trigger: ['password-input', 'blur'],
    },
  ],
  captcha: {
    required: true,
    message: "请输入验证码"
  }
}
const handleSignUpButtonClick = (e: MouseEvent) => {
  e.preventDefault()
  loadingRef.value = true
  signUpFormRef.value?.validate(async (errors) => {
    if (!errors) {
      try {
        const { status, data, content, errors } = await api.post<RegisterResponse>("/api/user/register/", {
          username: signUpFormValue.value.username,
          password: signUpFormValue.value.password,
          email: signUpFormValue.value.email,
          captcha_value: signUpFormValue.value.captcha,
          captcha_key: captchaInfo.value.key,
        })

        if (status !== 200) {
          if (errors) {
            for (const error of errors) {
              message.error(`${error.field}: ${error.err_msg}`)
            }
          } else {
            message.error(`注册失败: ${data.message}。请重试或联系管理员。`)
          }
        } else {
          message.success("注册成功，请登录")
          switchToSignInTabTrigger()
        }
      } catch (e) {
        message.error(`内部错误，请重试或联系管理员：${e.message}`)
        console.error(e)
      } finally {
        loadingRef.value = false
      }
    } else {
      message.error("信息输入有误")
      loadingRef.value = false
    }
  })
}
const tabsRef = ref(null)
const tabsValueRef = ref()
const switchToSignInTabTrigger = () => {
  tabsValueRef.value = 'sign-in'
  nextTick(() => {
    tabsRef.value.syncBarPosition()
  })
}

// captcha
const captchaInfo = ref({
  key: "",
  imageUrl: "",
})
const captchaLoading = ref(false)

// TODO: Handle the captcha reloading 
const updateCaptcha = async () => {
  captchaLoading.value = true
  try {
    const { status, data, content, errors } = await api.get<GetCaptchaResponse>('/api/captcha/')
    if (status === 200) {
      captchaInfo.value.imageUrl = content.image_url
      captchaInfo.value.key = content.key
    } else {
      message.error('获取验证码失败，请重试')
    }
  } catch (error) {
    console.error('error: ', error)
    message.error('获取验证码时发生错误，请重试')
  } finally {
    captchaLoading.value = false
  }
}

onMounted(async () => {
  await updateCaptcha()
})

const emit = defineEmits<{
  (e: 'close-modal'): void,
  (e: 'login-success', data: UserProfile): void
}>()

const goToForgotPassword = () => {
  emit('close-modal')
  router.push('/user/forget-password')
}

</script>

<style scoped>
.card-tabs .n-tabs-nav--bar-type {
  padding-left: 4px;
}
</style>