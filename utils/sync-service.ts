/**
 * 销售数据同步服务
 * 封装从第三方平台（悠悠有品、网易 BUFF）拉取出售记录并上传至后端的完整流程
 */

import { PlatformAuthCache } from "@/utils/platform-auth-cache";
import { submitSaleBillApi } from "@/api/modules/equipment-sales/sync.service";
import { submitWithdrawApi } from "@/api/modules/equipment-sales/withdraw-sync.service";
import type { PlatformType } from "@/types/platform-auth";
import type {
	SubmitSaleBillRequest,
	SyncSaleItem,
	SyncUserEntry,
} from "@/api/modules/equipment-sales/interface/syncRequest";
import type {
	SubmitWithdrawRequest,
	WithdrawSyncItem,
	WithdrawSyncUserEntry,
} from "@/api/modules/equipment-sales/interface/withdrawSyncRequest";

/**
 * 第三方平台出售记录（内部中间类型）
 */
export interface SaleItem {
	appId : string;
	goodsId : string;
	/** YYYP 为秒级时间戳（number），BUFF 直接用接口返回值 */
	updatedAt : string | number;
	createdAt : string | number;
	price : string | number;
	fee : string;
	income : string;
	abrade : number;
	assetId : string;
	orderNo : string;
	mhn ?: string;
	name ?: string;
}

/**
 * 悠悠有品出售列表单条记录
 */
interface YYYPSaleRecord {
	orderNo ?: string;
	sellerUserId ?: string | number;
	commodityNum ?: number;
	orderType ?: number;
	createOrderTime ?: number;
	finishOrderTime ?: number;
	productDetail ?: {
		assertId ?: number;
		commodityId ?: string | number;
		commodityTemplateId ?: number;
		commodityHashName ?: string;
		commodityName ?: string;
		commodityAbrade ?: number;
		[key : string] : unknown;
	};
	productDetailList ?: YYYPProductDetailItem[];
	[key : string] : unknown;
}

/**
 * 悠悠有品 productDetailList 条目（commodityNum 为 2-3 时）
 */
interface YYYPProductDetailItem {
	commodityId ?: string | number;
	commodityTemplateId ?: number;
	commodityHashName ?: string;
	commodityName ?: string;
	commodityAbrade ?: number;
	assertId ?: number;
	price ?: string | number;
	createOrderTime ?: number;
	finishOrderTime ?: number;
	[key : string] : unknown;
}

/**
 * 悠悠有品详情接口返回的 commodityVOList 条目（commodityNum > 3 时）
 */
interface YYYPCommodityVO {
	id ?: string | number;
	price ?: string | number;
	abrade ?: number;
	[key : string] : unknown;
}

/**
 * 悠悠有品出售列表接口响应
 */
interface YYYPSaleResponse {
	code ?: number;
	data ?: {
		orderList ?: YYYPSaleRecord[];
		[key : string] : unknown;
	};
	[key : string] : unknown;
}

/**
 * 悠悠有品详情接口响应
 */
interface YYYPDetailResponse {
	code ?: number;
	data ?: {
		commodityVOList ?: YYYPCommodityVO[];
		[key : string] : unknown;
	};
	[key : string] : unknown;
}

/**
 * 网易 BUFF 出售记录原始数据结构
 */
interface BUFFSaleRecord {
	id ?: string | number;
	appid ?: string | number;
	goods_id ?: string | number;
	updated_at ?: string | number;
	created_at ?: string | number;
	price ?: string | number;
	fee ?: string | number;
	income ?: string | number;
	asset_info ?: {
		paintwear ?: number;
		assetid ?: string;
		[key : string] : unknown;
	};
	[key : string] : unknown;
}

/**
 * 网易 BUFF 出售记录接口响应
 */
interface BUFFSaleResponse {
	code ?: number;
	data ?: {
		items ?: BUFFSaleRecord[];
		total_count ?: number;
		[key : string] : unknown;
	};
	[key : string] : unknown;
}

/**
 * 销售数据同步服务类
 */
export class SyncService {
	/** 悠悠有品出售列表接口 */
	private static readonly YYYP_SALE_API =
		"https://api.youpin898.com/api/youpin/bff/trade/sale/v1/sell/list";

