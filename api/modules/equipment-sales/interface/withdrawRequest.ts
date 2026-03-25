/**
 * 我的提现 请求参数
 * 接口路径: /api/mgr/gtm/seller/withdraw/list2.do
 */
export interface WithdrawRequest {
  /** 页码 */
  page?: number
  /** 每页数量 */
  pageSize?: number
  
  /** 索引签名，允许动态属性 */
  [key: string]: unknown
}
