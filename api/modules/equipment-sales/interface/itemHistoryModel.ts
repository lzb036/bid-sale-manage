/**
 * 饰品出售历史 响应数据（datas 字段内容）
 * 接口路径: /api/mgr/gtm/seller/items/history2.do
 */

/**
 * 出售历史记录条目
 */
export interface ItemHistoryRecord {
  /** 磨损值 */
  abrade: number
  flag: boolean
  /** 记录 ID */
  id: string
  /** 出售平台 */
  market: string
  /** 平台名称 */
  marketName: string
  /** 出售时间 */
  marketTime: string
  /** 净价 */
  netPrice: number
  /** 出售价格 */
  price: number
}

/**
 * 分页信息
 */
export interface ItemHistoryPager {
  current: number
  pages: number
  rp: number
  total: number
}

/**
 * 饰品出售历史响应数据
 */
export interface ItemHistoryModel {
  list: ItemHistoryRecord[]
  pager: ItemHistoryPager
}
