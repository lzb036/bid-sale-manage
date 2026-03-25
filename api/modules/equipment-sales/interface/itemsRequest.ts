/**
 * 饰品记录 请求参数
 * 接口路径: /api/mgr/gtm/seller/items/list2.do
 */
export interface ItemsRequest {
  /** 页码 */
  page?: number
  /** 每页数量 */
  pageSize?: number
  /** 状态筛选 */
  status?: boolean
  /** 确认状态 */
  confirmed?: string

  /** 索引签名，允许动态属性 */
  [key: string]: unknown
}
