// API 响应类型定义
export interface ApiResponse<T = unknown> {
  code: number | string
  data?: T
  message?: string
  msg?: string
}

// 登录请求参数
export interface LoginParams {
  username: string
  password: string
  rememberMe?: boolean
}

// 用户角色类型
export interface UserRole {
  id: string
  name: string
  code: string
}

// 管理员用户信息类型
export interface AdminUserInfo {
  id: string
  flag: boolean
  username: string
  email: string
  authVerifyType: string
  nickname: string
  realname: string
  initPwdChanged: boolean
  accountLocked: boolean
  roles: UserRole[]
}

// 登录响应数据
export interface LoginResponse {
  token: string
  header: string
  userId: string
  realName: string
  verifyType?: number
  appUse?: string
}
