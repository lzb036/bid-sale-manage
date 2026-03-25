<template>
  <view class="records-page">
    <!-- 顶部区域 -->
    <view class="header-section" :style="{ paddingTop: appStore.statusBarHeight + 'px' }">
      <text class="header-title">饰品记录</text>
      <text class="header-subtitle">共 {{ total }} 条记录</text>
    </view>

    <!-- 同步操作区域 -->
    <view class="sync-section">
      <!-- 未设置默认账号提示 -->
      <view v-if="!defaultSteamId" class="sync-no-account">
        <text class="sync-no-account-text">请先在账号管理中选择默认账号</text>
      </view>

      <!-- 同步按钮区域 -->
      <view class="sync-buttons">
        <!-- 悠悠有品同步按钮 -->
        <view
          :class="['sync-btn', 'sync-btn-yyyp', { 'sync-btn-disabled': !defaultSteamId || yyyypSyncing }]"
          @tap="triggerSync('yyyp')"
        >
          <view v-if="yyyypSyncing" class="sync-btn-loading">
            <view class="loading-dot"></view>
            <view class="loading-dot"></view>
            <view class="loading-dot"></view>
          </view>
          <text v-else class="sync-btn-text">{{ yyyypSyncing ? '同步中...' : '悠悠有品 同步' }}</text>
        </view>

        <!-- 网易 BUFF 同步按钮 -->
        <view
          :class="['sync-btn', 'sync-btn-buff', { 'sync-btn-disabled': !defaultSteamId || buffSyncing }]"
          @tap="triggerSync('buff')"
        >
          <view v-if="buffSyncing" class="sync-btn-loading">
            <view class="loading-dot"></view>
            <view class="loading-dot"></view>
            <view class="loading-dot"></view>
          </view>
          <text v-else class="sync-btn-text">{{ buffSyncing ? '同步中...' : '网易 BUFF 同步' }}</text>
        </view>
      </view>
    </view>

    <!-- 列表区域 -->
    <scroll-view
      class="scroll-container"
      scroll-y
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="onLoadMore"
    >
      <!-- 加载中骨架 -->
      <view v-if="loading && list.length === 0" class="loading-container">
        <view v-for="i in 5" :key="i" class="skeleton-item">
          <view class="skeleton-image"></view>
          <view class="skeleton-content">
            <view class="skeleton-line long"></view>
            <view class="skeleton-line short"></view>
            <view class="skeleton-line medium"></view>
          </view>
        </view>
      </view>

      <!-- 列表内容 -->
      <template v-else>
        <view
          v-for="item in list"
          :key="item.id"
          class="record-item"
        >
          <!-- 饰品图片 + 磨损度 -->
          <view class="item-left">
            <view class="item-image-wrap">
              <image
                :src="item.itemDefine.imageUrl"
                class="item-image"
                mode="aspectFit"
              ></image>
              <!-- 平台标识角标 -->
              <view v-if="item.marketName" :class="['market-badge', item.market]">
                <text class="market-badge-text">{{ item.marketName }}</text>
              </view>
              <!-- 磨损度覆盖在图片底部 -->
              <view v-if="item.abrade != null" class="abrade-overlay">
                <text class="abrade-overlay-text">{{ formatAbrade(item.abrade) }}</text>
              </view>
            </view>
          </view>

          <!-- 饰品信息 -->
          <view class="item-info">
            <text class="item-name">{{ item.itemDefine.name }}</text>
            <view class="item-meta">
              <text v-if="item.marketTime" class="item-sell-time">{{ formatTime(item.marketTime) }}</text>
            </view>
            <view class="item-price-row">
              <text v-if="item.price > 0" class="item-price">¥{{ formatAmount(item.price) }}</text>
              <view :class="['status-badge', item.confirmed ? 'confirmed' : 'pending']">
                <text>{{ item.confirmed ? '已确认' : '待确认' }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="list.length === 0" class="empty-state">
          <text class="empty-icon">📭</text>
          <text class="empty-text">暂无记录</text>
        </view>

        <!-- 加载更多 -->
        <view v-if="list.length > 0" class="load-more">
          <text v-if="loading" class="load-more-text">加载中...</text>
          <text v-else-if="finished" class="load-more-text">已加载全部</text>
        </view>

        <!-- tabBar 占位 -->
        <view style="height: 120rpx;"></view>
      </template>
    </scroll-view>
  </view>

  <!-- 自定义 tabBar -->
  <EquipmentTabbar :current="2"></EquipmentTabbar>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getItemsApi } from '@/api/modules/equipment-sales/items.service'
