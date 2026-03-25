<template>
  <view class="detail-page">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <view class="nav-back" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="nav-title">饰品详情</text>
    </view>

    <!-- 错误状态 -->
    <view v-if="!itemData || dataLoadError" class="error-state">
      <text class="error-text">无法加载饰品数据</text>
      <button class="error-button" @click="goBack">返回</button>
    </view>

    <!-- 饰品内容 -->
    <view v-else class="detail-content">
      <view class="item-info-card">
        <!-- 游戏标识 -->
        <text class="game-tag">CS:GO</text>

        <!-- 饰品名称 -->
        <text class="item-name">{{ itemData.shortName || itemData.name }}</text>

        <!-- 参考价格 -->
        <view class="price-section">
          <text class="price-label">参考价格</text>
          <text class="price-value">¥{{ formatAmount(itemData.baseValue) }}</text>
        </view>

        <!-- 标签页 -->
        <view class="tabs-section">
          <view
            v-for="(tab, index) in tabs"
            :key="index"
            :class="['tab-item', { active: activeTab === index }]"
            @click="switchTab(index)"
          >
            <text>{{ tab }}</text>
          </view>
        </view>

        <!-- Tab 0: 在售比价 -->
        <view v-if="activeTab === 0" class="price-table">
          <view class="table-header">
            <text class="col-platform">平台</text>
            <text class="col-price">平台价</text>
            <text class="col-net-price">净价</text>
          </view>
          <view class="table-body">
            <view
              v-for="(row, index) in sellPriceRows"
              :key="`${row.platform}-${row.index}`"
              :class="['table-row', { 'row-highlighted': row.highlighted }]"
            >
              <view class="col-platform">
                <view :class="['platform-badge', `platform-badge--${row.platform}`]">
                  <text class="platform-badge-text">{{ row.platform === 'buff' ? 'B' : 'Y' }}</text>
                </view>
                <text class="platform-name">{{ row.platformName }}</text>
              </view>
              <view class="col-price">
                <text v-if="row.loading" class="text-loading">加载中...</text>
                <text v-else-if="row.error" class="text-error">获取失败</text>
                <text v-else-if="row.platformPrice === null" class="text-empty">暂无数据</text>
                <text v-else class="price-amount">¥{{ formatAmount(row.platformPrice) }}</text>
              </view>
              <view class="col-net-price">
                <text v-if="row.loading" class="text-loading">-</text>
                <text v-else-if="row.error || row.netPrice === null" class="text-empty">-</text>
                <view v-else class="net-price-wrapper">
                  <text :class="['net-price-text', { 'net-price-red': row.netPriceRed }]">
                    ¥{{ formatAmount(row.netPrice) }}
                  </text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- Tab 1: 求购比价 -->
        <view v-else-if="activeTab === 1" class="price-table">
          <view class="table-header">
            <text class="col-platform">平台</text>
            <text class="col-price">求购价</text>
            <text class="col-net-price">净价</text>
          </view>
          <view class="table-body">
            <view
              v-for="(row, index) in purchasePriceRows"
              :key="`${row.platform}-${row.index}`"
              :class="['table-row', { 'row-highlighted': row.highlighted }]"
            >
              <view class="col-platform">
                <view :class="['platform-badge', `platform-badge--${row.platform}`]">
                  <text class="platform-badge-text">{{ row.platform === 'buff' ? 'B' : 'Y' }}</text>
                </view>
                <text class="platform-name">{{ row.platformName }}</text>
              </view>
              <view class="col-price">
                <text v-if="row.loading" class="text-loading">加载中...</text>
                <text v-else-if="row.error" class="text-error">获取失败</text>
                <text v-else-if="row.platformPrice === null" class="text-empty">暂无数据</text>
                <text v-else class="price-amount">¥{{ formatAmount(row.platformPrice) }}</text>
              </view>
              <view class="col-net-price">
                <text v-if="row.loading" class="text-loading">-</text>
                <text v-else-if="row.error || row.netPrice === null" class="text-empty">-</text>
                <view v-else class="net-price-wrapper">
                  <text :class="['net-price-text', { 'net-price-red': row.netPriceRed }]">
                    ¥{{ formatAmount(row.netPrice) }}
                  </text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- Tab 2: 出售记录 -->
        <view v-else-if="activeTab === 2" class="sales-record-tab">
          <view v-if="salesLoading" class="tab-loading">
            <text class="text-loading">加载中...</text>
          </view>
          <view v-else-if="salesError" class="tab-error">
            <text class="text-error">获取失败，请重试</text>
          </view>
          <view v-else-if="salesRecords.length === 0" class="tab-empty">
            <u-empty text="暂无出售记录"></u-empty>
          </view>
          <view v-else class="chart-container">
            <!-- 点击数据点后显示的详情卡片 -->
            <view v-if="selectedRecord" class="chart-tooltip">
              <text class="chart-tooltip-date">{{ selectedRecord.marketTime }}</text>
              <text class="chart-tooltip-platform">{{ selectedRecord.marketName }}</text>
              <text class="chart-tooltip-price">¥{{ formatAmount(selectedRecord.price) }}</text>
            </view>
            <view v-else class="chart-hint">
              <text class="chart-hint-text">点击数据点查看详情</text>
            </view>
            <canvas
              canvas-id="salesChart"
              id="salesChart"
              class="sales-canvas"
              @touchstart="touchStart"
              @touchmove="touchMove"
              @touchend="touchEnd"
            ></canvas>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useEquipmentSalesStore } from '@/store/equipment-sales'
