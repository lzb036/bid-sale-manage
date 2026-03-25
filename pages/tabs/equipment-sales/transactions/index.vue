<template>
  <view class="equipment-sales-transactions">
    <!-- 顶部紫色区域 -->
    <view class="header-section" :style="{ paddingTop: appStore.statusBarHeight + 'px' }">
      <text class="header-title">提现记录</text>
      
      <!-- 同步操作栏 -->
      <view class="sync-actions">
        <view 
          class="sync-button buff"
          @click="syncBuffData"
          :class="{ disabled: syncingBuff }"
        >
          <text class="sync-icon">🔄</text>
          <text class="sync-text">{{ syncingBuff ? '同步中...' : '同步Buff数据' }}</text>
        </view>
        <view 
          class="sync-button yyyp"
          @click="syncYyypData"
          :class="{ disabled: syncingYyyp }"
        >
          <text class="sync-icon">🔄</text>
          <text class="sync-text">{{ syncingYyyp ? '同步中...' : '同步悠悠数据' }}</text>
        </view>
      </view>
    </view>
    
    <!-- 交易记录列表 - 支持下拉刷新和上拉加载 -->
    <scroll-view 
      class="scroll-container"
      scroll-y
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="onLoadMore"
    >
      <view class="transaction-list">
      <!-- 加载状态 -->
      <view v-if="loading" class="loading-container">
        <text class="loading-text">加载中...</text>
      </view>
      
      <!-- 提现记录列表 -->
      <template v-else>
        <view 
          v-for="record in withdrawList" 
          :key="record.id"
          class="transaction-card"
        >
          <view class="card-header">
            <view class="platform-info">
              <view :class="['platform-icon', getMarketIconClass(record.market)]">
                <text>💰</text>
              </view>
              <view class="platform-details">
                <text class="platform-name">{{ getMarketName(record.market) }}</text>
                <text class="transaction-time">🕐 {{ record.withdrawTime }}</text>
              </view>
            </view>
            <view class="status-badge completed">
              <text>已完成</text>
            </view>
          </view>
          
          <view class="card-body">
            <view class="amount-row">
              <text class="amount-label">提现金额</text>
              <text class="amount-value">¥{{ formatAmount(record.amount) }}</text>
            </view>
            <view class="amount-row">
              <text class="amount-label">手续费</text>
              <text class="amount-value fee">-¥{{ formatAmount(record.fee) }}</text>
            </view>
            <view class="amount-row total">
              <text class="amount-label">实际到账</text>
              <text class="amount-value highlight">¥{{ formatAmount(record.amount - record.fee) }}</text>
            </view>
          </view>
        </view>
        
        <!-- 空状态 -->
        <view v-if="withdrawList.length === 0" class="empty-state">
          <text class="empty-text">暂无提现记录</text>
        </view>
        
        <!-- 加载更多状态 -->
        <view v-if="withdrawList.length > 0" class="load-more">
          <text v-if="loadingMore" class="load-more-text">加载中...</text>
          <text v-else-if="noMore" class="load-more-text">没有更多了</text>
        </view>
      </template>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getWithdrawApi } from '@/api/modules/equipment-sales/withdraw.service'
import type { WithdrawRecord } from '@/api/modules/equipment-sales/interface/withdrawModel'
import { useAppStore } from '@/store/app'

const appStore = useAppStore()

// 加载状态
const loading = ref(true)

// 下拉刷新状态
const refreshing = ref(false)

// 上拉加载状态
const loadingMore = ref(false)

// 当前页码
const currentPage = ref(1)

// 每页数量
const pageSize = 20

// 是否还有更多数据
const noMore = ref(false)

// 同步状态
const syncingBuff = ref(false)
const syncingYyyp = ref(false)

// 提现记录列表
const withdrawList = ref<WithdrawRecord[]>([])

// 统计信息
const stats = computed(() => {
  const total = withdrawList.value.length
  const processing = 0 // 根据实际业务逻辑判断处理中的数量
  
  return {
    total,
    processing
  }
})

onLoad(() => {
  loadData()
})

/**
 * 加载提现记录数据
 * @param page 页码
 * @param append 是否追加数据（用于加载更多）
 */
