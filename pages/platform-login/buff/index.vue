<template>
  <view class="buff-login">
    <!-- 自定义导航栏 -->
    <u-navbar
      title="网易 BUFF 登录"
      :autoBack="true"
    ></u-navbar>

    <!-- 加载指示器 -->
    <view v-if="loading" class="loading-overlay">
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 顶部同步按钮 -->
    <view class="sync-bar">
      <view class="sync-btn" @click="handleVerifyLogin">
        <text class="sync-btn-text">验证登录</text>
      </view>
    </view>

    <!-- WebView 容器 -->
    <web-view
      :webview-styles="{ top: webviewTop + 'px' }"
      :src="loginUrl"
      @load="handleWebViewLoad"
      @error="handleWebViewError"
    ></web-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { PlatformLoginHelper } from '@/utils/platform-login-helper'
import { useEquipmentSalesStore } from '@/store/equipment-sales'

// 页面参数
const steamId = ref<string>('')

// 状态
const loading = ref<boolean>(true)
const verifying = ref<boolean>(false)
const loginUrl = ref<string>('')

// WebView 顶部偏移（导航栏 + 同步栏高度）
const webviewTop = ref<number>(132)

const equipmentSalesStore = useEquipmentSalesStore()

// 读取路由参数
onLoad((options) => {
  steamId.value = (options as Record<string, string>)?.steamId || ''
  if (!steamId.value) {
    uni.showToast({ title: '参数错误', icon: 'none' })
    uni.navigateBack()
    return
  }
  loginUrl.value = PlatformLoginHelper.getPlatformLoginUrl('buff')
})

/**
 * WebView 加载完成
 */
function handleWebViewLoad(): void {
  loading.value = false
}

/**
 * WebView 加载失败
 */
function handleWebViewError(): void {
  loading.value = false
  uni.showToast({ title: '页面加载失败，请检查网络', icon: 'none' })
}

/**
 * 调用 BUFF 用户信息接口验证登录状态
 * WebView 登录后 cookie 会自动携带，无需手动传 token
 */
async function handleVerifyLogin(): Promise<void> {
  if (verifying.value) return
  verifying.value = true

  uni.showLoading({ title: '验证中...', mask: true })

  try {
    const res = await uni.request({
      method: 'GET',
      url: 'https://buff.163.com/account/api/user/info/v2',
      dataType: 'json'
    })

    const data = res.data as Record<string, unknown>

    // BUFF 接口返回 code=0 且有 data.nickname 表示已登录
    if (data?.code === 0 && (data?.data as Record<string, unknown>)?.nickname) {
      // 保存认证状态到 store（token 字段用 steamId 占位，实际通过 cookie 鉴权）
      equipmentSalesStore.setPlatformAuth({
        token: steamId.value,
        authTime: Date.now(),
        platform: 'buff',
        steamId: steamId.value
      })

      uni.hideLoading()
      uni.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => uni.navigateBack(), 1000)
    } else {
      uni.hideLoading()
      uni.showToast({ title: '未检测到登录状态，请先在页面登录', icon: 'none', duration: 2500 })
    }
  } catch {
    uni.hideLoading()
    uni.showToast({ title: '验证失败，请检查网络', icon: 'none' })
  } finally {
    verifying.value = false
  }
}
</script>

<style scoped lang="scss">
.buff-login {
  width: 100%;
  height: 100vh;
  position: relative;
  background-color: #ffffff;
}

/* 同步栏 */
.sync-bar {
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 30rpx;
  background-color: #ffffff;
  border-bottom: 1rpx solid #F3F4F6;
}

.sync-btn {
  padding: 12rpx 32rpx;
  background: linear-gradient(135deg, #7C3AED 0%, #A855F7 100%);
  border-radius: 32rpx;

  .sync-btn-text {
    font-size: 26rpx;
    color: #ffffff;
    font-weight: 500;
  }
}

/* 加载指示器 */
.loading-overlay {
  position: fixed;
  left: 0;
  right: 0;
  top: 176rpx;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #ffffff;
  z-index: 999;

  .loading-text {
    font-size: 28rpx;
    color: #909399;
  }
}
</style>
