<template>
  <view :class="['login-container', themeClass]">
    <!-- 状态栏占位 -->
    <view class="status-bar"></view>

    <!-- 标题区域 -->
    <view class="header">
      <text class="page-title">{{ t('login.registerPageTitle') }}</text>
      <text class="page-subtitle">{{ t('login.registerPageSubtitle') }}</text>
    </view>

    <!-- 表单区域 -->
    <view class="form-wrapper">
      <view class="form-card">
        <!-- 账号 -->
        <view class="form-group">
          <view class="input-wrap">
            <u-input
              v-model="formData.username"
              :placeholder="t('login.usernamePlaceholder')"
              border="none"
              :custom-style="inputStyle"
              :placeholder-style="placeholderStyle"
            />
          </view>
        </view>

        <!-- 手机号码 -->
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

        <!-- 短信验证码 -->
        <view class="form-group">
          <view class="verify-row">
            <view class="input-wrap verify-input">
              <u-input
                v-model="formData.verifyCode"
                type="number"
                :placeholder="t('login.verifyCodePlaceholder')"
                border="none"
                :custom-style="inputStyle"
                :placeholder-style="placeholderStyle"
                maxlength="6"
              />
            </view>
            <view
              class="get-code-btn"
              :class="{ disabled: countdown > 0 }"
              @click="sendVerifyCode"
            >
              <text class="code-btn-text">{{ countdown > 0 ? countdown + 's' : t('login.sendVerifyCode') }}</text>
            </view>
          </view>
        </view>

        <!-- 密码 -->
        <view class="form-group">
          <view class="input-wrap">
            <u-input
              v-model="formData.password"
              :password="!showPassword"
              :placeholder="t('login.passwordPlaceholder')"
              border="none"
              :custom-style="inputStyle"
              :placeholder-style="placeholderStyle"
              :password-icon="true"
              @icon-click="showPassword = !showPassword"
            />
          </view>
          <!-- 密码强度条 - 5段 -->
          <view class="strength-bar">
            <view
              class="strength-segment"
              :class="getStrengthClass(1)"
            ></view>
            <view
              class="strength-segment"
              :class="getStrengthClass(2)"
            ></view>
            <view
              class="strength-segment"
              :class="getStrengthClass(3)"
            ></view>
            <view
              class="strength-segment"
              :class="getStrengthClass(4)"
            ></view>
            <view
              class="strength-segment"
              :class="getStrengthClass(5)"
            ></view>
          </view>
          <view class="strength-text" v-if="strengthLevel > 0">
            {{ t('login.passwordStrength_' + strengthLevel) }}
          </view>
        </view>

        <!-- 确认密码 -->
        <view class="form-group">
          <view class="input-wrap">
            <u-input
              v-model="formData.confirmPassword"
              :password="!showConfirmPassword"
              :placeholder="t('login.confirmPasswordPlaceholder')"
              border="none"
              :custom-style="inputStyle"
              :placeholder-style="placeholderStyle"
              :password-icon="true"
              @icon-click="showConfirmPassword = !showConfirmPassword"
            />
          </view>
        </view>

        <!-- 隐私政策勾选 -->
        <view class="privacy-check" @click="agreePrivacy = !agreePrivacy">
          <view class="checkbox" :class="{ checked: agreePrivacy }">
            <u-icon v-if="agreePrivacy" name="checkmark" size="12" color="#fff"></u-icon>
          </view>
          <text class="privacy-text">
            {{ t('login.privacyAgreePrefix') }}
            <text class="privacy-link">{{ t('login.privacyPolicy') }}</text>
            {{ t('login.privacyAgreeSuffix') }}
          </text>
        </view>

        <!-- 注册按钮 -->
        <u-button
          type="primary"
          :loading="loading"
          :custom-style="buttonStyle"
          @click="handleRegister"
        >
          {{ loading ? t('common.loading') : t('login.registerBtnText') }}
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
import UIcon from 'uview-plus/components/u-icon/u-icon.vue'
import UButton from 'uview-plus/components/u-button/u-button.vue'

interface RegisterFormData {
  username: string
  phone: string
  verifyCode: string
  password: string
  confirmPassword: string
}

const appStore = useAppStore()
const { t, locale } = useI18n()

const themeClass = computed(() => appStore.theme)

watch(() => appStore.language, (newLang: string) => {
  locale.value = newLang
})

const loading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const agreePrivacy = ref(false)
const countdown = ref(0)

const formData = ref<RegisterFormData>({
  username: '',
  phone: '',
  verifyCode: '',
  password: '',
  confirmPassword: ''
})

