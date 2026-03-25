/**
 * 价格比较相关接口请求参数类型定义
 */

/**
 * BUFF 买家挂单（在售比价）请求参数
 * 接口：GET https://buff.163.com/api/market/goods/buy_order
 */
export interface BuffBuyOrderRequest {
  /** 商品 ID */
  goods_id: string
  /** 页码 */
  page_num: number
  /** 每页数量 */
  page_size: number
  /** 游戏类型 */
  game: string
  /** 应用 ID */
  appid: number
  /** 是否只返回最高价 */
  max_price_only?: string
  [key: string]: unknown
}

/**
 * BUFF 卖家挂单（求购比价）请求参数
 * 接口：GET https://buff.163.com/api/market/goods/sell_order
 */
export interface BuffSellOrderRequest {
  /** 游戏类型 */
  game: string
  /** 商品 ID */
  goods_id: string
  /** 页码 */
  page_num: number
  /** 每页数量 */
  page_size: number
  /** 排序方式 */
  sort_by: string
  /** 模式 */
  mode: string
  /** 是否允许交易冷却 */
  allow_tradable_cooldown: number
  [key: string]: unknown
}

/**
 * YYYP 在售/出售记录列表请求参数
 * 接口：POST https://api.youpin898.com/api/youpin/bff/trade/sale/v1/sell/list
 */
export interface YyypSellListRequest {
  /** 搜索关键词 */
  keys: string
  /** 订单状态（340=已完成，不传则查询在售） */
  orderStatus?: string
  /** 页码 */
  pageIndex: number
  /** 每页数量 */
  pageSize: number
  /** JWT token，用于构建 Authorization header（不放入请求 body） */
  token: string
  /** 会话 ID（固定 deviceId，放入请求 body） */
  Sessionid: string
  [key: string]: unknown
}

/**
 * YYYP 求购订单列表请求参数
 * 接口：POST https://api.youpin898.com/api/youpin/bff/trade/purchase/order/getTemplatePurchaseOrderList
 */
export interface YyypPurchaseOrderRequest {
  /** 页码 */
  pageIndex: number
  /** 每页数量 */
  pageSize: number
  /** 模板 ID（对应 YYYP 商品 ID） */
  templateId: string
  /** JWT token，用于构建 Authorization header（不放入请求 body） */
  token: string
  /** 会话 ID（固定 deviceId，放入请求 body） */
  Sessionid: string
  [key: string]: unknown
}

/**
 * YYYP 市场在售比价请求参数
 * 接口：POST https://api.youpin898.com/api/homepage/v3/detail/commodity/list/sell
 */
export interface YyypMarketSellRequest {
  /** 自动发货 */
  autoDelivery: number
  /** 筛选条件 */
  conditions: unknown[]
  /** 是否包含已售 */
  hasSold: string
  /** 补涨类型 */
  haveBuZhangType: number
  /** 完整性过滤 */
  integritySellFilter: number
  /** 是否弹窗市场 */
  isDialogMarket: boolean
  /** 是否多区域 */
  isMultipleZone: number
  /** 列表排序类型 */
  listSortType: string
  /** 列表类型 */
  listType: number
  /** 合并标志 */
  mergeFlag: number
  /** 页码 */
  pageIndex: number
  /** 每页数量 */
  pageSize: number
  /** 页面来源代码 */
  pageSourceCode: string
  /** 预售多区域 */
  presaleMoreZones: number
  /** 排序类型 */
  sortType: string
  /** 排序类型键 */
  sortTypeKey: string
  /** 来源渠道 */
  sourceChannel: string
  /** 状态（20=在售） */
  status: string
  /** 贴纸磨损 */
  stickerAbrade: number
  /** 贴纸是否排序 */
  stickersIsSort: boolean
  /** 商品模板 ID */
  templateId: string
  /** 超长租赁多区域 */
  ultraLongLeaseMoreZones: number
  /** 用户 ID */
  userId: string
  /** 会话 ID */
  Sessionid: string
  [key: string]: unknown
}
