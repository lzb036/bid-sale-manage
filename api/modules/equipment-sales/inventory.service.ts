/**
 * 我的库存相关接口
 */

import request from '@/api/index'
import type { InventoryRequest } from './interface/inventoryRequest'
import type { InventoryModel } from './interface/inventoryModel'

/**
 * 获取我的库存列表
 * @param params 请求参数
 * @returns 库存列表响应
 */
export const getInventoryApi = (params: InventoryRequest = {}) => {
  return request.post<InventoryModel>('/api/mgr/gtm/seller/inventory/list2.do', params)
}
