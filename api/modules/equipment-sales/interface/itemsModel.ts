/**
 * 饰品记录 响应数据（datas 字段内容）
 * 接口路径: /api/mgr/gtm/seller/items/list2.do
 */

/**
 * 市场平台信息
 */
export interface ItemMarket {
  flag: boolean
  goodsId: string
  id: string
  market: string
}

/**
 * 饰品定义信息
 */
export interface ItemDefine {
  /** App ID (730 = CS:GO) */
  appId: number
  /** 基础价值 */
  baseValue: number
  flag: boolean
  /** 游戏类型 (csgo 等) */
  game: string
  id: string
  /** 图片地址 */
  imageUrl: string
  inerested: boolean
  /** 主要市场 */
  market: string
  /** Steam 市场哈希名称 */
  marketHashName: string
  /** 各平台市场信息 */
  markets: ItemMarket[]
  /** 饰品名称 */
  name: string
  /** 饰品短名称 */
  shortName: string
}

/**
 * 代理人信息
 */
export interface Agentor {
  flag: boolean
  id: string
  mobile: string
  name: string
  quotaLeft: number
  status: boolean
}

/**
 * Steam 账号信息
 */
export interface ItemSteam {
  agentor: Agentor
  flag: boolean
  id: string
  name: string
  nickname: string
  status: boolean
}

/**
 * 饰品记录条目
 */
export interface EquipmentItem {
  /** 磨损值 */
  abrade: number | null
  /** 是否已确认 */
  confirmed: boolean
  /** 折扣 */
  discount: number
  flag: boolean
  /** 记录 ID */
  id: string
  /** 饰品定义 */
  itemDefine: ItemDefine
  /** 上架市场 */
  market: string | null
  /** 市场名称 */
  marketName: string | null
  /** 上架时间 */
  marketTime: string | null
  /** 净价格 */
  netPrice: number
  /** 价格 */
  price: number
  /** 入库时间 */
  receiveTime: string
  /** 发送时间 */
  sentTime: string
  /** Steam 账号信息 */
  steam: ItemSteam
  /** Steam ID */
  steamId: string
  /** 可交易时间 */
  tradableTime: string
}

/**
 * 分页信息
 */
export interface ItemsPager {
  current: number
  pages: number
  rp: number
  total: number
}

/**
 * 饰品记录响应数据
 */
export interface ItemsModel {
  /** 饰品列表 */
  list: EquipmentItem[]
  /** 分页信息 */
  pager: ItemsPager
}
