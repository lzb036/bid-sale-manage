/**
 * Steam 账号列表相关接口
 */

import request from '@/api/index'
import type { ListRequest } from './interface/listRequest'
import type { ListModel } from './interface/listModel'

/**
 * 获取 Steam 账号列表
 * @param params 请求参数
 * @returns Steam 账号列表响应
 */
export const getListApi = (params: ListRequest = {}) => {
  return request.post<ListModel>('/api/mgr/gtm/seller/list2.do', params)
}
