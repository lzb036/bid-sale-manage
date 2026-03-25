<template>
  <view class="equipment-sales-overview">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <text class="loading-text">加载中...</text>
    </view>
    
    <!-- 内容区域 -->
    <scroll-view 
      v-else
      class="scroll-container"
      scroll-y
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <!-- 顶部蓝色区域 -->
      <view class="header-section">
        <!-- 标题栏 -->
        <view class="header-top" :style="{ paddingTop: appStore.statusBarHeight + 'px' }">
          <view class="header-title-area">
            <text class="header-title">账户汇总</text>
            <text class="header-date">{{ currentDate }}</text>
          </view>
          <view class="header-actions">
            <view class="action-icon logout-icon" @tap="onLogout">
              <text class="logout-text">退出</text>
            </view>
          </view>
        </view>
        
        <!-- 总资产卡片 -->
        <view class="total-asset-card">
          <text class="asset-label">总资产</text>
          <text class="asset-value">¥{{ formatAmount(summaryData.totalAsset) }}</text>
        </view>
      </view>
      
      <!-- 数据卡片网格，底部留出 tabBar 空间 -->
      <view class="data-grid">
        <!-- 累积销售额 -->
        <view class="data-card">
          <view class="card-icon blue">
            <text class="icon-text">📈</text>
          </view>
          <text class="card-label">累积销售额</text>
          <text class="card-value">¥{{ formatAmount(summaryData.totalSales) }}</text>
        </view>
        
        <!-- 应付款 -->
        <view class="data-card">
          <view class="card-icon orange">
            <text class="icon-text">💳</text>
          </view>
          <text class="card-label">应付款</text>
          <text class="card-value">¥{{ formatAmount(summaryData.unpaid) }}</text>
        </view>
        
        <!-- 已付款 -->
        <view class="data-card">
          <view class="card-icon green">
            <text class="icon-text">✓</text>
          </view>
          <text class="card-label">已付款</text>
          <text class="card-value">¥{{ formatAmount(summaryData.paid) }}</text>
        </view>
        
        <!-- 累积利润 -->
        <view class="data-card">
          <view class="card-icon purple">
            <text class="icon-text">$</text>
          </view>
          <text class="card-label">累积利润</text>
          <text class="card-value">¥{{ formatAmount(summaryData.totalProfit) }}</text>
        </view>
      </view>

      <!-- tabBar 占位 -->
      <view style="height: 120rpx;"></view>
    </scroll-view>
  </view>

  <!-- 自定义 tabBar -->
  <EquipmentTabbar :current="0"></EquipmentTabbar>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getSummaryApi } from '@/api/modules/equipment-sales/summary.service'
import type { SummaryModel } from '@/api/modules/equipment-sales/interface/summaryModel'
import EquipmentTabbar from '@/components/equipment-tabbar/EquipmentTabbar.vue'
import { useAppStore } from '@/store/app'
import { useUserStore } from '@/store/user'

const appStore = useAppStore()
const userStore = useUserStore()

// 加载状态
const loading = ref(true)
// 下拉刷新状态
const refreshing = ref(false)

// 汇总数据
const summaryData = ref({
  totalAsset: 0,    // 总资产 - incomeTotal
  totalSales: 0,    // 累积销售额 - tradeTotal
  unpaid: 0,        // 应付款 - unpaidTotal
  paid: 0,          // 已付款 - paidTotal
  totalProfit: 0    // 累积利润 - profitTotal
})

// 当前日期
const currentDate = computed(() => {
  const now = new Date()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const weekDay = weekDays[now.getDay()]
  return `${month}月${day}日 ${weekDay}`
})

onLoad(() => {
  loadData()
})

/**
 * 加载数据
 */
