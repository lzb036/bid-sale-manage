/**
 * 认证相关配置读取
 */

/**
 * 获取存储的 token
 * @returns {string} token
 */
export function getToken(): string {
  // 优先读取新key，兼容旧数据
  const newToken = uni.getStorageSync('user_token')
  if (newToken) {
    return newToken
  }
  // 兼容旧版本的token key
  const oldToken = uni.getStorageSync('token')
  return oldToken || ''
}

/**
 * 获取认证头名称（后台管理系统使用 X-Service-Authorization）
 * @returns {string} header name
 */
export function getAuthHeaderName(): string {
  return uni.getStorageSync('authHeader') || 'X-Service-Authorization'
}
