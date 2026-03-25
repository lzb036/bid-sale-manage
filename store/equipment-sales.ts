/**
 * 游戏装备销售数据状态管理
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import equipmentSalesAPI from '@/api/modules/equipment-sales'
import type { SummaryModel } from '@/api/modules/equipment-sales/interface/summaryModel'
import type { SteamAccount } from '@/api/modules/equipment-sales/interface/listModel'
import { EMPTY_SELLER_SUMMARY, normalizeSellerSummary } from '@/utils/equipment-sales-summary'
import { PlatformAuthCache } from '@/utils/platform-auth-cache'
import type { PlatformAuthState, PlatformType } from '@/types/platform-auth'

export const useEquipmentSalesStore = defineStore('equipmentSales', () => {
  // 状态
  const summary = ref<SummaryModel>({
    ...EMPTY_SELLER_SUMMARY,
    withdraw: { ...EMPTY_SELLER_SUMMARY.withdraw }
  })
  
  const steamAccounts = ref<SteamAccount[]>([])
  const defaultSteamId = ref<string>((() => {
    try {
      return uni.getStorageSync('equipment_sales_default_steam_id') || ''
    } catch {
      return ''
    }
  })())
  const pendingCount = ref(0)
  const loading = computed(() => pendingCount.value > 0)

  // 平台验证状态（内存缓存）
  const platformAuthStates = ref<Map<string, PlatformAuthState>>(new Map())

  async function runWithLoading<T>(requester: () => Promise<T>): Promise<T> {
    pendingCount.value += 1
    try {
      return await requester()
    } finally {
      pendingCount.value = Math.max(0, pendingCount.value - 1)
    }
  }

  // Actions
  async function fetchSummary(): Promise<SummaryModel> {
    return runWithLoading(async () => {
      try {
        const data = await equipmentSalesAPI.getAccountSummary()
        const normalizedSummary = normalizeSellerSummary(data)
        summary.value = normalizedSummary
        return normalizedSummary
      } catch (error) {
        console.error('获取汇总数据失败:', error)
        throw error
      }
    }) 
  }

  async function fetchSteamAccounts(): Promise<SteamAccount[]> {
    return runWithLoading(async () => {
      try {
        const data = await equipmentSalesAPI.getSteamAccounts()
		console.log(data)
        steamAccounts.value = data
        return data
      } catch (error) {
        console.error('获取Steam账号列表失败:', error)
        throw error
      }
    })
  }

  async function fetchOverviewSummary(): Promise<SummaryModel> {
    return fetchSummary()
  }

  async function refreshData(): Promise<void> {
    await Promise.all([
      fetchSummary(),
      fetchSteamAccounts()
    ])
  }

  /**
   * 设置默认 Steam 账号
   * @param steamId Steam 账号 ID
   */
  function setDefaultSteamId(steamId: string): void {
    defaultSteamId.value = steamId
    try {
      uni.setStorageSync('equipment_sales_default_steam_id', steamId)
    } catch {
      // 存储写入失败，静默处理
    }
  }

  /**
   * 设置平台验证状态
   * @param authState 验证状态
   */
  function setPlatformAuth(authState: PlatformAuthState): void {
    const key = `${authState.steamId}_${authState.platform}`
    platformAuthStates.value.set(key, authState)
    PlatformAuthCache.saveAuthState(authState)
  }

  /**
   * 获取平台验证状态
   * @param steamId Steam 账号 ID
   * @param platform 平台类型
   * @returns 验证状态，如果不存在则返回 null
   */
  function getPlatformAuth(steamId: string, platform: PlatformType): PlatformAuthState | null {
    const key = `${steamId}_${platform}`
    
    // 先从内存读取
    let authState = platformAuthStates.value.get(key)
    
    // 如果内存中不存在，从本地存储加载
    if (!authState) {
      authState = PlatformAuthCache.loadAuthState(steamId, platform)
      if (authState) {
        platformAuthStates.value.set(key, authState)
      }
    }
    return authState || null
  }

  /**
   * 清除平台验证状态
   * @param steamId Steam 账号 ID
   * @param platform 平台类型
   */
  function clearPlatformAuth(steamId: string, platform: PlatformType): void {
    const key = `${steamId}_${platform}`
    platformAuthStates.value.delete(key)
    PlatformAuthCache.removeAuthState(steamId, platform)
  }

  /**
   * 清除所有平台验证状态
   */
  function clearAllPlatformAuth(): void {
    // 清除内存中的所有状态
    const keys = Array.from(platformAuthStates.value.keys())
    keys.forEach(key => {
      const [steamId, platform] = key.split('_')
      PlatformAuthCache.removeAuthState(steamId, platform as PlatformType)
    })
    platformAuthStates.value.clear()
  }

  /**
   * 检查平台是否已验证
   * @param steamId Steam 账号 ID
   * @param platform 平台类型
   * @returns 是否已验证
   */
  function isPlatformAuthenticated(steamId: string, platform: PlatformType): boolean {
    const authState = getPlatformAuth(steamId, platform)
    return authState !== null
  }

  return {
    summary,
    steamAccounts,
    defaultSteamId,
    setDefaultSteamId,
    loading,
    fetchSummary,
    fetchOverviewSummary,
    fetchSteamAccounts,
    refreshData,
    platformAuthStates,
    setPlatformAuth,
    getPlatformAuth,
    clearPlatformAuth,
    clearAllPlatformAuth,
    isPlatformAuthenticated
  }
})
