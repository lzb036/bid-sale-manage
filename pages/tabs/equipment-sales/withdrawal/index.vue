<template>
  <view class="withdrawal-page">
    <!-- 顶部区域 -->
    <view class="header-section" :style="{ paddingTop: appStore.statusBarHeight + 'px' }">
      <view class="header-title-wrapper">
        <text 
          :class="['header-title-tab', currentTab === 0 ? 'active' : '']"
          @click="switchTab(0)"
        >
          我的提现
        </text>
        <text class="title-divider">|</text>
        <text 
          :class="['header-title-tab', currentTab === 1 ? 'active' : '']"
          @click="switchTab(1)"
        >
          我的结算
        </text>
      </view>
      <text class="header-subtitle">共 {{ displayTotal }} 条记录</text>
    </view>

    <!-- 同步操作区域 -->
    <view v-if="currentTab === 0" class="sync-section">
      <view class="sync-buttons">
        <view
          class="sync-btn yyyp-btn"
          :class="{ 'syncing': syncingYyyp }"
          @tap="onSyncYyyp"
        >
          <text class="sync-btn-icon">{{ syncingYyyp ? '⏳' : '🔄' }}</text>
          <text class="sync-btn-text">{{ syncingYyyp ? '同步中...' : '悠悠提现同步' }}</text>
        </view>
        <view
          class="sync-btn buff-btn"
          :class="{ 'syncing': syncingBuff }"
          @tap="onSyncBuff"
        >
          <text class="sync-btn-icon">{{ syncingBuff ? '⏳' : '🔄' }}</text>
          <text class="sync-btn-text">{{ syncingBuff ? '同步中...' : 'BUFF提现同步' }}</text>
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
      <!-- 骨架屏 -->
      <view v-if="loading && currentListLength === 0" class="loading-container">
        <view v-for="i in 6" :key="i" class="skeleton-item">
          <view class="skeleton-left">
            <view class="skeleton-line long"></view>
            <view class="skeleton-line short"></view>
          </view>
          <view class="skeleton-right">
            <view class="skeleton-line medium"></view>
          </view>
        </view>
      </view>

      <!-- 列表内容 -->
      <template v-else>
        <template v-if="currentTab === 0">
          <view
            v-for="item in withdrawList"
            :key="item.id"
            class="record-item"
          >
            <!-- 左侧：市场图标 + 时间 -->
            <view class="item-left">
              <view :class="['market-badge', item.market]">
                <text class="market-text">{{ formatMarket(item.market) }}</text>
              </view>
              <text class="item-time">{{ formatTime(item.withdrawTime) }}</text>
            </view>

            <!-- 中间：手续费 -->
            <view class="item-center">
              <text class="fee-label">手续费</text>
              <text class="fee-value">¥{{ formatAmount(item.fee) }}</text>
            </view>

            <!-- 右侧：提现金额 -->
            <view class="item-right">
              <text class="amount-value">-¥{{ formatAmount(item.amount) }}</text>
              <text class="total-after">余 ¥{{ formatAmount(item.withdrawTotal) }}</text>
            </view>
          </view>

          <view v-if="withdrawList.length === 0" class="empty-state">
            <text class="empty-icon">💸</text>
            <text class="empty-text">暂无提现记录</text>
          </view>

          <view v-if="withdrawList.length > 0" class="load-more">
            <text v-if="loading" class="load-more-text">加载中...</text>
            <text v-else-if="withdrawFinished" class="load-more-text">已加载全部</text>
          </view>
        </template>

        <template v-else>
          <view
            v-for="item in settleList"
            :key="item.id"
            class="record-item settle-item"
          >
            <view class="item-left settle-left">
              <text class="settle-time-label">结算时间</text>
              <text class="item-time">{{ formatTime(item.settleTime) }}</text>
            </view>

            <view class="item-center">
              <text class="fee-label">确认状态</text>
              <text :class="['settle-status', item.confirmed ? 'confirmed' : 'pending']">
                {{ item.confirmed ? '已确认' : '待确认' }}
              </text>
            </view>

            <view class="item-right">
              <text class="amount-value settle-amount">+¥{{ formatAmount(item.amount) }}</text>
              <text class="total-after">总额 ¥{{ formatNullableAmount(item.settleTotal) }}</text>
            </view>
          </view>

          <view v-if="settleList.length === 0" class="empty-state">
            <text class="empty-icon">💰</text>
            <text class="empty-text">暂无结算记录</text>
          </view>

          <view v-if="settleList.length > 0" class="load-more">
            <text v-if="loading" class="load-more-text">加载中...</text>
            <text v-else-if="settleFinished" class="load-more-text">已加载全部</text>
          </view>
        </template>

        <!-- tabBar 占位 -->
        <view style="height: 120rpx;"></view>
      </template>
    </scroll-view>
  </view>

  <!-- 自定义 tabBar -->
  <EquipmentTabbar :current="3"></EquipmentTabbar>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getSettleApi } from '@/api/modules/equipment-sales/settle.service'