import type { EquipmentItem } from '@/api/modules/equipment-sales/interface/itemsModel'
import EquipmentTabbar from '@/components/equipment-tabbar/EquipmentTabbar.vue'
import { useEquipmentSalesStore } from '@/store/equipment-sales'
import { SyncService } from '@/utils/sync-service'
import type { PlatformType } from '@/types/platform-auth'
import { useAppStore } from '@/store/app'

const appStore = useAppStore()

// Store
const equipmentSalesStore = useEquipmentSalesStore()
const defaultSteamId = computed(() => equipmentSalesStore.defaultSteamId)

// 各平台同步状态（独立管理，互不影响）
const yyyypSyncing = ref(false)
const buffSyncing = ref(false)

// 列表数据
const list = ref<EquipmentItem[]>([])
const loading = ref(false)
const refreshing = ref(false)
const finished = ref(false)

// 分页
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

onLoad(() => {
  loadData()
})

/**
 * 加载数据
 */
async function loadData(isRefresh = false) {
  if (loading.value) return
  if (!isRefresh && finished.value) return

  if (isRefresh) {
    page.value = 1
    finished.value = false
  }

  loading.value = true
  try {
    const res = await getItemsApi({ page: page.value, pageSize: pageSize.value, confirmed: '', status: '' })
    const newList = res?.list ?? []
    list.value = isRefresh ? newList : [...list.value, ...newList]
    total.value = res?.pager?.total ?? 0
    finished.value = list.value.length >= total.value
    if (!isRefresh) page.value++
  } finally {
    loading.value = false
  }
}

/**
 * 下拉刷新
 */
async function onRefresh() {
  refreshing.value = true
  await loadData(true)
  refreshing.value = false
}

/**
 * 上拉加载更多
 */
function onLoadMore() {
  loadData()
}

/**
 * 格式化磨损度，显示完整数值
 */
function formatAbrade(abrade: number | string | null | undefined): string {
  if (abrade == null) return ''
  return String(abrade)
}

/**
 * 格式化金额
 */
function formatAmount(amount: number | null | undefined): string {
  if (amount == null) return '0.00'
  return amount.toFixed(2)
}

/**
 * 格式化时间（只显示日期）
 */
function formatTime(time: string | null): string {
  if (!time) return ''
  return time.substring(0, 10)
}

/**
 * 触发指定平台同步
 * @param platform 平台类型（'yyyp' 或 'buff'）
 */
async function triggerSync(platform: PlatformType): Promise<void> {
  // 未设置默认账号时不触发
  if (!defaultSteamId.value) return

  // 同步中时防止重复触发
  if (platform === 'yyyp' && yyyypSyncing.value) return
  if (platform === 'buff' && buffSyncing.value) return

  // 设置对应平台的同步状态
  if (platform === 'yyyp') {
    yyyypSyncing.value = true
  } else {
    buffSyncing.value = true
  }

  try {
    await SyncService.sync(defaultSteamId.value, platform)
  } catch (error: unknown) {
    // yyyp Token 不存在时显示专属提示
    if (error instanceof Error && error.message === 'YYYP_TOKEN_NOT_FOUND') {
      uni.showToast({
        title: '请先绑定悠悠有品账号',
        icon: 'none',
        duration: 2000
      })
    } else {
      const msg = error instanceof Error ? error.message : '同步失败，请稍后重试'
      uni.showToast({
        title: msg,
        icon: 'none',
        duration: 2000
      })
    }
    return
  } finally {
    // 恢复按钮状态（无论成功或失败）
    if (platform === 'yyyp') {
      yyyypSyncing.value = false
    } else {
      buffSyncing.value = false
    }
  }

  // 同步成功后刷新列表并提示
  await loadData(true)
  uni.showToast({
    title: '同步成功',
    icon: 'success'
  })
}
</script>

<style scoped lang="scss">
.records-page {
  min-height: 100vh;
  background-color: #f5f7fa;
}

