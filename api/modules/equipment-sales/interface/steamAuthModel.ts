/**
 * Steam 认证相关响应数据类型定义
 */

/**
 * RSA 公钥响应数据
 * 接口路径: https://api.steampowered.com/IAuthenticationService/GetPasswordRSAPublicKey/v1
 */
export interface RsaPublicKeyModel {
  /** RSA 公钥模数 */
  publickey_mod: string
  /** RSA 公钥指数 */
  publickey_exp: string
  /** 时间戳 */
  timestamp: string
}

/**
 * 加密密码响应数据（后端接口 datas 字段内容）
 * 接口路径: https://buy.fj-mingu.cn/api/mgr/gtm/agentor/steam/decrypt_password.do
 */
export interface DecryptPasswordModel {
  /** 加密后的密码 */
  password: string
}

/**
 * Steam Guard 确认方式
 */
export interface AllowedConfirmation {
  /** 确认方式类型（2=邮箱/手机验证码，3=手机 App 确认） */
  confirmation_type: number
  /** 关联消息 */
  associated_message: string
}

/**
 * 发起认证会话响应数据
 * 接口路径: https://api.steampowered.com/IAuthenticationService/BeginAuthSessionViaCredentials/v1/
 */
export interface BeginAuthSessionModel {
  /** 客户端 ID */
  client_id: string
  /** 请求 ID */
  request_id: string
  /** Steam ID */
  steamid: string
  /** 允许的确认方式列表 */
  allowed_confirmations: AllowedConfirmation[]
}

/**
 * 轮询认证状态响应数据
 * 接口路径: https://api.steampowered.com/IAuthenticationService/PollAuthSessionStatus/v1/
 */
export interface PollAuthSessionModel {
  /** Steam access token */
  access_token: string
  /** Steam refresh token */
  refresh_token: string
  /** 是否有远程交互 */
  had_remote_interaction?: boolean
}
