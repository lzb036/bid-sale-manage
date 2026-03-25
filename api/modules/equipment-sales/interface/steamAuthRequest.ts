/**
 * Steam 认证相关请求参数类型定义
 */

/**
 * 加密密码请求参数
 * 接口路径: https://buy.fj-mingu.cn/api/mgr/gtm/agentor/steam/decrypt_password.do
 */
export interface DecryptPasswordRequest {
  /** Steam 账号名 */
  account: string
  /** 原始密码 */
  password: string
  /** RSA 公钥模数 */
  publickey_mod: string
  /** RSA 公钥指数 */
  publickey_exp: string
  /** 时间戳 */
  timestamp?: string
  /** 索引签名，允许动态属性 */
  [key: string]: unknown
}

/**
 * 发起认证会话请求参数
 * 接口路径: https://api.steampowered.com/IAuthenticationService/BeginAuthSessionViaCredentials/v1/
 */
export interface BeginAuthSessionRequest {
  /** 持久化标识 */
  persistence: string
  /** 加密后的密码 */
  encrypted_password: string
  /** Steam 账号名 */
  account_name: string
  /** 加密时间戳 */
  encryption_timestamp: string
  /** 索引签名，允许动态属性 */
  [key: string]: unknown
}

/**
 * 上传 Steam Guard 验证码请求参数
 * 接口路径: https://api.steampowered.com/IAuthenticationService/UpdateAuthSessionWithSteamGuardCode/v1
 */
export interface UpdateSteamGuardCodeRequest {
  /** 客户端 ID */
  client_id: string
  /** 请求 ID */
  request_id: string
  /** 验证码 */
  code: string
  /** 验证码类型（2=邮箱/手机验证码，3=手机 App 确认） */
  code_type: number
  /** 索引签名，允许动态属性 */
  [key: string]: unknown
}

/**
 * 轮询认证状态请求参数
 * 接口路径: https://api.steampowered.com/IAuthenticationService/PollAuthSessionStatus/v1/
 */
export interface PollAuthSessionRequest {
  /** 客户端 ID */
  client_id: string
  /** 请求 ID */
  request_id: string
  /** 索引签名，允许动态属性 */
  [key: string]: unknown
}

/**
 * 上传 Token 到后端请求参数
 * 接口路径: https://buy.fj-mingu.cn/api/mgr/gtm/agentor/steam/token/fresh.do
 */
export interface UploadTokenRequest {
  /** 后端分配的账号唯一标识符 */
  steamId: string
  /** Steam access_token */
  token: string
  /** Steam refresh_token */
  freshToken: string
  /** 索引签名，允许动态属性 */
  [key: string]: unknown
}
