<template>
	<view class="initialize-page">
		<view class="header-section" :style="{ paddingTop: appStore.statusBarHeight + 'px' }">
			<view class="header-back" @click="goBack">
				<text class="back-icon">‹</text>
				<text class="back-text">返回</text>
			</view>
			<text class="header-title">{{ t('accountInitialize.title') }}</text>
		</view>

		<view class="platform-buttons">
			<view class="platform-buttons-inner">
				<view
					:class="['platform-btn', isActiveTab('buff', 'sale') ? 'active' : '']"
					@click="selectTab('buff', 'sale')"
					@touchstart="handleTouchStart"
					@touchend="handleTouchEnd"
					:style="{ opacity: isPressed ? 0.7 : 1 }"
				>
					<text class="platform-text">buff 出售记录</text>
				</view>

				<view
					:class="['platform-btn', isActiveTab('yyyp', 'sale') ? 'active' : '']"
					@click="selectTab('yyyp', 'sale')"
					@touchstart="handleTouchStart"
					@touchend="handleTouchEnd"
					:style="{ opacity: isPressed ? 0.7 : 1 }"
				>
					<text class="platform-text">悠悠出售记录</text>
				</view>

				<view
					:class="['platform-btn', isActiveTab('buff', 'withdraw') ? 'active' : '']"
					@click="selectTab('buff', 'withdraw')"
					@touchstart="handleTouchStart"
					@touchend="handleTouchEnd"
					:style="{ opacity: isPressed ? 0.7 : 1 }"
				>
					<text class="platform-text">buff 提现记录</text>
				</view>

				<view
					:class="['platform-btn', isActiveTab('yyyp', 'withdraw') ? 'active' : '']"
					@click="selectTab('yyyp', 'withdraw')"
					@touchstart="handleTouchStart"
					@touchend="handleTouchEnd"
					:style="{ opacity: isPressed ? 0.7 : 1 }"
				>
					<text class="platform-text">悠悠提现记录</text>
				</view>
			</view>
		</view>

		<view class="progress-section">
			<view class="status-header">
				<text class="status-text">{{ statusText }}</text>
			</view>
			<view class="progress-content">
				<text class="progress-info">{{ progressInfo }}</text>
			</view>
		</view>

		<!-- 表格头部 -->
		<view class="table-header">
			<view class="th-year">年份</view>
			<view class="th-platform">平台</view>
			<view class="th-desc">描述</view>
			<view class="th-status">状态</view>
		</view>

		<!-- 表格内容列表 -->
		<scroll-view class="records-list" scroll-y>
			<view v-for="(record, index) in syncRecords" :key="record.id" class="table-row">
				<view class="td-year">{{ record.year }}</view>
				<view class="td-platform">{{ record.platform }}</view>
				<view class="td-desc">{{ record.description }}</view>
				<view class="td-status" :class="'status-' + record.statusType">
					{{ record.status }}
				</view>
			</view>

			<view v-if="syncRecords.length === 0 && !isInitializing" class="empty-state">
				<text>{{ emptyText }}</text>
			</view>
		</scroll-view>
	</view>
</template>

<script setup lang="ts">
	import { computed, ref, onUnmounted } from 'vue'
	import { onLoad, onShow } from '@dcloudio/uni-app'
	import { useI18n } from 'vue-i18n'
	import { useAppStore } from '@/store/app'
	import { useEquipmentSalesStore } from '@/store/equipment-sales'
	import { submitSaleBillApi } from '@/api/modules/equipment-sales/sync.service'
	import type { SyncSaleItem, SyncUserEntry } from '@/api/modules/equipment-sales/interface/syncRequest'
	import { submitWithdrawApi } from '@/api/modules/equipment-sales/withdraw-sync.service'
	import type {
		SubmitWithdrawRequest,
		WithdrawSyncItem,
		WithdrawSyncUserEntry,
	} from '@/api/modules/equipment-sales/interface/withdrawSyncRequest'

	const { t } = useI18n()
	const appStore = useAppStore()
	const equipmentSalesStore = useEquipmentSalesStore()

	let steamId = ''
	let hasInitialized = false

	onLoad((options) => {
		steamId = options?.steamId || ''
	})

	onShow(() => {
		if (steamId && hasInitialized) {
			startInitialize()
		}
		hasInitialized = true
	})

	// ===================== 类型定义 =====================
	type InitializeType = 'sale' | 'withdraw'
	type RecordStatusType = 'reading' | 'uploading' | 'success' | 'error'

	interface SyncLogItem {
		id : string | number;
		year : string;
		platform : string;
		description : string;
		count : number;
		status : string;
		statusType : RecordStatusType;
	}

	// ===================== 核心状态管理 =====================
const selectedPlatform = ref<'buff' | 'yyyp'>('buff')
const initializeType = ref<InitializeType>('sale')
const isInitializing = ref(false)
const isPressed = ref(false)
const statusText = ref('')
const progressInfo = ref('')
const syncRecords = ref<SyncLogItem[]>([]) 
const emptyText = computed(() => '暂无同步记录，请选择上方标签开始初始化')

let currentLogId = ref<string | number>('')

// 跟踪每个年份的数据数量
const yearDataCount = ref<Record<string, number>>({})

const PAGE_SIZE = 200
const MAX_REQUEST_COUNT = 200 
let requestCount = 0

