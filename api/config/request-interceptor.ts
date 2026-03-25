/**
 * 请求拦截器
 */

import { getToken } from './auth'
import type { RequestConfig } from './types'

/**
 * 请求拦截器
 * @param {Object} config 请求配置
 * @returns {Object} 处理后的配置
 */
export function requestInterceptor(config: RequestConfig): RequestConfig {
  // 添加 token
  const token = getToken()
  if (token && config.autoToken !== false) {
    config.header = config.header || {}
    config.header.Authorization = `Bearer ${token}`
  }

  // 添加设备信息
  // #ifdef APP-PLUS
  config.header = config.header || {}
  config.header['X-Device-Type'] = 'app'
  // #endif
  // #ifdef MP-WEIXIN
  config.header = config.header || {}
  config.header['X-Device-Type'] = 'mp-weixin'
  // #endif
  // #ifdef H5
  config.header = config.header || {}
  config.header['X-Device-Type'] = 'h5'
  // #endif

  // 添加时间戳（防止缓存）
  if (config.method === 'GET') {
    config.params = config.params || {}
    config.params['_t'] = Date.now()
  }

  console.log(`[请求] ${config.method} ${config.url}`, config.data || config.params)
  return config
}

/**
 * 请求拦截器错误处理
 * @param {Error} error 错误对象
 */
export function requestInterceptorError(error: Error): Promise<never> {
  console.error('[请求错误]', error)
  return Promise.reject(error)
}
