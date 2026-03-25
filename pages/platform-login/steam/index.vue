<template>
	<view class="page">
		<!-- 顶部紫色 header -->
		<view class="header-section">
			<!-- 返回按钮 -->
			<view class="back-btn" @click="handleBack">
				<text class="back-icon">‹</text>
			</view>
			<!-- Logo 区域 -->
			<view class="logo-circle">
				<text class="logo-text">S</text>
			</view>
			<text class="header-title">{{ t('steamAuth.pageTitle') }}</text>
		</view>

		<!-- 内容卡片区域 -->
		<scroll-view class="scroll-area" scroll-y>
			<view class="content">

				<!-- 登录表单卡片 -->
				<view v-if="!showMethodChoice && !showGuardCode" class="card">
					<view class="input-group">
						<text class="input-label">{{ t('steamAuth.accountLabel') }}</text>
						<input
							class="form-input"
							type="text"
							v-model="steamAccount"
							:placeholder="t('steamAuth.accountPlaceholder')"
							placeholder-class="input-placeholder"
						/>
					</view>
					<view class="input-group">
						<text class="input-label">{{ t('steamAuth.passwordLabel') }}</text>
						<input
							class="form-input"
							type="password"
							v-model="steamPassword"
							:placeholder="t('steamAuth.passwordPlaceholder')"
							placeholder-class="input-placeholder"
						/>
					</view>
					<button class="primary-btn" :disabled="loading" @click="handleLogin">
						<text v-if="!loading">{{ t('steamAuth.loginButton') }}</text>
						<text v-else>{{ t('steamAuth.loggingIn') }}</text>
					</button>
					<text class="disclaimer">{{ t('steamAuth.disclaimer') }}</text>
				</view>

				<!-- 选择验证方式卡片 -->
				<view v-if="showMethodChoice" class="card method-card">
					<view class="method-icon-row">
						<view class="method-icon-circle">
							<text class="method-icon">🔐</text>
						</view>
					</view>
					<text class="card-title">{{ t('steamAuth.chooseMethodTitle') }}</text>
					<text class="card-subtitle">{{ t('steamAuth.chooseMethodSubtitle') }}</text>
					<view class="method-btn-list">
						<view class="method-option" @click="onChoosePhone">
							<view class="method-option-left">
								<text class="method-option-icon">📱</text>
								<text class="method-option-text">{{ t('steamAuth.chooseMethodPhone') }}</text>
							</view>
							<text class="method-option-arrow">›</text>
						</view>
						<view class="method-divider"></view>
						<view class="method-option" @click="onChooseCode">
							<view class="method-option-left">
								<text class="method-option-icon">🔑</text>
								<text class="method-option-text">{{ t('steamAuth.chooseMethodCode') }}</text>
							</view>
							<text class="method-option-arrow">›</text>
						</view>
					</view>
				</view>

				<!-- 手机确认弹窗（自定义，替代系统 uni.showModal） -->
				<view v-if="showPhoneConfirm" class="modal-overlay" @click.self="onPhoneConfirmCancel">
					<view class="modal-card">
						<view class="modal-icon-row">
							<view class="modal-icon-circle">
								<text class="modal-icon">📱</text>
							</view>
						</view>
						<text class="modal-title">{{ t('steamAuth.phoneConfirmTitle') }}</text>
						<text class="modal-content">{{ t('steamAuth.phoneConfirmContent') }}</text>
						<view class="modal-actions">
							<view class="modal-btn modal-btn-cancel" @click="onPhoneConfirmCancel">
								<text>{{ t('common.cancel') }}</text>
							</view>
							<view class="modal-btn modal-btn-confirm" @click="onPhoneConfirmOk">
								<text>{{ t('steamAuth.phoneConfirmButton') }}</text>
							</view>
						</view>
					</view>
				</view>

				<!-- 验证码输入卡片 -->
				<view v-if="showGuardCode" class="card">
					<view class="method-icon-row">
						<view class="method-icon-circle">
							<text class="method-icon">🔑</text>
						</view>
					</view>
					<text class="card-title">{{ t('steamAuth.guardCodeTitle') }}</text>
					<text class="guard-hint">{{ t('steamAuth.guardCodeHint') }}</text>
					<view class="input-group">
						<input
							class="form-input code-input"
							type="text"
							v-model="guardCode"
							:placeholder="t('steamAuth.guardCodePlaceholder')"
							placeholder-class="input-placeholder"
							maxlength="5"
						/>
					</view>
					<button class="primary-btn" :disabled="loading" @click="handleGuardCodeSubmit">
						<text v-if="!loading">{{ t('steamAuth.guardCodeSubmit') }}</text>
						<text v-else>{{ t('steamAuth.verifying') }}</text>
					</button>
					<button class="ghost-btn" @click="backToMethodChoice">
						{{ t('steamAuth.backToChoice') }}
					</button>
				</view>

			</view>
		</scroll-view>
	</view>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { onLoad } from '@dcloudio/uni-app'
	import { useI18n } from 'vue-i18n'
	import {
		getRsaPublicKeyApi,
		decryptPasswordApi,
		beginAuthSessionApi,
		updateSteamGuardCodeApi,
		pollAuthSessionApi,
		uploadTokenApi
	} from '@/api/modules/equipment-sales/steam-auth.service'
	import type { DecryptPasswordRequest } from '@/api/modules/equipment-sales/interface/steamAuthRequest'

	const { t } = useI18n()

	// 路由参数
	const steamId = ref<string>('')

	// 表单数据
	const steamAccount = ref<string>('')
	const steamPassword = ref<string>('')

	// 加载状态
	const loading = ref<boolean>(false)

	// 选择验证方式状态
	const showMethodChoice = ref<boolean>(false)
	// 暂存 beginAuthSession 返回的 client_id / request_id，供用户选择后使用
	const pendingClientId = ref<string>('')
	const pendingRequestId = ref<string>('')

	// 验证码确认相关状态
	const showGuardCode = ref<boolean>(false)
	const guardCode = ref<string>('')
	const authClientId = ref<string>('')
	const authRequestId = ref<string>('')

	// 手机确认弹窗状态
	const showPhoneConfirm = ref<boolean>(false)
	// 弹窗 Promise 的 resolve/reject，供确认/取消回调使用
	let phoneConfirmResolve: (() => void) | null = null
	let phoneConfirmReject: ((e: unknown) => void) | null = null

	// 读取路由参数
	onLoad((options) => {
		steamId.value = (options as Record<string, string>)?.steamId || ''
	})

	/**
	 * 返回上一页
	 */
	function handleBack(): void {
		uni.navigateBack()
	}

	/**
	 * 返回验证方式选择
	 */
	function backToMethodChoice(): void {
		showGuardCode.value = false
		showMethodChoice.value = true
	}

	/**
	 * 登录成功处理
	 */
	function handleLoginSuccess(): void {
		uni.showToast({ title: t('steamAuth.loginSuccess'), icon: 'success', duration: 2000 })
		setTimeout(() => uni.navigateBack(), 2000)
	}

	/**
	 * 统一错误提示
	 */
	function showError(e: unknown): void {
		const errorCode = (e as Error).message
		const knownErrors = ['getRsaKeyFailed', 'encryptPasswordFailed', 'beginSessionFailed', 'pollSessionFailed', 'uploadTokenFailed', 'guardCodeFailed']
		const title = knownErrors.includes(errorCode) ? t('steamAuth.' + errorCode) : t('steamAuth.unknownError')
		uni.showToast({ title, icon: 'none' })
	}

	/**
	 * 登录入口：校验表单后发起登录流程
	 */
	async function handleLogin(): Promise<void> {
		if (!steamAccount.value.trim()) {
			uni.showToast({ title: t('steamAuth.accountRequired'), icon: 'none' })
			return
		}
		if (!steamPassword.value.trim()) {
			uni.showToast({ title: t('steamAuth.passwordRequired'), icon: 'none' })
			return
		}

		loading.value = true

		try {
			// 步骤 1：获取 RSA 公钥
			const rsaKey = await getRsaPublicKeyApi(steamAccount.value)
			const { publickey_mod, publickey_exp, timestamp } = rsaKey

			// 步骤 2：加密密码
			const params: DecryptPasswordRequest = {
				account: steamAccount.value,
				password: steamPassword.value,
				publickey_mod,
				publickey_exp
			}
			const decryptResult = await decryptPasswordApi(params)
			const encrypted_password = decryptResult.password

			// 步骤 3：发起认证会话
			const authSession = await beginAuthSessionApi({
				persistence: '1',
				encrypted_password,
				account_name: steamAccount.value,
				encryption_timestamp: timestamp
			})

			const { client_id, request_id, allowed_confirmations } = authSession
			const codeConfirm = allowed_confirmations.find(c => c.confirmation_type === 2)
			const phoneConfirm = allowed_confirmations.find(c => c.confirmation_type === 3)

			// 暂存会话信息
			pendingClientId.value = client_id
			pendingRequestId.value = request_id

			if (phoneConfirm) {
				// 有手机确认选项，展示选择区域让用户决定
				showMethodChoice.value = true
				loading.value = false
			} else if (codeConfirm) {
				// 仅支持验证码，直接进入验证码模式
				enterGuardCodeMode(client_id, request_id)
			}
		} catch (e) {
			showError(e)
		} finally {
			if (!showMethodChoice.value && !showGuardCode.value) {
				loading.value = false
			}
		}
	}

	/**
	 * 用户选择手机 App 确认
	 */
	async function onChoosePhone(): Promise<void> {
		showMethodChoice.value = false
		await handlePhoneConfirmBranch(pendingClientId.value, pendingRequestId.value)
	}

	/**
	 * 用户选择验证码确认
	 */
	function onChooseCode(): void {
		showMethodChoice.value = false
		enterGuardCodeMode(pendingClientId.value, pendingRequestId.value)
	}

	/**
	 * 进入验证码输入模式
	 */
	function enterGuardCodeMode(clientId: string, requestId: string): void {
		showGuardCode.value = true
		authClientId.value = clientId
		authRequestId.value = requestId
		loading.value = false
	}

	/**
	 * 手机确认分支：显示自定义弹窗，等待用户操作
	 */
	async function handlePhoneConfirmBranch(clientId: string, requestId: string): Promise<void> {
		showPhoneConfirm.value = true
		return new Promise((resolve, reject) => {
			phoneConfirmResolve = resolve
			phoneConfirmReject = reject
		})
	}

	/**
	 * 用户点击"手机已确认"
	 */
	async function onPhoneConfirmOk(): Promise<void> {
		showPhoneConfirm.value = false
		loading.value = true
		try {
			// 步骤 5：轮询认证状态
			const pollResult = await pollAuthSessionApi({ client_id: pendingClientId.value, request_id: pendingRequestId.value })
			const { access_token, refresh_token } = pollResult

			// 步骤 6：上传 Token 到后端
			await uploadTokenApi({ steamId: steamId.value, token: access_token, freshToken: refresh_token })
			handleLoginSuccess()
			phoneConfirmResolve?.()
		} catch (e) {
			showError(e)
			phoneConfirmReject?.(e)
		} finally {
			loading.value = false
		}
	}

	/**
	 * 用户点击"取消"
	 */
	function onPhoneConfirmCancel(): void {
		showPhoneConfirm.value = false
		phoneConfirmResolve?.()
	}

	/**
	 * 验证码提交处理
	 */
	async function handleGuardCodeSubmit(): Promise<void> {
		if (!guardCode.value.trim()) {
			uni.showToast({ title: t('steamAuth.guardCodeRequired'), icon: 'none' })
			return
		}

		loading.value = true

		try {
			// 步骤 4：上传验证码（code_type 固定为 3，表示 Steam Guard 移动端验证码）
			await updateSteamGuardCodeApi({
				client_id: authClientId.value,
				request_id: authRequestId.value,
				code: guardCode.value,
				code_type: 3
			})
			// 步骤 5：轮询认证状态
			const pollResult = await pollAuthSessionApi({
				client_id: authClientId.value,
				request_id: authRequestId.value
			})
			const { access_token, refresh_token } = pollResult

			// 步骤 6：上传 Token 到后端
			await uploadTokenApi({ steamId: steamId.value, token: access_token, freshToken: refresh_token })
			handleLoginSuccess()
		} catch (e) {
			showError(e)
			// 验证码错误时保持验证码输入区域可见
			if ((e as Error).message === 'guardCodeFailed') {
				showGuardCode.value = true
			}
		} finally {
			loading.value = false
		}
	}
