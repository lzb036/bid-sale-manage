/**
 * 我的结算 请求参数
 * 接口路径: /api/mgr/gtm/seller/settle/list2.do
 */
export interface SettleRequest {
  page?: number
  pageSize?: number
  
  /** 索引签名，允许动态属性 */
  [key: string]: unknown
}