async function loadData(page: number = 1, append: boolean = false) {
  try {
    if (!append) {
      loading.value = true
    }
    
    // 加载提现记录列表
    const response = await getWithdrawApi({ 
      page, 
      pageSize
    })
    
    // 设置提现记录列表
    if (append) {
      // 追加数据
      withdrawList.value = [...withdrawList.value, ...(response.list || [])]
    } else {
      // 替换数据
      withdrawList.value = response.list || []
    }
    
    // 判断是否还有更多数据
    const pager = response.pager
    if (pager) {
      noMore.value = pager.current >= pager.pages
      // 更新当前页码
      currentPage.value = pager.current
    } else {
      noMore.value = true
      currentPage.value = page
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
 * 下拉刷新
 */
async function onRefresh() {
  refreshing.value = true
  noMore.value = false
  await loadData(1, false)
  refreshing.value = false
}

/**
 * 上拉加载更多
 */
async function onLoadMore() {
  // 如果正在加载或没有更多数据，则不处理
  if (loadingMore.value || noMore.value || loading.value) {
    return
  }
  
  loadingMore.value = true
  await loadData(currentPage.value + 1, true)
  loadingMore.value = false
}

/**
 * 格式化金额显示（精确到分）
 * @param amount 金额
 * @returns 格式化后的金额字符串
 */
function formatAmount(amount: number): string {
  return amount.toFixed(2)
}

/**
 * 获取市场名称
 * @param market 市场类型
 * @returns 市场名称
 */
function getMarketName(market: string): string {
  const marketMap: Record<string, string> = {
    'buff': '网易buff',
    'yyyp': '悠悠有品',
    'c5': 'C5Game'
  }
  return marketMap[market] || market
}

/**
 * 获取市场图标类名
 * @param market 市场类型
 * @returns 图标类名
 */
function getMarketIconClass(market: string): string {
  const classMap: Record<string, string> = {
    'buff': 'buff',
    'yyyp': 'youyou',
    'c5': 'c5'
  }
  return classMap[market] || 'buff'
}

/**
 * 同步Buff数据
 */
async function syncBuffData() {
  if (syncingBuff.value) return
  
  syncingBuff.value = true
  try {
    // TODO: 调用同步Buff数据的API
    // await syncBuffWithdrawApi()
    
    uni.showToast({
      title: '同步成功',
      icon: 'success'
    })
    
    // 同步成功后刷新数据
    await onRefresh()
  } catch (error) {
    console.error('同步Buff数据失败:', error)
    uni.showToast({
      title: '同步失败，请重试',
      icon: 'none'
    })
  } finally {
    syncingBuff.value = false
  }
}

/**
 * 同步悠悠有品数据
 */
async function syncYyypData() {
  if (syncingYyyp.value) return
  
  syncingYyyp.value = true
  try {
    // TODO: 调用同步悠悠有品数据的API
    // await syncYyypWithdrawApi()
    
    uni.showToast({
      title: '同步成功',
      icon: 'success'
    })
    
    // 同步成功后刷新数据
    await onRefresh()
  } catch (error) {
    console.error('同步悠悠数据失败:', error)
    uni.showToast({
      title: '同步失败，请重试',
      icon: 'none'
    })
  } finally {
    syncingYyyp.value = false
  }
}
</script>

<style scoped lang="scss">
.equipment-sales-transactions {
  min-height: 100vh;
  background-color: #f5f7fa;
}

/* 下拉刷新容器 */
.scroll-container {
  height: calc(100vh - 320rpx);
}

/* 顶部紫色区域 */
.header-section {
  background: linear-gradient(135deg, #7C3AED 0%, #A855F7 100%);
  padding: 0 30rpx 60rpx;
  border-radius: 0 0 40rpx 40rpx;
  
  .header-title {
    font-size: 48rpx;
    font-weight: 700;
    color: #ffffff;
    display: block;
    margin-bottom: 12rpx;
    padding-top: 40rpx;
  }
  
  .header-stats {
    font-size: 26rpx;
    color: rgba(255, 255, 255, 0.85);
    display: block;
    margin-bottom: 30rpx;
  }
}

/* 同步操作栏 */
.sync-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 20rpx;
  
  .sync-button {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    padding: 24rpx;
    border-radius: 16rpx;
    background: rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    transition: all 0.3s ease;
    
    &:active:not(.disabled) {
      transform: scale(0.95);
      background: rgba(255, 255, 255, 0.35);
    }
    
    &.disabled {
      opacity: 0.6;
    }
    
    .sync-icon {
      font-size: 32rpx;
    }
    
    .sync-text {
      font-size: 28rpx;
      font-weight: 500;
      color: #ffffff;
    }
  }
}

/* 交易记录列表 */
.transaction-list {
  padding: 30rpx;
  margin-top: -30rpx;
  min-height: 400rpx;
  
  /* 加载状态 */
  .loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 100rpx 0;
    
    .loading-text {
      font-size: 28rpx;
      color: #909399;
    }
  }
  
  /* 空状态 */
  .empty-state {
    text-align: center;
    padding: 100rpx 0;
    
    .empty-text {
      font-size: 28rpx;
      color: #909399;
      display: block;
    }
  }
  
  /* 加载更多状态 */
  .load-more {
    text-align: center;
    padding: 30rpx 0;
    
    .load-more-text {
      font-size: 26rpx;
      color: #909399;
    }
  }
  
  .transaction-card {
    background-color: #ffffff;
    border-radius: 20rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
    
    /* 卡片头部 */
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24rpx;
      padding-bottom: 24rpx;
      border-bottom: 1rpx solid #F3F4F6;
      
      .platform-info {
        display: flex;
        align-items: center;
        gap: 16rpx;
        
        .platform-icon {
          width: 80rpx;
          height: 80rpx;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36rpx;
          
          &.buff {
            background-color: #FEE2E2;
          }
          
          &.youyou {
            background-color: #DBEAFE;
          }
          
          &.c5 {
            background-color: #FEF3C7;
          }
        }
        
        .platform-details {
          .platform-name {
            font-size: 32rpx;
            font-weight: 600;
            color: #1F2937;
            display: block;
            margin-bottom: 8rpx;
          }
          
          .transaction-time {
            font-size: 24rpx;
            color: #9CA3AF;
            display: block;
          }
        }
      }
      
      .status-badge {
        padding: 8rpx 20rpx;
        border-radius: 12rpx;
        font-size: 24rpx;
        font-weight: 500;
        
        &.completed {
          background-color: #D1FAE5;
          color: #065F46;
        }
        
        &.processing {
          background-color: #FEF3C7;
          color: #92400E;
        }
      }
    }
    
    /* 卡片内容 */
    .card-body {
      .amount-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16rpx;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        &.total {
          margin-top: 20rpx;
          padding-top: 20rpx;
          border-top: 1rpx solid #F3F4F6;
        }
        
        .amount-label {
          font-size: 28rpx;
          color: #6B7280;
        }
        
        .amount-value {
          font-size: 32rpx;
          font-weight: 600;
          color: #1F2937;
          
          &.fee {
            color: #EF4444;
          }
          
          &.highlight {
            font-size: 36rpx;
            color: #10B981;
          }
        }
      }
    }
  }
}
</style>
