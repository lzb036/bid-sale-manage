import type { SummaryModel } from '@/api/modules/equipment-sales/interface/summaryModel'

export const EMPTY_SELLER_SUMMARY: SummaryModel = {
  incomeTotal: 0,
  profitTotal: 0,
  duesTotal: 0,
  paidTotal: 0,
  unpaidTotal: 0,
  withdrawTotal: 0,
  drawTotal: 0,
  undrawnTotal: 0,
  tradeTotal: 0,
  quotaLimit: 0,
  itemValTotal: 0,
  discountTotal: 0,
  drawFeeTotal: 0,
  drawnFeeTotal: 0,
  flag: false,
  id: '',
  sale: null,
  withdraw: {
    count: 0,
    total: 0
  }
}

function toFiniteNumber(value: unknown): number {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function toRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {}
}

export function normalizeSellerSummary(input: unknown): SummaryModel {
  const data = toRecord(input)
  const withdrawData = toRecord(data.withdraw)

  const hasNewContract = Object.prototype.hasOwnProperty.call(data, 'incomeTotal')

  if (hasNewContract) {
    return {
      incomeTotal: toFiniteNumber(data.incomeTotal),
      profitTotal: toFiniteNumber(data.profitTotal),
      duesTotal: toFiniteNumber(data.duesTotal),
      paidTotal: toFiniteNumber(data.paidTotal),
      unpaidTotal: toFiniteNumber(data.unpaidTotal),
      withdrawTotal: toFiniteNumber(data.withdrawTotal),
      drawTotal: toFiniteNumber(data.drawTotal),
      undrawnTotal: toFiniteNumber(data.undrawnTotal),
      tradeTotal: toFiniteNumber(data.tradeTotal),
      quotaLimit: toFiniteNumber(data.quotaLimit),
      itemValTotal: toFiniteNumber(data.itemValTotal),
      discountTotal: toFiniteNumber(data.discountTotal),
      drawFeeTotal: toFiniteNumber(data.drawFeeTotal),
      drawnFeeTotal: toFiniteNumber(data.drawnFeeTotal),
      withdraw: {
        count: toFiniteNumber(withdrawData.count),
        total: toFiniteNumber(withdrawData.total)
      }
    }
  }

  return {
    incomeTotal: toFiniteNumber(data.totalSales),
    profitTotal: 0,
    duesTotal: 0,
    paidTotal: 0,
    unpaidTotal: 0,
    withdrawTotal: toFiniteNumber(data.totalWithdrawal),
    drawTotal: 0,
    undrawnTotal: 0,
    tradeTotal: toFiniteNumber(data.totalTransactions),
    quotaLimit: 0,
    itemValTotal: 0,
    discountTotal: 0,
    drawFeeTotal: 0,
    drawnFeeTotal: 0,
    withdraw: {
      count: 0,
      total: 0
    }
  }
}
