<template>
  <view v-if="canRenderLogin" :class="['login-container', themeClass]" @touchmove.stop.prevent>
    <!-- 背景层 -->
    <view class="bg-layer">
      <view class="bg-orb orb-main"></view>
      <view class="bg-orb orb-accent"></view>
      <view class="bg-orb orb-soft"></view>
      <view class="bg-grid"></view>
    </view>

    <!-- 顶部工具栏 -->
    <view class="top-bar" :style="topBarStyle">
      <view class="switch-group">
        <view class="switch-btn" @click="handleLanguageToggle">
          <text class="switch-icon">{{ appStore.language === 'zh-CN' ? 'CN' : 'EN' }}</text>
        </view>
        <view class="switch-btn" @click="handleThemeToggle">
          <text class="switch-icon">{{ appStore.theme === 'light' ? '☀️' : '🌙' }}</text>
        </view>
        <view class="switch-btn" @click="handleBaseURLSetting">
          <text class="switch-icon">URL</text>
        </view>
      </view>
    </view>

    <!-- 表单区域 -->
    <view class="content-wrap">
      <view class="form-panel" :style="formPanelStyle">
        <!-- 账号输入 -->
        <view class="form-group">
          <text class="input-label">{{ t('login.username') }}</text>
          <view class="input-wrap">
            <u-input
              v-model="formData.username"
              :placeholder="t('login.usernamePlaceholder')"
              border="none"
              :custom-style="inputStyle"
              :placeholder-style="placeholderStyle"
              clearable
            ></u-input>
          </view>
        </view>

        <!-- 密码输入 -->
        <view class="form-group">
          <text class="input-label">{{ t('login.password') }}</text>
          <view class="input-wrap">
            <u-input
              v-model="formData.password"
              :type="showPassword ? 'text' : 'password'"
              :placeholder="t('login.passwordPlaceholder')"
              border="none"
              :custom-style="inputStyle"
              :placeholder-style="placeholderStyle"
              :password-visibility-toggle="false"
            ></u-input>
            <view class="password-toggle" @click="showPassword = !showPassword">
              <u-icon :name="showPassword ? 'eye-fill' : 'eye-off'" size="36rpx" color="var(--t-secondary)"></u-icon>
            </view>
          </view>
        </view>

        <!-- 登录按钮 -->
        <u-button
          type="primary"
          :loading="loading"
          :custom-style="buttonStyle"
          @click="handleLogin"
        >{{ t('login.loginButton') }}</u-button>
      </view>
    </view>
  </view>
  <view v-else :class="['login-guard', themeClass]"></view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useAppStore } from '@/store/app'
import { useUserStore } from '@/store/user'
import { useI18n } from 'vue-i18n'
import AuthAPI from '@/api/modules/auth'

interface LoginFormData {
  username: string
  password: string
}

const appStore = useAppStore()
const userStore = useUserStore()
const { t, locale } = useI18n()

const themeClass = computed(() => appStore.theme)
const statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 0
const topBarStyle = {
  paddingTop: `calc(26rpx + ${statusBarHeight}px)`
}

const loading = ref(false)
const showPassword = ref(false)
const keyboardHeight = ref(0)
const canRenderLogin = ref(false)
let keyboardHeightHandler: ((res: { height?: number }) => void) | null = null

const formData = ref<LoginFormData>({
  username: '',
  password: ''
})

const formPanelStyle = computed(() => {
  if (keyboardHeight.value <= 0) return {}
  const shift = Math.min(Math.max(keyboardHeight.value * 0.62, 140), 360)
  return { transform: `translateY(-${shift}px)` }
})

const inputStyle = computed(() => ({
  backgroundColor: 'transparent',
  border: 'none',
  padding: '30rpx 0',
  fontSize: '32rpx',
  color: 'var(--t-primary)'
}))

const placeholderStyle = computed(() => ({
  color: 'var(--t-secondary)'
}))

const buttonStyle = computed(() => ({
  width: '100%',
  height: '100rpx',
  borderRadius: '22rpx',
  fontSize: '31rpx',
  fontWeight: '600',
  marginTop: '28rpx',
  background: 'linear-gradient(135deg, var(--c-main) 0%, var(--c-main-2) 100%)',
  border: 'none',
  boxShadow: '0 16rpx 34rpx var(--c-main-shadow)'
}))

watch(() => appStore.language, (newLang: string) => {
  locale.value = newLang
})

onLoad(() => {
  if (userStore.isLoggedIn()) {
    uni.reLaunch({ url: '/pages/index/index' })
    return
  }
  canRenderLogin.value = true
})

onMounted(() => {
  if (typeof uni.onKeyboardHeightChange !== 'function') return
  keyboardHeightHandler = (res: { height?: number }) => {
    keyboardHeight.value = Number(res?.height || 0)
  }
  uni.onKeyboardHeightChange(keyboardHeightHandler)
})

onUnmounted(() => {
  if (keyboardHeightHandler && typeof uni.offKeyboardHeightChange === 'function') {
    uni.offKeyboardHeightChange(keyboardHeightHandler)
  }
  keyboardHeightHandler = null
})

const handleThemeToggle = (): void => {
  appStore.toggleTheme()
}

const handleLanguageToggle = (): void => {
  appStore.toggleLanguage()
}

const handleBaseURLSetting = (): void => {
  uni.navigateTo({ url: '/pages/baseurl/index' })
}

