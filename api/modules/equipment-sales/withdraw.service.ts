/**
 * 我的提现相关接口
 */

import request from '@/api/index'
import type { WithdrawRequest } from './interface/withdrawRequest'
import type { WithdrawModel } from './interface/withdrawModel'

/**
 * 获取我的提现列表
 * @param params 请求参数
 * @returns 提现列表响应
 */
export const getWithdrawApi = (params: WithdrawRequest = {}) => {
  return request.post<WithdrawModel>('/api/mgr/gtm/seller/withdraw/list2.do', params)
}
