/**
 * HTTP 基础配置
 */

import { getCurrentBaseURL } from '@/utils/baseurl'
import type { HttpConfig } from './types'

export const config: HttpConfig = {
  // 基础 URL
  baseURL: 'http://g.etopmarket.com',

  // 请求超时时间（毫秒）
  timeout: 5000,

  // 请求头
  header: {
    'Content-Type': 'application/json'
  },

  // 是否自动添加 token
  autoToken: true
}

/**
 * 获取当前环境的基础 URL
 * @returns {string} baseURL
 */
export function getBaseURL(): string {
  // 从存储中动态获取当前配置的 baseURL
  return getCurrentBaseURL()
}
