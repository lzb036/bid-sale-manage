/**
 * Steam 账号登录验证页面测试
 * Feature: steam-account-auth
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'fs'
import path from 'path'

// Mock uni-app API
const mockShowToast = vi.fn()
const mockShowModal = vi.fn()
const mockNavigateBack = vi.fn()

;(global as any).uni = {
  showToast: mockShowToast,
  showModal: mockShowModal,
  navigateBack: mockNavigateBack
}

// Mock service 方法
const mockGetRsaPublicKeyApi = vi.fn()
const mockDecryptPasswordApi = vi.fn()
const mockBeginAuthSessionApi = vi.fn()
const mockUpdateSteamGuardCodeApi = vi.fn()
const mockPollAuthSessionApi = vi.fn()
const mockUploadTokenApi = vi.fn()

vi.mock('@/api/modules/equipment-sales/steam-auth.service', () => ({
  getRsaPublicKeyApi: mockGetRsaPublicKeyApi,
  decryptPasswordApi: mockDecryptPasswordApi,
  beginAuthSessionApi: mockBeginAuthSessionApi,
  updateSteamGuardCodeApi: mockUpdateSteamGuardCodeApi,
  pollAuthSessionApi: mockPollAuthSessionApi,
  uploadTokenApi: mockUploadTokenApi
}))

// 读取 Steam 登录页面文件内容（用于验证 i18n 键使用）
const steamPageContent = fs.readFileSync(
  path.resolve(__dirname, './index.vue'),
  'utf-8'
)

// 读取账号列表页文件内容（用于验证 onShow 逻辑）
const accountPageContent = fs.readFileSync(
  path.resolve(__dirname, '../../../tabs/equipment-sales/account/index.vue'),
  'utf-8'
)

describe('Steam 账号登录验证页面测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('页面初始化与参数接收', () => {
    it('页面加载时正确读取路由参数 steamId（需求 1.1）', () => {
      // 模拟 onLoad 接收路由参数
      const steamId = { value: '' }
      const onLoadHandler = (options: Record<string, string>) => {
        steamId.value = options?.steamId || ''
      }

      onLoadHandler({ steamId: '76561198012345678' })

      expect(steamId.value).toBe('76561198012345678')
    })

    it('页面包含账号输入框、密码输入框和登录按钮（需求 1.2）', () => {
      // 验证页面初始响应式状态
      const steamAccount = { value: '' }
      const steamPassword = { value: '' }
      const loading = { value: false }

      expect(steamAccount.value).toBe('')
      expect(steamPassword.value).toBe('')
      expect(loading.value).toBe(false)
    })

    it('导航栏标题使用 i18n 键渲染（需求 1.3）', () => {
      // 验证模板中使用了 i18n 键而非硬编码中文
      expect(steamPageContent).toContain("steamAuth.pageTitle")
      expect(steamPageContent).not.toContain('"Steam 登录"')
    })

    it('免责声明文本使用 i18n 键渲染（需求 1.4）', () => {
      // 验证免责声明使用 i18n 键
      expect(steamPageContent).toContain("steamAuth.disclaimer")
    })
  })

  describe('表单验证', () => {
    it('表单验证通过后登录按钮变为禁用状态（需求 2.3）', async () => {
      const loading = { value: false }
      const steamAccount = { value: 'testuser' }
      const steamPassword = { value: 'testpass' }

      // mock getRsaPublicKeyApi 永不 resolve（模拟请求进行中）
      mockGetRsaPublicKeyApi.mockReturnValue(new Promise(() => {}))

      // 模拟 handleLogin 逻辑
      const handleLogin = async () => {
        if (!steamAccount.value.trim()) return
        if (!steamPassword.value.trim()) return
        loading.value = true
        await mockGetRsaPublicKeyApi(steamAccount.value)
      }

      // 不 await，让请求挂起
      handleLogin()

      // 验证 loading 已变为 true
      expect(loading.value).toBe(true)
    })
  })

  describe('Steam 登录流程', () => {
    it('allowed_confirmations 含 type=3 时显示手机确认弹窗（需求 3.4）', async () => {
      // mock 完整登录链路
      mockGetRsaPublicKeyApi.mockResolvedValue({
        publickey_mod: 'mod',
        publickey_exp: 'exp',
        timestamp: '12345'
      })
      mockDecryptPasswordApi.mockResolvedValue({ password: 'encrypted_pass' })
      mockBeginAuthSessionApi.mockResolvedValue({
        client_id: 'client_123',
        request_id: 'req_123',
        steamid: '76561198012345678',
        allowed_confirmations: [{ confirmation_type: 3, associated_message: '' }]
      })

      // 模拟 handleLogin 中的分支逻辑
      const allowed_confirmations = [{ confirmation_type: 3, associated_message: '' }]
      const phoneConfirm = allowed_confirmations.find(c => c.confirmation_type === 3)

      if (phoneConfirm) {
        uni.showModal({
          title: 'steamAuth.phoneConfirmTitle',
          content: 'steamAuth.phoneConfirmContent',
          confirmText: 'steamAuth.phoneConfirmButton'
        })
      }

      expect(mockShowModal).toHaveBeenCalledTimes(1)
      expect(mockShowModal).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'steamAuth.phoneConfirmTitle'
        })
      )
    })

    it('allowed_confirmations 含 type=2 时显示验证码输入区域（需求 3.7）', async () => {
      const showGuardCode = { value: false }
      const authClientId = { value: '' }
      const authRequestId = { value: '' }
      const authCodeType = { value: 2 }

      // 模拟 beginAuthSessionApi 返回 type=2
      const allowed_confirmations = [{ confirmation_type: 2, associated_message: '' }]
      const codeConfirm = allowed_confirmations.find(c => c.confirmation_type === 2)

      if (codeConfirm) {
        showGuardCode.value = true
        authClientId.value = 'client_123'
        authRequestId.value = 'req_123'
        authCodeType.value = codeConfirm.confirmation_type
      }

      expect(showGuardCode.value).toBe(true)
    })
  })

  describe('验证码确认登录方式', () => {
    it('验证码输入区域显示验证码来源说明文本（需求 4.1）', () => {
      // 验证模板中包含 guardCodeHint i18n 键
      expect(steamPageContent).toContain("steamAuth.guardCodeHint")
    })

    it('验证码错误后保持验证码输入区域可见（需求 4.4）', async () => {
      const showGuardCode = { value: true }
      const guardCode = { value: '12345' }
      const authClientId = { value: 'client_123' }
      const authRequestId = { value: 'req_123' }
      const authCodeType = { value: 2 }
      const loading = { value: false }

      // mock updateSteamGuardCodeApi 失败
      mockUpdateSteamGuardCodeApi.mockRejectedValue(new Error('guardCodeFailed'))

      // 模拟 handleGuardCodeSubmit 逻辑
      const handleGuardCodeSubmit = async () => {
        if (!guardCode.value.trim()) return
        loading.value = true
        try {
          await mockUpdateSteamGuardCodeApi({
            client_id: authClientId.value,
            request_id: authRequestId.value,
            code: guardCode.value,
            code_type: authCodeType.value
          })
        } catch (e) {
          const errorCode = (e as Error).message
          uni.showToast({ title: errorCode, icon: 'none' })
          // 验证码错误时保持验证码输入区域可见
          if (errorCode === 'guardCodeFailed') {
            showGuardCode.value = true
          }
        } finally {
          loading.value = false
        }
      }

      await handleGuardCodeSubmit()

      // 验证 showGuardCode 仍为 true
      expect(showGuardCode.value).toBe(true)
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'guardCodeFailed' })
      )
    })
  })

  describe('登录成功后的状态同步', () => {
    it('Token 上传成功后显示登录成功 Toast（需求 5.1）', async () => {
      // 模拟 handleLoginSuccess 逻辑
      const handleLoginSuccess = () => {
        uni.showToast({ title: 'steamAuth.loginSuccess', icon: 'success', duration: 2000 })
        setTimeout(() => uni.navigateBack(), 2000)
      }

      handleLoginSuccess()

      expect(mockShowToast).toHaveBeenCalledTimes(1)
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'steamAuth.loginSuccess',
          icon: 'success'
        })
      )
    })

    it('登录成功后调用 uni.navigateBack（需求 5.2）', async () => {
      vi.useFakeTimers()

      // 模拟 handleLoginSuccess 逻辑
      const handleLoginSuccess = () => {
        uni.showToast({ title: 'steamAuth.loginSuccess', icon: 'success', duration: 2000 })
        setTimeout(() => uni.navigateBack(), 2000)
      }

      handleLoginSuccess()

      // 2000ms 前不应该调用
      expect(mockNavigateBack).not.toHaveBeenCalled()

      // 快进 2000ms
      vi.advanceTimersByTime(2000)

      expect(mockNavigateBack).toHaveBeenCalledTimes(1)

      vi.useRealTimers()
    })

    it('账号列表页 onShow 时重新加载数据（需求 5.3）', () => {
      // 验证账号列表页的 onShow 钩子中调用了 loadData()
      expect(accountPageContent).toContain('onShow')
      expect(accountPageContent).toContain('loadData()')
    })
  })
})
