/**
 * PlatformLoginHelper 属性测试
 * 使用 fast-check 进行基于属性的测试
 */

import { describe, test, expect, vi } from 'vitest'
import * as fc from 'fast-check'
import { PlatformLoginHelper } from './platform-login-helper'
import type { PlatformType } from '@/types/platform-auth'

// Mock uni-app 的导航 API
global.uni = {
  navigateTo: vi.fn()
} as any

// 生成器：生成有效的 PlatformType
const platformArb = fc.constantFrom<PlatformType>('buff', 'yyyp')

// 生成器：生成有效的 steamId
const steamIdArb = fc.string({ minLength: 10, maxLength: 20 })

// 生成器：生成有效的 token
const validTokenArb = fc.string({ minLength: 11, maxLength: 100 })

// 生成器：生成无效的 token（长度小于等于 10）
const invalidTokenArb = fc.oneof(
  fc.constant(null),
  fc.constant(''),
  fc.string({ maxLength: 10 })
)

describe('PlatformLoginHelper 属性测试', () => {
  // Feature: platform-auth-cache, Property 12: WebView URL 正确性
  test('属性 12: 对于任何平台类型（buff 或 yyyp），getPlatformLoginUrl 应该返回对应平台的有效登录 URL', () => {
    fc.assert(
      fc.property(platformArb, (platform) => {
        const url = PlatformLoginHelper.getPlatformLoginUrl(platform)

        // 验证 URL 不为空
        expect(url).toBeTruthy()
        expect(typeof url).toBe('string')

        // 验证 URL 格式正确（以 https:// 开头）
        expect(url).toMatch(/^https:\/\//)

        // 验证 URL 包含对应平台的域名
        if (platform === 'yyyp') {
          expect(url).toContain('youpin898.com')
        } else if (platform === 'buff') {
          expect(url).toContain('buff.163.com')
        }

        // 验证 URL 包含登录路径
        expect(url).toContain('login')
      }),
      { numRuns: 100 }
    )
  })

  // Feature: platform-auth-cache, Property 13: Token 提取脚本安全性
  test('属性 13: 对于任何执行 getYYYPTokenExtractionScript 返回的 JavaScript 代码，应该不包含恶意代码且能安全执行', () => {
    fc.assert(
      fc.property(fc.constant(true), () => {
        const script = PlatformLoginHelper.getYYYPTokenExtractionScript()

        // 验证脚本不为空
        expect(script).toBeTruthy()
        expect(typeof script).toBe('string')

        // 验证脚本包含函数调用结构
        expect(script).toContain('(function()')
        expect(script).toContain('})()')

        // 验证脚本包含必要的逻辑
        expect(script).toContain('document.cookie')
        expect(script).toContain('uu_token')

        // 验证脚本不包含危险操作
        expect(script).not.toContain('eval(')
        expect(script).not.toContain('Function(')
        expect(script).not.toContain('setTimeout(')
        expect(script).not.toContain('setInterval(')
        expect(script).not.toContain('XMLHttpRequest')
        expect(script).not.toContain('fetch(')

        // 验证脚本可以被解析（语法正确）
        expect(() => {
          new Function(script)
        }).not.toThrow()
      }),
      { numRuns: 100 }
    )
  })

  // Feature: platform-auth-cache, Property 14: Token 格式验证
  test('属性 14: 对于任何从 WebView 提取的 token，isValidToken 应该正确识别有效和无效的 token', () => {
    fc.assert(
      fc.property(validTokenArb, (token) => {
        // 有效的 token（长度 > 10）应该返回 true
        const isValid = PlatformLoginHelper.isValidToken(token)
        expect(isValid).toBe(true)
      }),
      { numRuns: 100 }
    )

    fc.assert(
      fc.property(invalidTokenArb, (token) => {
        // 无效的 token（null、空字符串或长度 <= 10）应该返回 false
        const isValid = PlatformLoginHelper.isValidToken(token)
        expect(isValid).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  // 额外测试：parseTokenFromEvalResult 的正确性
  test('parseTokenFromEvalResult 应该正确解析各种格式的 evalJS 结果', () => {
    fc.assert(
      fc.property(validTokenArb, (token) => {
        // 测试字符串格式
        const result1 = PlatformLoginHelper.parseTokenFromEvalResult(token)
        expect(result1).toBe(token)

        // 测试对象格式（带 data 字段）
        const result2 = PlatformLoginHelper.parseTokenFromEvalResult({ data: token })
        expect(result2).toBe(token)

        // 测试空字符串
        const result3 = PlatformLoginHelper.parseTokenFromEvalResult('')
        expect(result3).toBeNull()

        // 测试 null
        const result4 = PlatformLoginHelper.parseTokenFromEvalResult(null)
        expect(result4).toBeNull()

        // 测试 undefined
        const result5 = PlatformLoginHelper.parseTokenFromEvalResult(undefined)
        expect(result5).toBeNull()

        // 测试对象但没有 data 字段
        const result6 = PlatformLoginHelper.parseTokenFromEvalResult({ other: token })
        expect(result6).toBeNull()
      }),
      { numRuns: 100 }
    )
  })
})
