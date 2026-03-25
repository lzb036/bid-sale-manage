/**
 * 平台净价计算工具函数
 * 净价 = 出售价扣除平台手续费和提现费后的实际到手金额
 */

/**
 * 计算 BUFF 净价
 * 公式：出售价 × 0.975 × 0.995 + 出售价 × 0.001
 * - 0.975：扣除 2.5% 平台手续费
 * - 0.995：扣除 0.5% 提现手续费
 * - 0.001：加上 0.1% 的补贴（实际为正向调整）
 * @param price 出售价格
 * @returns 净价
 */
export function calcBuffNetPrice(price: number): number {
  return price * 0.975 * 0.995 + price * 0.001
}

/**
 * 计算 YYYP（悠悠有品）净价（按无会员计算）
 * 公式：出售价 × 0.99 × 0.99
 * - 第一个 0.99：扣除 1% 出售服务费（2025-03-31 11:00 起正式收取）
 * - 第二个 0.99：扣除 1% 提现手续费
 * @param price 出售价格
 * @returns 净价
 */
export function calcYyypNetPrice(price: number): number {
  return price * 0.99 * 0.99
}

/**
 * 统一净价计算入口
 * @param price 出售价格
 * @param platform 平台类型
 * @returns 净价
 */
export function calcNetPrice(price: number, platform: 'buff' | 'yyyp'): number {
  return platform === 'buff' ? calcBuffNetPrice(price) : calcYyypNetPrice(price)
}

/**
 * 计算价格行列表中净价最高的行索引
 * 两个净价相等时取第一个
 * @param netPrices 净价数组（null 表示未获取到价格）
 * @returns 净价最高的行索引，如果全为 null 则返回 -1
 */
export function getHighestNetPriceIndex(netPrices: (number | null)[]): number {
  let maxIndex = -1
  let maxPrice = -Infinity
  for (let i = 0; i < netPrices.length; i++) {
    const p = netPrices[i]
    if (p !== null && p > maxPrice) {
      maxPrice = p
      maxIndex = i
    }
  }
  return maxIndex
}
