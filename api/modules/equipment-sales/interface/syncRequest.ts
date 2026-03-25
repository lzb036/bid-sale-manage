/**
 * 饰品出售上传 请求参数类型定义
 * 接口路径: /api/mgr/gtm/seller/crawle/submitsalebill2.do
 */

/**
 * 单条出售记录
 */
export interface SyncSaleItem {
  /** 游戏 App ID，如 "730" 表示 CS2 */
  appId: string
  /** 商品 ID */
  goodsId: string
  /** 更新时间（秒级时间戳） */
  updated_at: string | number
  /** 创建时间（秒级时间戳） */
  created_at: string | number
  /** 出售价格（分） */
  price: string
  /** 手续费（分） */
  fee: string
  /** 实际到账（分） */
  income: string
  /** 磨损值 */
  abrade: number
  /** Steam Asset ID */
  assetId: string
  /** 订单号 */
  orderNo: string
  /** 商品 Hash 名称 */
  mhn?: string
  /** 商品名称 */
  name?: string
  /** 允许动态属性 */
  [key: string]: unknown
}

/**
 * 单个用户的出售数据条目
 */
export interface SyncUserEntry {
  /** 用户信息 */
  user: {
    /** 平台标识，如 "buff" 或 "yyyp" */
    market: string
    /** Steam ID */
    steamId: string
  }
  /** 出售记录列表 */
  items: SyncSaleItem[]
}

/**
 * 饰品出售上传 请求参数
 * 接口路径: /api/mgr/gtm/seller/crawle/submitsalebill2.do
 */
export interface SubmitSaleBillRequest {
  /** 用户出售数据列表 */
  list: SyncUserEntry[]
  /** Steam ID */
  steamId: string
  /** 允许动态属性 */
  [key: string]: unknown
}
