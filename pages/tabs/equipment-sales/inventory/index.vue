<template>
  <view class="equipment-sales-inventory">
    <!-- 顶部紫色区域 -->
    <view class="header-section" :style="{ paddingTop: appStore.statusBarHeight + 'px' }">
      <text class="header-title">Steam 库存</text>
      <text class="header-stats">共 {{ stats.total }} 件饰品·{{ stats.tradable }} 件可交易</text>
      
      <!-- 库存总价值卡片 -->
      <view class="total-card">
        <text class="total-label">库存总价值</text>
        <text class="total-value">¥{{ formatAmount(stats.totalValue) }}</text>
      </view>
    </view>
    
    <!-- 筛选标签栏 -->
    <view class="filter-bar">
      <view class="filter-tabs">
        <view 
          v-for="(tab, index) in filterTabs" 
          :key="index"
          :class="['tab-item', { active: activeTab === index }]"
          @click="switchTab(index)"
        >
          <text>{{ tab }}</text>
        </view>
      </view>
      <view class="filter-icon">
        <text>🔽</text>
      </view>
    </view>
    
    <!-- 饰品网格 - 支持下拉刷新 -->
    <scroll-view 
      class="scroll-container"
      scroll-y
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view class="inventory-grid">
      <!-- 加载状态 -->
      <view v-if="loading" class="loading-container">
        <text class="loading-text">加载中...</text>
      </view>
      
      <!-- 饰品列表 -->
      <template v-else>
        <view 
          v-for="item in inventoryList" 
          :key="item.id"
          class="item-card"
          @click="navigateToDetail(item)"
        >
          <view class="item-image-wrapper">
            <image :src="item.imageUrl" class="item-image" mode="aspectFit"></image>
            <!-- 只有不可交易的才显示标签 -->
            <view v-if="!item.markets || item.markets.length === 0" class="status-badge non-tradable">
              <text>{{ formatCooldown(item.cooldown) }}</text>
            </view>
          </view>
          <view class="item-info">
            <text class="item-name">{{ item.shortName || item.name }}</text>
            <view class="item-footer">
              <text class="item-price">¥{{ formatAmount(item.baseValue) }}</text>
            </view>
          </view>
        </view>
        
        <!-- 空状态 -->
        <view v-if="inventoryList.length === 0" class="empty-state">
          <text class="empty-text">暂无库存数据</text>
        </view>

        <!-- tabBar 占位 -->
        <view style="height: 120rpx; grid-column: 1 / -1;"></view>
      </template>
      </view>
    </scroll-view>
  </view>

  <!-- 自定义 tabBar -->
  <EquipmentTabbar :current="4"></EquipmentTabbar>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getInventoryApi } from '@/api/modules/equipment-sales/inventory.service'
import type { InventoryItem } from '@/api/modules/equipment-sales/interface/inventoryModel'
import EquipmentTabbar from '@/components/equipment-tabbar/EquipmentTabbar.vue'
import { useAppStore } from '@/store/app'

const appStore = useAppStore()

// 加载状态
const loading = ref(true)

// 下拉刷新状态
const refreshing = ref(false)

// 库存列表
const inventoryList = ref<InventoryItem[]>([])

// 筛选标签
const filterTabs = ['全部', '可交易', '不可交易']
const activeTab = ref(0)

// 统计信息
const stats = computed(() => {
  const total = inventoryList.value.length
  const tradable = inventoryList.value.filter(item => item.markets && item.markets.length > 0).length
  const totalValue = inventoryList.value.reduce((sum, item) => sum + (item.baseValue || 0), 0)
  
  return {
    total,
    tradable,
    totalValue
  }
})

onLoad(() => {
  loadData()
})

/**
 * 加载库存数据
 * @param tradable 交易状态 ('' = 全部, true = 可交易, false = 不可交易)
 */
