/**
 * 平台认证缓存管理工具
 * 提供平台验证状态的本地存储管理功能
 */

import type { PlatformAuthState, PlatformType } from '@/types/platform-auth'

/**
 * 缓存键类型
 * 格式: platform_auth_{steamId}_{platform}
 */
type CacheKey = string

/**
 * 平台认证缓存管理类
 * 使用 uni-app 本地存储实现验证状态的持久化
 */
export class PlatformAuthCache {
  /**
   * 生成缓存键
   * @param steamId Steam 账号 ID
   * @param platform 平台类型
   * @returns 缓存键，格式为 platform_auth_{steamId}_{platform}
   */
  static generateCacheKey(steamId: string, platform: PlatformType): CacheKey {
    return `platform_auth_${steamId}_${platform}`
  }

  /**
   * 保存验证状态到本地存储
   * @param authState 验证状态
   * @returns 是否保存成功
   */
  static saveAuthState(authState: PlatformAuthState): boolean {
    try {
      const cacheKey = this.generateCacheKey(authState.steamId, authState.platform)
      const cacheData = JSON.stringify(authState)
      uni.setStorageSync(cacheKey, cacheData)
      console.log(`[PlatformAuthCache] 保存验证状态成功: ${cacheKey}`)
      return true
    } catch (error) {
      console.error('[PlatformAuthCache] 保存验证状态失败:', error)
      return false
    }
  }

  /**
   * 从本地存储加载验证状态
   * @param steamId Steam 账号 ID
   * @param platform 平台类型
   * @returns 验证状态，如果不存在或已过期则返回 null
   */
  static loadAuthState(steamId: string, platform: PlatformType): PlatformAuthState | null {
    try {
      const cacheKey = this.generateCacheKey(steamId, platform)
      const cacheData = uni.getStorageSync(cacheKey)
      
      if (!cacheData) {
        return null
      }

      const authState: PlatformAuthState = JSON.parse(cacheData)
      
      // 验证数据结构
      if (!this.isValidAuthState(authState)) {
        console.warn('[PlatformAuthCache] 缓存数据格式错误，清除缓存')
        this.removeAuthState(steamId, platform)
        return null
      }

      // 检查是否过期
      if (this.isTokenExpired(authState)) {
        console.log('[PlatformAuthCache] Token 已过期，清除缓存')
        this.removeAuthState(steamId, platform)
        return null
      }

      return authState
    } catch (error) {
      console.error('[PlatformAuthCache] 加载验证状态失败:', error)
      return null
    }
  }

  /**
   * 移除验证状态
   * @param steamId Steam 账号 ID
   * @param platform 平台类型
   */
  static removeAuthState(steamId: string, platform: PlatformType): void {
    try {
      const cacheKey = this.generateCacheKey(steamId, platform)
      uni.removeStorageSync(cacheKey)
      console.log(`[PlatformAuthCache] 移除验证状态: ${cacheKey}`)
    } catch (error) {
      console.error('[PlatformAuthCache] 移除验证状态失败:', error)
    }
  }

  /**
   * 清除指定 Steam 账号的所有平台验证状态
   * @param steamId Steam 账号 ID
   */
  static clearSteamAccountAuth(steamId: string): void {
    this.removeAuthState(steamId, 'buff')
    this.removeAuthState(steamId, 'yyyp')
  }

  /**
   * 检查 token 是否过期
   * @param authState 验证状态
   * @returns 是否过期
   */
  static isTokenExpired(authState: PlatformAuthState): boolean {
    if (!authState.expiresAt) {
      return false // 没有过期时间，认为永不过期
    }
    return Date.now() >= authState.expiresAt
  }

  /**
   * 验证验证状态数据结构
   * @param authState 验证状态
   * @returns 是否有效
   */
  private static isValidAuthState(authState: any): authState is PlatformAuthState {
    return (
      authState &&
      typeof authState.token === 'string' &&
      typeof authState.authTime === 'number' &&
      typeof authState.platform === 'string' &&
      typeof authState.steamId === 'string' &&
      (authState.platform === 'buff' || authState.platform === 'yyyp')
    )
  }
}
