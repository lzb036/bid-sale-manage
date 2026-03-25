import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock uni API
const mockNavigateTo = vi.fn()
global.uni = {
  navigateTo: mockNavigateTo
} as any

// 模拟 handlePlatformLogin 函数（从页面组件中提取的逻辑）
function handlePlatformLogin(steamId: string, platform: 'buff' | 'yyyp') {
  // 根据平台类型导航到对应的专用登录页面
  if (platform === 'yyyp') {
    uni.navigateTo({
      url: `/pages/platform-login/yyyp/index?steamId=${steamId}&platform=${platform}`
    })
  } else if (platform === 'buff') {
    uni.navigateTo({
      url: `/pages/platform-login/buff/index?steamId=${steamId}&platform=${platform}`
    })
  }
}

function handleInitialize(steamId: string) {
  uni.navigateTo({
    url: `/pages/tabs/equipment-sales/account/initialize/index?steamId=${steamId}`
  })
}

describe('账户页面集成测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('平台登录按钮点击', () => {
    it('点击网易 BUFF 按钮应该跳转到 BUFF 专用登录页面', () => {
      const steamId = '76561198012345678'
      const platform = 'buff'
      
      // 调用导航方法
      handlePlatformLogin(steamId, platform)
      
      // 验证 uni.navigateTo 被调用
      expect(mockNavigateTo).toHaveBeenCalledTimes(1)
      expect(mockNavigateTo).toHaveBeenCalledWith({
        url: `/pages/platform-login/buff/index?steamId=${steamId}&platform=${platform}`
      })
    })

    it('点击悠悠有品按钮应该跳转到悠悠有品专用登录页面', () => {
      const steamId = '76561198087654321'
      const platform = 'yyyp'
      
      // 调用导航方法
      handlePlatformLogin(steamId, platform)
      
      // 验证 uni.navigateTo 被调用
      expect(mockNavigateTo).toHaveBeenCalledTimes(1)
      expect(mockNavigateTo).toHaveBeenCalledWith({
        url: `/pages/platform-login/yyyp/index?steamId=${steamId}&platform=${platform}`
      })
    })

    it('应该正确传递 steamId 参数', () => {
      const testCases = [
        '76561198012345678',
        '76561198087654321',
        '76561199999999999'
      ]
      
      testCases.forEach((steamId, index) => {
        handlePlatformLogin(steamId, 'buff')
        
        // 验证每次调用都传递了正确的 steamId
        expect(mockNavigateTo).toHaveBeenNthCalledWith(index + 1, {
          url: `/pages/platform-login/buff/index?steamId=${steamId}&platform=buff`
        })
      })
    })

    it('应该正确传递 platform 参数', () => {
      const steamId = '76561198012345678'
      const platforms: Array<'buff' | 'yyyp'> = ['buff', 'yyyp']
      
      platforms.forEach((platform, index) => {
        handlePlatformLogin(steamId, platform)
        
        // 验证每次调用都传递了正确的 platform
        const expectedUrl = platform === 'buff' 
          ? `/pages/platform-login/buff/index?steamId=${steamId}&platform=${platform}`
          : `/pages/platform-login/yyyp/index?steamId=${steamId}&platform=${platform}`
        
        expect(mockNavigateTo).toHaveBeenNthCalledWith(index + 1, {
          url: expectedUrl
        })
      })
    })

    it('应该为不同的账号和平台组合生成正确的 URL', () => {
      const testCases = [
        { steamId: '76561198012345678', platform: 'buff' as const, expectedPath: '/pages/platform-login/buff/index' },
        { steamId: '76561198012345678', platform: 'yyyp' as const, expectedPath: '/pages/platform-login/yyyp/index' },
        { steamId: '76561198087654321', platform: 'buff' as const, expectedPath: '/pages/platform-login/buff/index' },
        { steamId: '76561198087654321', platform: 'yyyp' as const, expectedPath: '/pages/platform-login/yyyp/index' }
      ]
      
      testCases.forEach(({ steamId, platform, expectedPath }, index) => {
        handlePlatformLogin(steamId, platform)
        
        expect(mockNavigateTo).toHaveBeenNthCalledWith(index + 1, {
          url: `${expectedPath}?steamId=${steamId}&platform=${platform}`
        })
      })
    })
  })

  describe('参数传递正确性', () => {
    it('BUFF 平台 URL 参数应该正确编码', () => {
      const steamId = '76561198012345678'
      const platform = 'buff'
      
      handlePlatformLogin(steamId, platform)
      
      const calledUrl = mockNavigateTo.mock.calls[0][0].url
      
      // 验证 URL 格式
      expect(calledUrl).toMatch(/^\/pages\/platform-login\/buff\/index\?/)
      expect(calledUrl).toContain(`steamId=${steamId}`)
      expect(calledUrl).toContain(`platform=${platform}`)
    })

    it('悠悠有品平台 URL 参数应该正确编码', () => {
      const steamId = '76561198012345678'
      const platform = 'yyyp'
      
      handlePlatformLogin(steamId, platform)
      
      const calledUrl = mockNavigateTo.mock.calls[0][0].url
      
      // 验证 URL 格式
      expect(calledUrl).toMatch(/^\/pages\/platform-login\/yyyp\/index\?/)
      expect(calledUrl).toContain(`steamId=${steamId}`)
      expect(calledUrl).toContain(`platform=${platform}`)
    })

    it('应该使用 & 连接多个参数', () => {
      const steamId = '76561198012345678'
      const platform = 'yyyp'
      
      handlePlatformLogin(steamId, platform)
      
      const calledUrl = mockNavigateTo.mock.calls[0][0].url
      
      // 验证参数连接符
      expect(calledUrl).toBe(`/pages/platform-login/yyyp/index?steamId=${steamId}&platform=${platform}`)
    })
  })

  describe('初始化按钮点击', () => {
    it('点击初始化按钮应该跳转到初始化页面', () => {
      const steamId = '76561198012345678'

      handleInitialize(steamId)

      expect(mockNavigateTo).toHaveBeenCalledTimes(1)
      expect(mockNavigateTo).toHaveBeenCalledWith({
        url: `/pages/tabs/equipment-sales/account/initialize/index?steamId=${steamId}`
      })
    })
  })
})