/* 顶部区域 */
.header-section {
  background: linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%);
  padding: 0 30rpx 50rpx;
  border-radius: 0 0 40rpx 40rpx;

  .header-title {
    font-size: 48rpx;
    font-weight: 700;
    color: #ffffff;
    display: block;
    margin-bottom: 8rpx;
    padding-top: 40rpx;
  }

  .header-subtitle {
    font-size: 26rpx;
    color: rgba(255, 255, 255, 0.8);
    display: block;
  }
}
/* 同步操作区域 */
.sync-section {
  padding: 20rpx 30rpx 10rpx;

  .sync-no-account {
    background-color: #FEF3C7;
    border-radius: 12rpx;
    padding: 16rpx 20rpx;
    margin-bottom: 16rpx;

    .sync-no-account-text {
      font-size: 24rpx;
      color: #D97706;
    }
  }

  .sync-buttons {
    display: flex;
    gap: 20rpx;
  }

  .sync-btn {
    flex: 1;
    height: 72rpx;
    border-radius: 12rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    &.sync-btn-yyyp {
      background-color: #EFF6FF;
      border: 2rpx solid #BFDBFE;
    }

    &.sync-btn-buff {
      background-color: #FEF3C7;
      border: 2rpx solid #FDE68A;
    }

    &.sync-btn-disabled {
      opacity: 0.5;
    }

    .sync-btn-text {
      font-size: 26rpx;
      font-weight: 600;
    }

    &.sync-btn-yyyp .sync-btn-text {
      color: #1D4ED8;
    }

    &.sync-btn-buff .sync-btn-text {
      color: #D97706;
    }

    .sync-btn-loading {
      display: flex;
      gap: 8rpx;
      align-items: center;
    }
  }

  .sync-btn-yyyp .sync-btn-loading .loading-dot {
    background-color: #1D4ED8;
  }

  .sync-btn-buff .sync-btn-loading .loading-dot {
    background-color: #D97706;
  }
}

.loading-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  animation: dot-bounce 1.2s infinite ease-in-out;

  &:nth-child(1) { animation-delay: 0s; }
  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.4s; }
}

@keyframes dot-bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

.scroll-container {
  height: calc(100vh - 380rpx);
}

/* 骨架屏 */
.loading-container {
  padding-top: 20rpx;

  .skeleton-item {
    display: flex;
    gap: 24rpx;
    padding: 24rpx;
    background: #ffffff;
    border-radius: 16rpx;
    margin-bottom: 20rpx;

    .skeleton-image {
      width: 180rpx;
      height: 120rpx;
      border-radius: 12rpx;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      flex-shrink: 0;
    }

    .skeleton-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16rpx;
      justify-content: center;
    }

    .skeleton-line {
      height: 24rpx;
      border-radius: 8rpx;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);

      &.long { width: 80%; }
      &.medium { width: 60%; }
      &.short { width: 40%; }
    }
  }
}

