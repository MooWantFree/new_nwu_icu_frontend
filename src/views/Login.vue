<template>
  <a-form
      :model="formState"
      class="login-form"
      name="normal_login"
      @finish="onFinish"
      @finishFailed="onFinishFailed"
  >
    <a-form-item
        :rules="[{ required: true, message: 'Please input your username!' }]"
        label="Username"
        name="username"
    >
      <a-input v-model:value="formState.username">
        <template #prefix>
          <UserOutlined class="site-form-item-icon"/>
        </template>
      </a-input>
    </a-form-item>

    <a-form-item
        :rules="[{ required: true, message: 'Please input your password!' }]"
        label="Password"
        name="password"
    >
      <a-input-password v-model:value="formState.password">
        <template #prefix>
          <LockOutlined class="site-form-item-icon"/>
        </template>
      </a-input-password>
    </a-form-item>

    <a-form-item>
      <a-form-item name="remember" no-style>
        <a-checkbox v-model:checked="formState.remember">Remember me</a-checkbox>
      </a-form-item>
      <a class="login-form-forgot" href="/reset">Forgot password</a>
    </a-form-item>

    <a-form-item>
      <a-button :disabled="disabled" class="login-form-button" html-type="submit" type="primary">
        Log in
      </a-button>
      Or
      <a href="/register">register now!</a>
    </a-form-item>
  </a-form>
</template>
<script lang="ts" setup>
import {computed, reactive} from 'vue';

interface FormState {
  username: string;
  password: string;
  remember: boolean;
}

const formState = reactive<FormState>({
  username: '',
  password: '',
  remember: true,
});
const onFinish = (values: any) => {
  console.log('Success:', values);
};

const onFinishFailed = (errorInfo: any) => {
  console.log('Failed:', errorInfo);
};
const disabled = computed(() => {
  return !(formState.username && formState.password);
});
</script>
<style scoped>

</style>