import { getWithdrawApi } from '@/api/modules/equipment-sales/withdraw.service'
import type { SettleRecord } from '@/api/modules/equipment-sales/interface/settleModel'
import type { WithdrawRecord } from '@/api/modules/equipment-sales/interface/withdrawModel'
import EquipmentTabbar from '@/components/equipment-tabbar/EquipmentTabbar.vue'
import { WithdrawSyncService } from '@/utils/sync-service'
import { useEquipmentSalesStore } from '@/store/equipment-sales'
import { useAppStore } from '@/store/app'

const appStore = useAppStore()

// 当前选中的 tab
const currentTab = ref(0)

// 提现列表数据
const withdrawList = ref<WithdrawRecord[]>([])
const withdrawPage = ref(1)
const withdrawFinished = ref(false)
const withdrawTotal = ref(0)

// 结算列表数据
const settleList = ref<SettleRecord[]>([])
const settlePage = ref(1)
const settleFinished = ref(false)
const settleTotal = ref(0)

const loading = ref(false)
const refreshing = ref(false)

const pageSize = 20

// 同步状态
const syncingYyyp = ref(false)
const syncingBuff = ref(false)

const equipmentSalesStore = useEquipmentSalesStore()
const defaultSteamId = computed(() => equipmentSalesStore.defaultSteamId)
const displayTotal = computed(() => currentTab.value === 0 ? withdrawTotal.value : settleTotal.value)
const currentListLength = computed(() => currentTab.value === 0 ? withdrawList.value.length : settleList.value.length)


onLoad(() => {
  loadData(true)
})

/**
 * 切换 tab
 */
function switchTab(index: number) {
  if (currentTab.value === index) return
  currentTab.value = index
  // 切换 tab 后重新加载数据
  loadData(true)
}

/**
 * 加载当前 tab 数据
 */
async function loadData(isRefresh = false) {
  if (loading.value) return
  if (!isRefresh && currentTab.value === 0 && withdrawFinished.value) return
  if (!isRefresh && currentTab.value === 1 && settleFinished.value) return

  loading.value = true
  try {
    if (currentTab.value === 0) {
      await loadWithdrawData(isRefresh)
    } else {
      await loadSettleData(isRefresh)
    }
  } finally {
    loading.value = false
  }
}

async function loadWithdrawData(isRefresh = false) {
  if (isRefresh) {
    withdrawPage.value = 1
    withdrawFinished.value = false
  }

  const res = await getWithdrawApi({ page: withdrawPage.value, pageSize })
  const newList = res?.list ?? []
  const pager = res?.pager

  withdrawList.value = isRefresh ? newList : [...withdrawList.value, ...newList]
  withdrawTotal.value = pager?.total ?? withdrawTotal.value
  withdrawFinished.value = pager
    ? pager.current >= pager.pages || withdrawList.value.length >= pager.total
    : newList.length < pageSize
  withdrawPage.value = (pager?.current ?? withdrawPage.value) + 1
}

async function loadSettleData(isRefresh = false) {
  if (isRefresh) {
    settlePage.value = 1
    settleFinished.value = false
  }

  const res = await getSettleApi({ page: settlePage.value, pageSize })
  const newList = res?.list ?? []
  const pager = res?.pager

  settleList.value = isRefresh ? newList : [...settleList.value, ...newList]
  settleTotal.value = pager?.total ?? settleTotal.value
  settleFinished.value = pager
    ? pager.current >= pager.pages || settleList.value.length >= pager.total
    : newList.length < pageSize
  settlePage.value = (pager?.current ?? settlePage.value) + 1
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
 * 悠悠有品提现同步
 */
async function onSyncYyyp() {
  if (syncingYyyp.value) return
  const steamId = defaultSteamId.value
  if (!steamId) {
    uni.showToast({ title: '请先在账号管理中选择默认账号', icon: 'none' })
    return
  }
  syncingYyyp.value = true
  try {
    await WithdrawSyncService.syncYYYPWithdraw(steamId)
    uni.showToast({ title: '悠悠同步成功', icon: 'success' })
    await loadData(true)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '同步失败'
    uni.showToast({ title: msg, icon: 'none' })
  } finally {
    syncingYyyp.value = false
  }
}

/**
 * 网易 BUFF 提现同步
 */
async function onSyncBuff() {
  if (syncingBuff.value) return
  const steamId = defaultSteamId.value
  if (!steamId) {
    uni.showToast({ title: '请先在账号管理中选择默认账号', icon: 'none' })
    return
  }
  syncingBuff.value = true
  try {
    await WithdrawSyncService.syncBUFFWithdraw(steamId)
    uni.showToast({ title: 'BUFF 同步成功', icon: 'success' })
    await loadData(true)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '同步失败'
    uni.showToast({ title: msg, icon: 'none' })
  } finally {
    syncingBuff.value = false
  }
}

/**
 * 格式化金额
 */
function formatAmount(amount: number): string {
  return amount.toFixed(2)
}

/**
 * 格式化可空金额
 */
function formatNullableAmount(amount: number | null): string {
  return amount === null ? '--' : amount.toFixed(2)
}

/**
 * 格式化市场名称
 */
function formatMarket(market: string): string {
  const marketMap: Record<string, string> = {
    buff: 'BUFF',
    yyyp: '悠悠',
    c5: 'C5'
  }
  return marketMap[market] ?? market.toUpperCase()
}

/**
 * 格式化时间
 */
function formatTime(time: string): string {
  return time ? time.substring(0, 16) : ''
}
</script>

<style scoped lang="scss">
.withdrawal-page {
  min-height: 100vh;
  background-color: #f5f7fa;
}

/* 顶部区域 */
.header-section {
  background: linear-gradient(135deg, #059669 0%, #10B981 100%);
  padding: 0 30rpx 40rpx;
  border-radius: 0 0 40rpx 40rpx;

  .header-title-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20rpx;
    margin-bottom: 20rpx;
    padding-top: 40rpx;

    .header-title-tab {
      font-size: 48rpx;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.7);
      transition: all 0.2s ease;

      &.active {
        color: #ffffff;
      }
    }

    .title-divider {
      font-size: 40rpx;
      color: rgba(255, 255, 255, 0.5);
    }
  }

  .header-subtitle {
    font-size: 26rpx;
    color: rgba(255, 255, 255, 0.8);
    display: block;
    text-align: center;
    margin-bottom: 30rpx;
  }

}