const strengthLevel = computed(() => {
  const pwd = formData.value.password
  if (pwd.length === 0) return 0
  if (pwd.length < 6) return 1
  if (pwd.length < 8) return 2
  if (pwd.length >= 8 && !(/[a-zA-Z]/.test(pwd) && /\d/.test(pwd))) return 3
  if (pwd.length >= 8 && /[a-zA-Z]/.test(pwd) && /\d/.test(pwd) && !(/[a-z]/.test(pwd) && /[A-Z]/.test(pwd))) return 4
  if (pwd.length >= 8 && /[a-z]/.test(pwd) && /[A-Z]/.test(pwd) && /\d/.test(pwd) && /[^a-zA-Z0-9]/.test(pwd)) return 5
  if (pwd.length >= 8 && /[a-z]/.test(pwd) && /[A-Z]/.test(pwd) && /\d/.test(pwd)) return 5
  return 3
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
  marginTop: '32rpx',
  backgroundColor: 'var(--c-main)',
  border: 'none'
}))

const goBack = (): void => uni.navigateBack()

const getStrengthClass = (index: number): string[] => {
  if (strengthLevel.value >= index) {
    return ['active', 'strength-' + strengthLevel.value]
  }
  return []
}

const sendVerifyCode = (): void => {
  if (countdown.value > 0) return
  if (!formData.value.phone || formData.value.phone.length !== 11) {
    uni.showToast({ title: t('login.phoneError'), icon: 'none' })
    return
  }
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) clearInterval(timer)
  }, 1000)
}

const handleRegister = async (): Promise<void> => {
  if (!formData.value.username) {
    uni.showToast({ title: t('login.usernameRequired'), icon: 'none' })
    return
  }
  if (!formData.value.phone || formData.value.phone.length !== 11) {
    uni.showToast({ title: t('login.phoneError'), icon: 'none' })
    return
  }
  if (!formData.value.verifyCode) {
    uni.showToast({ title: t('login.verifyCodeRequired'), icon: 'none' })
    return
  }
  if (!formData.value.password) {
    uni.showToast({ title: t('login.passwordRequired'), icon: 'none' })
    return
  }
  if (formData.value.password.length < 8) {
    uni.showToast({ title: t('login.passwordLengthError'), icon: 'none' })
    return
  }
  if (formData.value.password !== formData.value.confirmPassword) {
    uni.showToast({ title: t('login.passwordMismatch'), icon: 'none' })
    return
  }
  if (!agreePrivacy.value) {
    uni.showToast({ title: t('login.privacyRequired'), icon: 'none' })
    return
  }
  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 1500))
  uni.showToast({ title: t('login.registerSuccess'), icon: 'success' })
  loading.value = false
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
  --c-border: #E5E7EB;
  --c-status-bar: #F5F7FA;
  --c-strength-1: #EF4444;
  --c-strength-2: #F97316;
  --c-strength-3: #EAB308;
  --c-strength-4: #84CC16;
  --c-strength-5: #22C55E;
}

.login-container.dark {
  --c-bg: #0F172A;
  --c-card: #1E293B;
  --c-main: #3B82F6;
  --c-main-light: #1E3A5F;
  --t-primary: #F1F5F9;
  --t-regular: #94A3B8;
  --c-border: #334155;
  --c-status-bar: #0F172A;
  --c-strength-1: #EF4444;
  --c-strength-2: #F97316;
  --c-strength-3: #EAB308;
  --c-strength-4: #84CC16;
  --c-strength-5: #22C55E;
}

.status-bar {
  height: var(--status-bar-height);
  background-color: var(--c-status-bar);
}

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

/* 验证码输入框 - 左右排列 */
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

/* 密码强度条 - 5段 */
.strength-bar {
  display: flex;
  gap: 8rpx;
  margin-top: 16rpx;
  height: 8rpx;
}

.strength-segment {
  flex: 1;
  background-color: var(--c-border);
  border-radius: 4rpx;
  transition: all 0.3s ease;
}

/* 各等级颜色 - 一段一段变 */
.strength-segment.active.strength-1 {
  background-color: var(--c-strength-1);
}

.strength-segment.active.strength-2 {
  background-color: var(--c-strength-2);
}

.strength-segment.active.strength-3 {
  background-color: var(--c-strength-3);
}

.strength-segment.active.strength-4 {
  background-color: var(--c-strength-4);
}

.strength-segment.active.strength-5 {
  background-color: var(--c-strength-5);
}

.strength-text {
  font-size: 22rpx;
  color: var(--t-regular);
  margin-top: 8rpx;
}

/* 隐私政策勾选 */
.privacy-check {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  margin-bottom: 32rpx;
}

.checkbox {
  width: 32rpx;
  height: 32rpx;
  border-radius: 8rpx;
  border: 2rpx solid var(--c-border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 4rpx;
  transition: all 0.2s ease;
}

.checkbox.checked {
  background-color: var(--c-main);
  border-color: var(--c-main);
}

.privacy-text {
  font-size: 24rpx;
  color: var(--t-regular);
  line-height: 1.6;
}

.privacy-link {
  color: var(--c-main);
}

/* 返回按钮 */
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

::v-deep .u-input {
  color: var(--t-primary) !important;
  font-size: 28rpx !important;
}

::v-deep .uni-input-input {
  color: var(--t-primary) !important;
}

::v-deep .u-input__content__subfix-icon .u-icon__icon {
  color: var(--t-regular) !important;
}
</style>
