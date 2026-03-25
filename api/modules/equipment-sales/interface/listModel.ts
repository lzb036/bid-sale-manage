/**
 * Steam 账号列表 响应数据（datas 字段内容）
 * 接口路径: /api/mgr/gtm/seller/list2.do
 */

/**
 * 市场账号信息
 */
export interface MarketAccount {
  /** 折扣总额 */
  discountTotal: number
  /** 提现手续费总额 */
  drawFeeTotal: number
  /** 已提现手续费总额 */
  drawnFeeTotal: number
  /** 标识 */
  flag: boolean
  /** ID */
  id: string
  /** 收入总额 */
  incomeTotal: number
  /** 市场类型 (buff/yyyp) */
  market: string
  /** 市场名称 */
  marketName: string
  /** 市场昵称 */
  marketNickname: string
  /** 名称 */
  name: string
  /** 交易总额 */
  tradeTotal: number
  /** 类型 */
  type: string
  /** 用户代码 */
  userCode: string | null
  /** 提现总额 */
  withdrawTotal: number
}

/**
 * Steam 账号信息
 */
export interface SteamAccount {
  /** 关联的市场账号列表 */
  accounts: MarketAccount[]
  /** 头像 URL */
  avatar: string
  /** 冷却时间 */
  cooldown: number
  /** 创建时间 */
  createTime: string
  /** 标识 */
  flag: boolean
  /** 是否有访问密钥 */
  hasAccessKey: boolean
  /** 是否有交易链接 */
  hasTradeUrl: boolean
  /** Steam ID */
  id: string
  /** 最后获取时间 */
  lastFetchTime: string
  /** 最后交易时间（时间戳） */
  lastTradeTime: string
  /** 本月数量 */
  month: number
  /** 本月金额 */
  monthAmount: number
  /** 名称 */
  name: string
  /** 昵称 */
  nickname: string
  /** 状态 */
  status: boolean
  /** 今日数量 */
  today: number
  /** 今日金额 */
  todayAmount: number
  /** 总数 */
  total: number
  /** 未确认数量 */
  unconfirmed: number | null
  /** 未售出数量 */
  unsaled: number
  /** 本周数量 */
  week: number
  /** 本周金额 */
  weekAmount: number
  /** 本年数量 */
  year: number
  /** 本年金额 */
  yearAmount: number
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
 * Steam 账号列表响应数据
 */
export interface ListModel {
  /** Steam 账号列表 */
  list: SteamAccount[]
  /** 分页信息 */
  pager: Pager
}
