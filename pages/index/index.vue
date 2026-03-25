<template>
  <view :class="['page', themeClass]">
    <!-- 跳转中提示 -->
    <view class="redirect-container">
      <text class="redirect-text">加载中...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useAppStore } from '@/store/app'
import { useUserStore } from '@/store/user'

const appStore = useAppStore()
const userStore = useUserStore()

const themeClass = computed(() => appStore.theme)

onLoad(() => {
  // 检查登录状态，未登录跳转登录页，已登录跳转概览页
  if (!userStore.isLoggedIn()) {
    uni.reLaunch({
      url: '/pages/login/index'
    })
  } else {
    uni.reLaunch({
      url: '/pages/tabs/equipment-sales/overview/index'
    })
  }
})
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background-color: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.redirect-container {
  display: flex;
  align-items: center;
  justify-content: center;

  .redirect-text {
    font-size: 28rpx;
    color: #9CA3AF;
  }
}
</style>
