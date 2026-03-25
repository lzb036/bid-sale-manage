<template>
  <view class="equipment-sales-account">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <u-loading-page loading></u-loading-page>
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
      <!-- 顶部紫色区域 -->
      <view class="header-section" :style="{ paddingTop: appStore.statusBarHeight + 'px' }">
        <text class="header-title">{{ t('equipmentSales.myAccounts') }}</text>
        <text class="header-stats">
          {{ t('equipmentSales.totalStats') }} {{ stats.total }} · {{ stats.online }} {{ t('equipmentSales.onlineCount') }}
        </text>
      </view>

      <!-- 账号列表 -->
      <view class="account-list">
        <view
          v-for="account in steamAccounts"
          :key="account.id"
          class="account-card"
        >
          <!-- 卡片头部：点击头像跳转 Steam 认证 -->
          <view class="card-header">
            <view class="avatar-wrapper" @click="handleSteamAuth(account.id)">
              <image :src="account.avatar" class="avatar"></image>
              <view :class="['status-dot', account.status ? 'online' : 'offline']"></view>
            </view>
            <view class="account-info">
              <view class="name-row">
                <text class="account-name">{{ account.nickname }}</text>
                <text v-if="account.id === defaultSteamId" class="default-badge">{{ t('equipmentSales.defaultBadge') }}</text>
              </view>
              <view class="tags">
                <text class="tag level">Lv {{ account.total }}</text>
                <text :class="['tag', 'status-tag', account.status ? 'online' : 'offline']">
                  {{ account.status ? t('equipmentSales.online') : t('equipmentSales.offline') }}
                </text>
              </view>
            </view>
            <view
              v-if="account.id !== defaultSteamId"
              class="set-default-btn"
              @click="setDefaultAccount(account.id)"
            >
              <text class="set-default-text">{{ t('equipmentSales.setDefault') }}</text>
            </view>
          </view>

          <!-- 统计数据 -->
          <view class="card-stats">
            <view class="stat-item">
              <text class="stat-icon">📦</text>
              <text class="stat-label">{{ t('equipmentSales.inventory') }}</text>
              <text class="stat-value">{{ account.total }}</text>
            </view>
            <view class="stat-item">
              <text class="stat-icon">🏷️</text>
              <text class="stat-label">{{ t('equipmentSales.unsold') }}</text>
              <text class="stat-value">{{ account.unsaled }}</text>
            </view>
          </view>

          <!-- 操作按钮 -->
          <view class="card-actions">
            <view
              class="action-btn initialize"
              @click="handleInitialize(account.id)"
            >
              <text class="btn-icon"></text>
              <text class="btn-text">{{ t('equipmentSales.initialize') }}</text>
            </view>

            <!-- BUFF 按钮：灰色=未登录，红色=已登录 -->
            <view
              :class="['action-btn', 'buff', isBuffAuthed(account.id) ? 'authed' : 'unauthed']"
              @click="handlePlatformLogin(account.id, 'buff')"
            >
              <text class="btn-icon">🔗</text>
              <text class="btn-text">{{ t('equipmentSales.neteaseBuff') }}</text>
            </view>

            <!-- 悠悠有品按钮：灰色=未登录，蓝色=已登录 -->
            <view
              :class="['action-btn', 'youyou', isYyypAuthed(account.id) ? 'authed' : 'unauthed']"
              @click="handlePlatformLogin(account.id, 'yyyp')"
            >
              <text class="btn-icon">🔗</text>
              <text class="btn-text">{{ t('equipmentSales.youyouYoupin') }}</text>
            </view>
          </view>

          <!-- Steam 离线提示：点击跳转认证 -->
          <view
            v-if="!account.status"
            class="steam-offline-tip"
            @click="handleSteamAuth(account.id)"
          >
            <text class="offline-tip-text">🔒 {{ t('equipmentSales.steamOfflineTip') }}</text>
          </view>
        </view>

        <!-- 空状态 -->
        <u-empty
          v-if="!loading && steamAccounts.length === 0"
          :text="t('equipmentSales.noAccounts')"
        ></u-empty>
      </view>

      <!-- tabBar 占位 -->
      <view style="height: 120rpx;"></view>
    </scroll-view>
  </view>

  <!-- 自定义 tabBar -->
  <EquipmentTabbar :current="1"></EquipmentTabbar>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'
import { getListApi } from '@/api/modules/equipment-sales/list.service'
import type { SteamAccount } from '@/api/modules/equipment-sales/interface/listModel'
import type { PlatformType } from '@/types/platform-auth'
import EquipmentTabbar from '@/components/equipment-tabbar/EquipmentTabbar.vue'
import { useEquipmentSalesStore } from '@/store/equipment-sales'
import { useAppStore } from '@/store/app'

const { t } = useI18n()
const appStore = useAppStore()
const equipmentSalesStore = useEquipmentSalesStore()

// 加载状态
const loading = ref(true)
const refreshing = ref(false)

// Steam 账号列表
const steamAccounts = ref<SteamAccount[]>([])

// 默认账号
const defaultSteamId = computed(() => equipmentSalesStore.defaultSteamId)

// 统计信息
const stats = computed(() => ({
  total: steamAccounts.value.length,
  online: steamAccounts.value.filter(a => a.status).length
}))

/**
 * 判断 BUFF 是否已认证（通过 store 中的 getPlatformAuth 判断）
 */
function isBuffAuthed(steamId: string): boolean {
  return equipmentSalesStore.isPlatformAuthenticated(steamId, 'buff')
}

/**
 * 判断悠悠有品是否已认证
 */
function isYyypAuthed(steamId: string): boolean {
  return equipmentSalesStore.isPlatformAuthenticated(steamId, 'yyyp')
}