import type { InventoryItem } from '@/api/modules/equipment-sales/interface/inventoryModel'
import type { ItemHistoryRecord } from '@/api/modules/equipment-sales/interface/itemHistoryModel'
import {
  fetchBuffBuyOrderApi,
  fetchBuffSellOrderApi,
  fetchYyypMarketSellByWebview,
  fetchYyypPurchaseOrderByWebview
} from '@/api/modules/equipment-sales/price-compare.service'
import { getItemHistoryApi } from '@/api/modules/equipment-sales/item-history.service'
import { calcNetPrice, getHighestNetPriceIndex } from '@/utils/price-calculator'
// @ts-ignore — ucharts 无官方类型声明
import uCharts from '@qiun/ucharts/u-charts.js'

// ==================== 类型定义 ====================

/** 价格行数据结构 */
interface PriceRow {
  platform: 'buff' | 'yyyp'
  platformName: string
  /** 序号，同平台多条时显示（如 BUFF #1） */
  index: number
  platformPrice: number | null
  netPrice: number | null
  loading: boolean
  error: boolean
  netPriceRed: boolean
  highlighted: boolean
}

// ==================== 常量 ====================

// ==================== Store ====================

const equipmentSalesStore = useEquipmentSalesStore()

// ==================== 响应式数据 ====================

/** 标签页列表 */
const tabs = ['在售比价', '求购比价', '出售记录']

/** 当前激活的标签页 */
const activeTab = ref(0)

/** 饰品数据 */
const itemData = ref<InventoryItem | null>(null)

/** 数据加载错误标志 */
const dataLoadError = ref(false)

/** 已加载过的 Tab 集合（懒加载控制） */
const loadedTabs = ref<Set<number>>(new Set())

/** 在售比价行数据（动态，最多 BUFF×5 + YYYP×5 = 10 行） */
const sellPriceRows = ref<PriceRow[]>([
  { platform: 'buff', platformName: 'BUFF', index: 0, platformPrice: null, netPrice: null, loading: true, error: false, netPriceRed: false, highlighted: false },
  { platform: 'yyyp', platformName: '悠悠有品', index: 0, platformPrice: null, netPrice: null, loading: true, error: false, netPriceRed: false, highlighted: false }
])

/** 求购比价行数据（动态，最多 BUFF×5 + YYYP×5 = 10 行） */
const purchasePriceRows = ref<PriceRow[]>([
  { platform: 'buff', platformName: 'BUFF', index: 0, platformPrice: null, netPrice: null, loading: true, error: false, netPriceRed: false, highlighted: false },
  { platform: 'yyyp', platformName: '悠悠有品', index: 0, platformPrice: null, netPrice: null, loading: true, error: false, netPriceRed: false, highlighted: false }
])

/** 出售记录列表 */
const salesRecords = ref<ItemHistoryRecord[]>([])

/** 出售记录加载状态 */
const salesLoading = ref(false)

/** 出售记录错误状态 */
const salesError = ref(false)

/** 当前选中的出售记录（点击图表数据点时更新） */
const selectedRecord = ref<ItemHistoryRecord | null>(null)

// ==================== 图表实例 ====================

/** uCharts 实例，用于 touch 事件透传 */
let uChartsInstance: unknown = null

// ==================== 方法 ====================

