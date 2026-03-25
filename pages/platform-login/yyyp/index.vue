<template>
  <view class="yyyp-login">
    <!-- 自定义导航栏 -->
    <u-navbar 
      title="悠悠有品登录" 
      :autoBack="true" 
    >
      <template #right>
        <view class="navbar-right" @click="handleSyncToken">
          <text class="right-action-text">同步</text>
        </view>
      </template>
    </u-navbar>

    <!-- 加载指示器 -->
    <view v-if="loading" class="loading-overlay">
      <text class="loading-text">加载中...</text>
    </view>

    <!-- WebView 容器 -->
    <web-view
      :webview-styles="{top:88 +'px'}"
      :src="loginUrl"
      @load="handleWebViewLoad"
      @error="handleWebViewError"
	  @message="onMessage"
    ></web-view>
  </view>
</template>

<script>
import { PlatformLoginHelper } from '@/utils/platform-login-helper'
import { PlatformAuthCache } from '@/utils/platform-auth-cache'
import { getYYYPVersionApi } from '@/api/modules/dict/version.service'
import { useEquipmentSalesStore } from '@/store/equipment-sales'
import UNavbar from 'uview-plus/components/u-navbar/u-navbar.vue'

// 存储 WebView 实例
var wv = null

export default {
  components: {
    UNavbar
  },
  
  data() {
    return {
      steamId: '',
      platform: 'yyyp',
      loading: true,
      loginUrl: '',
      syncing: false
    }
  },
  
  onLoad(options) {
    // 获取页面参数
    this.steamId = options.steamId || ''
    this.platform = 'yyyp'
    
    this.initPage()
  },
  
  onReady() {
    // #ifdef APP-PLUS
    var currentWebview = this.$scope.$getAppWebview()
    setTimeout(function() {
      wv = currentWebview.children()[0]
      console.log('[YYYPLogin] WebView 实例初始化成功')
    }, 1000)
    // #endif
  },
  
  methods: {
    /**
     * 初始化页面
     */
    initPage() {
      // 验证参数
      if (!this.steamId || !this.platform) {
        uni.showModal({
          title: '参数错误',
          content: '缺少必要的参数，请重新进入',
          showCancel: false,
          success: () => {
            this.goBack()
          }
        })
        return
      }

      // 获取登录 URL
      this.loginUrl = PlatformLoginHelper.getPlatformLoginUrl(this.platform)
    },
    
    /**
     * WebView 加载完成
     */
    handleWebViewLoad() {
      this.loading = false
      console.log('[YYYPLogin] WebView 加载完成')
    },
    
    /**
     * 处理同步 token
     */
    handleSyncToken() {
      if (this.syncing) {
        return
      }
      
      this.syncing = true
      
      uni.showLoading({
        title: '同步中...',
        mask: true
      })
      
      // 添加短暂延迟，确保 WebView 完全就绪
      setTimeout(() => {
        this.tryExtractToken()
      }, 300)
    },
    
    /**
     * 尝试提取 token
     */
    tryExtractToken() {
      // #ifdef APP-PLUS
      try {
        if (!wv || typeof wv.evalJS !== 'function') {
          uni.hideLoading()
          this.syncing = false
          uni.showToast({
            title: 'WebView 未就绪，请稍后重试',
            icon: 'none',
            duration: 2000
          })
          return
        }
        
        // 执行 JavaScript 代码
        const script = PlatformLoginHelper.getYYYPTokenExtractionScript()
        console.log('[YYYPLogin] 执行提取脚本')
        wv.evalJS(script)
      } catch (error) {
        console.error('[YYYPLogin] 提取 token 失败:', error)
        uni.hideLoading()
        this.syncing = false
        uni.showToast({
          title: '同步失败',
          icon: 'none'
        })
      }
      // #endif
      
      // #ifndef APP-PLUS
      uni.hideLoading()
      this.syncing = false
      console.warn('[YYYPLogin] evalJS 仅在 App 端可用')
      uni.showToast({
        title: '仅支持 App 端',
        icon: 'none'
      })
      // #endif
    },
    
    /**
     * 处理 WebView 消息
     */
    async onMessage(e) {
      try {
        // 检查消息数据
        if (!e?.detail?.data?.[0]?.token) {
          console.warn('[YYYPLogin] 未收到 token')
          uni.hideLoading()
          this.syncing = false
          return
        }
        
        const token = 'Bearer ' + e.detail.data[0].token
        console.log('[YYYPLogin] 收到 token')
        
        // 验证 token 格式
        if (!PlatformLoginHelper.isValidToken(token)) {
          uni.hideLoading()
          this.syncing = false
          uni.showToast({
            title: '无效的登录信息',
            icon: 'none'
          })
          return
        }
        
        uni.showLoading({
          title: '验证中...',
          mask: true
        })
        
        // 获取版本号
        const versionRes = await getYYYPVersionApi({
          typeId: '836682235645005824'
        })
        
        const appVersion = versionRes?.list?.[0]?.code
        if (!appVersion) {
          throw new Error('获取版本号失败')
        }
        
        console.log('[YYYPLogin] 获取到版本号:', appVersion)
        
        // 验证用户信息
        const userRes = await uni.request({
          method: 'GET',
          url: 'https://api.youpin898.com/api/user/Account/GetUserInfo',
          header: {
            'content-type': 'application/json;charset=UTF-8',
            'Authorization': token,
            'App-Version': appVersion
          },
          dataType: 'json'
        })
        
        uni.hideLoading()
        this.syncing = false
		console.log(versionRes)
        console.log('[YYYPLogin] 用户信息验证成功')
        
        // 保存到 Store
        const pureToken = token.replace('Bearer ', '')
        this.handleTokenExtracted(pureToken)
        
      } catch (error) {
        uni.hideLoading()
        this.syncing = false
        console.error('[YYYPLogin] 消息处理失败:', error)
        uni.showToast({
          title: error.message || '登录失败',
          icon: 'none',
          duration: 2000
        })
      }
    },
    
    /**
     * 处理 token 提取成功
     */
    handleTokenExtracted(token) {
      console.log('[YYYPLogin] Token 提取成功')
      
      // 构建认证状态
      const authState = {
        token,
        authTime: Date.now(),
        platform: this.platform,
        steamId: this.steamId
      }
      
      // 保存到 Store
      const equipmentSalesStore = useEquipmentSalesStore()
      equipmentSalesStore.setPlatformAuth(authState)
      
      // 保存到缓存
      PlatformAuthCache.saveAuthState(authState)
      
      // 显示成功提示
      uni.showToast({
        title: '登录成功',
        icon: 'success'
      })
      
      // 延迟返回上一页
      setTimeout(() => {
        uni.navigateBack()
      }, 1000)
    },
    
    /**
     * WebView 加载错误
     */
    handleWebViewError(e) {
      this.loading = false
      console.error('[YYYPLogin] WebView 加载失败:', e)
      
      uni.showModal({
        title: '加载失败',
        content: '页面加载失败，请检查网络连接',
        confirmText: '重试',
        cancelText: '返回',
        success: (res) => {
          if (res.confirm) {
            // 重新加载
            this.loading = true
            this.loginUrl = PlatformLoginHelper.getPlatformLoginUrl(this.platform)
          } else {
            this.goBack()
          }
        }
      })
    },
    
    /**
     * 返回上一页
     */
    goBack() {
      uni.navigateBack({
        delta: 1
      })
    }
  }
}
</script>

<style scoped lang="scss">
.yyyp-login {
  width: 100%;
  height: 100vh;
  position: relative;
  background-color: #ffffff;
}

/* 导航栏右侧按钮 */
.navbar-right {
  padding: 0 20rpx;
  
  .right-action-text {
    font-size: 28rpx;
    color: #7C3AED;
    font-weight: 500;
  }
}

/* 加载指示器 */
.loading-overlay {
  position: fixed;
  left: 0;
  right: 0;
  top: 88px;
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