async function loadData(tradable: string | boolean = '') {
  try {
    loading.value = true
    
    // 构建请求参数
    const params: any = { 
      page: 1, 
      pageSize: 100,
      type: 'mystock'
    }
    
    // 只有在 tradable 不为空字符串时才添加到参数中
    if (tradable !== '') {
      params.tradable = tradable
    }
    
    // 加载库存列表
    const response = await getInventoryApi(params)
    
    // 设置库存列表
    inventoryList.value = response.list || []
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
  
  // 根据当前标签确定 tradable 参数值
  let tradableValue: string | boolean = ''
  if (activeTab.value === 1) {
    tradableValue = true
  } else if (activeTab.value === 2) {
    tradableValue = false
  }
  
  await loadData(tradableValue)
  refreshing.value = false
}

/**
 * 切换筛选标签
 * @param index 标签索引
 */
async function switchTab(index: number) {
  if (activeTab.value === index) return // 如果点击的是当前标签，不做处理
  
  activeTab.value = index
  
  // 清空当前数据
  inventoryList.value = []
  
  // 根据标签索引确定 tradable 参数值
  let tradableValue: string | boolean = ''
  if (index === 1) {
    // 可交易
    tradableValue = true
  } else if (index === 2) {
    // 不可交易
    tradableValue = false
  }
  // index === 0 时为全部，tradableValue 保持为 ''
  
  // 重新加载数据
  await loadData(tradableValue)
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
 * 格式化冷却时间
 * @param cooldown 冷却时间（秒）
 * @returns 格式化后的时间字符串
 */
function formatCooldown(cooldown?: number): string {
  if (!cooldown || cooldown <= 0) {
    return '不可交易'
  }
  
  const days = Math.floor(cooldown / 86400)
  const hours = Math.floor((cooldown % 86400) / 3600)
  
  if (days > 0) {
    return `${days}天${hours}小时`
  } else if (hours > 0) {
    return `${hours}小时`
  } else {
    return '不可交易'
  }
}

/**
 * 导航到饰品详情页
 * @param item 饰品数据对象
 */
function navigateToDetail(item: InventoryItem) {
  uni.navigateTo({
    url: `/pages/tabs/equipment-sales/inventory/detail/index?id=${item.id}`,
    success: (res) => {
      // 通过 eventChannel 传递完整的饰品数据对象
      res.eventChannel.emit('itemData', item)
    },
    fail: (err) => {
      console.error('导航失败:', err)
      uni.showToast({
        title: '无法打开详情页',
        icon: 'none'
      })
    }
  })
}
</script>

<style scoped lang="scss">
.equipment-sales-inventory {
  min-height: 100vh;
  background-color: #f5f7fa;
}

/* 空状态 */
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 80rpx 0;
  
  .empty-text {
    font-size: 28rpx;
    color: #909399;
    display: block;
  }
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
  
  /* 库存总价值卡片 */
  .total-card {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border-radius: 20rpx;
    padding: 30rpx;
    border: 1px solid rgba(255, 255, 255, 0.2);
    
    .total-label {
      font-size: 26rpx;
      color: rgba(255, 255, 255, 0.9);
      display: block;
      margin-bottom: 12rpx;
    }
    
    .total-value {
      font-size: 48rpx;
      font-weight: 700;
      color: #ffffff;
      display: block;
    }
  }
}

/* 下拉刷新容器 */
.scroll-container {
  height: calc(100vh - 380rpx);
}

/* 筛选标签栏 */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  background-color: #ffffff;
  margin-top: -30rpx;
  border-radius: 20rpx 20rpx 0 0;
  
  .filter-tabs {
    display: flex;
    gap: 30rpx;
    
    .tab-item {
      padding: 12rpx 24rpx;
      border-radius: 12rpx;
      font-size: 28rpx;
      color: #6B7280;
      
      &.active {
        background-color: #EEF2FF;
        color: #7C3AED;
        font-weight: 600;
      }
    }
  }
  
  .filter-icon {
    font-size: 32rpx;
    color: #9CA3AF;
  }
}

/* 饰品网格 */
.inventory-grid {
  padding: 20rpx 30rpx 30rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
  min-height: 400rpx;
  position: relative;
  
  /* 加载状态 */
  .loading-container {
    grid-column: 1 / -1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 100rpx 0;
    
    .loading-text {
      font-size: 28rpx;
      color: #909399;
    }
  }
  
  .item-card {
    background-color: #ffffff;
    border-radius: 16rpx;
    overflow: hidden;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
    
    /* 图片区域 */
    .item-image-wrapper {
      position: relative;
      width: 100%;
      height: 280rpx;
      background: linear-gradient(135deg, #1F2937 0%, #374151 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      
      .item-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .status-badge {
        position: absolute;
        top: 16rpx;
        right: 16rpx;
        padding: 8rpx 16rpx;
        border-radius: 8rpx;
        font-size: 22rpx;
        font-weight: 600;
        
        &.non-tradable {
          background-color: #EF4444;
          color: #ffffff;
        }
      }
    }
    
    /* 信息区域 */
    .item-info {
      padding: 20rpx;
      
      .item-name {
        font-size: 26rpx;
        color: #1F2937;
        font-weight: 500;
        display: block;
        margin-bottom: 16rpx;
        line-height: 1.4;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .item-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .item-price {
          font-size: 28rpx;
          font-weight: 700;
          color: #10B981;
        }
      }
    }
  }
}
</style>
