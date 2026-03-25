<template>
  <view class="equipment-sales-settle">
    <!-- 顶部紫色区域 -->
    <view class="header-section" :style="{ paddingTop: appStore.statusBarHeight + 'px' }">
      <text class="header-title">结算记录</text>
      <text class="header-stats">共 {{ stats.total }} 笔记录</text>
    </view>
    
    <!-- 结算记录列表 - 支持下拉刷新和上拉加载 -->
    <scroll-view 
      class="scroll-container"
      scroll-y
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="onLoadMore"
    >
      <view class="settle-list">
        <!-- 加载状态 -->
        <view v-if="loading" class="loading-container">
          <text class="loading-text">加载中...</text>
        </view>
        
        <!-- 结算记录列表 -->
        <template v-else>
          <view 
            v-for="record in settleList" 
            :key="record.id"
            class="settle-card"
          >
            <view class="card-header">
              <view class="time-info">
                <text class="settle-icon">💰</text>
                <text class="settle-time">{{ record.settleTime }}</text>
              </view>
              <view :class="['status-badge', record.confirmed ? 'confirmed' : 'pending']">
                <text>{{ record.confirmed ? '已确认' : '待确认' }}</text>
              </view>
            </view>
            
            <view class="card-body">
              <view class="amount-row">
                <text class="amount-label">结算金额</text>
                <text class="amount-value">¥{{ formatAmount(record.amount) }}</text>
              </view>
            </view>
          </view>
          
          <!-- 空状态 -->
          <view v-if="settleList.length === 0" class="empty-state">
            <text class="empty-text">暂无结算记录</text>
          </view>
          
          <!-- 加载更多状态 -->
          <view v-if="settleList.length > 0" class="load-more">
            <text v-if="loadingMore" class="load-more-text">加载中...</text>
            <text v-else-if="noMore" class="load-more-text">没有更多了</text>
          </view>
        </template>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getSettleApi } from '@/api/modules/equipment-sales/settle.service'
import type { SettleRecord } from '@/api/modules/equipment-sales/interface/settleModel'
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

// 结算记录列表
const settleList = ref<SettleRecord[]>([])

// 统计信息
const stats = computed(() => {
  const total = settleList.value.length
  const totalAmount = settleList.value.reduce((sum, item) => sum + (item.amount || 0), 0)
  
  return {
    total,
    totalAmount
  }
})

onMounted(() => {
  loadData()
})

/**
 * 加载结算记录数据
 * @param page 页码
 * @param append 是否追加数据（用于加载更多）
 */
async function loadData(page: number = 1, append: boolean = false) {
  try {
    if (!append) {
      loading.value = true
    }
    
    // 加载结算记录列表
    const response = await getSettleApi({ 
      page, 
      pageSize
    })
    
    // 设置结算记录列表
    if (append) {
      // 追加数据
      settleList.value = [...settleList.value, ...(response.list || [])]
    } else {
      // 替换数据
      settleList.value = response.list || []
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
 * @param amount 金额（单位：分）
 * @returns 格式化后的金额字符串
 */
function formatAmount(amount: number): string {
  return amount.toFixed(2)
}
</script>

<style scoped lang="scss">
.equipment-sales-settle {
  min-height: 100vh;
  background-color: #f5f7fa;
}

/* 下拉刷新容器 */
.scroll-container {
  position: fixed;
  top: 180rpx;
  left: 0;
  right: 0;
  bottom: 0;
  height: auto;
}

/* 顶部紫色区域 */
.header-section {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: linear-gradient(135deg, #7C3AED 0%, #A855F7 100%);
  padding: 0 30rpx 40rpx;
  border-radius: 0 0 40rpx 40rpx;
  
  .header-title {
    font-size: 48rpx;
    font-weight: 700;
    color: #ffffff;
    display: block;
    margin-bottom: 12rpx;
    padding-top: 40rpx;
  }
}

.settle-list {
  padding: 30rpx;
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
  
  .settle-card {
    background-color: #ffffff;
    border-radius: 20rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
    
    /* 卡片头部 */
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24rpx;
      padding-bottom: 24rpx;
      border-bottom: 1rpx solid #F3F4F6;
      
      .time-info {
        display: flex;
        align-items: center;
        gap: 12rpx;
        
        .settle-icon {
          font-size: 32rpx;
        }
        
        .settle-time {
          font-size: 28rpx;
          color: #6B7280;
        }
      }
      
      .status-badge {
        padding: 8rpx 20rpx;
        border-radius: 12rpx;
        font-size: 24rpx;
        font-weight: 500;
        
        &.confirmed {
          background-color: #D1FAE5;
          color: #065F46;
        }
        
        &.pending {
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
        
        .amount-label {
          font-size: 28rpx;
          color: #6B7280;
        }
        
        .amount-value {
          font-size: 32rpx;
          font-weight: 600;
          color: #10B981;
          
          &.total {
            color: #7C3AED;
          }
        }
      }
    }
  }
}
</style>
