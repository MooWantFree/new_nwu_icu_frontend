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
        <div style="display: flex">
          <p style="margin-left: auto">
            <!--          TODO-->
            <RouterLink to="/reset">忘记密码</RouterLink>
          </p>
        </div>
        <n-button type="primary" block secondary strong @click="handleLoginButtonClick" :loading="loadingRef">
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

import {FormInst, FormItemRule, FormRules, useMessage} from "naive-ui";
import {nextTick, onMounted, ref} from "vue";
import {debounce} from 'lodash-es';

const props = defineProps<{
  onLoginSuccess: Function
}>()

// Common parts
const message = useMessage()
const loadingRef = ref<boolean>(false)

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
        const resp = await fetch("/api/user/login/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            username: loginFormValue.value.username,
            password: loginFormValue.value.password,
          })
        })
        if (!resp.ok) {
          const data = await resp.json()
          if (resp.status === 401) {
            message.error("用户名或密码错误")
          } else if (resp.status === 400) {
            message.error("您已经登录")
          } else {
            throw new Error(JSON.stringify(data))
          }
        } else {
          const data = await resp.json()
          props.onLoginSuccess(data)
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
  try {
    const response = await fetch('/api/user/username/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: value }),
    })
    if (response.status === 400) {
      throw new Error('用户名已被使用')
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
      } else if (!/^[A-Za-z0-9_]{4,29}$/.test(value)) {
        return new Error("用户名应只包括字母、数字与下划线，且长度位于4与29之间")
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
        const resp = await fetch("/api/user/register/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            username: signUpFormValue.value.username,
            password: signUpFormValue.value.password,
            email: signUpFormValue.value.email,
            captcha_value: signUpFormValue.value.captcha,
            captcha_key: captchaInfo.value.key,
          })
        })
        if (!resp.ok) {
          const data = await resp.json()
          if (resp.status === 400) {
            message.error(`注册失败: ${JSON.stringify(data.errors)}。请重试或联系管理员。`)
            // TODO: More user friendly
            return
          }
        } else {
          message.info(`注册成功，请登录`)
          switchToSignInTabTrigger()
        }
      } catch (e) {
        message.error(`内部错误，请重试或联系管理员：${e.message}`)
      } finally {
        loadingRef.value = false
      }
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
    const req = await fetch("/api/captcha")
    if (!req.ok) {
      throw new Error("Failed to fetch captcha")
    }
    const data = await req.json()
    captchaInfo.value.key = data.key
    captchaInfo.value.imageUrl = data.image_url
  } catch (error) {
    message.error("获取验证码失败，请重试。")
    console.error(error)
  } finally {
    captchaLoading.value = false
  }
}

onMounted(async () => {
  await updateCaptcha()
})

</script>

<style scoped>
.card-tabs .n-tabs-nav--bar-type {
  padding-left: 4px;
}
</style>