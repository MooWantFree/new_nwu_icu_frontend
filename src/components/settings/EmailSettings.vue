<template>
  <div class="bg-white p-6 mb-4">
    <h2 class="text-xl font-semibold mb-4">邮箱设置</h2>
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1"
          >主邮箱</label
        >
        <div class="flex">
          <input
            type="text"
            :value="mainEmailAddress"
            readonly
            class="flex-grow px-3 py-2 border border-gray-300 rounded-l-md text-gray-700 bg-gray-100"
          />
          <button
            @click="handleEditMainEmailAddressClicked"
            class="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 transition duration-200"
          >
            编辑
          </button>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1"
          >NWU邮箱</label
        >
        <div class="flex">
          <input
            ref="nwuEmailAddressInput"
            type="text"
            v-model="nwuEmailAddress"
            :readonly="!editNwuEmailAddress"
            :placeholder="editNwuEmailAddress ? '请输入NWU邮箱' : '暂无'"
            class="flex-grow px-3 py-2 border border-gray-300 rounded-l-md text-gray-700"
            :class="{
              'bg-gray-100': !editNwuEmailAddress,
              'border-red-500': nwuEmailError,
            }"
          />
          <button
            v-if="!nwuEmailAddress || editNwuEmailAddress"
            @click="handleNwuEmailAction"
            class="flex items-center justify-center px-4 py-2 rounded-r-md transition duration-200 text-white"
            :class="
              editNwuEmailAddress
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-blue-500 hover:bg-blue-600'
            "
          >
            <span v-if="!isLoadingBindNWUEmail">{{
              editNwuEmailAddress ? '保存' : '绑定'
            }}</span>
            <div v-else class="flex items-center justify-center space-x-2">
              <LoaderCircle class="animate-spin h-5 w-5 text-white" />
              <span class="text-white text-sm">正在保存</span>
            </div>
          </button>
          <div v-else-if="!isNWUEmailVerified" class="flex items-center">
            <button
              @click="showNWUEmailVerifyDialog"
              class="flex items-center justify-center px-4 py-2 rounded-r-md transition duration-200 text-white bg-yellow-500 hover:bg-yellow-600 cursor-pointer"
            >
              <span>等待验证</span>
            </button>
          </div>
          <div
            v-else
            @click="handleBindedNVerifiedNwuEmailAction"
            class="flex items-center justify-center px-4 py-2 rounded-r-md transition duration-200 text-white bg-blue-500 hover:bg-blue-600 cursor-pointer"
          >
            <span>已绑定</span>
          </div>
        </div>
        <p v-if="nwuEmailError" class="mt-1 text-sm text-red-600">
          {{ nwuEmailError }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { api } from '@/lib/requests'
import { APIUserProfile } from '@/types/api/user/profilePage'
import { useMessage, useDialog } from 'naive-ui'
import { LoaderCircle } from 'lucide-vue-next'
import { APIBindScholarEmailQuery } from '@/types/api/user/profilePage'

const props = defineProps<{
  userInfo: APIUserProfile['response']
}>()
const message = useMessage()
const dialog = useDialog()

const mainEmailAddress = ref(props.userInfo.email)
const nwuEmailAddress = ref(props.userInfo.nwu_email || '')
const editNwuEmailAddress = ref(false)
const isNWUEmailVerified = ref(true)

const nwuEmailAddressInput = useTemplateRef('nwuEmailAddressInput')

const handleEditMainEmailAddressClicked = () => {
  dialog.warning({
    title: '无法修改主邮箱',
    content: '抱歉，我们目前不支持修改主邮箱。如有特殊情况，请联系我们。',
    positiveText: '我知道了',
  })
}

const handleBindedNVerifiedNwuEmailAction = () => {
  dialog.warning({
    title: '无法修改NWU邮箱',
    content: '抱歉，我们目前不支持修改NWU邮箱。如有特殊情况，请联系我们。',
    positiveText: '我知道了',
  })
}

const isLoadingBindNWUEmail = ref(false)
const nwuEmailError = ref('')
const handleNwuEmailAction = async () => {
  if (editNwuEmailAddress.value) {
    try {
      nwuEmailError.value = ''

      const validationResult = APIBindScholarEmailQuery.safeParse({
        college_email: nwuEmailAddress.value,
      })
      if (!validationResult.success) {
        nwuEmailError.value =
          validationResult.error.errors[0]?.message || '邮箱格式不正确'
        return
      }

      isLoadingBindNWUEmail.value = true

      const resp = await api.post({
        url: '/api/user/bind-college-email/bind/',
        query: { college_email: nwuEmailAddress.value },
      })
      if (!resp.status.toString().startsWith('2')) {
        throw new Error('绑定失败，请重试')
      }
      message.success('NWU邮箱绑定成功')
      editNwuEmailAddress.value = false
      // FIXME: Temp solution
      isNWUEmailVerified.value = false
      showNWUEmailVerifyDialog()
    } catch (error) {
      if (error instanceof Error) {
        nwuEmailError.value = error.message
      } else {
        nwuEmailError.value = '绑定失败，请重试'
      }
    } finally {
      isLoadingBindNWUEmail.value = false
    }
  } else {
    editNwuEmailAddress.value = true
    nwuEmailAddressInput.value?.focus()
  }
}

const showNWUEmailVerifyDialog = () => {
  dialog.success({
    title: '等待验证',
    content: '请前往你的NWU邮箱，点击链接进行验证。',
    positiveText: '好的',
  })
}
</script>