// 计算指定年份的开始和结束时间戳
function getYearTimeRange(year: number): { start: number; end: number } {
  const start = new Date(year, 0, 1).getTime() / 1000
  const end = new Date(year, 11, 31, 23, 59, 59).getTime() / 1000
  return { start, end }
}

	// ===================== 通用工具函数 =====================
	function handleTouchStart() : void { isPressed.value = true }
	function handleTouchEnd() : void { isPressed.value = false }

	function isActiveTab(platform : 'buff' | 'yyyp', type : InitializeType) : boolean {
		return selectedPlatform.value === platform && initializeType.value === type
	}

	function selectTab(platform : 'buff' | 'yyyp', type : InitializeType) : void {
		if (isInitializing.value) {
			uni.showToast({ title: '初始化进行中，请勿切换', icon: 'none' })
			return
		}
		selectedPlatform.value = platform
		initializeType.value = type
		syncRecords.value = []
		startInitialize()
	}

	function goBack() : void {
		isInitializing.value = false
		requestCount = 0
		uni.navigateBack()
	}

	function formatTimestamp(timestamp : number) : string {
		const date = new Date(timestamp * 1000)
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
	}

	function delay(ms : number) : Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms))
	}

	// ===================== 表格操作辅助函数 =====================
	function addLogRow(year : string, platform : string, desc : string, count : number = 0, status : string = '读取中', statusType : RecordStatusType = 'reading') {
		const id = Date.now() + Math.random()
		currentLogId.value = id
		syncRecords.value.push({ id, year, platform, description: desc, count, status, statusType })
		return id
	}

	function updateCurrentLog(newDesc ?: string, newCount ?: number, newStatus ?: string, newStatusType ?: RecordStatusType) {
		const index = syncRecords.value.findIndex(item => item.id === currentLogId.value)
		if (index !== -1) {
			const row = syncRecords.value[index]
			if (newDesc) row.description = newDesc
			if (newCount !== undefined) row.count = newCount
			if (newStatus) row.status = newStatus
			if (newStatusType) row.statusType = newStatusType
			syncRecords.value = [...syncRecords.value]
		}
	}

	// ===================== BUFF 数据处理 (保持不变) =====================
	interface BuffSaleRecord {
		id ?: string | number; appid ?: string | number; goods_id ?: string | number;
		updated_at ?: string | number; created_at ?: string | number;
		price ?: string | number; fee ?: string | number; income ?: string | number;
		asset_info ?: { paintwear ?: number; assetid ?: string };
	}
	interface BuffSaleResponse { code ?: number; data ?: { items ?: BuffSaleRecord[]; total_count ?: number }; }

	function convertBuffSaleToSyncItem(item : BuffSaleRecord) : SyncSaleItem {
		return {
			appId: String(item.appid || '730'), goodsId: String(item.goods_id || ''),
			updated_at: item.updated_at ?? '', created_at: item.created_at ?? '',
			price: String(item.price || '0'), fee: String(item.fee || '0'), income: String(item.income || '0'),
			abrade: Number(item.asset_info?.paintwear || 0), assetId: String(item.asset_info?.assetid || ''),
			orderNo: `buff@${item.id || ''}`, mhn: '', name: ''
		}
	}

	async function fetchBuffDataRecursive(
  startTime: number, endTime: number, pageNum: number,
  allItems: BuffSaleRecord[], currentYear: number
): Promise<void> {
  if (!isInitializing.value) return
  requestCount++
  if (requestCount > MAX_REQUEST_COUNT) {
    updateCurrentLog(undefined, undefined, `请求超限`, 'error')
    finishInitialization(allItems.length, 'buff')
    return
  }

  const nowTimestamp = Math.floor(Date.now() / 1000)
  if (startTime >= nowTimestamp) { 
    finishInitialization(allItems.length, 'buff'); 
    return 
  }

  // 获取当前年份的正确时间范围
  const yearRange = getYearTimeRange(currentYear)
  let safeStartTime = Math.max(startTime, yearRange.start)
  let safeEndTime = Math.min(endTime, yearRange.end, nowTimestamp)
  
  if (safeStartTime >= safeEndTime) { 
    finishInitialization(allItems.length, 'buff'); 
    return 
  }

		const displayStart = formatTimestamp(safeStartTime)
		const displayEnd = formatTimestamp(safeEndTime)
		const yearStr = `${currentYear}年`
		const platformStr = '网易BUFF-出售记录'

		// 【关键修复 1】无论第几页，都要确保找到对应的行并更新状态
		let existing = syncRecords.value.find(r => r.year === yearStr && r.platform.includes('BUFF'))

		if (!existing) {
			// 如果是第一年第一次，创建新行
			addLogRow(yearStr, platformStr, `读取 ${displayStart} 至 ${displayEnd}`, 0, '读取中', 'reading')
		} else {
			// 如果已存在（可能是之前的年份残留或并发问题），确保我们操作的是正确的行
			currentLogId.value = existing.id
			// 【关键修复 2】即使在翻页，也要更新描述，显示当前进度
			updateCurrentLog(
				`读取 ${displayStart} 至 ${displayEnd} (第${pageNum}页)`,
				undefined,
				'读取中',
				'reading'
			)
		}

		try {
			const url = `https://buff.163.com/api/market/sell_order/history?page_num=${pageNum}&page_size=${PAGE_SIZE}&game=csgo&appid=730&state=success&start_time=${safeStartTime}&end_time=${safeEndTime}`

			const response = await new Promise<BuffSaleResponse>((resolve, reject) => {
				uni.request({
					url, method: 'GET',
					success: (res) => res.statusCode === 200 ? resolve(res.data as BuffSaleResponse) : reject(new Error(`状态码：${res.statusCode}`)),
					fail: (err) => reject(new Error(err.errMsg))
				})
			})

			const items = response?.data?.items || []
			if (items.length > 0) {
				allItems.push(...items)
				const syncItems = items.map(item => convertBuffSaleToSyncItem(item))
				const newTotal = allItems.length
				
				// 更新当前年份的累计数量
				const yearKey = `${currentYear}年`;
				if (!yearDataCount.value[yearKey]) {
					yearDataCount.value[yearKey] = 0;
				}
				yearDataCount.value[yearKey] += syncItems.length;
				const yearTotal = yearDataCount.value[yearKey];
				
				// 更新累计数量和状态
				updateCurrentLog(
					`已读取 ${yearTotal} 条，累计 ${newTotal} 条`, 
					newTotal, 
					'上传中...', 
					'uploading'
				)
				
				await uploadSaleData(syncItems)
				
				// 上传完成后，更新为成功状态，但保留“继续翻页”的提示
				updateCurrentLog(
					`读取 ${yearTotal} 条，共 ${newTotal} 条`, 
					newTotal, 
					items.length === PAGE_SIZE ? '上传完成 (继续下一页)' : '上传完成', 
					items.length === PAGE_SIZE ? 'success' : 'success'
				)
			} else {
				// 如果没有数据，也更新一下
				updateCurrentLog(
					`该时间段无数据 (第${pageNum}页)`, 
					0, 
					'上传完成', 
					'success'
				)
			}

			// --- 分页与时间推进逻辑 ---

			if (items.length === PAGE_SIZE) {
				await delay(500)
				// 【关键修复 5】递归调用下一页，保持 currentLogId 不变，这样 updateCurrentLog 会更新同一行
				await fetchBuffDataRecursive(startTime, safeEndTime, pageNum + 1, allItems, currentYear)

			} else {
				const nextYear = currentYear + 1
				const nextYearRange = getYearTimeRange(nextYear)
				const nextStartTime = nextYearRange.start
				const nextEndTime = Math.min(nextYearRange.end, nowTimestamp)
				
				if (nextStartTime < nowTimestamp) {
					if (nextStartTime < nextEndTime) {
						await delay(1000)
						await fetchBuffDataRecursive(nextStartTime, nextEndTime, 1, allItems, nextYear)
					} else {
						finishInitialization(allItems.length, 'buff')
					}
				} else {
					finishInitialization(allItems.length, 'buff')
				}
			}
		} catch (error : any) {
			updateCurrentLog(undefined, undefined, `错误：${error.message}`, 'error')
			isInitializing.value = false
			uni.showToast({ title: '初始化失败', icon: 'none' })
		}
	}

	// ===================== 悠悠有品数据处理 (终极修复版) =====================
	interface YYYPSaleRecord {
		orderNo ?: string; sellerUserId ?: string | number; commodityNum ?: number; orderType ?: number;
		createOrderTime ?: number; finishOrderTime ?: number; totalAmount ?: number;
		productDetail ?: { assertId ?: number; commodityId ?: string | number; commodityTemplateId ?: number; commodityHashName ?: string; commodityName ?: string; commodityAbrade ?: number; };
		productDetailList ?: any[];
	}
	interface YYYPCommodityVO { id ?: string | number; price ?: string | number; abrade ?: number; }
	interface YYYPSaleResponse { code ?: number; data ?: { orderList ?: YYYPSaleRecord[]; total ?: number; }; }
	interface YYYPDetailResponse { code ?: number; data ?: { commodityVOList ?: YYYPCommodityVO[]; }; }
	interface YYYPWithdrawRecord { Status ?: number; ChangeMoney ?: string | number; ChargeMoney ?: string | number; TreadNo ?: string | number; AddTime ?: string; }
	interface YYYPWithdrawResponse { Code ?: number; Data ?: YYYPWithdrawRecord[]; TotalCount ?: number; }
	interface BuffWithdrawRecord { id ?: string | number; amount ?: string | number; fee ?: string | number; created_at ?: number; }
	interface BuffWithdrawResponse {
		code ?: string;
		data ?: {
			total_count ?: number;
			total_page ?: number;
			items ?: BuffWithdrawRecord[];
		};
	}

	function buildYYYPHeaders(token : string) {
		const deviceId = 'aa9yril4G1UDAJIdZL+Q/3+f';
		return {
			'Content-Type': 'application/json; charset=utf-8', 'Authorization': `Bearer ${token}`,
			'DeviceToken': deviceId, 'DeviceId': deviceId, 'Gameid': '730', 'deviceType': '4',
			'platform': 'android', 'User-Agent': 'Android/12 official com.uu898.uuhavequality/5.42.3 okhttp/4.9.3',
			'currentTheme': 'Dark', 'package-type': 'uuyp', 'App-Version': '5.42.3', 'AppType': '7', 'deviceBrand': 'oppo',
		};
	}

	async function fetchYYYPSellDetail(orderNo : string, userId : string, token : string) : Promise<YYYPCommodityVO[]> {
		const deviceId = 'aa9yril4G1UDAJIdZL+Q/3+f';
		return new Promise((resolve, reject) => {
			uni.request({
				url: 'https://api.youpin898.com/api/youpin/bff/trade/v1/order/query/detail',
				method: 'POST', header: buildYYYPHeaders(token),
				data: { orderNo, userId, Sessionid: deviceId }, sslVerify: false,
				success: (res) => {
					if (res.statusCode === 200) {
						const d = res.data as YYYPDetailResponse;
						if (d.code !== 0) reject(new Error(`业务错误 code: ${d.code}`));
						else resolve(d?.data?.commodityVOList || []);
					} else reject(new Error(`状态码：${res.statusCode}`));
				},
				fail: (err) => reject(new Error(err.errMsg))
			});
		});
	}

	function getYYYPPrice(order : YYYPSaleRecord) : number {
		const totalAmount = Number(order.totalAmount || 0);
		return order.orderType === 1 ? totalAmount / 100 : totalAmount;
	}

	function processYyypRecords(records : YYYPSaleRecord[], token : string) : Promise<SyncSaleItem[]> {
		const result : SyncSaleItem[] = [];
		const detailPromises : Promise<void>[] = [];
		for (const order of records) {
			const num = order.commodityNum ?? 1;
			const detail = order.productDetail;
			const createdAt = Math.floor((order.createOrderTime || 0) / 1000);
			const updatedAt = Math.floor((order.finishOrderTime || order.createOrderTime || 0) / 1000);

			if (num > 3) {
				const promise = fetchYYYPSellDetail(String(order.orderNo || ""), String(order.sellerUserId || ""), token)
					.then(list => {
						list.forEach(item => {
							result.push({
								appId: "730", goodsId: String(detail?.commodityTemplateId || ""),
								created_at: createdAt, updated_at: updatedAt,
								price: String(parseFloat(String(item.price || 0))), fee: "", income: "",
								mhn: detail?.commodityHashName || "", name: detail?.commodityName || "",
								abrade: Number(item.abrade || 0), assetId: "", orderNo: `yyyp@${item.id || ""}`
							});
						});
					});
				detailPromises.push(promise);
			} else if (num === 1) {
				result.push({
					appId: "730", goodsId: String(detail?.commodityTemplateId || ""),
					created_at: createdAt, updated_at: updatedAt,
					price: String(getYYYPPrice(order)), fee: "", income: "",
					mhn: detail?.commodityHashName || "", name: detail?.commodityName || "",
					abrade: Number(detail?.commodityAbrade || 0), assetId: String(detail?.assertId || ""),
					orderNo: `yyyp@${detail?.commodityId || ""}`
				});
			} else {
				const list = order.productDetailList || [];
				list.forEach(item => {
					const rawPrice = parseFloat(String(item.price || 0));
					result.push({
						appId: "730", goodsId: String(item.commodityTemplateId || ""),
						created_at: Math.floor((item.createOrderTime || 0) / 1000),
						updated_at: Math.floor((item.finishOrderTime || 0) / 1000),
						price: String(order.orderType === 1 ? rawPrice / 100 : rawPrice), fee: "", income: "",
						mhn: item.commodityHashName || "", name: item.commodityName || "",
						abrade: Number(item.commodityAbrade || 0), assetId: String(item.assertId || ""),
						orderNo: `yyyp@${item.commodityId || ""}`
					});
				});
			}
		}
		return Promise.all(detailPromises).then(() => result);
	}

	// 【终极修复】悠悠有品按时间段递归获取
