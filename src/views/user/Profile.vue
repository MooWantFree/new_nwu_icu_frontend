<template>
  <template v-if="profileData">
    <div class="flex justify-center">
      <div class="flex flex-row justify-center w-4/5 pt-8">
        <div class="flex flex-1 flex-col justify-center justify-items-center ">
          <div class="cursor-pointer">
            <n-upload
                action="/api/upload/"
                @finish="handleFinish"
                @before-upload="beforeUpload"
                accept="image/png, image/jpeg, image/jpg"
                :default-upload="true"
                :show-file-list="false"
            >
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-avatar :bordered="true" round :size="300" class="shadow border-solid border-2 border-gray-300 "
                          :src="`/api/download/${avatar_url}`"/>
              </template>
              点击更换头像
            </n-tooltip>
            </n-upload>
          </div>

          <div v-if="showProfile" class="pt-4">
            <p class="pt-2 text-3xl text-black font-semibold">{{ profileData.message.nickname }}</p>
            <p class="text-xl text-zinc-400 ">@{{ profileData.message.username }}</p>
            <p class="pt-2 text-xl">{{ profileData.message.bio }}</p>
          </div>
          <div v-else class="pt-4 w-4/5 space-y-1">
            <p class="text-base font-semibold">用户名(登录使用的)</p>
            <n-input v-model:value="profileData.message.username" type="text" placeholder="用户名"/>
            <p class="text-base font-semibold">昵称(网站中对外展示的)</p>
            <n-input v-model:value="profileData.message.nickname" type="text" placeholder="昵称"/>
            <p class="text-base font-semibold">签名</p>
            <n-input v-model:value="profileData.message.bio" type="text" placeholder="个性签名"/>
            <n-button quaternary>修改邮箱/密码等</n-button>
          </div>

          <div class="pt-4 ">
            <n-button v-if="showProfile" secondary class="w-4/5  border-solid border border-gray-300"
                      @click="showProfile=!showProfile">
              <template #icon>
                <n-icon>
                  <CreateOutline/>
                </n-icon>
              </template>
              <p class="text-center font-semibold flex-grow text-base ">
                编辑个人资料</p>
            </n-button>
            <div v-else>
              <n-button type="primary" class="border-solid border border-gray-300 mr-3">
                保存
              </n-button>
              <n-button strong secondary class="border-solid border-gray-300" @click="showProfile=!showProfile">
                取消
              </n-button>
            </div>

          </div>
          <div v-if="profileData" class="pt-4 text-base">
            <p>第 {{ profileData.message.id }} 位用户, 加入于
            <n-tooltip trigger="hover">
              <template #trigger>
                <span>
                  <n-number-animation ref="numberAnimationInstRef" :from="0" :to="daysAlive"/>
                  天前
                </span>
              </template>
              <n-time :time="new Date(profileData.message.date_joined)" format="yyyy-MM-dd hh:mm:ss"/>
            </n-tooltip>
          </p>

        </div>
        </div>

        <div class=" flex-3 rounded-md">
          <div class="flex justify-start pb-4">
            <p :class="mySelect === 'review' ? 'font-semibold text-2xl' : 'font-thin text-2xl cursor-pointer'"
               @click="mySelect = 'review'">
              我的课程评价
            </p>
            <p class=" text-2xl">&nbsp;|&nbsp;</p>
            <p :class="mySelect === 'reply' ? 'font-semibold text-2xl' : 'font-thin text-2xl cursor-pointer'"
               @click="mySelect = 'reply'">
              我的回复
            </p>
          </div>
          <MyReview v-if="mySelect === 'review'"/>
          <MyReply v-else-if="mySelect === 'reply'"/>
        </div>
      </div>
    </div>


  </template>
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue';
import type {UploadFileInfo} from 'naive-ui';
import {useMessage} from 'naive-ui';
import {CreateOutline} from "@vicons/ionicons5"
import MyReply from "@/views/courseReview/MyReply.vue";
import MyReview from "@/views/courseReview/MyReview.vue";
import type {UserProfile} from '@/types/userProfile'
import {avatar_url} from '@/lib/avatar'

const message = useMessage();
const mySelect = ref<string>('review');
const showProfile = ref<boolean>(true);

const beforeUpload = async (data: { file: UploadFileInfo; fileList: UploadFileInfo[] }) => {
  const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg'];
  if (!allowedTypes.includes(data.file.file?.type)) {
    message.error('只能上传 png、jpg 或 jpeg 格式的图片文件，请重新上传');
    return false;
  }
  return true;
};
const handleFinish = async ({file, event}: {
  file: UploadFileInfo
  event?: ProgressEvent
}) => {
  const avatar_uuid = JSON.parse((event?.target as XMLHttpRequest).response).id
  try {
    const resp = await fetch('/api/user/profile/', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        avatar_uuid: avatar_uuid
      })
    });
    if (!resp.ok) {
      console.error('Failed to fetch profile:', resp.statusText);
      message.error("更改头像失败")
      return;
    }
  } catch (error) {
    message.error("更改头像失败")
    console.error('Failed to fetch profile:', error);
  }
  await profileReq()
  message.success("更改头像成功")
}
const profileData = ref<UserProfile | null>(null);
const profileReq = async () => {
  try {
    const resp = await fetch('/api/user/profile/', {
      method: 'GET',
    });
    if (!resp.ok) {
      console.error('Failed to fetch profile:', resp.statusText);
      return;
    }
    profileData.value = await resp.json();
    avatar_url.value = profileData.value.message.avatar;
    calculateDaysAlive();
  } catch (error) {
    console.error('Failed to fetch profile:', error);
  }
};
const daysAlive = ref<number>(0)
const calculateDaysAlive = () => {
  if (profileData.value) {
    const startDate = new Date(profileData.value.message.date_joined)
    const diffTime = Math.abs(new Date().getTime() - startDate.getTime())
    daysAlive.value = diffTime / (1000 * 60 * 60 * 24)
  }

}


onMounted(async () => {
  await profileReq();

});
</script>
<style scoped>

</style>