/**
 * 我的库存 请求参数
 * 接口路径: /api/mgr/gtm/seller/inventory/list2.do
 */
export interface InventoryRequest {
  /** 页码 */
  page?: number
  /** 每页数量 */
  pageSize?: number
  /** 类型 (mystock: 我的库存) */
  type?: string
  
  /** 索引签名，允许动态属性 */
  [key: string]: unknown
}