async function fetchYyypDataRecursive(
  startTime: number, 
  endTime: number,   
  allItems: SyncSaleItem[],
  currentYear: number,
  token: string,
  pageNum: number = 1
): Promise<void> {
  if (!isInitializing.value) return
  
  requestCount++
  if (requestCount > MAX_REQUEST_COUNT) {
    updateCurrentLog(undefined, undefined, `请求超限`, 'error')
    finishInitialization(allItems.length, 'yyyp')
    return
  }

  const nowTimestamp = Math.floor(Date.now() / 1000)
  
  // 严格检查开始时间
  if (startTime >= nowTimestamp) {
    console.log('[YYYP] 开始时间已超过当前时间，终止', startTime, nowTimestamp)
    finishInitialization(allItems.length, 'yyyp')
    return
  }

  // 获取当前年份的正确时间范围
  const yearRange = getYearTimeRange(currentYear)
  let safeStartTime = Math.max(startTime, yearRange.start)
  let safeEndTime = Math.min(endTime, yearRange.end, nowTimestamp)
  
  // 如果修正后开始时间仍大于等于结束时间，说明无需再抓
  if (safeStartTime >= safeEndTime) {
    console.log('[YYYP] 时间区间无效，终止', safeStartTime, safeEndTime)
    finishInitialization(allItems.length, 'yyyp')
    return
  }

  // 防止微秒级死循环：如果时间区间小于 1 小时，直接视为最后一段，不再递归
  const timeRangeHours = (safeEndTime - safeStartTime) / 3600;
  if (timeRangeHours < 1) {
     console.log('[YYYP] 时间区间过小 (<1h)，视为最后一段', safeStartTime, safeEndTime)
     // 执行最后一次请求，然后强制结束，不再计算 nextStartTime
     await performYyypRequest(safeStartTime, safeEndTime, allItems, currentYear, token, true);
     finishInitialization(allItems.length, 'yyyp');
     return;
  }

		const displayStart = formatTimestamp(safeStartTime)
		const displayEnd = formatTimestamp(safeEndTime)
		const yearStr = `${currentYear}年`
		const platformStr = '悠悠有品-出售记录'

		const existing = syncRecords.value.find(r => r.year === yearStr && r.platform.includes('悠悠'))
		if (!existing) {
			addLogRow(yearStr, platformStr, `读取 ${displayStart} 至 ${displayEnd}`, 0, '读取中', 'reading')
		} else {
			currentLogId.value = existing.id
			updateCurrentLog(`读取 ${displayStart} 至 ${displayEnd}${pageNum > 1 ? ` (第${pageNum}页)` : ''}`, undefined, '读取中', 'reading')
		}

		const pageItems = await performYyypRequest(safeStartTime, safeEndTime, allItems, currentYear, token, false, pageNum);

		// 分页逻辑：如果获取到的数据数量等于pageSize，说明还有更多数据
		const PAGE_SIZE = 30;
		if (pageItems.length === PAGE_SIZE) {
			// 继续获取下一页
			await delay(1000);
			await fetchYyypDataRecursive(safeStartTime, safeEndTime, allItems, currentYear, token, pageNum + 1);
		} else {
			// 继续处理下一个时间区间
			const nextYear = currentYear + 1
			const nextYearRange = getYearTimeRange(nextYear)
			const nextStartTime = nextYearRange.start
			const nextEndTime = Math.min(nextYearRange.end, nowTimestamp)
			
			if (nextStartTime < nowTimestamp) {
				if (nextStartTime < nextEndTime) {
					await delay(1000)
					await fetchYyypDataRecursive(nextStartTime, nextEndTime, allItems, nextYear, token, 1)
				} else {
					finishInitialization(allItems.length, 'yyyp')
				}
			} else {
				finishInitialization(allItems.length, 'yyyp')
			}
		}
	}

	// 提取具体的请求逻辑
