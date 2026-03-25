<template>
  <view class="equipment-tabbar">
    <view
      v-for="(tab, index) in tabs"
      :key="index"
      :class="['tab-item', { active: currentIndex === index }]"
      @click="switchTab(index)"
    >
      <text class="tab-icon">{{ tab.icon }}</text>
      <text class="tab-label">{{ tab.label }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// 菜单配置：概览 → 账号 → 记录 → 提现 → 库存
const tabs = [
  { label: '概览', icon: '📊', path: '/pages/tabs/equipment-sales/overview/index' },
  { label: '账号', icon: '👤', path: '/pages/tabs/equipment-sales/account/index' },
  { label: '记录', icon: '📝', path: '/pages/tabs/equipment-sales/records/index' },
  { label: '提现', icon: '💰', path: '/pages/tabs/equipment-sales/withdrawal/index' },
  { label: '库存', icon: '📦', path: '/pages/tabs/equipment-sales/inventory/index' }
]

const props = defineProps<{
  /** 当前激活的菜单索引 */
  current: number
}>()

const currentIndex = computed(() => props.current)

/**
 * 切换 tab
 */
function switchTab(index: number) {
  if (index === currentIndex.value) return
  uni.switchTab({
    url: tabs[index].path,
    fail: () => {
      // switchTab 失败时使用 reLaunch（非 tabBar 页面）
      uni.reLaunch({ url: tabs[index].path })
    }
  })
}
</script>

<style scoped lang="scss">
.equipment-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  border-top: 1rpx solid #E5E7EB;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 999;

  .tab-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4rpx;
    padding: 10rpx 0;

    .tab-icon {
      font-size: 40rpx;
      line-height: 1;
    }

    .tab-label {
      font-size: 20rpx;
      color: #9CA3AF;
    }

    &.active {
      .tab-label {
        color: #007aff;
        font-weight: 600;
      }
    }
  }
}
</style>