	/** 悠悠有品订单详情接口（commodityNum > 3 时使用） */
	private static readonly YYYP_DETAIL_API =
		"https://api.youpin898.com/api/youpin/bff/trade/v1/order/query/detail";

	/** 网易 BUFF 出售历史接口 */
	private static readonly BUFF_SALE_API =
		"https://buff.163.com/api/market/sell_order/history";

	/** 悠悠有品固定设备信息，模拟 Android 客户端 */
	private static readonly YYYP_DEVICE = {
		deviceId: "aa9yril4G1UDAJIdZL+Q/3+f",
		appVersion: "5.42.3",
		userAgent: "Android/12 official com.uu898.uuhavequality/5.42.3 okhttp/4.9.3",
	};

	/**
	 * 执行完整同步流程
	 */
	static async sync(steamId : string, platform : PlatformType) : Promise<void> {
		let items : SaleItem[];
		if (platform === "yyyp") {
			items = await this.fetchYYYPSaleRecords(steamId);
		} else if (platform === "buff") {
			items = await this.fetchBUFFSaleRecords(steamId);
		} else {
			throw new Error(`不支持的平台类型: ${platform}`);
		}
		await this.submitToBackend(steamId, platform, items);
	}

	/**
	 * 构造悠悠有品请求 headers
	 */
	private static buildYYYPHeaders(token : string) : Record<string, string> {
		const deviceId = this.YYYP_DEVICE.deviceId;
		return {
			"Content-Type": "application/json; charset=utf-8",
			"Authorization": `Bearer ${token}`,
			"DeviceToken": deviceId,
			"DeviceId": deviceId,
			"Gameid": "730",
			"deviceType": "4",
			"platform": "android",
			"User-Agent": this.YYYP_DEVICE.userAgent,
			"currentTheme": "Dark",
			"package-type": "uuyp",
			"App-Version": this.YYYP_DEVICE.appVersion,
			"AppType": "7",
			"deviceBrand": "oppo",
		};
	}