/**
 * 获取 YYYP JWT token（用于 Authorization header）
 * 从 store 中读取当前默认账号的 YYYP 认证 token
 */
function getYyypToken(): string | null {
  const defaultSteamId = equipmentSalesStore.defaultSteamId
  if (!defaultSteamId) return null
  const auth = equipmentSalesStore.getPlatformAuth(defaultSteamId, 'yyyp')
  return auth?.token || null
}

/**
 * 从 itemData.markets 中提取指定平台的 goodsId
 * @param platform 平台类型
 */
function getPlatformGoodsId(platform: 'buff' | 'yyyp'): string | null {
  if (!itemData.value?.markets) return null
  const market = itemData.value.markets.find(m => m.market === platform)
  return market?.goodsId || null
}

/**
 * 根据平台和序号生成显示名称
 * 单条时直接显示平台名，多条时加序号（如 BUFF #1）
 */
function buildPlatformName(baseName: string, _index: number, _total: number): string {
  return baseName
}

/**
 * 按净价升序排序价格行（null 排最后）
 */
function sortByNetPrice(rows: PriceRow[]): PriceRow[] {
  return [...rows].sort((a, b) => {
    if (a.netPrice === null && b.netPrice === null) return 0
    if (a.netPrice === null) return 1
    if (b.netPrice === null) return -1
    return a.netPrice - b.netPrice
  })
}

/**
 * 更新价格行的高亮和红色标记状态
 * 净价颜色规则：低于参考价显示灰色，等于或高于参考价显示红色
 * 平台优势规则：取两个平台各自的最低净价，最低净价更高的那一行标蓝（只标一条）
 * @param rows 价格行数组
 */
function updateHighlightAndRedMark(rows: PriceRow[]): void {
  const baseValue = itemData.value?.baseValue ?? 0

  // 净价颜色：>= 参考价标红，< 参考价不标红（显示灰色）
  rows.forEach(row => {
    row.netPriceRed = row.netPrice !== null && row.netPrice >= baseValue
  })

  // 找到 BUFF 最低净价行和 YYYP 最低净价行
  let buffMinRow: PriceRow | null = null
  let yyyypMinRow: PriceRow | null = null

  rows.forEach(row => {
    if (row.netPrice === null) return
    if (row.platform === 'buff') {
      if (!buffMinRow || row.netPrice < buffMinRow.netPrice!) buffMinRow = row
    } else if (row.platform === 'yyyp') {
      if (!yyyypMinRow || row.netPrice < yyyypMinRow.netPrice!) yyyypMinRow = row
    }
  })

  // 先全部清除高亮
  rows.forEach(row => { row.highlighted = false })

  // 两个平台都有数据时，最低净价更高的那一行标蓝（只标一条）
  if (buffMinRow && yyyypMinRow) {
    const winnerRow = (buffMinRow.netPrice! >= yyyypMinRow.netPrice!) ? buffMinRow : yyyypMinRow
    winnerRow.highlighted = true
  }
}

/**
 * 加载在售比价数据
 * BUFF 和 YYYP 并行请求，全部完成后一起渲染
 */
