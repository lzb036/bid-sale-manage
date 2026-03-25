/**
 * 我的结算 响应数据
 * 接口路径: /api/mgr/gtm/seller/settle/list2.do
 */

/**
 * 结算记录项
 */
export interface SettleRecord {
  /** 结算 ID */
  id: string
  /** 结算金额（单位：分） */
  amount: number
  /** 是否已确认 */
  confirmed: boolean
  /** 标志位 */
  flag: boolean
  /** 备注人 */
  remarker: string | null
  /** 结算时间 */
  settleTime: string
  /** 累计结算金额 */
  settleTotal: number | null
}

/**
 * 分页信息
 */
export interface Pager {
  /** 当前页 */
  current: number
  /** 总页数 */
  pages: number
  /** 每页数量 */
  rp: number
  /** 总记录数 */
  total: number
}

/**
 * 结算列表响应数据
 */
export interface SettleModel {
  /** 结算记录列表 */
  list: SettleRecord[]
  /** 分页信息 */
  pager: Pager
}