	/**
	 * 从悠悠有品获取出售记录
	 */
	private static async fetchYYYPSaleRecords(steamId : string) : Promise<SaleItem[]> {
		const authState = PlatformAuthCache.loadAuthState(steamId, "yyyp");
		if (!authState || !authState.token) {
			throw new Error("YYYP_TOKEN_NOT_FOUND");
		}

		const token = authState.token;
		const deviceId = this.YYYP_DEVICE.deviceId;
		const PAGE_SIZE = 30;
		const allRecords : YYYPSaleRecord[] = [];
		let pageIndex = 1;

		// 分页拉取所有订单（pageSize 最大 30）
		while (true) {
			const response = await new Promise<YYYPSaleResponse>((resolve, reject) => {
				uni.request({
					url: this.YYYP_SALE_API,
					method: "POST",
					header: this.buildYYYPHeaders(token),
					data: { keys: "", orderStatus: 340, pageIndex, pageSize: PAGE_SIZE, Sessionid: deviceId },
					sslVerify: false,
					success: (res : UniApp.RequestSuccessCallbackResult) => {
						if (res.statusCode === 200) {
							const d = res.data as YYYPSaleResponse;
							if (d.code !== undefined && d.code !== 0) {
								reject(new Error(`悠悠有品接口业务错误，code: ${d.code}`));
								return;
							}
							resolve(d);
						} else {
							reject(new Error(`悠悠有品接口请求失败，状态码: ${res.statusCode}`));
						}
					},
					fail: (err : UniApp.GeneralCallbackResult) => {
						reject(new Error(`悠悠有品接口请求失败: ${err.errMsg}`));
					},
				});
			});

			const pageItems : YYYPSaleRecord[] = response?.data?.orderList || [];
			allRecords.push(...pageItems);
			console.log(`[SyncService] YYYP 第${pageIndex}页 ${pageItems.length} 条，累计 ${allRecords.length} 条`);
			if (pageItems.length < PAGE_SIZE) break;
			pageIndex++;
		}

		// 按 commodityNum 分三种情况处理
		const result : SaleItem[] = [];
		for (const order of allRecords) {
			const num = order.commodityNum ?? 1;
			const detail = order.productDetail;
			const createdAt = Math.floor((order.createOrderTime || 0) / 1000);
			const updatedAt = Math.floor((order.finishOrderTime || order.createOrderTime || 0) / 1000);

			if (num > 3) {
				// 超过 3 条：调详情接口获取 commodityVOList
				const commodityVOList = await this.fetchYYYPSellDetail(
					String(order.orderNo || ""),
					String(order.sellerUserId || ""),
					token,
				);
				for (const item of commodityVOList) {
					result.push({
						appId: "730",
						goodsId: String(detail?.commodityTemplateId || ""),
						createdAt: createdAt,
						updatedAt: updatedAt,
						price: parseFloat(String(item.price || 0)),
						fee: "",
						income: "",
						mhn: detail?.commodityHashName || "",
						name: detail?.commodityName || "",
						abrade: Number(item.abrade || 0),
						assetId: "",
						orderNo: `yyyp@${item.id || ""}`,
					});
				}
			} else if (num === 1) {
				// 单条：直接用 productDetail
				result.push({
					appId: "730",
					goodsId: String(detail?.commodityTemplateId || ""),
					createdAt: createdAt,
					updatedAt: updatedAt,
					price: this.getYYYPPrice(order),
					fee: "",
					income: "",
					mhn: detail?.commodityHashName || "",
					name: detail?.commodityName || "",
					abrade: Number(detail?.commodityAbrade || 0),
					assetId: String(detail?.assertId || ""),
					orderNo: `yyyp@${detail?.commodityId || ""}`,
				});
			} else {
				// 2-3 条：遍历 productDetailList，时间取每个 item 自身的时间戳
				const productDetailList : YYYPProductDetailItem[] = (order.productDetailList as YYYPProductDetailItem[]) || [];
				for (const item of productDetailList) {
					const itemCreatedAt = Math.floor((item.createOrderTime || 0) / 1000);
					const itemUpdatedAt = Math.floor((item.finishOrderTime || 0) / 1000);
					const rawPrice = parseFloat(String(item.price || 0));
					result.push({
						appId: "730",
						goodsId: String(item.commodityTemplateId || ""),
						createdAt: itemCreatedAt,
						updatedAt: itemUpdatedAt,
						// orderType == 1 时价格单位为分，需除以 100
						price: order.orderType === 1 ? rawPrice / 100 : rawPrice,
						fee: "",
						income: "",
						mhn: item.commodityHashName || "",
						name: item.commodityName || "",
						abrade: Number(item.commodityAbrade || 0),
						assetId: String(item.assertId || ""),
						orderNo: `yyyp@${item.commodityId || ""}`,
					});
				}
			}
		}

		return result;
	}

	/**
	 * 计算悠悠有品单条订单价格
	 * 参考项目的 getYYYPPrice 逻辑
	 */
	private static getYYYPPrice(order : YYYPSaleRecord) : number {
		const totalAmount = Number(order.totalAmount || 0);
		// orderType == 1 时单位为分，需除以 100
		return order.orderType === 1 ? totalAmount / 100 : totalAmount;
	}

	/**
	 * 调悠悠有品订单详情接口（commodityNum > 3 时使用）
	 * @param orderNo 订单号
	 * @param userId 卖家用户 ID
	 * @param token 认证 token
	 * @returns commodityVOList 列表
	 */
	private static async fetchYYYPSellDetail(
		orderNo : string,
		userId : string,
		token : string,
	) : Promise<YYYPCommodityVO[]> {
		const deviceId = this.YYYP_DEVICE.deviceId;
		const response = await new Promise<YYYPDetailResponse>((resolve, reject) => {
			uni.request({
				url: this.YYYP_DETAIL_API,
				method: "POST",
				header: this.buildYYYPHeaders(token),
				data: { orderNo, userId, Sessionid: deviceId },
				sslVerify: false,
				success: (res : UniApp.RequestSuccessCallbackResult) => {
					if (res.statusCode === 200) {
						const d = res.data as YYYPDetailResponse;
						if (d.code !== undefined && d.code !== 0) {
							reject(new Error(`悠悠有品详情接口业务错误，code: ${d.code}`));
							return;
						}
						resolve(d);
					} else {
						reject(new Error(`悠悠有品详情接口请求失败，状态码: ${res.statusCode}`));
					}
				},
				fail: (err : UniApp.GeneralCallbackResult) => {
					reject(new Error(`悠悠有品详情接口请求失败: ${err.errMsg}`));
				},
			});
		});
		return response?.data?.commodityVOList || [];
	}

