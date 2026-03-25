/**
 * HTTP 配置与拦截器类型定义
 */

export interface HttpConfig {
  baseURL: string
  timeout: number
  header: Record<string, string>
  autoToken: boolean
}

export interface RequestConfig {
  method?: string
  url: string
  data?: unknown
  params?: Record<string, unknown>
  header?: Record<string, string>
  autoToken?: boolean
}

export interface ResponseData {
  code: number | string
  statusCode: number | string
  datas?: unknown
  message?: string
}

export interface Response<T = ResponseData> {
  statusCode: number
  data: T
  config: RequestConfig
}
