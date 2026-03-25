<template>
  <view :class="['login-container', themeClass]">
    <!-- 状态栏占位 -->
    <view class="status-bar"></view>

    <!-- 标题区域 -->
    <view class="header">
      <text class="page-title">{{ t('login.phonePageTitle') }}</text>
      <text class="page-subtitle">{{ t('login.phonePageSubtitle') }}</text>
    </view>

    <!-- 表单区域 -->
    <view class="form-wrapper">
      <view class="form-card">
        <!-- 手机号输入 -->
        <view class="form-group">
          <view class="input-wrap">
            <u-input
              v-model="formData.phone"
              type="number"
              :placeholder="t('login.phonePlaceholder')"
              border="none"
              :custom-style="inputStyle"
              :placeholder-style="placeholderStyle"
              maxlength="11"
            />
          </view>
        </view>

        <!-- 验证码输入 + 获取验证码 -->
        <view class="form-group">
          <view class="verify-row">
            <view class="input-wrap verify-input">
              <u-input
                v-model="formData.code"
                type="number"
                :placeholder="t('login.codePlaceholder')"
                border="none"
                :custom-style="inputStyle"
                :placeholder-style="placeholderStyle"
                maxlength="6"
              />
            </view>
            <view
              class="get-code-btn"
              :class="{ disabled: countdown > 0 }"
              @click="getVerifyCode"
            >
              <text class="code-btn-text">{{ countdown > 0 ? `${countdown}s` : t('login.getCode') }}</text>
            </view>
          </view>
        </view>

        <u-button
          type="primary"
          :loading="loading"
          :custom-style="buttonStyle"
          @click="handleLogin"
        >
          {{ loading ? t('login.loading') : t('login.loginBtn') }}
        </u-button>

        <!-- 返回按钮 -->
        <view class="back-btn" @click="goBack">
          {{ t('login.backBtn') }}
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAppStore } from '@/store/app'
import { useI18n } from 'vue-i18n'
import UInput from 'uview-plus/components/u-input/u-input.vue'
import UButton from 'uview-plus/components/u-button/u-button.vue'

interface PhoneFormData {
  phone: string
  code: string
}

const appStore = useAppStore()
const { t, locale } = useI18n()

const themeClass = computed(() => appStore.theme)

watch(() => appStore.language, (newLang: string) => {
  locale.value = newLang
})

const loading = ref(false)
const countdown = ref(0)
const formData = ref<PhoneFormData>({
  phone: '',
  code: ''
})

const inputStyle = computed(() => ({
  backgroundColor: 'transparent',
  border: 'none',
  padding: '24rpx 0',
  fontSize: '28rpx',
  color: 'var(--t-primary)'
}))

const placeholderStyle = computed(() => ({
  color: 'var(--t-regular)'
}))

const buttonStyle = computed(() => ({
  width: '100%',
  height: '88rpx',
  borderRadius: '16rpx',
  fontSize: '32rpx',
  fontWeight: '500',
  marginTop: '48rpx',
  backgroundColor: 'var(--c-main)',
  border: 'none'
}))

const goBack = (): void => {
  uni.navigateBack()
}

const getVerifyCode = (): void => {
  if (!formData.value.phone || formData.value.phone.length !== 11) {
    uni.showToast({ title: t('login.invalidPhone'), icon: 'none' })
    return
  }
  if (countdown.value > 0) return

  // 模拟发送验证码
  uni.showToast({ title: t('login.codeSent'), icon: 'success' })
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) clearInterval(timer)
  }, 1000)
}

const handleLogin = async (): Promise<void> => {
  if (!formData.value.phone || formData.value.phone.length !== 11) {
    uni.showToast({ title: t('login.phoneRequired'), icon: 'none' })
    return
  }
  if (!formData.value.code) {
    uni.showToast({ title: t('login.codeRequired'), icon: 'none' })
    return
  }

  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1500))
    uni.showToast({ title: t('login.loginSuccess'), icon: 'success' })
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/index/index' })
    }, 1000)
  } catch (error) {
    uni.showToast({ title: t('login.loginFailed'), icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--c-bg);
}

.login-container.light {
  --c-bg: #F5F7FA;
  --c-card: #FFFFFF;
  --c-main: #2563EB;
  --c-main-light: #EFF6FF;
  --t-primary: #1F2937;
  --t-regular: #6B7280;
  --t-secondary: #9CA3AF;
  --c-border: #E5E7EB;
  --c-status-bar: #F5F7FA;
}

.login-container.dark {
  --c-bg: #0F172A;
  --c-card: #1E293B;
  --c-main: #3B82F6;
  --c-main-light: #1E3A5F;
  --t-primary: #F1F5F9;
  --t-regular: #94A3B8;
  --t-secondary: #64748B;
  --c-border: #334155;
  --c-status-bar: #0F172A;
}

/* 状态栏 */
.status-bar {
  height: var(--status-bar-height);
  background-color: var(--c-status-bar);
}

/* 标题区域 */
.header {
  padding: 32rpx 40rpx 48rpx;
}

.page-title {
  display: block;
  font-size: 52rpx;
  font-weight: 700;
  color: var(--t-primary);
  letter-spacing: -1rpx;
}

.page-subtitle {
  display: block;
  font-size: 28rpx;
  color: var(--t-regular);
  margin-top: 12rpx;
}

/* 表单区域 */
.form-wrapper {
  padding: 0 40rpx 60rpx;
}

.form-card {
  background-color: var(--c-card);
  border-radius: 24rpx;
  padding: 48rpx 40rpx;
  border: 2rpx solid var(--c-border);
}

.form-group {
  margin-bottom: 32rpx;
}

.input-wrap {
  background-color: var(--c-bg);
  border-radius: 16rpx;
  border: 2rpx solid var(--c-border);
  padding: 0 24rpx;
  transition: all 0.2s ease;
}

.input-wrap:focus-within {
  border-color: var(--c-main);
}

.verify-row {
  display: flex;
  gap: 16rpx;
}

.verify-input {
  flex: 1;
}

.get-code-btn {
  min-width: 180rpx;
  height: 88rpx;
  border-radius: 16rpx;
  background-color: transparent;
  border: 2rpx solid var(--c-main);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.get-code-btn:active {
  background-color: var(--c-main-light);
}

.get-code-btn.disabled {
  background-color: var(--c-border);
  border-color: var(--c-border);
}

.code-btn-text {
  font-size: 26rpx;
  font-weight: 500;
  color: var(--c-main);
}

/* 返回按钮 - 与登录按钮样式相同，颜色不同 */
.back-btn {
  width: 100%;
  height: 88rpx;
  border-radius: 16rpx;
  font-size: 32rpx;
  font-weight: 500;
  margin-top: 24rpx;
  background-color: transparent;
  border: 2rpx solid var(--c-border);
  color: var(--t-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.back-btn:active {
  background-color: var(--c-border);
}

/* 穿透样式 */
::v-deep .u-input {
  color: var(--t-primary) !important;
  font-size: 28rpx !important;
}

::v-deep .uni-input-input {
  color: var(--t-primary) !important;
}
</style>
