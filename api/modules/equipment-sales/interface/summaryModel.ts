/**
 * 账户汇总 响应数据（datas 字段内容）
 * 接口路径: /api/mgr/gtm/seller/summary2.do
 */
export interface SummaryModel {
  /** 折扣总额 */
  discountTotal: number
  /** 提现手续费总额 */
  drawFeeTotal: number
  /** 已提现总额 */
  drawTotal: number
  /** 已提现手续费总额 */
  drawnFeeTotal: number
  /** 应付总额 */
  duesTotal: number
  /** 标识 */
  flag: boolean
  /** ID */
  id: string
  /** 收入总额 */
  incomeTotal: number
  /** 物品价值总额 */
  itemValTotal: number
  /** 已支付总额 */
  paidTotal: number
  /** 利润总额 */
  profitTotal: number
  /** 额度限制 */
  quotaLimit: number
  /** 销售信息（可能为空） */
  sale: any | null
  /** 交易总额 */
  tradeTotal: number
  /** 未提现总额 */
  undrawnTotal: number
  /** 未支付总额 */
  unpaidTotal: number
  /** 提现信息 */
  withdraw: {
    /** 提现次数 */
    count: number
    /** 提现总额（可能为空） */
    total: number | null
  }
  /** 提现总额 */
  withdrawTotal: number
}
