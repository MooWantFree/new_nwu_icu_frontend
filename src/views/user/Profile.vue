<template>
  <template v-if="profileData">
    <div class="parent">
      <div class="my-profile">
        <div class="user-info">
          <div class="user-avatar">
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-badge value="V">
                  <n-avatar round :size="300" :src="`/api/download/${profileData.message.avatar}`"/>
                </n-badge>
              </template>
              点击更换头像
            </n-tooltip>

          </div>

          <div class="user-all-name">
            <div class="username">
              <p>{{ profileData.message.username }}</p>
            </div>
            <div class="nickname">
              <p>{{ profileData.message.nickname }}</p>
            </div>

          </div>

          <div class="bio">
            <p>{{ profileData.message.bio }}</p>
          </div>

          <n-button secondary strong>编辑个人资料</n-button>
          <p>第 {{ profileData.message.id }} 位用户, 加入于
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-time :time="new Date(profileData.message.date_joined)" type="relative"/>
              </template>
              <n-time :time="new Date(profileData.message.date_joined)" format="yyyy-MM-dd hh:mm:ss"/>
            </n-tooltip>
          </p>
        </div>

        <div class="review">
          <p>占位符</p>
        </div>
      </div>
    </div>


  </template>
</template>

<script setup lang="ts">
import {nextTick, onMounted, ref} from 'vue';
import type {InputInst, UploadFileInfo} from 'naive-ui';
import {useMessage} from 'naive-ui';

const message = useMessage();
const editNicknameFlag = ref(false)
const editEmailFlag = ref(false)
const editNwuEmailFlag = ref(false)
const inputInstNicknameRef = ref<InputInst | null>(null)
const inputInstEmailRef = ref<InputInst | null>(null)
const inputInstNwuEmailRef = ref<InputInst | null>(null)
const nickname = ref<string>()
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

interface UserProfile {
  message: {
    id: number;
    username: string;
    email: string;
    date_joined: number;
    nickname: string;
    avatar: string;
    nwu_email: string;
    bio: string;
  }
}

interface Review {
  id: number;
  anonymous: boolean;
  datetime: string;
  course: {
    course_name: string;
    course_id: number;
  };
  like: {
    like: number;
    dislike: number;
  };
  content: {
    current_content: string;
    content_history: string[];
  };
  teachers: {
    teacher_name: string;
    teacher_id: number;
  }[];
  semester: string;
}

interface Message {
  reviews: Review[];
}

const profileData = ref<UserProfile | null>(null);
const reviewData = ref<Message[]>(null);
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
const reviewReq = async () => {
  try {
    const resp = await fetch('/api/review/my-review', {
      method: 'GET',
    });
    if (!resp.ok) {
      console.error('Failed to fetch profile:', resp.statusText);
      return;
    }
    reviewData.value = await resp.json();
  } catch (error) {
    console.error('Failed to fetch profile:', error);
  }
};

onMounted(() => {
  profileReq();
  reviewReq();
});
</script>
<style scoped>
.parent {
  display: flex;
  justify-content: center;
}

.my-profile {
  display: flex;
  flex-direction: row;
  justify-content: center;
  justify-items: center;
  align-items: center;
  width: 80%;
  padding-top: 2rem;
}

.user-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  justify-items: center;
}

.user-all-name {
  padding-top: 1rem;

}

.username {
  font-size: 1.5rem;
  font-weight: 600;
}

.nickname {
  font-size: 1.25rem;
  font-weight: 300;
  color: #636c76;
}
.bio{
  font-size: 1rem;

}

.review {
  background-color: grey;
  flex: 2
}

.pointer {
  cursor: pointer;
}


.user-all-name p {
  margin: 0;
  padding: 0;
}

.user-avatar {
  cursor: pointer;
}

</style>