async function loadSellPriceData(): Promise<void> {
  const buffGoodsId = getPlatformGoodsId('buff')
  const yyyypId = getPlatformGoodsId('yyyp')

  // 显示加载中占位行
  const initRows: PriceRow[] = []
  if (buffGoodsId) {
    initRows.push({ platform: 'buff', platformName: 'BUFF', index: 0, platformPrice: null, netPrice: null, loading: true, error: false, netPriceRed: false, highlighted: false })
  }
  if (yyyypId) {
    initRows.push({ platform: 'yyyp', platformName: '悠悠有品', index: 0, platformPrice: null, netPrice: null, loading: true, error: false, netPriceRed: false, highlighted: false })
  }
  sellPriceRows.value = initRows

  // 并行请求，等两个都完成后一起渲染
  const [buffResult, yyyypResult] = await Promise.allSettled([
    buffGoodsId ? fetchBuffSellOrderApi(buffGoodsId) : Promise.resolve(null),
    yyyypId ? fetchYyypMarketSellByWebview(yyyypId) : Promise.resolve(null)
  ])

  const buffRows: PriceRow[] = (() => {
    if (!buffGoodsId) return []
    if (buffResult.status === 'fulfilled' && buffResult.value) {
      const items = (buffResult.value as Awaited<ReturnType<typeof fetchBuffSellOrderApi>>)?.data?.items?.slice(0, 5) ?? []
      return items.length > 0
        ? items.map((item, i) => ({
            platform: 'buff' as const,
            platformName: buildPlatformName('BUFF', i, items.length),
            index: i,
            platformPrice: parseFloat(item.price),
            netPrice: calcNetPrice(parseFloat(item.price), 'buff'),
            loading: false, error: false, netPriceRed: false, highlighted: false
          }))
        : [{ platform: 'buff' as const, platformName: 'BUFF', index: 0, platformPrice: null, netPrice: null, loading: false, error: false, netPriceRed: false, highlighted: false }]
    }
    return [{ platform: 'buff' as const, platformName: 'BUFF', index: 0, platformPrice: null, netPrice: null, loading: false, error: true, netPriceRed: false, highlighted: false }]
  })()

  const yyyypRows: PriceRow[] = (() => {
    if (!yyyypId) return []
    if (yyyypResult.status === 'fulfilled' && yyyypResult.value) {
      const list = (yyyypResult.value as Awaited<ReturnType<typeof fetchYyypMarketSellByWebview>>)?.Data?.commodityList?.slice(0, 5) ?? []
      return list.length > 0
        ? list.map((item, i) => ({
            platform: 'yyyp' as const,
            platformName: buildPlatformName('悠悠有品', i, list.length),
            index: i,
            platformPrice: item.price / 100,
            netPrice: calcNetPrice(item.price / 100, 'yyyp'),
            loading: false, error: false, netPriceRed: false, highlighted: false
          }))
        : [{ platform: 'yyyp' as const, platformName: '悠悠有品', index: 0, platformPrice: null, netPrice: null, loading: false, error: false, netPriceRed: false, highlighted: false }]
    }
    return [{ platform: 'yyyp' as const, platformName: '悠悠有品', index: 0, platformPrice: null, netPrice: null, loading: false, error: true, netPriceRed: false, highlighted: false }]
  })()

  const merged = sortByNetPrice([...buffRows, ...yyyypRows])
  sellPriceRows.value = merged
  updateHighlightAndRedMark(sellPriceRows.value)
}

/**
 * 加载求购比价数据
 * BUFF 和 YYYP 并行请求，全部完成后一起渲染
 */
async function loadPurchasePriceData(): Promise<void> {
  const buffGoodsId = getPlatformGoodsId('buff')
  const yyyypId = getPlatformGoodsId('yyyp')

  // 显示加载中占位行
  const initRows: PriceRow[] = []
  if (buffGoodsId) {
    initRows.push({ platform: 'buff', platformName: 'BUFF', index: 0, platformPrice: null, netPrice: null, loading: true, error: false, netPriceRed: false, highlighted: false })
  }
  if (yyyypId) {
    initRows.push({ platform: 'yyyp', platformName: '悠悠有品', index: 0, platformPrice: null, netPrice: null, loading: true, error: false, netPriceRed: false, highlighted: false })
  }
  purchasePriceRows.value = initRows

  // 并行请求，等两个都完成后一起渲染
  const [buffResult, yyyypResult] = await Promise.allSettled([
    buffGoodsId ? fetchBuffBuyOrderApi(buffGoodsId) : Promise.resolve(null),
    yyyypId ? fetchYyypPurchaseOrderByWebview(yyyypId) : Promise.resolve(null)
  ])

  const buffRows: PriceRow[] = (() => {
    if (!buffGoodsId) return []
    if (buffResult.status === 'fulfilled' && buffResult.value) {
      const items = (buffResult.value as Awaited<ReturnType<typeof fetchBuffBuyOrderApi>>)?.data?.items?.slice(0, 5) ?? []
      return items.length > 0
        ? items.map((item, i) => ({
            platform: 'buff' as const,
            platformName: buildPlatformName('BUFF', i, items.length),
            index: i,
            platformPrice: parseFloat(item.price),
            netPrice: calcNetPrice(parseFloat(item.price), 'buff'),
            loading: false, error: false, netPriceRed: false, highlighted: false
          }))
        : [{ platform: 'buff' as const, platformName: 'BUFF', index: 0, platformPrice: null, netPrice: null, loading: false, error: false, netPriceRed: false, highlighted: false }]
    }
    return [{ platform: 'buff' as const, platformName: 'BUFF', index: 0, platformPrice: null, netPrice: null, loading: false, error: true, netPriceRed: false, highlighted: false }]
  })()

  const yyyypRows: PriceRow[] = (() => {
    if (!yyyypId) return []
    if (yyyypResult.status === 'fulfilled' && yyyypResult.value) {
      const list = (yyyypResult.value as Awaited<ReturnType<typeof fetchYyypPurchaseOrderByWebview>>)?.Data?.slice(0, 5) ?? []
      return list.length > 0
        ? list.map((item, i) => ({
            platform: 'yyyp' as const,
            platformName: buildPlatformName('悠悠有品', i, list.length),
            index: i,
            platformPrice: item.price,
            netPrice: calcNetPrice(item.price, 'yyyp'),
            loading: false, error: false, netPriceRed: false, highlighted: false
          }))
        : [{ platform: 'yyyp' as const, platformName: '悠悠有品', index: 0, platformPrice: null, netPrice: null, loading: false, error: false, netPriceRed: false, highlighted: false }]
    }
    return [{ platform: 'yyyp' as const, platformName: '悠悠有品', index: 0, platformPrice: null, netPrice: null, loading: false, error: true, netPriceRed: false, highlighted: false }]
  })()

  const merged = sortByNetPrice([...buffRows, ...yyyypRows])
  purchasePriceRows.value = merged
  updateHighlightAndRedMark(purchasePriceRows.value)
}