</script>

<style lang="scss" scoped>
	/* ===== 页面基础 ===== */
	.page {
		min-height: 100vh;
		background-color: #f5f7fa;
		display: flex;
		flex-direction: column;
	}

	/* ===== 顶部紫色 header ===== */
	.header-section {
		background: linear-gradient(135deg, #7C3AED 0%, #A855F7 100%);
		padding: 80rpx 30rpx 60rpx;
		border-radius: 0 0 40rpx 40rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		position: relative;
	}

	.back-btn {
		position: absolute;
		top: 80rpx;
		left: 30rpx;
		width: 64rpx;
		height: 64rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.back-icon {
		font-size: 48rpx;
		color: #ffffff;
		line-height: 1;
		margin-top: -4rpx;
	}

	.logo-circle {
		width: 120rpx;
		height: 120rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.2);
		border: 3rpx solid rgba(255, 255, 255, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 20rpx;
	}

	.logo-text {
		font-size: 64rpx;
		font-weight: 700;
		color: #ffffff;
		line-height: 1;
	}

	.header-title {
		font-size: 36rpx;
		font-weight: 700;
		color: #ffffff;
	}

	/* ===== 滚动区域 ===== */
	.scroll-area {
		flex: 1;
	}

	.content {
		padding: 30rpx;
		margin-top: -20rpx;
	}

	/* ===== 白色卡片 ===== */
	.card {
		background-color: #ffffff;
		border-radius: 20rpx;
		padding: 40rpx 30rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
	}

	/* ===== 输入组 ===== */
	.input-group {
		margin-bottom: 28rpx;
	}

	.input-label {
		display: block;
		font-size: 26rpx;
		color: #6B7280;
		margin-bottom: 12rpx;
	}

	.form-input {
		width: 100%;
		height: 88rpx;
		background-color: #F9FAFB;
		border: 1rpx solid #E5E7EB;
		border-radius: 12rpx;
		padding: 0 24rpx;
		font-size: 30rpx;
		color: #1F2937;
		box-sizing: border-box;
	}

	.code-input {
		text-align: center;
		font-size: 48rpx;
		font-weight: 700;
		letter-spacing: 16rpx;
	}

	.input-placeholder {
		color: #9CA3AF;
	}

	/* ===== 主按钮 ===== */
	.primary-btn {
		width: 100%;
		height: 88rpx;
		border-radius: 44rpx;
		background: linear-gradient(135deg, #7C3AED 0%, #A855F7 100%);
		border: none;
		color: #ffffff;
		font-size: 32rpx;
		font-weight: 600;
		margin-top: 8rpx;
		box-shadow: 0 8rpx 24rpx rgba(124, 58, 237, 0.35);

		&[disabled] {
			opacity: 0.6;
		}
	}

	/* ===== 幽灵按钮 ===== */
	.ghost-btn {
		width: 100%;
		height: 80rpx;
		border-radius: 40rpx;
		background: transparent;
		border: none;
		color: #9CA3AF;
		font-size: 28rpx;
		margin-top: 8rpx;
	}

	/* ===== 免责声明 ===== */
	.disclaimer {
		display: block;
		font-size: 22rpx;
		color: #9CA3AF;
		line-height: 1.6;
		margin-top: 28rpx;
		text-align: center;
	}

	/* ===== 选择验证方式卡片 ===== */
	.method-card {
		text-align: center;
	}

	.method-icon-row {
		display: flex;
		justify-content: center;
		margin-bottom: 24rpx;
	}

	.method-icon-circle {
		width: 100rpx;
		height: 100rpx;
		border-radius: 50%;
		background: #F3E8FF;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.method-icon {
		font-size: 48rpx;
	}

	.card-title {
		display: block;
		font-size: 34rpx;
		font-weight: 700;
		color: #1F2937;
		margin-bottom: 10rpx;
	}

	.card-subtitle {
		display: block;
		font-size: 26rpx;
		color: #6B7280;
		margin-bottom: 36rpx;
		line-height: 1.5;
	}

	/* ===== 方式选项列表 ===== */
	.method-btn-list {
		background-color: #F9FAFB;
		border-radius: 16rpx;
		overflow: hidden;
		border: 1rpx solid #E5E7EB;
	}

	.method-option {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 32rpx 28rpx;

		.method-option-left {
			display: flex;
			align-items: center;
			gap: 20rpx;
		}

		.method-option-icon {
			font-size: 40rpx;
		}

		.method-option-text {
			font-size: 30rpx;
			font-weight: 500;
			color: #1F2937;
		}

		.method-option-arrow {
			font-size: 40rpx;
			color: #9CA3AF;
		}
	}

	.method-divider {
		height: 1rpx;
		background-color: #E5E7EB;
		margin: 0 28rpx;
	}

	/* ===== 验证码提示 ===== */
	.guard-hint {
		display: block;
		font-size: 26rpx;
		color: #6B7280;
		line-height: 1.6;
		margin-bottom: 28rpx;
		text-align: left;
	}

	/* ===== 自定义弹窗 ===== */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 999;
		padding: 40rpx;
	}

	.modal-card {
		background: #ffffff;
		border-radius: 24rpx;
		padding: 48rpx 40rpx 36rpx;
		width: 100%;
		box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.15);
	}

	.modal-icon-row {
		display: flex;
		justify-content: center;
		margin-bottom: 28rpx;
	}

	.modal-icon-circle {
		width: 96rpx;
		height: 96rpx;
		border-radius: 50%;
		background: #F3E8FF;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal-icon {
		font-size: 44rpx;
	}

	.modal-title {
		display: block;
		font-size: 34rpx;
		font-weight: 700;
		color: #1F2937;
		text-align: center;
		margin-bottom: 16rpx;
	}

	.modal-content {
		display: block;
		font-size: 28rpx;
		color: #6B7280;
		text-align: center;
		line-height: 1.6;
		margin-bottom: 48rpx;
	}

	.modal-actions {
		display: flex;
		gap: 20rpx;
	}

	.modal-btn {
		flex: 1;
		height: 80rpx;
		border-radius: 40rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 30rpx;
		font-weight: 500;

		&.modal-btn-cancel {
			background: #F3F4F6;
			color: #6B7280;
		}

		&.modal-btn-confirm {
			background: linear-gradient(135deg, #7C3AED 0%, #A855F7 100%);
			color: #ffffff;
		}
	}
</style>