const handleLogin = async (): Promise<void> => {
  if (!formData.value.username) {
    uni.showToast({ title: t('login.usernameRequired'), icon: 'none' })
    return
  }
  if (!formData.value.password) {
    uni.showToast({ title: t('login.passwordRequired'), icon: 'none' })
    return
  }

  loading.value = true
  try {
    const response = await AuthAPI.login({
      username: formData.value.username,
      password: formData.value.password,
      rememberMe: false
    })
    uni.setStorageSync('user_token', response.token)
    userStore.setToken(response.token)
    uni.showToast({ title: t('login.loginSuccess'), icon: 'success' })
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/index/index' })
    }, 1000)
  } catch (error) {
    console.error('[登录] 登录失败:', error)
    uni.showToast({ title: t('login.loginFailed'), icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  height: 100vh;
  position: fixed;
  inset: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.login-guard {
  min-height: 100vh;
  height: 100vh;
  width: 100%;
}

.login-guard.light { background: #f4f7ff; }
.login-guard.dark  { background: #070d1a; }

/* 亮色主题变量 */
.login-container.light {
  --c-bg: #f4f7ff;
  --c-bg-2: #edf2ff;
  --c-main: #3f62ff;
  --c-main-2: #5e7dff;
  --c-main-shadow: rgba(63, 98, 255, 0.35);
  --c-input: rgba(255, 255, 255, 0.86);
  --c-input-border: rgba(126, 154, 255, 0.22);
  --t-primary: #0f172a;
  --t-secondary: #94a3b8;
  --t-weak: #7c8bb0;
}

/* 暗色主题变量 */
.login-container.dark {
  --c-bg: #070d1a;
  --c-bg-2: #0a1428;
  --c-main: #5a8bff;
  --c-main-2: #7ea0ff;
  --c-main-shadow: rgba(90, 139, 255, 0.34);
  --c-input: rgba(15, 27, 48, 0.82);
  --c-input-border: rgba(98, 122, 172, 0.4);
  --t-primary: #f8fbff;
  --t-secondary: #8fa4c9;
  --t-weak: #7a90b7;
}

/* 背景层 */
.bg-layer {
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, var(--c-bg) 0%, var(--c-bg-2) 100%);
}

.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(8rpx);
}

.orb-main {
  width: 620rpx;
  height: 620rpx;
  top: -140rpx;
  right: -180rpx;
  background: radial-gradient(circle, rgba(91, 123, 255, 0.42) 0%, rgba(91, 123, 255, 0) 72%);
}

.orb-accent {
  width: 420rpx;
  height: 420rpx;
  bottom: 160rpx;
  left: -120rpx;
  background: radial-gradient(circle, rgba(33, 184, 255, 0.34) 0%, rgba(33, 184, 255, 0) 74%);
}

.orb-soft {
  width: 320rpx;
  height: 320rpx;
  top: 46%;
  right: 15%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.24) 0%, rgba(255, 255, 255, 0) 76%);
}

.bg-grid {
  position: absolute;
  inset: 0;
  opacity: 0.34;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.18) 1rpx, transparent 1rpx),
    linear-gradient(90deg, rgba(255, 255, 255, 0.16) 1rpx, transparent 1rpx);
  background-size: 42rpx 42rpx;
}

/* 顶部工具栏 */
.top-bar {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: flex-end;
  padding: 24rpx 34rpx 0;
}

.switch-group {
  display: flex;
  gap: 14rpx;
}

.switch-btn {
  width: 66rpx;
  height: 66rpx;
  border-radius: 18rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.24);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10rpx);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10rpx 18rpx rgba(0, 0, 0, 0.08);
  transition: all 0.18s ease;
}

.switch-btn:active {
  transform: scale(0.92);
}

.switch-icon {
  font-size: 24rpx;
  font-weight: 700;
  color: var(--t-primary);
}

/* 表单区域 */
.content-wrap {
  position: relative;
  z-index: 2;
  flex: 1;
  padding: 120rpx 52rpx 92rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.form-panel {
  width: 100%;
  max-width: 660rpx;
  display: flex;
  flex-direction: column;
  gap: 34rpx;
  margin-top: -56rpx;
  transition: transform 0.22s ease;
  will-change: transform;
}

.form-group {
  margin-bottom: 0;
}

.input-label {
  display: block;
  font-size: 26rpx;
  color: var(--t-weak);
  margin-bottom: 14rpx;
  letter-spacing: 0.6rpx;
}

.input-wrap {
  min-height: 104rpx;
  padding: 0 30rpx;
  border-radius: 22rpx;
  border: 2rpx solid var(--c-input-border);
  background: var(--c-input);
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
}

.input-wrap:focus-within {
  border-color: rgba(103, 133, 255, 0.66);
  box-shadow: 0 0 0 4rpx rgba(103, 133, 255, 0.12);
}

.password-toggle {
  width: 62rpx;
  height: 62rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.password-toggle:active {
  background: rgba(120, 138, 180, 0.16);
}

/* 穿透 u-input 样式 */
::v-deep .u-input {
  color: var(--t-primary) !important;
  font-size: 30rpx !important;
}

::v-deep .uni-input-input {
  color: var(--t-primary) !important;
}

::v-deep .u-input__content__clear .u-icon__icon,
::v-deep .u-input__content__subfix-icon .u-icon__icon,
::v-deep .u-input__right-icon .u-icon {
  color: var(--t-secondary) !important;
}
</style>
