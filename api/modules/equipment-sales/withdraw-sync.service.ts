/**
 * 提现记录上传接口
 * 接口路径: /api/mgr/gtm/seller/crawle/submitwithdraw2.do
 */

import request from '@/api/index'
import type { SubmitWithdrawRequest } from './interface/withdrawSyncRequest'

/**
 * 提交提现记录至后端
 * @param params 请求参数，包含提现记录列表和 steamId
 */
export const submitWithdrawApi = (params: SubmitWithdrawRequest) => {
  return request.post<void>('/api/mgr/gtm/seller/crawle/submitwithdraw2.do', params)
}
