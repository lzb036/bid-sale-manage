/**
 * 我的库存 响应数据（datas 字段内容）
 * 接口路径: /api/mgr/gtm/seller/inventory/list2.do
 */

/**
 * 市场信息
 */
export interface InventoryMarket {
  /** 标识 */
  flag: boolean
  /** 商品ID */
  goodsId: string
  /** ID */
  id: string
  /** 市场类型 (c5/buff/yyyp) */
  market: string
}

/**
 * 库存物品信息
 */
export interface InventoryItem {
  /** 应用ID (730=CS:GO) */
  appId: number
  /** 基础价值 */
  baseValue: number
  /** 冷却时间（秒） */
  cooldown?: number
  /** 数量 */
  count: string
  /** 总数量 */
  countAll: string
  /** 标识 */
  flag: boolean
  /** 游戏类型 */
  game: string
  /** ID */
  id: string
  /** 图片URL */
  imageUrl: string
  /** 是否感兴趣 */
  inerested: boolean
  /** 市场类型 */
  market: string
  /** 市场哈希名称 */
  marketHashName: string
  /** 市场列表 */
  markets: InventoryMarket[]
  /** 名称 */
  name: string
  /** 短名称 */
  shortName: string
}

/**
 * 分页信息
 */
export interface InventoryPager {
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
 * 我的库存响应数据
 */
export interface InventoryModel {
  /** 库存物品列表 */
  list: InventoryItem[]
  /** 分页信息 */
  pager: InventoryPager
}