/**
 * 加载出售记录数据，完成后渲染图表
 * 使用系统 token（Authorization: Bearer <token>），由请求拦截器自动注入
 */
async function loadSalesRecordData(): Promise<void> {
  if (!itemData.value?.id) return

  salesLoading.value = true
  salesError.value = false
  try {
    const res = await getItemHistoryApi({
      itemDefineId: itemData.value.id,
      days: 365
    })
    salesRecords.value = res?.list || []
    if (salesRecords.value.length > 0) {
      setTimeout(() => renderSalesChart(), 100)
    }
  } catch {
    salesError.value = true
  } finally {
    salesLoading.value = false
  }
}

/**
 * 渲染出售记录折线图
 */
function renderSalesChart(): void {
  if (salesRecords.value.length === 0) return

  const systemInfo = uni.getSystemInfoSync()
  const canvasWidth = systemInfo.windowWidth - 72
  const canvasHeight = 360

  // 按时间正序排列（接口返回可能是倒序）
  const sorted = [...salesRecords.value].reverse()
  const categories = sorted.map(r => formatChartTime(r.marketTime))
  const seriesData = sorted.map(r => r.price)

  uChartsInstance = new uCharts({
    type: 'line',
    context: uni.createCanvasContext('salesChart'),
    width: canvasWidth,
    height: canvasHeight,
    categories,
    series: [{
      name: '出售价格',
      data: seriesData,
      color: '#7C3AED',
      // series 级别关闭数据点标注
      dataLabel: false
    }],
    background: '#FFFFFF',
    color: ['#7C3AED'],
    padding: [20, 20, 10, 15],
    // 顶层也关闭数据点标注（双保险）
    dataLabel: false,
    legend: { show: false },
    xAxis: {
      disableGrid: true,
      labelCount: 5,
      fontSize: 10
    },
    yAxis: {
      gridType: 'dash',
      dashLength: 4,
      fontSize: 10,
      format: (val: number) => `¥${Math.round(val)}`
    },
    extra: {
      line: {
        type: 'curve',
        width: 2,
        activeType: 'hollow'
      },
      // 禁用内置 tooltip，改用自定义卡片
      tooltip: {
        show: false,
        showBox: false,
        showArrow: false
      }
    }
  })
}

/**
 * 根据触摸坐标更新选中的出售记录
 * App 端 touch 事件的 x 是相对于 canvas 的坐标，H5 端用 clientX
 */
function updateSelectedByTouch(e: TouchEvent): void {
  const touch = e.touches?.[0] as (Touch & { x?: number }) | undefined
  if (!touch) return

  const sorted = [...salesRecords.value].reverse()
  const count = sorted.length
  if (count === 0) return

  const systemInfo = uni.getSystemInfoSync()
  // canvas 宽度 = 屏幕宽度 - 卡片左右 margin(16*2) - 卡片左右 padding(20*2)
  const canvasWidth = systemInfo.windowWidth - 72
  const paddingLeft = 15
  const paddingRight = 20
  const chartWidth = canvasWidth - paddingLeft - paddingRight

  // App 端 touch.x 是相对 canvas 的坐标，H5 端降级用 clientX
  const rawX = (touch.x !== undefined ? touch.x : touch.clientX) - paddingLeft
  const step = chartWidth / (count - 1 || 1)
  const idx = Math.max(0, Math.min(Math.round(rawX / step), count - 1))
  selectedRecord.value = sorted[idx] ?? null
}

