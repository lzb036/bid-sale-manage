/**
 * 响应拦截器
 */

import type { Response, ResponseData } from './types'

/**
 * 响应拦截器
 * @param {Object} response 响应对象
 * @returns {Object} 处理后的响应数据
 */
export function responseInterceptor<T = ResponseData>(response: Response<T>): unknown {
  const { statusCode, data } = response

  // HTTP 状态码判断
  if (statusCode >= 200 && statusCode < 300) {
    // 业务状态码判断（后端返回格式：{ code, datas, message }）
    if ((data as ResponseData).statusCode === 200) {
      // 兼容 data.datas 和 data.data 两种格式
      return (data as ResponseData).datas || data
    } else {
      // 业务错误
      handleBusinessError(data as ResponseData)
      return Promise.reject(data)
    }
  }

  // HTTP 错误处理
  handleHttpError(statusCode, data as ResponseData)
  return Promise.reject(data)
}

/**
 * 响应拦截器错误处理
 * @param {Error} error 错误对象
 */
export function responseInterceptorError(
  error: UniApp.GeneralCallbackResult  | UniApp.GeneralCallbackResult 
): Promise<never> {
  console.error('[响应错误]', error)

  const errorMessage = (error as { errMsg?: string }).errMsg

  if (errorMessage) {
    if (errorMessage.includes('timeout')) {
      uni.showToast({
        title: '请求超时，请检查网络',
        icon: 'none',
        duration: 2000
      })
    } else if (errorMessage.includes('fail')) {
      uni.showToast({
        title: '网络连接失败',
        icon: 'none',
        duration: 2000
      })
    }
  }

  return Promise.reject(error)
}

/**
 * 处理业务错误
 * @param {Object} data 响应数据
 */
function handleBusinessError(data: ResponseData): void {
  const errorMap: Record<number | string, string> = {
    401: '登录已过期，请重新登录',
    403: '没有权限访问',
    404: '请求的资源不存在',
    500: '服务器错误'
  }

  // token 过期，跳转登录
  if (data.code === 401 || data.code === 1001) {
    uni.removeStorageSync('token')
    uni.removeStorageSync('userInfo')

    // 跳转登录页
    uni.reLaunch({
      url: '/pages/login/index'
    })
    return
  }

  const message = data.message || errorMap[data.code] || '请求失败'
  uni.showToast({
    title: message,
    icon: 'none',
    duration: 2000
  })
}

/**
 * 处理 HTTP 错误
 * @param {number} statusCode HTTP 状态码
 * @param {Object} data 响应数据
 */
function handleHttpError(statusCode: number, data: ResponseData): void {
  const errorMap: Record<number, string> = {
    400: '请求参数错误',
    401: '未授权，请登录',
    403: '拒绝访问',
    404: '请求资源不存在',
    405: '请求方法不允许',
    408: '请求超时',
    500: '服务器内部错误',
    502: '网关错误',
    503: '服务不可用',
    504: '网关超时'
  }

  const message = data?.message || errorMap[statusCode] || `请求失败(${statusCode})`

  uni.showToast({
    title: message,
    icon: 'none',
    duration: 2000
  })
}
