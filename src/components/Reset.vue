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

    <a-form-item
        :rules="[{ required: true, message: 'Please input your email!' }]"
        label="Email"
        name="email"
    >
      <a-input v-model:value="formState.password">
        <template #prefix>
          <LockOutlined class="site-form-item-icon"/>
        </template>
      </a-input>
    </a-form-item>


    <a-form-item>
      <a-button :disabled="disabled" class="login-form-button" html-type="submit" type="primary">
        Reset password
      </a-button>
      <a-button :disabled="disabled" class="login-form-button" html-type="submit" type="primary">
        Reset input
      </a-button>
      <a-button class="login-form-button" type="primary">
        <RouterLink to="/login">Back</RouterLink>
      </a-button>
    </a-form-item>
  </a-form>
</template>
<script lang="ts" setup>
import {computed, reactive} from 'vue';
import {LockOutlined, UserOutlined} from '@ant-design/icons-vue';

interface FormState {
  username: string;
  password: string;
  email: string;

}

const formState = reactive<FormState>({
  username: '',
  password: '',
  email: '',

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
