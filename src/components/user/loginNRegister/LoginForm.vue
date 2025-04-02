<template>
  <div class="login-form-container">
    <!-- Tab Headers -->
    <div class="tab-headers">
      <button 
        class="tab-button" 
        :class="{ 'active': activeTab === 'login' }"
        @click="setActiveTab('login')"
        :disabled="loading"
      >
        登录
      </button>
      <button 
        class="tab-button" 
        :class="{ 'active': activeTab === 'register' }"
        @click="setActiveTab('register')"
        :disabled="loading"
      >
        注册
      </button>
    </div>
    
    <!-- Tab Contents -->
    <div class="tab-contents p-6">
      <Transition name="fade" mode="out-in">
        <LoginTabContent 
          v-if="activeTab === 'login'" 
          :loading="loading"
          @login-success="handleLoginSuccess"
          @update:loading="updateLoading"
        />
        <RegisterTabContent 
          v-else 
          :loading="loading"
          @register-success="handleRegisterSuccess"
          @update:loading="updateLoading"
        />
      </Transition>
    </div>
    
    <!-- Messages (Error or Success) -->
    <div class="px-6 pb-4">
      <div v-if="generalError" class="text-red-600 text-sm bg-red-50 p-3 rounded-md">
        {{ generalError }}
      </div>
      <div v-if="successMessage" class="text-green-600 text-sm bg-green-50 p-3 rounded-md">
        {{ successMessage }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import LoginTabContent from './LoginTabContent.vue';
import RegisterTabContent from './RegisterTabContent.vue';
import { APILogin } from '@/types/api/user/user';

type UserProfile = APILogin['response'];

// Shared state
const activeTab = ref('login');
const loading = ref(false);
const generalError = ref('');
const successMessage = ref('');

// Emitted events
const emit = defineEmits<{
  (e: 'close-modal'): void
  (e: 'login-success', data: UserProfile): void
}>();

// Tab switching
const setActiveTab = (tab: string) => {
  activeTab.value = tab;
  generalError.value = '';
  successMessage.value = '';
};

// Handle loading state from child components
const updateLoading = (value: boolean) => {
  loading.value = value;
};

// Handle login success
const handleLoginSuccess = (profile: UserProfile) => {
  emit('login-success', profile);
};

// Handle register success
const handleRegisterSuccess = () => {
  // Clear any error messages
  generalError.value = '';
  // Show success message
  successMessage.value = '注册成功！请检查你的邮箱，点击激活链接完成账号激活。';
  // Keep user on the register tab to see the success message
};

// For backward compatibility with code that might call this
const switchToSignInTabTrigger = () => {
  setActiveTab('login');
};

// Expose methods that might be called from parent components
defineExpose({
  switchToLoginTab: () => setActiveTab('login'),
  switchToSignInTabTrigger
});
</script>

<style scoped>
.login-form-container {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  width: 100%;
  max-width: 460px;
  overflow: hidden;
}

.tab-headers {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
}

.tab-button {
  flex: 1;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 500;
  text-align: center;
  background-color: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #6b7280;
}

.tab-button:hover:not(:disabled) {
  color: #1d4ed8;
}

.tab-button.active {
  color: #1d4ed8;
  border-bottom: 2px solid #1d4ed8;
}

.tab-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.tab-contents {
  min-height: 380px;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