	/**
	 * 从网易 BUFF 获取出售历史记录（分页拉取）
	 */
	private static async fetchBUFFSaleRecords(_steamId : string) : Promise<SaleItem[]> {
		const PAGE_SIZE = 100;
		const allItems : BUFFSaleRecord[] = [];
		let pageNum = 1;

		while (true) {
			const response = await new Promise<BUFFSaleResponse>((resolve, reject) => {
				uni.request({
					url: `${this.BUFF_SALE_API}?page_num=${pageNum}&page_size=${PAGE_SIZE}&game=csgo&appid=730&state=success`,
					method: "GET",
					success: (res : UniApp.RequestSuccessCallbackResult) => {
						if (res.statusCode === 200) {
							resolve(res.data as BUFFSaleResponse);
						} else {
							reject(new Error(`网易 BUFF 接口请求失败，状态码: ${res.statusCode}`));
						}
					},
					fail: (err : UniApp.GeneralCallbackResult) => {
						reject(new Error(`网易 BUFF 接口请求失败: ${err.errMsg}`));
					},
				});
			});

			const pageItems : BUFFSaleRecord[] = response?.data?.items || [];
			allItems.push(...pageItems);
			console.log(`[SyncService] BUFF 第${pageNum}页 ${pageItems.length} 条，累计 ${allItems.length} 条`);
			if (pageItems.length < PAGE_SIZE) break;
			pageNum++;
		}

		return allItems.map((item) => this.normalizeBUFFRecord(item));
	}

	/**
	 * 将网易 BUFF 原始记录格式化为内部中间类型
	 * 严格按参考项目字段映射
	 */
	private static normalizeBUFFRecord(record : BUFFSaleRecord) : SaleItem {
		return {
			appId: String(record.appid || "730"),
			goodsId: String(record.goods_id || ""),
			updatedAt: record.updated_at ?? "",
			createdAt: record.created_at ?? "",
			price: String(record.price || "0"),
			fee: String(record.fee || "0"),
			income: String(record.income || "0"),
			abrade: Number(record.asset_info?.paintwear || 0),
			assetId: String(record.asset_info?.assetid || ""),
			orderNo: `buff@${record.id || ""}`,
		};
	}

	/**
	 * 将数据提交至后端
	 */
	private static async submitToBackend(
		steamId : string,
		platform : PlatformType,
		items : SaleItem[],
	) : Promise<void> {
		const syncItems : SyncSaleItem[] = items.map((item) => ({
			appId: item.appId,
			goodsId: String(item.goodsId),
			updated_at: item.updatedAt,
			created_at: item.createdAt,
			price: String(item.price),
			fee: String(item.fee || ""),
			income: String(item.income || ""),
			abrade: item.abrade,
			assetId: item.assetId,
			orderNo: item.orderNo,
			mhn: item.mhn || "",
			name: item.name || "",
		}));

		const userEntry : SyncUserEntry = {
			user: { market: platform, steamId },
			items: syncItems,
		};

		const requestBody : SubmitSaleBillRequest = {
			list: [userEntry],
			steamId,
		};
		await submitSaleBillApi(requestBody);
	}
}

/**
 * 悠悠有品提现记录原始数据结构
 */
interface YYYPWithdrawRecord {
	TreadNo ?: string;
	Status ?: number;
	/** 提现金额（字符串，如 "-7457.10"） */
	ChangeMoney ?: string | number;
	/** 手续费（字符串，如 "74.58"） */
	ChargeMoney ?: string | number;
	/** 时间（如 "2026.02.02 14:02:06"） */
	AddTime ?: string;
	[key : string] : unknown;
}

/**
 * 悠悠有品提现记录接口响应（业务数据层，即 res.data）
 * 实际结构: { Data: [...], TotalCount: number, Code: number }
 */
interface YYYPWithdrawResponse {
	Data ?: YYYPWithdrawRecord[];
	TotalCount ?: number;
	Code ?: number;
	Msg ?: string;
	[key : string] : unknown;
}

/**
 * 提现同步服务（独立于销售同步）
 */
