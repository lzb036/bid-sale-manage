/**
 * 账户汇总相关接口
 */

import request from '@/api/index'
import type { SummaryRequest } from './interface/summaryRequest'
import type { SummaryModel } from './interface/summaryModel'

/**
 * 获取账户汇总数据
 * @param params 请求参数
 * @returns 汇总数据响应
 */
export const getSummaryApi = (params: SummaryRequest = {}) => {
  return request.post<SummaryModel>('/api/mgr/gtm/seller/summary2.do', params)
}
