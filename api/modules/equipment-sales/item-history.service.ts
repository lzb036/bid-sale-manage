/**
 * 饰品出售历史相关接口
 */

import request from '@/api/index'
import type { ItemHistoryRequest } from './interface/itemHistoryRequest'
import type { ItemHistoryModel } from './interface/itemHistoryModel'

/**
 * 获取饰品出售历史记录
 * Authorization header 由请求拦截器自动注入（Bearer token）
 * @param params 请求参数
 * @returns 出售历史响应数据
 */
export const getItemHistoryApi = (params: ItemHistoryRequest) => {
  return request.post<ItemHistoryModel>('/api/mgr/gtm/seller/items/history2.do', params as Record<string, unknown>)
}
