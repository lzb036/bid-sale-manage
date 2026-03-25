/**
 * Steam 认证服务
 * - 后端接口：通过 request.post 调用，走项目拦截器
 * - Steam 官方接口：通过 uni.request 直接调用完整 URL，绕过项目拦截器
 */

import request from '@/api/index'
import type { DecryptPasswordRequest, BeginAuthSessionRequest, UpdateSteamGuardCodeRequest, PollAuthSessionRequest, UploadTokenRequest } from './interface/steamAuthRequest'
import type { RsaPublicKeyModel, DecryptPasswordModel, BeginAuthSessionModel, PollAuthSessionModel } from './interface/steamAuthModel'

/**
 * 获取 Steam RSA 公钥
 * @param account Steam 账号名
 * @returns RSA 公钥信息（publickey_mod、publickey_exp、timestamp）
 */
export const getRsaPublicKeyApi = (account: string): Promise<RsaPublicKeyModel> => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `https://api.steampowered.com/IAuthenticationService/GetPasswordRSAPublicKey/v1/?account_name=${account}`,
      method: 'GET',
      success: (res) => {
        const response = (res.data as Record<string, unknown>)?.response
        if (response && (response as RsaPublicKeyModel).publickey_mod) {
          resolve(response as RsaPublicKeyModel)
        } else {
          reject(new Error('getRsaKeyFailed'))
        }
      },
      fail: () => {
        reject(new Error('getRsaKeyFailed'))
      }
    })
  })
}

/**
 * 加密 Steam 密码（通过后端接口）
 * @param params 加密密码请求参数
 * @returns 加密后的密码
 */
export const decryptPasswordApi = (params: DecryptPasswordRequest) => {
  return request.post<DecryptPasswordModel>('/api/mgr/gtm/agentor/steam/decrypt_password.do', params)
}

/**
 * 发起 Steam 认证会话
 * @param params 认证会话请求参数
 * @returns 认证会话信息（client_id、request_id、steamid、allowed_confirmations）
 */
export const beginAuthSessionApi = (params: BeginAuthSessionRequest): Promise<BeginAuthSessionModel> => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: 'https://api.steampowered.com/IAuthenticationService/BeginAuthSessionViaCredentials/v1/',
      method: 'POST',
      header: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Referer': 'https://steamcommunity.com'
      },
      data: params,
      success: (res) => {
        const response = (res.data as Record<string, unknown>)?.response
        if (response && (response as BeginAuthSessionModel).client_id) {
          resolve(response as BeginAuthSessionModel)
        } else {
          reject(new Error('beginSessionFailed'))
        }
      },
      fail: () => {
        reject(new Error('beginSessionFailed'))
      }
    })
  })
}

/**
 * 上传 Steam Guard 验证码
 * @param params 验证码请求参数
 */
export const updateSteamGuardCodeApi = (params: UpdateSteamGuardCodeRequest): Promise<void> => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: 'https://api.steampowered.com/IAuthenticationService/UpdateAuthSessionWithSteamGuardCode/v1',
      method: 'POST',
      header: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Referer': 'https://steamcommunity.com'
      },
      data: params,
      success: () => {
        resolve()
      },
      fail: () => {
        reject(new Error('guardCodeFailed'))
      }
    })
  })
}

/**
 * 轮询 Steam 认证状态
 * @param params 轮询请求参数
 * @returns 认证令牌（access_token、refresh_token）
 */
export const pollAuthSessionApi = (params: PollAuthSessionRequest): Promise<PollAuthSessionModel> => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: 'https://api.steampowered.com/IAuthenticationService/PollAuthSessionStatus/v1/',
      method: 'POST',
      header: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Referer': 'https://steamcommunity.com'
      },
      data: params,
      success: (res) => {
        const response = (res.data as Record<string, unknown>)?.response
        if (response && (response as PollAuthSessionModel).access_token) {
          resolve(response as PollAuthSessionModel)
        } else {
          reject(new Error('pollSessionFailed'))
        }
      },
      fail: () => {
        reject(new Error('pollSessionFailed'))
      }
    })
  })
}

/**
 * 上传 Steam Token 到后端
 * @param params Token 上传请求参数
 */
export const uploadTokenApi = (params: UploadTokenRequest) => {
  return request.post('/api/mgr/gtm/agentor/steam/token/fresh.do', params)
}
