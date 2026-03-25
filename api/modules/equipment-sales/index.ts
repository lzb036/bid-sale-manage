/**
 * 游戏饰品销售管理 API 模块
 * 统一导出所有 API 方法
 */

import type { SteamAccount } from './interface/listModel'
import type { SummaryModel } from './interface/summaryModel'
import { getInventoryApi } from './inventory.service'
import { getSettleApi } from './settle.service'
import { getWithdrawApi } from './withdraw.service'

export { getSummaryApi } from './summary.service'
export { getListApi } from './list.service'
export { getInventoryApi } from './inventory.service'
export { getSettleApi } from './settle.service'
export { getWithdrawApi } from './withdraw.service'
export { getItemsApi } from './items.service'
export { submitSaleBillApi } from './sync.service'

/**
 * 获取账户汇总数据
 * @param params 请求参数
 * @returns 汇总数据
 */
async function getAccountSummary(params = {}): Promise<SummaryModel> {
  const { getSummaryApi } = await import('./summary.service')
  const result = await getSummaryApi(params)
  return result as unknown as SummaryModel
}

/**
 * 获取 Steam 账号列表
 * @param params 请求参数
 * @returns Steam 账号列表
 */
async function getSteamAccounts(params = {}): Promise<SteamAccount[]> {
  const { getListApi } = await import('./list.service')
  const result = await getListApi(params)
  // 响应拦截器会自动提取 datas 字段，所以这里直接返回
  // 如果 API 返回的是 { list, pager } 结构，则提取 list
  if (result && typeof result === 'object' && 'list' in result) {
    return (result as any).list
  }
  return result as unknown as SteamAccount[]
}

// 默认导出所有 API 方法
export default {
  getAccountSummary,
  getSteamAccounts,
  getInventory: getInventoryApi,
  getSettle: getSettleApi,
  getWithdraw: getWithdrawApi
}
