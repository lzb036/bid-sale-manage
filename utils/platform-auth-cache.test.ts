/**
 * PlatformAuthCache 属性测试
 * 使用 fast-check 进行基于属性的测试
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'
import * as fc from 'fast-check'
import { PlatformAuthCache } from './platform-auth-cache'
import type { PlatformAuthState, PlatformType } from '@/types/platform-auth'

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
  })
} as any

// 清空存储
beforeEach(() => {
  mockStorage.clear()
  vi.clearAllMocks()
})

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

describe('PlatformAuthCache 属性测试', () => {
  // Feature: platform-auth-cache, Property 1: 缓存写入一致性
  test('属性 1: 对于任何有效的 PlatformAuthState，保存后读取应返回等价对象', () => {
    fc.assert(
      fc.property(authStateArb, (authState) => {
        // 保存验证状态
        const saveResult = PlatformAuthCache.saveAuthState(authState)
        expect(saveResult).toBe(true)

        // 读取验证状态
        const loadedState = PlatformAuthCache.loadAuthState(authState.steamId, authState.platform)

        // 验证数据一致性
        expect(loadedState).not.toBeNull()
        expect(loadedState?.token).toBe(authState.token)
        expect(loadedState?.authTime).toBe(authState.authTime)
        expect(loadedState?.platform).toBe(authState.platform)
        expect(loadedState?.steamId).toBe(authState.steamId)
        expect(loadedState?.expiresAt).toBe(authState.expiresAt)
      }),
      { numRuns: 100 }
    )
  })

  // Feature: platform-auth-cache, Property 2: 缓存键唯一性
  test('属性 2: 对于任何两组不同的 (steamId, platform) 组合，生成的缓存键应该不同', () => {
    fc.assert(
      fc.property(
        steamIdArb,
        platformArb,
        steamIdArb,
        platformArb,
        (steamId1, platform1, steamId2, platform2) => {
          // 只测试不同的组合
          if (steamId1 === steamId2 && platform1 === platform2) {
            return true
          }

          const key1 = PlatformAuthCache.generateCacheKey(steamId1, platform1)
          const key2 = PlatformAuthCache.generateCacheKey(steamId2, platform2)

          // 验证缓存键不同
          expect(key1).not.toBe(key2)
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: platform-auth-cache, Property 3: 缓存键格式正确性
  test('属性 3: 对于任何 steamId 和 platform，生成的缓存键应该匹配格式 platform_auth_{steamId}_{platform}', () => {
    fc.assert(
      fc.property(steamIdArb, platformArb, (steamId, platform) => {
        const cacheKey = PlatformAuthCache.generateCacheKey(steamId, platform)
        const expectedKey = `platform_auth_${steamId}_${platform}`

        // 验证缓存键格式
        expect(cacheKey).toBe(expectedKey)
        expect(cacheKey).toMatch(/^platform_auth_.+_(buff|yyyp)$/)
      }),
      { numRuns: 100 }
    )
  })

  // Feature: platform-auth-cache, Property 4: 过期 Token 自动清除
  test('属性 4: 对于任何已过期的 PlatformAuthState，调用 loadAuthState 应该返回 null 并清除该缓存', () => {
    fc.assert(
      fc.property(
        tokenArb,
        fc.integer({ min: 1000000000000, max: Date.now() - 1000 }),
        fc.integer({ min: 1000000000000, max: Date.now() - 1 }),
        platformArb,
        steamIdArb,
        (token, authTime, expiresAt, platform, steamId) => {
          // 创建已过期的验证状态
          const expiredAuthState: PlatformAuthState = {
            token,
            authTime,
            expiresAt, // 过期时间在当前时间之前
            platform,
            steamId
          }

          // 保存过期的验证状态
          PlatformAuthCache.saveAuthState(expiredAuthState)

          // 尝试加载，应该返回 null
          const loadedState = PlatformAuthCache.loadAuthState(steamId, platform)
          expect(loadedState).toBeNull()

          // 验证缓存已被清除
          const cacheKey = PlatformAuthCache.generateCacheKey(steamId, platform)
          const cachedData = uni.getStorageSync(cacheKey)
          expect(cachedData).toBe('')
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: platform-auth-cache, Property 5: 无效数据格式处理
  test('属性 5: 对于任何格式错误的缓存数据，调用 loadAuthState 应该返回 null 并清除该缓存', () => {
    fc.assert(
      fc.property(steamIdArb, platformArb, fc.anything(), (steamId, platform, invalidData) => {
        const cacheKey = PlatformAuthCache.generateCacheKey(steamId, platform)

        // 存储无效数据（不是有效的 PlatformAuthState JSON）
        try {
          const invalidJson = JSON.stringify(invalidData)
          uni.setStorageSync(cacheKey, invalidJson)
        } catch {
          // 如果无法序列化，直接存储字符串
          uni.setStorageSync(cacheKey, String(invalidData))
        }

        // 尝试加载，应该返回 null
        const loadedState = PlatformAuthCache.loadAuthState(steamId, platform)
        expect(loadedState).toBeNull()

        // 验证缓存已被清除
        const cachedData = uni.getStorageSync(cacheKey)
        expect(cachedData).toBe('')
      }),
      { numRuns: 100 }
    )
  })
})
