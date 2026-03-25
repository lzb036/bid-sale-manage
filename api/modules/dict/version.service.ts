import request from '@/api/index'
import type { VersionRequest } from './interface/versionRequest'
import type { VersionModel } from './interface/versionModel'

/**
 * 获取悠悠有品版本号
 * @param params 请求参数
 * @returns 版本数据响应
 */
export const getYYYPVersionApi = (params: VersionRequest) => {
  return request.post<VersionModel>('/api/mgr/dict/data/catalog2.do', params)
}
