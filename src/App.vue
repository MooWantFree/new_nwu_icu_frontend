<template>
  <n-loading-bar-provider>
    <n-message-provider>
      <n-notification-provider>
        <n-modal-provider>
          <n-dialog-provider>
            <div class="AllPage">
              <div>
                <Navbar/>
              </div>

              <div class="content-wrapper">
                <div class="content-container">
                  <RouterView/>
                </div>
              </div>
              <div class="home_footer">2019-{{ new Date().getFullYear() }} NWU.ICU</div>
            </div>
          </n-dialog-provider>
        </n-modal-provider>
      </n-notification-provider>
    </n-message-provider>
  </n-loading-bar-provider>
</template>

<script lang="ts" setup>
import Navbar from "@/components/NavBar.vue";
</script>

<style scoped>
.AllPage {
  display: flex;
  flex-direction: column; /* 垂直排列子元素 */
  height: 100vh; /* 高度占满视口 */
  background-color: #F3F3F3;
  padding-bottom: 510px;
}



.content-wrapper {
  padding-top: 50px;
  flex: 1; /* 占据剩余空间 */
  display: flex;
  justify-content: center; /* 水平居中对齐 */
}

.content-container {
  width: 80%;
  max-width: 80vw; /* 确保最大宽度为屏幕的80% */
  background-color: white; /* 设置背景颜色为白色 */
  padding: 20px; /* 添加一些内边距 */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* 添加一些阴影效果 */
  overflow: hidden; /* 防止内容溢出 */
  display: flex;
  flex-direction: column;
}


.home_footer {
  text-align: center;
  padding: 10px;
  background-color: #f1f1f1;
}
</style>