async function loadData() {
  try {
    loading.value = true
    
    // 加载汇总数据
    const summaryResponse = await getSummaryApi({})
    
    // 映射汇总数据
    summaryData.value = {
      totalAsset: summaryResponse.incomeTotal || 0,      // 总资产
      totalSales: summaryResponse.tradeTotal || 0,       // 累积销售额
      unpaid: summaryResponse.unpaidTotal || 0,          // 应付款
      paid: summaryResponse.paidTotal || 0,              // 已付款
      totalProfit: summaryResponse.profitTotal || 0      // 累积利润
    }
  } catch (error) {
    console.error('加载数据失败:', error)
    uni.showToast({
      title: '加载失败，请重试',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

/**
 * 格式化金额显示（精确到分）
 * @param amount 金额
 * @returns 格式化后的金额字符串
 */
function formatAmount(amount: number): string {
  // 所有金额都保留两位小数，精确到分
  return amount.toFixed(2)
}

/**
 * 退出登录
 */
function onLogout() {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出登录吗？',
    confirmText: '退出',
    confirmColor: '#ff4d4f',
    success: (res) => {
      if (res.confirm) {
        userStore.logout()
        uni.reLaunch({ url: '/pages/login/index' })
      }
    }
  })
}

/**
 * 下拉刷新
 */
async function onRefresh() {
  refreshing.value = true
  await loadData()
  refreshing.value = false
}
</script>

<style lang="scss" scoped>
.equipment-sales-overview {
  min-height: 100vh;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
}

/* 滚动容器 */
.scroll-container {
  flex: 1;
  height: 100vh;
}

/* 加载状态 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 200rpx 0;
  
  .loading-text {
    font-size: 28rpx;
    color: #909399;
  }
}

/* 顶部蓝色区域 */
.header-section {
  background: linear-gradient(135deg, #4169E1 0%, #1E90FF 100%);
  padding: 0 30rpx 60rpx;
  border-radius: 0 0 40rpx 40rpx;
  
  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 40rpx;
    
    .header-title-area {
      .header-title {
        font-size: 48rpx;
        font-weight: 700;
        color: #ffffff;
        display: block;
        margin-bottom: 12rpx;
      }
      
      .header-date {
        font-size: 26rpx;
        color: rgba(255, 255, 255, 0.85);
        display: block;
      }
    }
    
    .header-actions {
      display: flex;
      gap: 20rpx;
      
      .action-icon {
        height: 64rpx;
        border-radius: 32rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        
        &.logout-icon {
          padding: 0 28rpx;
          background-color: rgba(255, 255, 255, 0.2);
          border: 2rpx solid rgba(255, 255, 255, 0.4);
        }
        
        .logout-text {
          font-size: 26rpx;
          color: rgba(255, 255, 255, 0.95);
          font-weight: 500;
          letter-spacing: 2rpx;
        }
        
        &:active {
          opacity: 0.7;
        }
      }
    }
  }
  
  /* 总资产卡片 */
  .total-asset-card {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border-radius: 24rpx;
    padding: 40rpx 30rpx;
    border: 1px solid rgba(255, 255, 255, 0.2);
    
    .asset-label {
      font-size: 28rpx;
      color: rgba(255, 255, 255, 0.9);
      display: block;
      margin-bottom: 16rpx;
    }
    
    .asset-value {
      font-size: 56rpx;
      font-weight: 700;
      color: #ffffff;
      display: block;
      letter-spacing: 1rpx;
    }
  }
}

/* 数据卡片网格 */
.data-grid {
  padding: 30rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
  margin-top: -30rpx;
  
  .data-card {
    background-color: #ffffff;
    border-radius: 20rpx;
    padding: 30rpx 24rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
    
    .card-icon {
      width: 80rpx;
      height: 80rpx;
      border-radius: 16rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20rpx;
      
      .icon-text {
        font-size: 36rpx;
      }
      
      &.blue {
        background-color: rgba(65, 105, 225, 0.1);
      }
      
      &.orange {
        background-color: rgba(255, 140, 0, 0.1);
      }
      
      &.green {
        background-color: rgba(46, 204, 113, 0.1);
      }
      
      &.purple {
        background-color: rgba(155, 89, 182, 0.1);
      }
    }
    
    .card-label {
      font-size: 26rpx;
      color: #909399;
      display: block;
      margin-bottom: 12rpx;
    }
    
    .card-value {
      font-size: 40rpx;
      font-weight: 700;
      color: #303133;
      display: block;
    }
  }
}

/* Steam 账号列表区域 */
.accounts-section {
  padding: 0 30rpx 30rpx;
  
  .section-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #303133;
    margin-bottom: 20rpx;
    display: block;
  }
  
  .account-card {
    background-color: #ffffff;
    border-radius: 16rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
    
    .account-header {
      display: flex;
      align-items: center;
      margin-bottom: 20rpx;
      
      .account-avatar {
        width: 80rpx;
        height: 80rpx;
        border-radius: 50%;
        margin-right: 20rpx;
      }
      
      .account-info {
        flex: 1;
        
        .account-name {
          font-size: 32rpx;
          font-weight: 500;
          color: #303133;
          display: block;
          margin-bottom: 8rpx;
        }
        
        .account-id {
          font-size: 24rpx;
          color: #909399;
          display: block;
        }
      }
    }
    
    .account-stats {
      display: flex;
      gap: 40rpx;
      margin-bottom: 20rpx;
      
      .stat-item {
        .stat-label {
          font-size: 24rpx;
          color: #909399;
          display: block;
          margin-bottom: 8rpx;
        }
        
        .stat-value {
          font-size: 28rpx;
          font-weight: 600;
          color: #303133;
          display: block;
        }
      }
    }
    
    .market-accounts {
      display: flex;
      gap: 12rpx;
      flex-wrap: wrap;
      
      .market-tag {
        background-color: #f0f2f5;
        border-radius: 8rpx;
        padding: 8rpx 16rpx;
        
        text {
          font-size: 24rpx;
          color: #606266;
        }
      }
    }
  }
  
  .empty-state {
    text-align: center;
    padding: 80rpx 0;
    
    .empty-text {
      font-size: 28rpx;
      color: #909399;
      display: block;
    }
  }
}

/* Steam 账号列表区域 */
.accounts-section {
  padding: 0 30rpx 30rpx;
  
  .section-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #303133;
    margin-bottom: 20rpx;
    display: block;
  }
  
  .account-card {
    background-color: #ffffff;
    border-radius: 16rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
    
    .account-header {
      display: flex;
      align-items: center;
      margin-bottom: 20rpx;
      
      .account-avatar {
        width: 80rpx;
        height: 80rpx;
        border-radius: 50%;
        margin-right: 20rpx;
      }
      
      .account-info {
        flex: 1;
        
        .account-name {
          font-size: 32rpx;
          font-weight: 500;
          color: #303133;
          display: block;
          margin-bottom: 8rpx;
        }
        
        .account-id {
          font-size: 24rpx;
          color: #909399;
          display: block;
        }
      }
    }
    
    .account-stats {
      display: flex;
      gap: 40rpx;
      margin-bottom: 20rpx;
      
      .stat-item {
        .stat-label {
          font-size: 24rpx;
          color: #909399;
          display: block;
          margin-bottom: 8rpx;
        }
        
        .stat-value {
          font-size: 28rpx;
          font-weight: 600;
          color: #303133;
          display: block;
        }
      }
    }
    
    .market-accounts {
      display: flex;
      gap: 12rpx;
      flex-wrap: wrap;
      
      .market-tag {
        background-color: #f0f2f5;
        border-radius: 8rpx;
        padding: 8rpx 16rpx;
        
        text {
          font-size: 24rpx;
          color: #606266;
        }
      }
    }
  }
  
  .empty-state {
    text-align: center;
    padding: 80rpx 0;
    
    .empty-text {
      font-size: 28rpx;
      color: #909399;
      display: block;
    }
  }
}
</style>
