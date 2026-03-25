/**
 * 我的提现 响应数据（datas 字段内容）
 * 接口路径: /api/mgr/gtm/seller/withdraw/list2.do
 */

/**
 * 提现记录信息
 */
export interface WithdrawRecord {
  /** 提现金额 */
  amount: number
  /** 手续费 */
  fee: number
  /** 标识 */
  flag: boolean
  /** ID */
  id: string
  /** 市场类型 (buff/yyyp) */
  market: string
  /** 提现时间 */
  withdrawTime: string
  /** 累计提现总额 */
  withdrawTotal: number
}

/**
 * 分页信息
 */
export interface WithdrawPager {
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
 * 我的提现响应数据
 */
export interface WithdrawModel {
  /** 提现记录列表 */
  list: WithdrawRecord[]
  /** 分页信息 */
  pager: WithdrawPager
}
