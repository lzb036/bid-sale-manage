/**
 * 获取版本号 请求参数
 * 接口路径: /api/mgr/dict/data/catalog2.do
 */
export interface VersionRequest {
  /** 类型ID */
  typeId: string
  
  /** 索引签名，允许动态属性 */
  [key: string]: unknown
}
