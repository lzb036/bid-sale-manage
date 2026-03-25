/**
 * 饰品出售上传相关接口
 * 接口路径: /api/mgr/gtm/seller/crawle/submitsalebill2.do
 */

import request from '@/api/index'
import type { SubmitSaleBillRequest } from './interface/syncRequest'

/**
 * 提交饰品出售数据至后端
 * @param params 请求参数，包含出售记录列表和 steamId
 */
export const submitSaleBillApi = (params: SubmitSaleBillRequest) => {
  return request.post<void>('/api/mgr/gtm/seller/crawle/submitsalebill2.do', params)
}
