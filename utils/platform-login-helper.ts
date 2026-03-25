import type { PlatformType } from '@/types/platform-auth'

/**
 * 平台登录辅助工具
 */
export class PlatformLoginHelper {
  /**
   * 平台登录 URL 配置
   */
  private static readonly PLATFORM_URLS = {
    yyyp: 'https://www.youpin898.com/login',
    buff: 'https://buff.163.com/account/login',
    steam: 'https://store.steampowered.com/login/'
  }

  /**
   * 获取平台登录 URL
   * @param platform 平台类型
   * @returns 登录 URL
   */
  static getPlatformLoginUrl(platform: PlatformType): string {
    return this.PLATFORM_URLS[platform]
  }

  /**
   * 从悠悠有品页面提取 token
   * 通过 evalJS 执行 JavaScript 代码获取 cookie
   * @returns JavaScript 代码字符串
   */
  static getYYYPTokenExtractionScript(): string {
    return `
     window.onload = (function(){
     	var script = document.createElement('script');
     	script.src = 'https://js.cdn.aliyun.dcloud.net.cn/dev/uni-app/uni.webview.1.5.2.js';  
     	document.head.appendChild(script);
     		
     	function getCookie(name) {  
     		let cookieArr = document.cookie.split(";");  
     		for(let i = 0; i < cookieArr.length; i++) {  
     			let cookiePair = cookieArr[i].split("=");  
     			if(name == cookiePair[0].trim()) {  
     				return decodeURIComponent(cookiePair[1]);  
     			}  
     		}  
     		return null;  
     	} 
     		
     	let token = getCookie("uu_token");  
     	document.addEventListener('UniAppJSBridgeReady', function() { 
     			if(token){
     				uni.postMessage({
     					data: {  
     						token: token
     					}  
     				}); 	
     			}
     	});
     })()
    `
  }

  /**
   * 解析 evalJS 返回的 token
   * @param result evalJS 执行结果
   * @returns token 字符串，如果提取失败则返回 null
   */
  static parseTokenFromEvalResult(result: any): string | null {
    try {
      // evalJS 返回的结果可能是字符串或对象
      if (typeof result === 'string') {
        return result || null
      }
      
      // 如果是对象，尝试从 data 字段获取
      if (result && typeof result === 'object' && result.data) {
        return result.data || null
      }
      
      return null
    } catch (error) {
      console.error('[PlatformLoginHelper] 解析 token 失败:', error)
      return null
    }
  }

  /**
   * 验证 token 格式
   * @param token token 字符串
   * @returns 是否有效
   */
  static isValidToken(token: string | null): boolean {
    if (!token || typeof token !== 'string') {
      return false
    }
    
    // 基本验证：token 长度应该大于 10
    if (token.length <= 10) {
      return false
    }
    
    return true
  }
}
