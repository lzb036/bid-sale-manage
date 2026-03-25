/**
 * 获取版本号 响应数据
 * 接口路径: /api/mgr/dict/data/catalog2.do
 */
export interface VersionModel {
  /** 版本列表 */
  list: Array<{
    /** 版本代码 */
    code: string
    /** 版本名称 */
    name?: string
    /** 其他字段 */
    [key: string]: unknown
  }>
  
  /** 其他字段 */
  [key: string]: unknown
}