async function performYyypRequest(
	startTime : number, safeEndTime : number, allItems : SyncSaleItem[],
	currentYear : number, token : string, isFinalStep : boolean,
	pageNum: number = 1
) {
		try {
			await delay(1500)
			const deviceId = 'aa9yril4G1UDAJIdZL+Q/3+f';

			// 尝试同时传入秒级和毫秒级，看接口认哪个
			// 通常 API 设计者可能会混用，这里做个兼容
			const requestData : any = {
				keys: '',
				orderStatus: 340,
				pageIndex: pageNum,
				pageSize: 30,
				Sessionid: deviceId,
				// 悠悠有品有些接口用秒，有些用毫秒，这里都带上试试（如果 key 不同）
				// 如果抓包确认是 startTime，那就是秒级还是毫秒级的问题
				startTime: startTime * 1000,
				endTime: safeEndTime * 1000,
				// 备用方案：如果上面不行，可能是秒级
				startAt: startTime,
				endAt: safeEndTime
			};

			const response = await new Promise<YYYPSaleResponse>((resolve, reject) => {
				uni.request({
					url: 'https://api.youpin898.com/api/youpin/bff/trade/sale/v1/sell/list',
					method: 'POST',
					header: buildYYYPHeaders(token),
					data: requestData,
					sslVerify: false,
					success: (res) => {
						if (res.statusCode === 200) {
							const d = res.data as YYYPSaleResponse;
							if (d.code !== 0) reject(new Error(`业务错误 code: ${d.code}`));
							else resolve(d);
						} else reject(new Error(`状态码：${res.statusCode}`));
					},
					fail: (err) => reject(new Error(err.errMsg))
				})
			})

			const pageItems = response?.data?.orderList || [];

			if (pageItems.length > 0) {
				const syncItems = await processYyypRecords(pageItems, token);
				allItems.push(...syncItems);
				const newTotal = allItems.length;

				// 更新当前年份的累计数量
				const yearKey = `${currentYear}年`;
				if (!yearDataCount.value[yearKey]) {
					yearDataCount.value[yearKey] = 0;
				}
				yearDataCount.value[yearKey] += syncItems.length;
				const yearTotal = yearDataCount.value[yearKey];

				updateCurrentLog(`读取${yearTotal} 条，共${newTotal} 条${pageNum > 1 ? ` (第${pageNum}页)` : ''}`, newTotal, '上传中...', 'uploading')

				await delay(500)
				await uploadSaleData(syncItems)

				updateCurrentLog(`读取${yearTotal} 条，共${newTotal} 条${pageNum > 1 ? ` (第${pageNum}页)` : ''}`, newTotal, '上传完成', 'success')
			} else {
				const msg = isFinalStep ? '最后时间段无数据' : '该时间段无数据'
				updateCurrentLog(msg, 0, '上传完成', 'success')
			}

			return pageItems;

		} catch (error : any) {
			updateCurrentLog(undefined, undefined, `错误：${error.message}`, 'error')
			if (!isFinalStep) {
				isInitializing.value = false
			}
			return [];
		}
	}

	// ===================== 提现记录处理 =====================
	function formatDateTime(timestamp : number) : string {
		const date = new Date(timestamp * 1000)
		const pad = (value : number) => String(value).padStart(2, '0')
		return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
	}

	function formatYyypWithdrawTime(time : string) : string {
		return time ? time.replace(/\./g, '-').substring(0, 19) : ''
	}

	function getYearLabel(created : string) : string {
		return created ? `${created.substring(0, 4)}年` : '未知'
	}

	function convertBuffWithdrawToSyncItem(item : BuffWithdrawRecord) : WithdrawSyncItem {
		return {
			id: String(item.id || ''),
			amount: Number(item.amount || 0),
			fee: Number(item.fee || 0),
			created: formatDateTime(Number(item.created_at || 0)),
		}
	}

	function convertYyypWithdrawToSyncItem(item : YYYPWithdrawRecord) : WithdrawSyncItem {
		return {
			id: String(item.TreadNo || ''),
			amount: Math.abs(Number(item.ChangeMoney || 0)),
			fee: Number(item.ChargeMoney || 0),
			created: formatYyypWithdrawTime(String(item.AddTime || '')),
		}
	}

	async function fetchBuffWithdrawDataRecursive(year : number, pageNum : number, allItems : WithdrawSyncItem[]) : Promise<void> {
		if (!isInitializing.value) return

		requestCount++
		if (requestCount > MAX_REQUEST_COUNT) {
			updateCurrentLog(undefined, undefined, '请求超限', 'error')
			finishInitialization(allItems.length, 'buff')
			return
		}

		const currentYear = new Date().getFullYear()
		if (year > currentYear) {
			finishInitialization(allItems.length, 'buff')
			return
		}

		const nowTimestamp = Math.floor(Date.now() / 1000)
		const yearRange = getYearTimeRange(year)
		const endTime = Math.min(yearRange.end, nowTimestamp)
		const yearStr = `${year}年`
		const platformStr = '网易BUFF-提现记录'
		const displayStart = formatTimestamp(yearRange.start)
		const displayEnd = formatTimestamp(endTime)

		const existing = syncRecords.value.find(r => r.year === yearStr && r.platform === platformStr)
		if (!existing) {
			addLogRow(yearStr, platformStr, `读取 ${displayStart} 至 ${displayEnd}${pageNum > 1 ? ` (第${pageNum}页)` : ''}`, 0, '读取中', 'reading')
		} else {
			currentLogId.value = existing.id
			updateCurrentLog(`读取 ${displayStart} 至 ${displayEnd}${pageNum > 1 ? ` (第${pageNum}页)` : ''}`, undefined, '读取中', 'reading')
		}

		try {
			const response = await new Promise<BuffWithdrawResponse>((resolve, reject) => {
				uni.request({
					method: 'GET',
					url: `https://buff.163.com/api/asset/withdraw_log/?page_num=${pageNum}&page_size=200&start_time=${yearRange.start}&end_time=${endTime}&state=success`,
					header: { Host: 'buff.163.com' },
					dataType: 'json',
					success: (res) => {
						if (res.statusCode === 200) resolve(res.data as BuffWithdrawResponse)
						else reject(new Error(`状态码：${res.statusCode}`))
					},
					fail: (err) => reject(new Error(`BUFF 提现接口请求失败: ${err.errMsg}`)),
				})
			})

			if (response.code && response.code !== 'OK') {
				throw new Error(`业务错误 code: ${response.code}`)
			}

			const totalPage = response?.data?.total_page ?? 0
			const pageItems = (response?.data?.items || []).map(convertBuffWithdrawToSyncItem)

			if (pageItems.length > 0) {
				allItems.push(...pageItems)
				yearDataCount.value[yearStr] = (yearDataCount.value[yearStr] || 0) + pageItems.length
				const yearTotal = yearDataCount.value[yearStr]

				updateCurrentLog(`第${pageNum}页读取 ${pageItems.length} 条，累计 ${yearTotal} 条`, allItems.length, '上传中...', 'uploading')
				await uploadWithdrawData(pageItems)
				updateCurrentLog(`读取 ${yearTotal} 条，共 ${allItems.length} 条`, allItems.length, pageNum < totalPage ? '上传完成 (继续下一页)' : '上传完成', 'success')
			} else {
				updateCurrentLog(`该年份暂无成功提现记录${pageNum > 1 ? ` (第${pageNum}页)` : ''}`, 0, '上传完成', 'success')
			}

			progressInfo.value = `已读取 ${yearStr} 第${pageNum}页，累计 ${allItems.length} 条提现记录`

			if (pageNum < totalPage) {
				await delay(500)
				await fetchBuffWithdrawDataRecursive(year, pageNum + 1, allItems)
				return
			}

			if (year < currentYear) {
				await delay(800)
				await fetchBuffWithdrawDataRecursive(year + 1, 1, allItems)
				return
			}

			finishInitialization(allItems.length, 'buff')
		} catch (error : any) {
			updateCurrentLog(undefined, undefined, `错误：${error.message}`, 'error')
			isInitializing.value = false
			uni.showToast({ title: '初始化失败', icon: 'none' })
		}
	}

	async function fetchYyypWithdrawDataRecursive(token : string, pageIndex : number, allItems : WithdrawSyncItem[]) : Promise<void> {
		if (!isInitializing.value) return

		requestCount++
		if (requestCount > MAX_REQUEST_COUNT) {
			updateCurrentLog(undefined, undefined, '请求超限', 'error')
			finishInitialization(allItems.length, 'yyyp')
			return
		}

		try {
			const response = await new Promise<YYYPWithdrawResponse>((resolve, reject) => {
				uni.request({
					url: 'https://api.youpin898.com/api/youpin/bff/payment/v1/user/withdrawRecordList',
					method: 'POST',
					header: buildYYYPHeaders(token),
					data: {
						RecordType: 2,
						Sessionid: 'aa9yril4G1UDAJIdZL+Q/3+f',
						DeviceToken: 'aa9yril4G1UDAJIdZL+Q/3+f',
						StatusType: 0,
						source: 2,
						isonlywithDraw: 0,
						PageIndex: pageIndex,
						PageSize: 30,
						isOnlyWithDraw: 0,
					},
					sslVerify: false,
					success: (res) => {
						if (res.statusCode === 200) {
							const d = res.data as YYYPWithdrawResponse
							if (d.Code !== undefined && d.Code !== 0) reject(new Error(`业务错误 code: ${d.Code}`))
							else resolve(d)
						} else reject(new Error(`状态码：${res.statusCode}`))
					},
					fail: (err) => reject(new Error(`悠悠提现接口请求失败: ${err.errMsg}`)),
				})
			})

			const rawItems = response?.Data || []
			const totalCount = response?.TotalCount ?? 0
			const successItems = rawItems.filter(item => item.Status === 1).map(convertYyypWithdrawToSyncItem)

			if (successItems.length > 0) {
				allItems.push(...successItems)
				const groupedItems = successItems.reduce<Record<string, WithdrawSyncItem[]>>((acc, item) => {
					const yearLabel = getYearLabel(item.created)
					acc[yearLabel] = acc[yearLabel] || []
					acc[yearLabel].push(item)
					return acc
				}, {})

				for (const [yearLabel, yearItems] of Object.entries(groupedItems)) {
					const platformStr = '悠悠有品-提现记录'
					const existing = syncRecords.value.find(r => r.year === yearLabel && r.platform === platformStr)
					if (!existing) {
						addLogRow(yearLabel, platformStr, `第${pageIndex}页读取 ${yearItems.length} 条`, 0, '读取中', 'reading')
					} else {
						currentLogId.value = existing.id
						updateCurrentLog(`第${pageIndex}页读取 ${yearItems.length} 条`, undefined, '读取中', 'reading')
					}

					yearDataCount.value[yearLabel] = (yearDataCount.value[yearLabel] || 0) + yearItems.length
					const yearTotal = yearDataCount.value[yearLabel]
					updateCurrentLog(`第${pageIndex}页读取 ${yearItems.length} 条，累计 ${yearTotal} 条`, yearTotal, '上传中...', 'uploading')
					await uploadWithdrawData(yearItems)
					updateCurrentLog(`第${pageIndex}页上传完成，累计 ${yearTotal} 条`, yearTotal, '上传完成', 'success')
				}
			} else if (pageIndex === 1 && totalCount === 0) {
				addLogRow('全部', '悠悠有品-提现记录', '暂无成功提现记录', 0, '上传完成', 'success')
			}

			progressInfo.value = totalCount > 0
				? `已读取第${pageIndex}页，累计上传 ${allItems.length} 条，共 ${totalCount} 条原始记录`
				: `已读取第${pageIndex}页，累计上传 ${allItems.length} 条提现记录`

			const reachedTotalCount = totalCount > 0 && pageIndex * 30 >= totalCount
			if (reachedTotalCount || rawItems.length < 30) {
				finishInitialization(allItems.length, 'yyyp')
				return
			}

			await delay(800)
			await fetchYyypWithdrawDataRecursive(token, pageIndex + 1, allItems)
		} catch (error : any) {
			updateCurrentLog(undefined, undefined, `错误：${error.message}`, 'error')
			isInitializing.value = false
			uni.showToast({ title: '初始化失败', icon: 'none' })
		}
	}

	// ===================== 通用上传和完成函数 =====================
	async function uploadSaleData(items : SyncSaleItem[]) : Promise<void> {
		if (items.length === 0) return
		const userEntry : SyncUserEntry = {
			user: { market: selectedPlatform.value, steamId },
			items
		}
		await submitSaleBillApi({ list: [userEntry], steamId })
	}

	async function uploadWithdrawData(items : WithdrawSyncItem[]) : Promise<void> {
		if (items.length === 0) return
		const userEntry : WithdrawSyncUserEntry = {
			user: { market: selectedPlatform.value, steamId },
			items,
		}
		const requestBody : SubmitWithdrawRequest = {
			list: [userEntry],
			steamId,
		}
		await submitWithdrawApi(requestBody)
	}

	function finishInitialization(totalCount : number, platform : 'buff' | 'yyyp') : void {
		isInitializing.value = false
		requestCount = 0
		statusText.value = '初始化完成'
		const recordLabel = initializeType.value === 'withdraw' ? '提现记录' : '出售记录'
		progressInfo.value = `共获取 ${totalCount} 条${platform === 'buff' ? '网易 buff' : '悠悠有品'}${recordLabel}`
		uni.showToast({ title: '初始化完成', icon: 'success' })
	}

	// ===================== 启动初始化 =====================
	function startInitialize(): void {
  requestCount = 0
  if (!steamId) {
    uni.showToast({ title: '缺少 steamId 参数', icon: 'none', duration: 3000 })
    return
  }

  isInitializing.value = true
  syncRecords.value = []
  yearDataCount.value = {} // 重置年份数据计数

		if (initializeType.value === 'withdraw') {
			if (selectedPlatform.value === 'buff') {
				const firstYear = 2021
				statusText.value = '当前正在初始化网易 buff 提现记录'
				progressInfo.value = `准备从${firstYear}年开始获取数据...`
				addLogRow(`${firstYear}年`, '网易BUFF-提现记录', `准备从 ${firstYear} 年开始`, 0, '读取中', 'reading')
				fetchBuffWithdrawDataRecursive(firstYear, 1, [])
			} else {
				const authState = equipmentSalesStore.getPlatformAuth(steamId, 'yyyp')
				if (!authState?.token) {
					isInitializing.value = false
					uni.showToast({ title: '请先登录悠悠有品', icon: 'none' })
					return
				}

				statusText.value = '当前正在初始化悠悠有品提现记录'
				progressInfo.value = '准备分页读取并上传提现记录...'
				fetchYyypWithdrawDataRecursive(authState.token, 1, [])
			}
			return
		}

		if (selectedPlatform.value === 'buff') {
    const firstYear = 2021
    const firstYearRange = getYearTimeRange(firstYear)
    const firstEndTime = Math.min(firstYearRange.end, Math.floor(Date.now() / 1000))
    const allItems: BuffSaleRecord[] = []
    
    statusText.value = '当前正在初始化网易 buff 出售记录'
    progressInfo.value = `准备从${firstYear}年开始获取数据...`
    addLogRow(`${firstYear}年`, '网易 BUFF', `准备从 ${firstYear} 年开始`, 0, '读取中', 'reading')
    
    fetchBuffDataRecursive(firstYearRange.start, firstEndTime, 1, allItems, firstYear)
  } else {
    const authState = equipmentSalesStore.getPlatformAuth(steamId, 'yyyp')
    if (!authState?.token) {
      isInitializing.value = false
      uni.showToast({ title: '请先登录悠悠有品', icon: 'none' })
      return
    }
    const token = authState.token
    const allItems: SyncSaleItem[] = []
    
    statusText.value = '当前正在初始化悠悠有品出售记录'
    progressInfo.value = '准备从 2021 年开始分段获取数据...'
    
    const firstYear = 2021
    const firstYearRange = getYearTimeRange(firstYear)
    const firstEndTime = Math.min(firstYearRange.end, Math.floor(Date.now() / 1000))
    
    addLogRow(`${firstYear}年`, '悠悠有品', `准备从 ${firstYear} 年开始`, 0, '读取中', 'reading')
    
    fetchYyypDataRecursive(firstYearRange.start, firstEndTime, allItems, firstYear, token, 1)
  }
	}

	onUnmounted(() => {
		isInitializing.value = false
		requestCount = 0
	})
