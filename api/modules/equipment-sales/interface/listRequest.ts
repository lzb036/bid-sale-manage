/**
 * Steam 账号列表 请求参数
 * 接口路径: /api/mgr/gtm/seller/list2.do
 */
export interface ListRequest {
  /** 页码 */
  page?: number
  /** 每页数量 */
  pageSize?: number
  
  /** 索引签名，允许动态属性 */
  [key: string]: unknown
}