export class WithdrawSyncService {
	/** 悠悠有品提现记录接口 */
	private static readonly YYYP_WITHDRAW_API =
		"https://api.youpin898.com/api/youpin/bff/payment/v1/user/withdrawRecordList";

	/** 悠悠有品固定设备信息 */
	private static readonly YYYP_DEVICE = {
		deviceId: "aa9yril4G1UDAJIdZL+Q/3+f",
		appVersion: "5.42.3",
		userAgent: "Android/12 official com.uu898.uuhavequality/5.42.3 okhttp/4.9.3",
	};

	/**
	 * 执行悠悠有品提现同步
	 */
	static async syncYYYPWithdraw(steamId : string) : Promise<void> {
		const items = await this.fetchYYYPWithdrawRecords(steamId);
		await this.submitWithdrawToBackend(steamId, "yyyp", items);
	}

	/**
	 * 执行网易 BUFF 提现同步
	 */
	static async syncBUFFWithdraw(steamId : string) : Promise<void> {
		const items = await this.fetchBUFFWithdrawRecords();
		await this.submitWithdrawToBackend(steamId, "buff", items);
	}

	/**
	 * 构造悠悠有品请求 headers
	 */
	private static buildYYYPHeaders(token : string) : Record<string, string> {
		const deviceId = this.YYYP_DEVICE.deviceId;
		return {
			"Content-Type": "application/json; charset=utf-8",
			"Authorization": `Bearer ${token}`,
			"DeviceToken": deviceId,
			"DeviceId": deviceId,
			"Gameid": "730",
			"deviceType": "4",
			"platform": "android",
			"User-Agent": this.YYYP_DEVICE.userAgent,
			"currentTheme": "Dark",
			"package-type": "uuyp",
			"App-Version": this.YYYP_DEVICE.appVersion,
			"AppType": "7",
			"deviceBrand": "oppo",
		};
	}

	/**
	 * 格式化悠悠时间字符串为 yyyy-mm-dd hh:MM:ss
	 * 输入格式: "2026.02.02 14:02:06"
	 * 输出格式: "2026-02-02 14:02:06"
	 */
	private static formatTime(timeStr : string) : string {
		if (!timeStr) return "";
		// 将 "2026.02.02 14:02:06" 转为 "2026-02-02 14:02:06"
		return timeStr.replace(/\./g, "-").substring(0, 19);
	}

	/**
	 * 从悠悠有品分页拉取所有提现记录
	 */
	private static async fetchYYYPWithdrawRecords(steamId : string) : Promise<WithdrawSyncItem[]> {
		const authState = PlatformAuthCache.loadAuthState(steamId, "yyyp");
		if (!authState || !authState.token) {
			throw new Error("YYYP_TOKEN_NOT_FOUND");
		}

		const token = authState.token;
		const deviceId = this.YYYP_DEVICE.deviceId;
		const PAGE_SIZE = 30;
		const allRecords : YYYPWithdrawRecord[] = [];
		let pageIndex = 1;

		// 分页拉取全部记录
		while (true) {
			const response = await new Promise<YYYPWithdrawResponse>((resolve, reject) => {
				uni.request({
					url: this.YYYP_WITHDRAW_API,
					method: "POST",
					header: this.buildYYYPHeaders(token),
					data: {
						RecordType: 2,
						Sessionid: deviceId,
						DeviceToken: deviceId,
						StatusType: 0,
						source: 2,
						isonlywithDraw: 0,
						PageIndex: pageIndex,
						PageSize: PAGE_SIZE,
						isOnlyWithDraw: 0,
					},
					sslVerify: false,
					success: (res : UniApp.RequestSuccessCallbackResult) => {
						console.log(res)
						if (res.statusCode === 200) {
							const d = res.data as YYYPWithdrawResponse;
							// 业务错误判断：Code !== 0
							if (d.Code !== undefined && d.Code !== 0) {
								reject(new Error(`悠悠有品提现接口业务错误，code: ${d.Code}`));
								return;
							}
							resolve(d);
						} else {
							reject(new Error(`悠悠有品提现接口请求失败，状态码: ${res.statusCode}`));
						}
					},
					fail: (err : UniApp.GeneralCallbackResult) => {
						reject(new Error(`悠悠有品提现接口请求失败: ${err.errMsg}`));
					},
				});
			});

			// response 即业务数据层，Data 和 TotalCount 直接在顶层
			const pageItems : YYYPWithdrawRecord[] = response?.Data || [];
			allRecords.push(...pageItems);
			const totalCount = response?.TotalCount ?? 0;
			console.log(`[WithdrawSyncService] YYYP 提现第${pageIndex}页 ${pageItems.length} 条，累计 ${allRecords.length}/${totalCount} 条`);
			if (allRecords.length >= totalCount || pageItems.length < PAGE_SIZE) break;
			pageIndex++;
		}

		// 只取 Status == 1 的记录，映射为上传格式
		const result : WithdrawSyncItem[] = [];
		for (const item of allRecords) {
			if (item.Status === 1) {
				result.push({
					amount: Math.abs(Number(item.ChangeMoney || 0)),
					created: this.formatTime(String(item.AddTime || "")),
					fee: Number(item.ChargeMoney || 0),
					id: String(item.TreadNo || ""),
				});
			}
		}

		return result;
	}

