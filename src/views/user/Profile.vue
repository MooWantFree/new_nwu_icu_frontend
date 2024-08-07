<template>
  <template v-if="profileData">
    <div class="flex justify-center">
      <div class="flex flex-row justify-center w-4/5 pt-8">
        <div class="flex flex-1 flex-col justify-center justify-items-center ">
          <div class="cursor-pointer">
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-avatar :bordered="true" round :size="256" :src="`/api/download/${profileData.message.avatar}`"/>
              </template>
              点击更换头像
            </n-tooltip>
          </div>

          <div class="pt-4">
            <p class="pt-2 text-3xl text-black font-semibold">{{ profileData.message.nickname }}</p>
            <p class="text-xl text-zinc-400 ">@{{ profileData.message.username }}</p>
            <p class="pt-2 text-xl">{{ profileData.message.bio }}</p>
          </div>

          <div class="pt-4 ">
            <n-button secondary class="w-4/5 border border-black">
              <template #icon>
                <n-icon>
                  <CreateOutline/>
                </n-icon>
              </template>
              <p class="text-center font-semibold flex-grow text-base">
                编辑个人资料</p>
            </n-button>
          </div>
          <div class="pt-4 text-base">
            <p>第 {{ profileData.message.id }} 位用户, 加入于
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-time :time="new Date(profileData.message.date_joined)" type="relative"/>
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
import {nextTick, onMounted, ref} from 'vue';
import type {InputInst, UploadFileInfo} from 'naive-ui';
import {useMessage} from 'naive-ui';
import {CreateOutline} from "@vicons/ionicons5"
import MyReply from "@/views/courseReview/MyReply.vue";
import MyReview from "@/views/courseReview/MyReview.vue";
import type {UserProfile} from '@/types/userProfile'
import MyTimeLine from "@/views/courseReview/MyTimeLine.vue";

const message = useMessage();
const editNicknameFlag = ref(false)
const editEmailFlag = ref(false)
const editNwuEmailFlag = ref(false)
const inputInstNicknameRef = ref<InputInst | null>(null)
const inputInstEmailRef = ref<InputInst | null>(null)
const inputInstNwuEmailRef = ref<InputInst | null>(null)
const nickname = ref<string>()
const mySelect = ref<string>('review');
const showReview = ref(false)
const email = ref<string>()
const nwuEmail = ref<string>()
const editNickName = () => {
  editNicknameFlag.value = !editNicknameFlag.value;
  nextTick(() => {
    inputInstNicknameRef.value.focus();
  })

}
const editEmail = () => {
  editEmailFlag.value = !editEmailFlag.value;
  nextTick(() => {
    inputInstEmailRef.value.focus();
  })

}
const editNwuEmail = () => {
  editNwuEmailFlag.value = !editNwuEmailFlag.value;
  nextTick(() => {
    inputInstNwuEmailRef.value.focus();
  })

}
const submitEmail = async () => {
  editEmailFlag.value = !editEmailFlag.value;
}
const submitNwuEmail = async () => {
  editNwuEmailFlag.value = !editNwuEmailFlag.value
}

interface updateNicknameProps {
  error: string;
}

const updateNicknameData = ref<updateNicknameProps>(null);
const submitNickName = async () => {
  editNicknameFlag.value = !editNicknameFlag.value;
  try {
    const resp = await fetch('/api/user/profile/', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        nickname: nickname.value
      })
    });
    if (!resp.ok) {
      console.error('Failed to fetch profile:', resp.statusText);
      updateNicknameData.value = await resp.json()
      console.log(updateNicknameData.value.error)
      message.error("更改昵称失败, 原因:" + updateNicknameData.value.error, {
        closable: true,
        duration: 5000
      })
      return;
    }
  } catch (error) {
    message.error("更改昵称失败")
    console.error('Failed to fetch profile:', error);
  }
  await profileReq()
  message.success("更改昵称成功")
}
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
      message.error("上传头像失败")
      return;
    }
  } catch (error) {
    message.error("上传头像失败")
    console.error('Failed to fetch profile:', error);
  }
  await profileReq()
  message.success("上传头像成功")
}





const profileData = ref<UserProfile | null>(null);

const profileReq = async () => {
  try {
    const resp = await fetch('/api/user/profile/', {
      method: 'GET',
    });
    if (!resp.ok) {
      // TODO: 错误处理
      console.error('Failed to fetch profile:', resp.statusText);
      return;
    }
    profileData.value = await resp.json();
    nickname.value = profileData.value.message.nickname
  } catch (error) {
    console.error('Failed to fetch profile:', error);
  }
};

onMounted(() => {
  profileReq();

});
</script>
<style scoped>

</style>