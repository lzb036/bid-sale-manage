/**
 * 价格比较相关接口响应数据类型定义
 */

/**
 * BUFF 订单条目
 */
export interface BuffOrderItem {
  /** 价格字符串，如 "123.45" */
  price: string
  /** 订单 ID */
  id: string
  /** 用户信息 */
  user_id?: string
  /** 商品数量 */
  num?: number
}

/**
 * BUFF 买家挂单响应（在售比价）
 * 接口：GET https://buff.163.com/api/market/goods/buy_order
 */
export interface BuffBuyOrderModel {
  /** 状态码，0 为成功 */
  code: number
  data: {
    /** 订单列表 */
    items: BuffOrderItem[]
    /** 总数量 */
    total_count: number
  }
}

/**
 * BUFF 卖家挂单响应（求购比价）
 * 接口：GET https://buff.163.com/api/market/goods/sell_order
 */
export interface BuffSellOrderModel {
  /** 状态码，0 为成功 */
  code: number
  data: {
    /** 订单列表 */
    items: BuffOrderItem[]
    /** 总数量 */
    total_count: number
  }
}

/**
 * YYYP 出售记录条目
 */
export interface YyypSellItem {
  /** 出售价格 */
  price: number
  /** 订单号 */
  orderNo: string
  /** 创建时间（ISO 格式） */
  createdAt: string
  /** 饰品名称 */
  itemName: string
  /** 订单状态 */
  orderStatus?: string | number
}

/**
 * YYYP 出售列表响应
 * 接口：POST https://api.youpin898.com/api/youpin/bff/trade/sale/v1/sell/list
 */
export interface YyypSellListModel {
  /** 状态码 */
  Code: number
  /** 消息 */
  Msg: string
  /** 数据列表 */
  Data: YyypSellItem[]
}

/**
 * YYYP 求购订单条目
 */
export interface YyypPurchaseItem {
  /** 求购价格 */
  price: number
  /** 订单 ID */
  orderId: string
  /** 商品名称 */
  itemName?: string
}

/**
 * YYYP 求购订单列表响应
 * 接口：POST https://api.youpin898.com/api/youpin/bff/trade/purchase/order/getTemplatePurchaseOrderList
 */
export interface YyypPurchaseOrderModel {
  /** 状态码 */
  Code: number
  /** 消息 */
  Msg: string
  /** 数据列表 */
  Data: YyypPurchaseItem[]
}

/**
 * YYYP 市场在售商品条目
 */
export interface YyypMarketSellItem {
  /** 出售价格（分） */
  price: number
  /** 商品 ID */
  commodityId?: string
  /** 商品名称 */
  name?: string
  /** 卖家 ID */
  userId?: string
}

/**
 * YYYP 市场在售比价响应
 * 接口：POST https://api.youpin898.com/api/homepage/v3/detail/commodity/list/sell
 */
export interface YyypMarketSellModel {
  /** 状态码 */
  Code: number
  /** 消息 */
  Msg: string
  /** 数据 */
  Data: {
    /** 商品列表 */
    commodityList: YyypMarketSellItem[]
    /** 总数量 */
    total?: number
  }
}
