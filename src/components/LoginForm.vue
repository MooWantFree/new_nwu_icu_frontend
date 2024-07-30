<template>
  <n-tabs
      class="card-tabs"
      default-value="sign-in"
      size="large"
      animated
      pane-wrapper-style="margin: 0 -4px"
      pane-style="padding-left: 4px; padding-right: 4px; box-sizing: border-box;"
  >
    <n-tab-pane name="sign-in" tab="登录" :disabled="loadingRef">
      <n-form
          ref="loginFormRef"
          :model="loginFormValue"
          :rules="loginFormRules"
      >
        <n-form-item-row label="用户名" path="username">
          <n-input v-model:value="loginFormValue.username" placeholder="请输入邮箱或用户名"/>
        </n-form-item-row>
        <n-form-item-row label="密码" path="password">
          <n-input
              v-model:value="loginFormValue.password"
              placeholder="请输入密码"
              type="password"
              show-password-on="click"
          />
        </n-form-item-row>
      </n-form>
      <br/>
      <n-button type="primary" block secondary strong @click="handleLoginButtonClick" :loading="loadingRef">
        登录
      </n-button>
    </n-tab-pane>
    <n-tab-pane name="sign-up" tab="注册" :disabled="loadingRef">
      <n-form>
        <n-form-item-row label="用户名">
          <n-input/>
        </n-form-item-row>
        <n-form-item-row label="密码">
          <n-input/>
        </n-form-item-row>
        <n-form-item-row label="重复密码">
          <n-input/>
        </n-form-item-row>
      </n-form>
      <n-button type="primary" block secondary strong>
        注册
      </n-button>
    </n-tab-pane>
  </n-tabs>
</template>

<script lang="ts" setup>

import {FormInst, useMessage} from "naive-ui";
import {ref} from "vue";

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
    trigger: "blur",
  },
  password: {
    required: true,
    message: "请输入密码",
    trigger: "blur",
  }
}
const handleLoginButtonClick = (e: MouseEvent) => {
  e.preventDefault()
  loadingRef.value = true
  loginFormRef.value?.validate((errors) => {
    if (!errors) {
      // TODO: CSRF Token
      fetch("/api/user/login/", {
        method: "POST",
        body: JSON.stringify({
          username: loginFormValue.value.username,
          password: loginFormValue.value.password,
        })
      })
          .then((resp) => {
            if (!resp.ok) {
              return resp.json().then(data=>{
                if (resp.status === 401) {
                  message.error("用户名或密码错误")
                } else if (resp.status === 400) {
                  message.error("您已经登录")
                }
                const error = new Error(`HTTP ${resp.status}: ${data.detail}`)
                error.response = data // 其实这个玩意儿挺脏的
                throw error
              })
            }
            return resp.json()
          })
          .then(data=>{
            message.success("成功登录，页面将会刷新")
            // TODO
          })
          .catch(err=>{
            console.log(err)
            if (!err.response) {
              message.error("网络错误，请重试或联系管理员")
            }
          })
          .finally(()=>{
            loadingRef.value = false
          })
    } else {
      message.error("信息输入有误")
      loadingRef.value = false
    }
  })
}

// Sign up part
const signUpFormRef = ref(null)


</script>

<style scoped>
.card-tabs .n-tabs-nav--bar-type {
  padding-left: 4px;
}
</style>