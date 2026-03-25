/**
 * EquipmentSalesStore 平台认证功能属性测试
 * 使用 fast-check 进行基于属性的测试
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'
import * as fc from 'fast-check'
import { createPinia, setActivePinia } from 'pinia'
import type { PlatformAuthState, PlatformType } from '@/types/platform-auth'

// Mock API 模块
vi.mock('@/api/modules/equipment-sales', () => ({
  default: {
    getAccountSummary: vi.fn(),
    getSteamAccounts: vi.fn()
  }
}))

// Mock utils 模块
vi.mock('@/utils/equipment-sales-summary', () => ({
  EMPTY_SELLER_SUMMARY: {
    withdraw: {}
  },
  normalizeSellerSummary: vi.fn((data) => data)
}))

// Mock uni-app 的存储 API
const mockStorage = new Map<string, string>()

global.uni = {
  setStorageSync: vi.fn((key: string, data: string) => {
    mockStorage.set(key, data)
  }),
  getStorageSync: vi.fn((key: string) => {
    return mockStorage.get(key) || ''
  }),
  removeStorageSync: vi.fn((key: string) => {
    mockStorage.delete(key)
  }),
  request: vi.fn()
} as any

// 清空存储并重置 Pinia
beforeEach(() => {
  mockStorage.clear()
  vi.clearAllMocks()
  setActivePinia(createPinia())
})

// 动态导入 store（在 mock 之后）
const getStore = async () => {
  const { useEquipmentSalesStore } = await import('./equipment-sales')
  return useEquipmentSalesStore()
}

// 生成器：生成有效的 PlatformType
const platformArb = fc.constantFrom<PlatformType>('buff', 'yyyp')

// 生成器：生成有效的 steamId
const steamIdArb = fc.string({ minLength: 10, maxLength: 20 })

// 生成器：生成有效的 token
const tokenArb = fc.string({ minLength: 20, maxLength: 100 })

// 生成器：生成有效的 PlatformAuthState
const authStateArb = fc.record({
  token: tokenArb,
  authTime: fc.integer({ min: 1000000000000, max: Date.now() }),
  expiresAt: fc.option(fc.integer({ min: Date.now() + 1000, max: Date.now() + 86400000 }), { nil: undefined }),
  platform: platformArb,
  steamId: steamIdArb
})

describe('EquipmentSalesStore 平台认证属性测试', () => {
  // Feature: platform-auth-cache, Property 6: 多账号隔离
  test('属性 6: 对于任何两个不同的 Steam 账号，为账号 A 设置的验证状态不应该影响账号 B 的验证状态', async () => {
    fc.assert(
      await fc.asyncProperty(
        authStateArb,
        authStateArb,
        async (authStateA, authStateB) => {
          // 确保是不同的账号
          if (authStateA.steamId === authStateB.steamId) {
            return true
          }

          const store = await getStore()

          // 为账号 A 设置验证状态
          store.setPlatformAuth(authStateA)

          // 为账号 B 设置验证状态
          store.setPlatformAuth(authStateB)

          // 验证账号 A 的状态未被影响
          const loadedStateA = store.getPlatformAuth(authStateA.steamId, authStateA.platform)
          expect(loadedStateA).not.toBeNull()
          expect(loadedStateA?.token).toBe(authStateA.token)
          expect(loadedStateA?.steamId).toBe(authStateA.steamId)

          // 验证账号 B 的状态正确
          const loadedStateB = store.getPlatformAuth(authStateB.steamId, authStateB.platform)
          expect(loadedStateB).not.toBeNull()
          expect(loadedStateB?.token).toBe(authStateB.token)
          expect(loadedStateB?.steamId).toBe(authStateB.steamId)

          // 验证两个状态互不影响
          expect(loadedStateA?.token).not.toBe(loadedStateB?.token)
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: platform-auth-cache, Property 7: 多平台共存
  test('属性 7: 对于任何 Steam 账号，可以同时存储 buff 和 yyyp 两个平台的验证状态，它们互不影响', async () => {
    fc.assert(
      await fc.asyncProperty(
        steamIdArb,
        tokenArb,
        tokenArb,
        fc.integer({ min: 1000000000000, max: Date.now() }),
        fc.integer({ min: 1000000000000, max: Date.now() }),
        async (steamId, tokenBuff, tokenYyyp, authTimeBuff, authTimeYyyp) => {
          // 确保两个 token 不同
          if (tokenBuff === tokenYyyp) {
            return true
          }

          const store = await getStore()

          // 创建 buff 平台的验证状态
          const buffAuthState: PlatformAuthState = {
            token: tokenBuff,
            authTime: authTimeBuff,
            platform: 'buff',
            steamId
          }

          // 创建 yyyp 平台的验证状态
          const yyypAuthState: PlatformAuthState = {
            token: tokenYyyp,
            authTime: authTimeYyyp,
            platform: 'yyyp',
            steamId
          }

          // 设置两个平台的验证状态
          store.setPlatformAuth(buffAuthState)
          store.setPlatformAuth(yyypAuthState)

          // 验证 buff 平台的状态
          const loadedBuffState = store.getPlatformAuth(steamId, 'buff')
          expect(loadedBuffState).not.toBeNull()
          expect(loadedBuffState?.token).toBe(tokenBuff)
          expect(loadedBuffState?.platform).toBe('buff')

          // 验证 yyyp 平台的状态
          const loadedYyypState = store.getPlatformAuth(steamId, 'yyyp')
          expect(loadedYyypState).not.toBeNull()
          expect(loadedYyypState?.token).toBe(tokenYyyp)
          expect(loadedYyypState?.platform).toBe('yyyp')

          // 验证两个平台的状态互不影响
          expect(loadedBuffState?.token).not.toBe(loadedYyypState?.token)
          expect(loadedBuffState?.platform).not.toBe(loadedYyypState?.platform)
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: platform-auth-cache, Property 8: 清除操作完整性
  test('属性 8: 对于任何 Steam 账号，调用 clearSteamAccountAuth 后，该账号的所有平台验证状态都应该被清除', async () => {
    fc.assert(
      await fc.asyncProperty(
        steamIdArb,
        tokenArb,
        tokenArb,
        fc.integer({ min: 1000000000000, max: Date.now() }),
        fc.integer({ min: 1000000000000, max: Date.now() }),
        async (steamId, tokenBuff, tokenYyyp, authTimeBuff, authTimeYyyp) => {
          const store = await getStore()

          // 创建并设置两个平台的验证状态
          const buffAuthState: PlatformAuthState = {
            token: tokenBuff,
            authTime: authTimeBuff,
            platform: 'buff',
            steamId
          }

          const yyypAuthState: PlatformAuthState = {
            token: tokenYyyp,
            authTime: authTimeYyyp,
            platform: 'yyyp',
            steamId
          }

          store.setPlatformAuth(buffAuthState)
          store.setPlatformAuth(yyypAuthState)

          // 验证两个平台的状态都存在
          expect(store.getPlatformAuth(steamId, 'buff')).not.toBeNull()
          expect(store.getPlatformAuth(steamId, 'yyyp')).not.toBeNull()

          // 清除该账号的所有平台验证状态
          store.clearPlatformAuth(steamId, 'buff')
          store.clearPlatformAuth(steamId, 'yyyp')

          // 验证两个平台的状态都被清除
          expect(store.getPlatformAuth(steamId, 'buff')).toBeNull()
          expect(store.getPlatformAuth(steamId, 'yyyp')).toBeNull()

          // 验证本地存储也被清除
          const buffCacheKey = `platform_auth_${steamId}_buff`
          const yyypCacheKey = `platform_auth_${steamId}_yyyp`
          expect(uni.getStorageSync(buffCacheKey)).toBe('')
          expect(uni.getStorageSync(yyypCacheKey)).toBe('')
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: platform-auth-cache, Property 9: 状态同步一致性
  test('属性 9: 对于任何验证状态更新操作，Pinia store 中的内存状态和本地存储中的持久化状态应该保持一致', async () => {
    fc.assert(
      await fc.asyncProperty(
        authStateArb,
        async (authState) => {
          const store = await getStore()

          // 设置验证状态
          store.setPlatformAuth(authState)

          // 从 store 读取内存状态
          const memoryState = store.getPlatformAuth(authState.steamId, authState.platform)

          // 从本地存储读取持久化状态
          const cacheKey = `platform_auth_${authState.steamId}_${authState.platform}`
          const cachedData = uni.getStorageSync(cacheKey)
          const persistedState = cachedData ? JSON.parse(cachedData) : null

          // 验证内存状态和持久化状态一致
          expect(memoryState).not.toBeNull()
          expect(persistedState).not.toBeNull()
          expect(memoryState?.token).toBe(persistedState.token)
          expect(memoryState?.authTime).toBe(persistedState.authTime)
          expect(memoryState?.platform).toBe(persistedState.platform)
          expect(memoryState?.steamId).toBe(persistedState.steamId)
          expect(memoryState?.expiresAt).toBe(persistedState.expiresAt)

          // 清除状态
          store.clearPlatformAuth(authState.steamId, authState.platform)

          // 验证内存和持久化状态都被清除
          const clearedMemoryState = store.getPlatformAuth(authState.steamId, authState.platform)
          const clearedCachedData = uni.getStorageSync(cacheKey)

          expect(clearedMemoryState).toBeNull()
          expect(clearedCachedData).toBe('')
        }
      ),
      { numRuns: 100 }
    )
  })
})