</script>

<style scoped lang="scss">
	/* 样式部分与之前完全一致，省略以节省空间 */
	.initialize-page {
		min-height: 100vh;
		background-color: #f5f7fa;
		display: flex;
		flex-direction: column;
	}

	.header-section {
		background: linear-gradient(135deg, #7C3AED 0%, #A855F7 100%);
		padding: 0 30rpx 40rpx;
		border-radius: 0 0 40rpx 40rpx;
		text-align: center;
		position: relative;

		.header-back {
			display: flex;
			align-items: center;
			position: absolute;
			left: 30rpx;
			top: 40rpx;

			.back-icon {
				font-size: 40rpx;
				color: #ffffff;
				font-weight: bold;
			}

			.back-text {
				font-size: 28rpx;
				color: #ffffff;
			}
		}

		.header-title {
			font-size: 48rpx;
			font-weight: 700;
			color: #ffffff;
			display: block;
			padding-top: 40rpx;
		}
	}

	.platform-buttons {
		padding: 32rpx 24rpx 24rpx;
	}

	.platform-buttons-inner {
		display: flex;
		gap: 12rpx;

		.platform-btn {
			flex: 1;
			min-width: 0;
			padding: 18rpx 8rpx;
			border-radius: 12rpx;
			background-color: #7C3AED;
			transition: all 0.2s ease;
			transform: scale(1);
			box-shadow: 0 8rpx 18rpx rgba(124, 58, 237, 0.18);
			display: flex;
			align-items: center;
			justify-content: center;
			text-align: center;

			&:active {
				transform: scale(0.95);
				background-color: #6D28D9;
			}

			&.active {
				background-color: #6D28D9;
				box-shadow: 0 4rpx 12rpx rgba(124, 58, 237, 0.4);
			}

			.platform-text {
				font-size: 24rpx;
				color: #ffffff;
				font-weight: 600;
				line-height: 1.3;
				white-space: normal;
				word-break: break-all;
			}
		}
	}

	.progress-section {
		margin: 0 30rpx 20rpx;
		background-color: #ffffff;
		border-radius: 16rpx;
		padding: 20rpx;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);

		.status-header {
			padding-bottom: 10rpx;
			border-bottom: 1rpx solid #f0f0f0;
			margin-bottom: 10rpx;
		}

		.status-text {
			font-size: 28rpx;
			color: #7C3AED;
			font-weight: 600;
		}

		.progress-info {
			font-size: 24rpx;
			color: #666666;
			line-height: 1.6;
		}
	}

	.table-header {
		display: flex;
		padding: 10rpx 20rpx;
		background-color: #f8f9fa;
		border-top: 1rpx solid #e9ecef;
		border-bottom: 2rpx solid #dee2e6;
		font-size: 24rpx;
		font-weight: bold;
		color: #495057;

		.th-year {
			width: 15%;
			text-align: center;
		}

		.th-platform {
			width: 25%;
			text-align: center;
		}

		.th-desc {
			width: 40%;
			text-align: center;
		}

		.th-status {
			width: 20%;
			text-align: center;
		}
	}

	.records-list {
		flex: 1;
		margin: 0 20rpx 20rpx;
		background-color: #ffffff;
		border-radius: 12rpx;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
		max-height: 50vh;

		.table-row {
				display: flex;
				align-items: flex-start;
				padding: 16rpx 20rpx;
				border-bottom: 1rpx solid #f1f3f5;
				font-size: 24rpx;
				color: #343a40;

				&:last-child {
					border-bottom: none;
				}

				.td-year {
					width: 15%;
					font-weight: 600;
					color: #7C3AED;
					padding: 8rpx 0;
					text-align: center;
				}

				.td-platform {
					width: 25%;
					color: #495057;
					padding: 8rpx 0;
					text-align: center;
				}

				.td-desc {
					width: 40%;
					color: #6c757d;
					overflow: visible;
					text-overflow: clip;
					white-space: normal;
					line-height: 1.4;
					padding: 8rpx 0;
					text-align: center;
				}

				.td-status {
					width: 20%;
					text-align: center;
					padding: 8rpx 12rpx;
					border-radius: 20rpx;
					font-size: 22rpx;

					&.status-reading {
						background-color: #e3f2fd;
						color: #1976d2;
					}

					&.status-uploading {
						background-color: #fff3e0;
						color: #f57c00;
					}

					&.status-success {
						background-color: #e8f5e9;
						color: #2e7d32;
					}

					&.status-error {
						background-color: #ffebee;
						color: #c62828;
					}
				}
			}

		.empty-state {
			padding: 40rpx;
			text-align: center;
			color: #adb5bd;
			font-size: 26rpx;
		}
	}
</style>
