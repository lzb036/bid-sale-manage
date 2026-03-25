/**
 * 饰品记录相关接口
 */

import request from '@/api/index'
import type { ItemsRequest } from './interface/itemsRequest'
import type { ItemsModel } from './interface/itemsModel'

/**
 * 获取饰品记录列表
 * @param params 请求参数
 * @returns 饰品记录列表响应
 */
export const getItemsApi = (params: ItemsRequest = {}) => {
  return request.post<ItemsModel>('/api/mgr/gtm/seller/items/list2.do', params)
}