/** 图表 touchstart 事件处理 */
function touchStart(e: TouchEvent): void {
  if (uChartsInstance) {
    const instance = uChartsInstance as {
      touchLegend: (e: TouchEvent) => void
      showToolTip: (e: TouchEvent, opts: object) => void
    }
    instance.touchLegend(e)
    instance.showToolTip(e, {})
  }
  updateSelectedByTouch(e)
}

/** 图表 touchmove 事件处理 */
function touchMove(e: TouchEvent): void {
  if (uChartsInstance) {
    (uChartsInstance as { showToolTip: (e: TouchEvent, opts: object) => void }).showToolTip(e, {})
  }
  updateSelectedByTouch(e)
}

/** 图表 touchend 事件处理 */
function touchEnd(e: TouchEvent): void {
  if (uChartsInstance) {
    (uChartsInstance as { touchLegend: (e: TouchEvent) => void }).touchLegend(e)
  }
}

/**
 * 切换标签页（懒加载：已加载过的 Tab 不重复请求）
 */
function switchTab(index: number): void {
  activeTab.value = index
  if (loadedTabs.value.has(index)) return
  loadedTabs.value.add(index)

  if (index === 0) loadSellPriceData()
  else if (index === 1) loadPurchasePriceData()
  else if (index === 2) loadSalesRecordData()
}

/** 返回上一页 */
function goBack(): void {
  uni.navigateBack({ delta: 1 })
}

/**
 * 格式化金额，保留两位小数
 */
function formatAmount(amount: number): string {
  if (amount === undefined || amount === null) return '0.00'
  return amount.toFixed(2)
}

/**
 * 格式化图表时间轴显示
 */
