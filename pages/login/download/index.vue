<template>
  <view :class="['login-container', themeClass]">
    <!-- 状态栏占位 -->
    <view class="status-bar"></view>

    <!-- 标题区域 -->
    <view class="header">
      <text class="page-title">{{ t('login.downloadPageTitle') }}</text>
      <text class="page-subtitle">{{ t('login.downloadPageSubtitle') }}</text>
    </view>

    <!-- 表单区域 -->
    <view class="form-wrapper">
      <view class="form-card">
        <view class="placeholder-area">
          <view class="placeholder">
            <u-icon name="scan" size="80" color="var(--c-regular)"></u-icon>
            <text class="placeholder-tip">{{ t('login.qrcodeTip') }}</text>
          </view>
        </view>

        <!-- 返回按钮 -->
        <view class="back-btn" @click="goBack">
          {{ t('login.backBtn') }}
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useAppStore } from '@/store/app'
import { useI18n } from 'vue-i18n'
import UIcon from 'uview-plus/components/u-icon/u-icon.vue'

const appStore = useAppStore()
const { t, locale } = useI18n()

const themeClass = computed(() => appStore.theme)

watch(() => appStore.language, (newLang: string) => {
  locale.value = newLang
})

const goBack = (): void => uni.navigateBack()
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
  --c-regular: #9CA3AF;
  --t-primary: #1F2937;
  --t-regular: #6B7280;
  --c-border: #E5E7EB;
  --c-status-bar: #F5F7FA;
}

.login-container.dark {
  --c-bg: #0F172A;
  --c-card: #1E293B;
  --c-main: #3B82F6;
  --c-main-light: #1E3A5F;
  --c-regular: #64748B;
  --t-primary: #F1F5F9;
  --t-regular: #94A3B8;
  --c-border: #334155;
  --c-status-bar: #0F172A;
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

.placeholder-area {
  display: flex;
  justify-content: center;
  padding: 40rpx 0;
}

.placeholder {
  width: 320rpx;
  height: 320rpx;
  background-color: var(--c-bg);
  border: 4rpx dashed var(--c-border);
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
}

.placeholder-tip {
  font-size: 24rpx;
  color: var(--t-regular);
}

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
</style>