/* 同步操作区域 */
.sync-section {
  padding: 20rpx 30rpx 10rpx;

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
    gap: 10rpx;

    &.syncing {
      opacity: 0.5;
    }

    .sync-btn-icon {
      font-size: 28rpx;
    }

    .sync-btn-text {
      font-size: 26rpx;
      font-weight: 600;
    }
  }

  .yyyp-btn {
    background-color: #EFF6FF;
    border: 2rpx solid #BFDBFE;

    .sync-btn-text {
      color: #1D4ED8;
    }
  }

  .buff-btn {
    background-color: #FEF3C7;
    border: 2rpx solid #FDE68A;

    .sync-btn-text {
      color: #D97706;
    }
  }
}

/* 滚动容器 */
.scroll-container {
  height: calc(100vh - 420rpx);
  padding: 20rpx 0 0;
}

/* 骨架屏 */
.loading-container {
  .skeleton-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 28rpx 30rpx;
    background: #ffffff;
    border-radius: 16rpx;
    margin: 0 30rpx 16rpx;

    .skeleton-left, .skeleton-right {
      display: flex;
      flex-direction: column;
      gap: 12rpx;
    }

    .skeleton-line {
      height: 24rpx;
      border-radius: 8rpx;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);

      &.long { width: 160rpx; }
      &.medium { width: 120rpx; }
      &.short { width: 100rpx; }
    }
  }
}

/* 记录条目 */
.record-item {
  display: flex;
  align-items: center;
  padding: 28rpx 30rpx;
  background: #ffffff;
  border-radius: 16rpx;
  margin: 0 30rpx 16rpx;
  gap: 20rpx;

  .item-left {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12rpx;
    width: 100rpx;
    flex-shrink: 0;

    .market-badge {
      padding: 8rpx 16rpx;
      border-radius: 10rpx;
      min-width: 80rpx;
      text-align: center;

      &.buff {
        background-color: #FEF3C7;
        .market-text { color: #D97706; }
      }

      &.yyyp {
        background-color: #EFF6FF;
        .market-text { color: #1D4ED8; }
      }

      &.c5 {
        background-color: #F0FDF4;
        .market-text { color: #15803D; }
      }
    }

    .market-text {
      font-size: 22rpx;
      font-weight: 600;
    }

    .item-time {
      font-size: 20rpx;
      color: #9CA3AF;
      text-align: center;
    }
  }

  .item-center {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8rpx;

    .fee-label {
      font-size: 22rpx;
      color: #9CA3AF;
    }

    .fee-value {
      font-size: 26rpx;
      color: #6B7280;
    }
  }

  .item-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8rpx;

    .amount-value {
      font-size: 32rpx;
      font-weight: 700;
      color: #EF4444;
    }

    .total-after {
      font-size: 22rpx;
      color: #9CA3AF;
    }
  }
}

.settle-item {
  .settle-left {
    width: 180rpx;
    align-items: flex-start;

    .settle-time-label {
      font-size: 22rpx;
      color: #9CA3AF;
      line-height: 1;
    }

    .item-time {
      text-align: left;
      line-height: 1.4;
      word-break: break-all;
    }
  }

  .settle-status {
    font-size: 26rpx;
    font-weight: 600;
    padding: 8rpx 16rpx;
    border-radius: 10rpx;
    display: inline-flex;
    align-items: center;
    justify-content: center;

    &.confirmed {
      background-color: #ECFDF5;
      color: #059669;
    }

    &.pending {
      background-color: #FEF3C7;
      color: #D97706;
    }
  }

  .settle-amount {
    color: #10B981;
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
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
