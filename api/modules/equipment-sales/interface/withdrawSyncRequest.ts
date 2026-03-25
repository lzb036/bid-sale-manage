/**
 * 提现记录上传 请求参数类型定义
 * 接口路径: /api/mgr/gtm/seller/crawle/submitwithdraw2.do
 */

/**
 * 单条提现记录
 */
export interface WithdrawSyncItem {
  /** 提现金额（绝对值） */
  amount: number
  /** 提现时间，格式 yyyy-mm-dd hh:MM:ss */
  created: string
  /** 手续费 */
  fee: number
  /** 交易流水号 */
  id: string
  [key: string]: unknown
}

/**
 * 单个用户的提现数据条目
 */
export interface WithdrawSyncUserEntry {
  /** 用户信息 */
  user: {
    /** 平台标识 */
    market: string
    /** Steam ID */
    steamId: string
  }
  /** 提现记录列表 */
  items: WithdrawSyncItem[]
}

/**
 * 提现记录上传 请求参数
 * 接口路径: /api/mgr/gtm/seller/crawle/submitwithdraw2.do
 */
export interface SubmitWithdrawRequest {
  /** 用户提现数据列表 */
  list: WithdrawSyncUserEntry[]
  /** Steam ID */
  steamId: string
  [key: string]: unknown
}