/**
 * 设置默认 Steam 账号
 */
function setDefaultAccount(steamId: string): void {
  equipmentSalesStore.setDefaultSteamId(steamId)
}

/**
 * 处理平台登录按钮点击
 */
function handlePlatformLogin(steamId: string, platform: PlatformType): void {
  if (platform === 'yyyp') {
    uni.navigateTo({ url: `/pages/platform-login/yyyp/index?steamId=${steamId}&platform=${platform}` })
  } else if (platform === 'buff') {
    uni.navigateTo({ url: `/pages/platform-login/buff/index?steamId=${steamId}&platform=${platform}` })
  }
}

/**
 * 点击头像或离线提示跳转 Steam 认证页
 */
function handleSteamAuth(steamId: string): void {
  uni.navigateTo({ url: `/pages/platform-login/steam/index?steamId=${steamId}` })
}

/**
 * 处理初始化按钮点击
 */
function handleInitialize(steamId: string): void {
  uni.navigateTo({ url: `/pages/tabs/equipment-sales/account/initialize/index?steamId=${steamId}` })
}

/**
 * 加载账号列表
 */
async function loadData(): Promise<void> {
  try {
    loading.value = true
    const res = await getListApi({ page: 1, pageSize: 100 })
    steamAccounts.value = res.list || []
  } finally {
    loading.value = false
  }
}

/**
 * 下拉刷新
 */
async function onRefresh(): Promise<void> {
  refreshing.value = true
  await loadData()
  refreshing.value = false
}

onLoad(() => {
  loadData()
})

// 每次显示页面时重新加载账号列表，确保从 Steam 登录页返回时数据最新
onShow(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.equipment-sales-account {
  min-height: 100vh;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.scroll-container {
  flex: 1;
  height: 100vh;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 200rpx 0;
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
  }
}

/* 账号列表 */
.account-list {
  padding: 30rpx;
  margin-top: -30rpx;

  .account-card {
    background-color: #ffffff;
    border-radius: 20rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);

    /* 卡片头部 */
    .card-header {
      display: flex;
      align-items: center;
      margin-bottom: 24rpx;

      .avatar-wrapper {
        position: relative;
        margin-right: 20rpx;

        .avatar {
          width: 96rpx;
          height: 96rpx;
          border-radius: 50%;
        }

        /* 状态圆点 */
        .status-dot {
          position: absolute;
          bottom: 4rpx;
          right: 4rpx;
          width: 24rpx;
          height: 24rpx;
          border-radius: 50%;
          border: 3rpx solid #ffffff;

          &.online { background-color: #10B981; }
          &.offline { background-color: #9CA3AF; }
        }
      }

      .account-info {
        flex: 1;

        .name-row {
          display: flex;
          align-items: center;
          gap: 12rpx;
          margin-bottom: 8rpx;
        }

        .account-name {
          font-size: 32rpx;
          font-weight: 600;
          color: #1F2937;
        }

        .default-badge {
          font-size: 20rpx;
          font-weight: 600;
          color: #ffffff;
          background-color: #7C3AED;
          padding: 2rpx 10rpx;
          border-radius: 8rpx;
        }

        .tags {
          display: flex;
          gap: 12rpx;

          .tag {
            font-size: 22rpx;
            padding: 4rpx 12rpx;
            border-radius: 8rpx;

            &.level {
              background-color: #DBEAFE;
              color: #1E40AF;
            }

            &.status-tag {
              &.online {
                background-color: #D1FAE5;
                color: #065F46;
              }
              &.offline {
                background-color: #F3F4F6;
                color: #6B7280;
              }
            }
          }
        }
      }

      .more-icon {
        font-size: 40rpx;
        color: #9CA3AF;
        padding: 0 10rpx;
      }

      .set-default-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8rpx 16rpx;
        border-radius: 12rpx;
        background-color: #F3E8FF;
        
        .set-default-text {
          font-size: 24rpx;
          color: #7C3AED;
          font-weight: 500;
        }
      }
    }

    /* 统计数据 */
    .card-stats {
      display: flex;
      gap: 40rpx;
      margin-bottom: 24rpx;
      padding: 20rpx 0;
      border-top: 1rpx solid #F3F4F6;
      border-bottom: 1rpx solid #F3F4F6;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 12rpx;

        .stat-icon { font-size: 32rpx; }
        .stat-label { font-size: 24rpx; color: #6B7280; }
        .stat-value { font-size: 32rpx; font-weight: 700; color: #1F2937; }
      }
    }

    /* 操作按钮 */
    .card-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 16rpx;

      .action-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8rpx;
        padding: 20rpx;
        border-radius: 12rpx;
        font-size: 26rpx;

        /* 未认证：灰色 */
        &.unauthed {
          background-color: #F3F4F6;
          color: #9CA3AF;
        }

        /* BUFF 已认证：红色 */
        &.buff.authed {
          background-color: #FEE2E2;
          color: #DC2626;
        }

        /* 悠悠有品已认证：蓝色 */
        &.youyou.authed {
          background-color: #DBEAFE;
          color: #2563EB;
        }

        &.set-default {
          background-color: #F3E8FF;
          color: #7C3AED;
        }

        &.initialize {
          background-color: #FEF3C7;
          color: #D97706;
        }

        .btn-icon { font-size: 28rpx; }
        .btn-text { font-weight: 500; }
      }
    }

    /* Steam 离线提示条 */
    .steam-offline-tip {
      margin-top: 20rpx;
      padding: 16rpx 20rpx;
      background-color: #FEF3C7;
      border-radius: 12rpx;
      border-left: 4rpx solid #F59E0B;

      .offline-tip-text {
        font-size: 24rpx;
        color: #92400E;
      }
    }
  }
}
</style>
