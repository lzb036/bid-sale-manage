import request from '@/api/index'
import type { SettleRequest } from './interface/settleRequest'
import type { SettleModel } from './interface/settleModel'

/**
 * 获取结算记录列表
 * @param params 请求参数
 * @returns 结算记录响应
 */
export const getSettleApi = (params: SettleRequest) => {
  return request.post<SettleModel>('/api/mgr/gtm/seller/settle/list2.do', params)
}
