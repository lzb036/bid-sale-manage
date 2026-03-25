/**
 * 饰品出售历史 请求参数
 * 接口路径: /api/mgr/gtm/seller/items/history2.do
 */
export interface ItemHistoryRequest {
  /** 饰品定义 ID */
  itemDefineId: string
  /** 查询天数 */
  days: number

  /** 索引签名，允许动态属性 */
  [key: string]: unknown
}
