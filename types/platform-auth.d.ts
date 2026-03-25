/**
 * 平台验证状态类型定义
 */

/**
 * 平台类型
 */
export type PlatformType = 'buff' | 'yyyp'

/**
 * 平台验证状态
 */
export interface PlatformAuthState {
  /** 访问令牌 */
  token: string
  /** 验证时间戳（毫秒） */
  authTime: number
  /** 过期时间戳（毫秒），可选 */
  expiresAt?: number
  /** 平台类型 */
  platform: PlatformType
  /** Steam 账号 ID */
  steamId: string
}

/**
 * 平台验证响应（从 API 获取）
 */
export interface PlatformAuthResponse {
  /** 访问令牌 */
  token: string
  /** 过期时间（秒），可选 */
  expiresIn?: number
}

/**
 * WebView 登录页面参数
 */
export interface PlatformLoginParams {
  /** Steam 账号 ID */
  steamId: string
  /** 平台类型 */
  platform: PlatformType
}