	/**
	 * 将提现记录提交至后端
	 */
	private static async submitWithdrawToBackend(
		steamId : string,
		platform : string,
		items : WithdrawSyncItem[],
	) : Promise<void> {
		const userEntry : WithdrawSyncUserEntry = {
			user: { market: platform, steamId },
			items,
		};

		const requestBody : SubmitWithdrawRequest = {
			list: [userEntry],
			steamId,
		};

		await submitWithdrawApi(requestBody);
	}

	/**
	 * 格式化秒级时间戳为 yyyy-mm-dd hh:MM:ss
	 */
	private static formatTimestamp(ts : number) : string {
		const d = new Date(ts * 1000);
		const pad = (n : number) => String(n).padStart(2, "0");
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
	}

	/**
	 * 从网易 BUFF 分年段拉取所有提现记录
	 * 按年份分段（2021 至当前年），每段内分页拉取
	 */
	private static async fetchBUFFWithdrawRecords() : Promise<WithdrawSyncItem[]> {
		const PAGE_SIZE = 200;
		const allItems : WithdrawSyncItem[] = [];
		const currentYear = new Date().getFullYear();

		for (let year = 2021; year <= currentYear; year++) {
			const startTime = Math.floor(new Date(`${year}-01-01T00:00:00`).getTime() / 1000);
			const endTime = Math.floor(new Date(`${year}-12-31T23:59:59`).getTime() / 1000);
			let pageNum = 1;

			while (true) {
				const res = await new Promise<UniApp.RequestSuccessCallbackResult>((resolve, reject) => {
					uni.request({
						method: "GET",
						url: `https://buff.163.com/api/asset/withdraw_log/?page_num=${pageNum}&page_size=${PAGE_SIZE}&start_time=${startTime}&end_time=${endTime}&state=success`,
						header: { Host: "buff.163.com" },
						dataType: "json",
						success: (r : UniApp.RequestSuccessCallbackResult) => resolve(r),
						fail: (err : UniApp.GeneralCallbackResult) => reject(new Error(`BUFF 提现接口请求失败: ${err.errMsg}`)),
					});
				});

				if (res.statusCode !== 200) break;

				const body = res.data as {
					code ?: string;
					data ?: {
						total_count ?: number;
						total_page ?: number;
						items ?: Array<{
							id ?: string | number;
							amount ?: string | number;
							fee ?: string | number;
							created_at ?: number;
							[key : string] : unknown;
						}>;
					};
				};

				if (body.code !== "OK") break;

				const data = body.data;
				if (!data || (data.total_count === 0 && data.total_page === 0)) break;

				const items = data.items || [];
				for (const item of items) {
					allItems.push({
						id: String(item.id || ""),
						amount: Number(item.amount || 0),
						fee: Number(item.fee || 0),
						created: this.formatTimestamp(Number(item.created_at || 0)),
					});
				}

				console.log(`[WithdrawSyncService] BUFF ${year}年 第${pageNum}页 ${items.length} 条，累计 ${allItems.length} 条`);

				if (pageNum >= (data.total_page ?? 1)) break;
				pageNum++;
			}
		}

		return allItems;
	}
}