/* 记录条目 */
.record-item {
  display: flex;
  gap: 24rpx;
  padding: 24rpx;
  background: #ffffff;
  border-radius: 16rpx;
  margin: 20rpx 30rpx 0;

  .item-left {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
    gap: 8rpx;
  }

  .item-image-wrap {
    width: 180rpx;
    height: 120rpx;
    border-radius: 12rpx;
    background: linear-gradient(135deg, #1F2937 0%, #374151 100%);
    flex-shrink: 0;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    .item-image {
      width: 100%;
      height: 100%;
    }

    /* 磨损度覆盖在图片底部 */
    .abrade-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(0, 0, 0, 0.45);
      padding: 2rpx 4rpx;

      .abrade-overlay-text {
        font-size: 16rpx;
        color: rgba(255, 255, 255, 0.9);
        display: block;
        text-align: center;
        white-space: nowrap;
        transform: scale(0.75);
        transform-origin: center center;
      }
    }

    /* 平台角标 */
    .market-badge {
      position: absolute;
      top: 0;
      left: 0;
	  height: 30rpx;
	  line-height: 20rpx;
	  padding: 0rpx 3rpx;

      &.buff {
        background-color: rgba(217, 119, 6, 0.85);
      }

      &.yyyp {
        background-color: rgba(29, 78, 216, 0.85);
      }

      &.c5 {
        background-color: rgba(21, 128, 61, 0.85);
      }

      .market-badge-text {
        font-size: 10rpx;
        color: #ffffff;
        font-weight: 500;
        line-height: 1;
      }
    }
  }

  .item-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10rpx;
    overflow: hidden;

    .item-name {
      font-size: 28rpx;
      font-weight: 600;
      color: #1F2937;
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .item-meta {
      display: flex;
      gap: 12rpx;
      flex-wrap: wrap;
      align-items: center;

      .meta-tag {
        font-size: 22rpx;
        padding: 4rpx 14rpx;
        border-radius: 8rpx;

        &.market-tag {
          &.buff { background-color: #FEF3C7; color: #D97706; }
          &.yyyp { background-color: #EFF6FF; color: #1D4ED8; }
          &.c5  { background-color: #F0FDF4; color: #15803D; }
        }

        &.market-tag-empty {
          background-color: #F3F4F6;
          color: #9CA3AF;
        }

        &.abrade-tag {
          background-color: #F0FDF4;
          color: #15803D;
        }
      }

      .item-sell-time {
        font-size: 22rpx;
        color: #9CA3AF;
      }
    }

    .item-price-row {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .item-price {
        font-size: 32rpx;
        font-weight: 700;
        color: #10B981;
      }

      .item-price-empty {
        font-size: 26rpx;
        color: #9CA3AF;
      }

      .status-badge {
        font-size: 22rpx;
        padding: 4rpx 16rpx;
        border-radius: 8rpx;

        &.confirmed {
          background-color: #ECFDF5;
          color: #059669;
        }

        &.pending {
          background-color: #FEF3C7;
          color: #D97706;
        }
      }
    }

    .item-market {
      font-size: 24rpx;
      color: #9CA3AF;
      display: block;
    }

    .item-sell-time {
      font-size: 22rpx;
      color: #9CA3AF;
      display: block;
    }

    .abrade-row {
      display: flex;
      align-items: center;
      gap: 10rpx;

      .abrade-label {
        font-size: 20rpx;
        color: #9CA3AF;
        flex-shrink: 0;
      }

      .abrade-bar-wrap {
        flex: 1;
        height: 16rpx;
        position: relative;
        border-radius: 8rpx;
        overflow: visible;

        .abrade-bar-bg {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          border-radius: 8rpx;
          /* 磨损度颜色区间：崭新 → 略磨 → 久经 → 破损 → 战痕 */
          background: linear-gradient(
            to right,
            #4ADE80 0%,
            #4ADE80 7%,
            #A3E635 7%,
            #A3E635 15%,
            #FACC15 15%,
            #FACC15 38%,
            #FB923C 38%,
            #FB923C 45%,
            #F87171 45%,
            #F87171 100%
          );
        }

        .abrade-pointer {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 20rpx;
          height: 20rpx;
          border-radius: 50%;
          background: #ffffff;
          border: 3rpx solid #374151;
          box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.3);
          z-index: 1;
        }
      }

      .abrade-value {
        font-size: 20rpx;
        color: #6B7280;
        flex-shrink: 0;
        min-width: 80rpx;
        text-align: right;
      }
    }

    .item-bottom-row {
      display: flex;
      align-items: center;
      gap: 12rpx;

      .market-tag {
        padding: 4rpx 14rpx;
        border-radius: 8rpx;
        flex-shrink: 0;

        &.buff {
          background-color: #FEF3C7;
          .market-tag-text { color: #D97706; }
        }

        &.yyyp {
          background-color: #EFF6FF;
          .market-tag-text { color: #1D4ED8; }
        }

        &.c5 {
          background-color: #F0FDF4;
          .market-tag-text { color: #15803D; }
        }

        .market-tag-text {
          font-size: 22rpx;
          font-weight: 600;
        }
      }

      .item-market-time {
        font-size: 22rpx;
        color: #9CA3AF;
      }
    }
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 30rpx;
  gap: 20rpx;

  .empty-icon {
    font-size: 80rpx;
  }

  .empty-text {
    font-size: 28rpx;
    color: #9CA3AF;
  }
}

/* 加载更多 */
.load-more {
  text-align: center;
  padding: 30rpx 0 60rpx;

  .load-more-text {
    font-size: 26rpx;
    color: #9CA3AF;
  }
}
</style>