function formatChartTime(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${month}-${day}`
  } catch {
    return dateStr
  }
}

// ==================== 生命周期 ====================

onLoad(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as unknown as { getOpenerEventChannel?: () => UniApp.EventChannel }

  const eventChannel = currentPage.getOpenerEventChannel?.()
  if (eventChannel) {
    eventChannel.on('itemData', (data: InventoryItem) => {
      if (data && data.id) {
        itemData.value = data
        dataLoadError.value = false
        loadedTabs.value.add(0)
        loadSellPriceData()
      } else {
        dataLoadError.value = true
      }
    })

    // 超时兜底：1 秒内未收到数据则标记错误
    setTimeout(() => {
      if (!itemData.value) {
        dataLoadError.value = true
      }
    }, 1000)
  } else {
    dataLoadError.value = true
  }
})
</script>

<style scoped lang="scss">
.detail-page {
  width: 100%;
  min-height: 100vh;
  background-color: #f5f5f5;
}

/* 自定义导航栏 */
.custom-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: calc(44px + env(safe-area-inset-top));
  background: linear-gradient(135deg, #7C3AED 0%, #A855F7 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding-top: env(safe-area-inset-top);
}

.nav-back {
  position: absolute;
  left: 12px;
  top: calc(env(safe-area-inset-top) + 50%);
  transform: translateY(-50%);
  padding: 8px 12px;
  cursor: pointer;
}

.back-icon {
  font-size: 26px;
  font-weight: 600;
  color: #ffffff;
  line-height: 1;
}

.nav-title {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
}

/* 错误状态 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 44px - env(safe-area-inset-top));
  padding: 60px 32px;
  margin-top: calc(44px + env(safe-area-inset-top));
}

.error-text {
  font-size: 17px;
  color: #666666;
  margin-bottom: 32px;
}

.error-button {
  padding: 12px 40px;
  background: linear-gradient(135deg, #7C3AED 0%, #A855F7 100%);
  color: #ffffff;
  border-radius: 8px;
  border: none;
  font-size: 16px;
  font-weight: 600;
}

/* 内容区域 */
.detail-content {
  margin-top: calc(44px + env(safe-area-inset-top));
  min-height: calc(100vh - 44px - env(safe-area-inset-top));
}

/* 饰品信息卡片 */
.item-info-card {
  background-color: #ffffff;
  margin: 16px;
  padding: 24px 20px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

/* 游戏标识 */
.game-tag {
  display: inline-block;
  padding: 4px 12px;
  background-color: #f0f0f0;
  color: #666666;
  font-size: 13px;
  border-radius: 4px;
  margin-bottom: 12px;
}

/* 饰品名称 */
.item-name {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 16px;
  line-height: 1.5;
}

/* 价格区域 */
.price-section {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 24px;
}

.price-label {
  font-size: 14px;
  color: #999999;
}

.price-value {
  font-size: 24px;
  font-weight: 700;
  color: #10B981;
}

/* 标签页 */
.tabs-section {
  display: flex;
  border-bottom: 1px solid #e5e5e5;
  margin-bottom: 20px;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  font-size: 15px;
  color: #666666;
  position: relative;
  cursor: pointer;

  &.active {
    color: #7C3AED;
    font-weight: 600;

    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 50%;
      transform: translateX(-50%);
      width: 40px;
      height: 3px;
      background-color: #7C3AED;
      border-radius: 2px 2px 0 0;
    }
  }
}

/* 价格对比表格 */
.price-table {
  width: 100%;
}

.table-header {
  display: flex;
  align-items: center;
  padding: 10rpx 16rpx 18rpx;
  border-bottom: 1px solid #f0f0f0;

  text {
    font-size: 24rpx;
    color: #aaaaaa;
    font-weight: 500;
    letter-spacing: 0.5px;
  }

  /* 表头各列文字对齐与数据行保持一致 */
  .col-platform {
    display: block;
    text-align: center;
  }

  .col-price {
    display: block;
    text-align: center;
  }

  .col-net-price {
    display: block;
    text-align: center;
  }
}

.table-body {
  .table-row {
    display: flex;
    align-items: center;
    padding: 22rpx 16rpx;
    border-radius: 12rpx;
    margin-top: 8rpx;
    background-color: #fafafa;
    transition: background-color 0.2s;

    &.row-highlighted {
      background-color: #EFF6FF;
      border: 1rpx solid #BFDBFE;
    }
  }
}

.col-platform {
  flex: 1.4;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.platform-badge {
  width: 44rpx;
  height: 44rpx;
  border-radius: 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &--buff {
    background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  }

  &--yyyp {
    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  }
}

.platform-badge-text {
  font-size: 22rpx;
  font-weight: 700;
  color: #ffffff;
  line-height: 1;
}

.platform-name {
  font-size: 26rpx;
  color: #333333;
  font-weight: 500;
}

.col-price {
  flex: 1.2;
  text-align: center;
}

.price-amount {
  font-size: 26rpx;
  color: #555555;
}

.col-net-price {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.net-price-wrapper {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.net-price-text {
  font-size: 28rpx;
  font-weight: 700;
  color: #999999;

  &.net-price-red {
    color: #EF4444;
  }
}

.net-price-tag {
  font-size: 18rpx;
  font-weight: 600;
  padding: 2rpx 8rpx;
  border-radius: 6rpx;
  line-height: 1.4;

  &--high {
    background-color: #FEE2E2;
    color: #EF4444;
  }
}

.text-loading {
  font-size: 24rpx;
  color: #bbbbbb;
}

.text-error {
  font-size: 24rpx;
  color: #EF4444;
}

.text-empty {
  font-size: 24rpx;
  color: #cccccc;
}

/* 出售记录 Tab */
.sales-record-tab {
  min-height: 300px;
}

.tab-loading,
.tab-error,
.tab-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

/* 图表提示文字 */
.chart-hint {
  padding: 16rpx 0 8rpx;
  text-align: center;
}

.chart-hint-text {
  font-size: 22rpx;
  color: #bbbbbb;
}

/* 点击数据点后显示的详情卡片 */
.chart-tooltip {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 20rpx;
  background: linear-gradient(135deg, #f5f0ff 0%, #ede9fe 100%);
  border-radius: 12rpx;
  margin-bottom: 12rpx;
  border: 1rpx solid #ddd6fe;
}

.chart-tooltip-date {
  font-size: 22rpx;
  color: #888888;
  flex-shrink: 0;
}

.chart-tooltip-platform {
  font-size: 22rpx;
  color: #7C3AED;
  flex-shrink: 0;
}

.chart-tooltip-price {
  font-size: 28rpx;
  font-weight: 700;
  color: #1a1a1a;
  flex: 1;
  text-align: right;
}

.sales-canvas {
  width: 100%;
  height: 360px;
}
</style>
