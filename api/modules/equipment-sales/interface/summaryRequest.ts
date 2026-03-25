/**
 * 账户汇总 请求参数
 * 接口路径: /api/mgr/gtm/seller/summary2.do
 */
export interface SummaryRequest {
  // 根据实际业务需求，这里可以添加筛选参数
  // 例如：日期范围、账号ID等
  
  /** 索引签名，允许动态属性 */
  [key: string]: unknown
}
