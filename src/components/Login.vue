<template>
    <n-tabs
        class="card-tabs"
        default-value="sign-in"
        size="large"
        animated
        pane-wrapper-style="margin: 0 -4px"
        pane-style="padding-left: 4px; padding-right: 4px; box-sizing: border-box;"
    >
      <n-tab-pane name="sign-in" tab="登录">
        <n-form>
          <n-form-item-row label="用户名">
            <n-input />
          </n-form-item-row>
          <n-form-item-row label="密码">
            <n-input />
          </n-form-item-row>
        </n-form>
        <br />
        <n-button type="primary" block secondary strong>
          登录
        </n-button>
      </n-tab-pane>
      <n-tab-pane name="sign-up" tab="注册">
        <n-form>
          <n-form-item-row label="用户名">
            <n-input />
          </n-form-item-row>
          <n-form-item-row label="密码">
            <n-input />
          </n-form-item-row>
          <n-form-item-row label="重复密码">
            <n-input />
          </n-form-item-row>
        </n-form>
        <n-button type="primary" block secondary strong>
          注册
        </n-button>
      </n-tab-pane>
    </n-tabs>
</template>

<script lang="ts" setup>
// TODO
</script>

<style scoped>
.card-tabs .n-tabs-nav--bar-type {
  padding-left: 4px;
}
</style>