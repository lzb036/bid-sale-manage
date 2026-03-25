/**
 * 认证相关接口
 */

import request from '../index'
import type { LoginParams, LoginResponse } from '@/types/api'

const AuthAPI = {
  /**
   * 后台管理员登录
   * @param data 登录数据
   * @returns 登录响应
   */
  login(data: LoginParams): Promise<LoginResponse> {
    return request.post('api/admin/member/login2.do', data)
  },

  /**
   * 退出登录
   * @returns 退出登录响应
   */
  logout(): Promise<unknown> {
    return request.post('/api/mgr/auth/logout', {})
  }
}

export default AuthAPI
