/**
 * 价格比较服务 - 修复版：确保读到5个价格
 */

import type {
  BuffBuyOrderModel,
  BuffSellOrderModel,
  YyypSellListModel,
  YyypPurchaseOrderModel,
  YyypMarketSellModel
} from './interface/priceCompareModel'
import type { YyypSellListRequest } from './interface/priceCompareRequest'
import { getYYYPVersionApi } from '@/api/modules/dict/version.service'

const YYYP_DEVICE = {
  deviceId: 'b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9',
  userAgent: 'Mozilla/5.0 (Linux; Android 11; OPPO R17 Pro) AppleWebKit/537.36'
}

let cachedYyypAppVersion: string | null = null

async function getYyypAppVersion(): Promise<string> {
  if (cachedYyypAppVersion) return cachedYyypAppVersion
  try {
    const res = await getYYYPVersionApi({ typeId: '836682235645005824' })
    const version = res?.list?.[0]?.code
    if (version) {
      cachedYyypAppVersion = version
      return version
    }
  } catch {}
  return '5.42.3'
}

function parseDeviceIdFromToken(token: string): string {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return YYYP_DEVICE.deviceId
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4)
    const payload = JSON.parse(decodeURIComponent(
      atob(padded).split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
    ))
    return payload.deviceId || YYYP_DEVICE.deviceId
  } catch {
    return YYYP_DEVICE.deviceId
  }
}

function buildYyypHeaders(token: string, appVersion: string): Record<string, string> {
  const deviceId = parseDeviceIdFromToken(token)
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Authorization': `Bearer ${token}`,
    'DeviceToken': deviceId,
    'DeviceId': deviceId,
    'Gameid': '730',
    'deviceType': '4',
    'platform': 'android',
    'User-Agent': YYYP_DEVICE.userAgent,
    'currentTheme': 'Dark',
    'package-type': 'uuyp',
    'App-Version': appVersion,
    'AppType': '7',
    'deviceBrand': 'oppo'
  }
}

function uniRequest<T>(options: UniApp.RequestOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    uni.request({
      ...options,
      success: (res) => resolve(res.data as T),
      fail: (err) => reject(err)
    })
  })
}

export function fetchBuffBuyOrderApi(goodsId: string): Promise<BuffBuyOrderModel> {
  return uniRequest<BuffBuyOrderModel>({
    method: 'GET',
    url: 'https://buff.163.com/api/market/goods/buy_order',
    data: {
      game: 'csgo',
      goods_id: goodsId,
      page_num: 1,
      tag_ids: -1,
      max_price_only: 'yes'
    }
  })
}

export function fetchBuffSellOrderApi(goodsId: string): Promise<BuffSellOrderModel> {
  return uniRequest<BuffSellOrderModel>({
    method: 'GET',
    url: 'https://buff.163.com/api/market/goods/sell_order',
    data: {
      game: 'csgo',
      goods_id: goodsId,
      page_num: 1,
      page_size: 5,
      sort_by: 'default',
      mode: '',
      allow_tradable_cooldown: 1
    }
  })
}

export async function fetchYyypSellListApi(params: YyypSellListRequest): Promise<YyypSellListModel> {
  const appVersion = await getYyypAppVersion()
  const headers = buildYyypHeaders(params.token, appVersion)
  const { token: _token, ...bodyParams } = params

  return uniRequest<YyypSellListModel>({
    method: 'POST',
    url: 'https://api.youpin898.com/api/youpin/bff/trade/sale/v1/sell/list',
    header: headers,
    data: bodyParams
  })
}

// ==================== Webview DOM 抓取 - 修复版 ====================

interface YyypWebviewScrapeResult {
  list: Array<{ price: number; name: string }>
  listType: number
}

function fetchByWebviewUltimate<T>(url: string, listType: number, timeoutMs = 60000): Promise<T> {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    let settled = false
    let loaded = false

    console.log('[YYYP Ultimate] 创建 webview:', url)

    const wv = plus.webview.create(url, `yyyp_scraper_${Date.now()}`, {
      top: '200%',
      width: '100%',
      height: '100%',
      background: 'transparent'
    })

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true
        console.error('[YYYP Ultimate] 超时')
        wv.close()
        reject(new Error('webview 抓取超时'))
      }
    }, timeoutMs)

    wv.addEventListener('titleUpdate', (e: { title: string }) => {
      const title = e.title || ''
      if (settled) return

      if (title.startsWith('__YYYP_DEBUG__')) {
        console.log('[YYYP Debug]', title.replace('__YYYP_DEBUG__', ''))
        return
      }

      if (!title.startsWith('__YYYP_DATA__')) return

      try {
        const jsonStr = title.replace('__YYYP_DATA__', '')
        const parsed = JSON.parse(jsonStr) as T
        console.log('[YYYP Ultimate] 成功:', parsed)
        settled = true
        clearTimeout(timer)
        wv.close()
        resolve(parsed)
      } catch (err) {
        settled = true
        clearTimeout(timer)
        wv.close()
        reject(err)
      }
    })

    wv.addEventListener('loaded', () => {
      if (loaded) return
      loaded = true
      
      console.log('[YYYP Ultimate] 页面 loaded，等待1秒...')
      
      setTimeout(() => {
        if (settled) return
        console.log('[YYYP Ultimate] 注入脚本...')
        wv.evalJS(buildUltimateScript(listType))
      }, 1000)
    })

    wv.loadURL(url)
    // #endif

    // #ifndef APP-PLUS
    reject(new Error('webview 抓取仅支持 App 环境'))
    // #endif
  })
}

/**
 * 修复版脚本：确保读到5个价格
 */
function buildUltimateScript(listType: number): string {
  const targetKey = listType === 10 ? 'sale' : 'buy'
  
  return '(function(){' +
    'if(window.__YYYP_SCRAPING__)return;' +
    'window.__YYYP_SCRAPING__=true;' +
    
    'var captured=false;' +
    'var MAX_WAIT=30000;' +
    'var POLL_INTERVAL=500;' +
    'var elapsed=0;' +
    'var tabClicked=false;' +
    'var lastTextLength=0;' +
    'var stableCount=0;' +
    
    'function sendResult(list){' +
      'if(captured)return;' +
      'captured=true;' +
      'window.__YYYP_SCRAPING__=false;' +
      'document.title="__YYYP_DATA__"+JSON.stringify({list:list,listType:'+listType+'});' +
    '}' +
    
    'function sendDebug(msg){' +
      'document.title="__YYYP_DEBUG__"+String(msg).substring(0,200);' +
    '}' +
    
    // 提取价格
    'function extractPrice(t){' +
      'if(!t)return 0;' +
      'var m=t.match(/[¥￥]\\s*([\\d,]+\\.?\\d*)/);' +
      'if(!m)return 0;' +
      'var n=parseFloat(m[1].replace(/,/g,""));' +
      'return isNaN(n)?0:n;' +
    '}' +
    
    // 检测文本是否包含价格符号
    'function hasPriceSymbol(t){' +
      'return t&&(t.indexOf("¥")>=0||t.indexOf("￥")>=0);' +
    '}' +
    
    // 检测数据是否加载完成
    'function checkDataReady(){' +
      'var panel=document.getElementById("rc-tabs-0-panel-'+targetKey+'");' +
      'if(!panel){' +
        'var btn=document.querySelector("[data-node-key=\\"'+targetKey+'\\"] [role=tab]");' +
        'if(btn){' +
          'var id=btn.getAttribute("aria-controls");' +
          'if(id)panel=document.getElementById(id);' +
        '}' +
      '}' +
      'if(!panel)return{ready:false,textLen:0,reason:"no_panel"};' +
      
      'var listContainer=panel.querySelector("[class*=\\"tabs-list___\\"]");' +
      'if(!listContainer)return{ready:false,textLen:0,reason:"no_list"};' +
      
      'var text=listContainer.textContent||"";' +
      'var hasPrice=hasPriceSymbol(text);' +
      
      // 返回对象，不用return关键字
      'var result={ready:hasPrice,textLen:text.length,hasPrice:hasPrice};' +
      'return result;' +
    '}' +
    
    // 读取价格 - 三层策略确保读到5个
    'function readPrices(){' +
      'var prices=[];' +
      'var seen=new Set();' +
      
      'var panel=document.getElementById("rc-tabs-0-panel-'+targetKey+'");' +
      'if(!panel){' +
        'var btn=document.querySelector("[data-node-key=\\"'+targetKey+'\\"] [role=tab]");' +
        'if(btn){' +
          'var id=btn.getAttribute("aria-controls");' +
          'if(id)panel=document.getElementById(id);' +
        '}' +
      '}' +
      'if(!panel)return prices;' +
      
      'var listContainer=panel.querySelector("[class*=\\"tabs-list___\\"]");' +
      'if(!listContainer)return prices;' +
      
      // 方法1：找商品卡片
      'var cards=listContainer.querySelectorAll("[class*=\\"goods-item\\"],[class*=\\"list-item\\"],[class*=\\"item___\\"],[class*=\\"row___\\"]");' +
      'sendDebug("cards:"+cards.length);' +
      
      'for(var i=0;i<cards.length&&prices.length<5;i++){' +
        'var card=cards[i];' +
        'var cardWalker=document.createTreeWalker(card,NodeFilter.SHOW_TEXT,null);' +
        'var node;' +
        'while(node=cardWalker.nextNode()){' +
          'var text=(node.nodeValue||"").trim();' +
          'if(!hasPriceSymbol(text))continue;' +
          'var price=extractPrice(text);' +
          'if(price>0&&price<500000&&!seen.has(price)){' +
            'seen.add(price);' +
            'prices.push({price:price,name:""});' +
            'break;' +
          '}' +
        '}' +
      '}' +
      
      // 方法2：遍历整个面板文本节点
      'if(prices.length<5){' +
        'var walker=document.createTreeWalker(panel,NodeFilter.SHOW_TEXT,null);' +
        'var node;' +
        'while(node=walker.nextNode()&&prices.length<5){' +
          'var text=(node.nodeValue||"").trim();' +
          'if(!hasPriceSymbol(text))continue;' +
          'var price=extractPrice(text);' +
          'if(price>0&&price<500000&&!seen.has(price)){' +
            'seen.add(price);' +
            'prices.push({price:price,name:""});' +
          '}' +
        '}' +
      '}' +
      
      // 方法3：找所有元素
      'if(prices.length<5){' +
        'var allElements=panel.querySelectorAll("*");' +
        'for(var i=0;i<allElements.length&&prices.length<5;i++){' +
          'var el=allElements[i];' +
          'var text=el.textContent||"";' +
          'if(!hasPriceSymbol(text))continue;' +
          'var price=extractPrice(text);' +
          'if(price>0&&price<500000&&!seen.has(price)){' +
            'seen.add(price);' +
            'prices.push({price:price,name:""});' +
          '}' +
        '}' +
      '}' +
      
      'sendDebug("found:"+prices.length);' +
      'return prices;' +
    '}' +
    
    // 点击tab
    'function clickTab(){' +
      'var tab=document.querySelector("[data-node-key=\\"'+targetKey+'\\"]");' +
      'if(tab){tab.click();return true;}' +
      'return false;' +
    '}' +
    
    // 主轮询
    'sendDebug("start_'+targetKey+'");' +
    
    'var poll=setInterval(function(){' +
      'elapsed+=POLL_INTERVAL;' +
      
      'if('+ (listType === 20 ? 'true' : 'false') +'&&!tabClicked){' +
        'if(clickTab()){' +
          'tabClicked=true;' +
          'elapsed=0;' +
          'sendDebug("tab_clicked");' +
        '}' +
        'if(elapsed>=MAX_WAIT){clearInterval(poll);sendResult([]);}' +
        'return;' +
      '}' +
      
      'var status=checkDataReady();' +
      'sendDebug("ready:"+status.ready+",len:"+status.textLen+",t:"+elapsed);' +
      
      'if(status.ready){' +
        'if(status.textLen===lastTextLength&&status.textLen>100){' +
          'stableCount++;' +
        '}else{' +
          'stableCount=0;' +
          'lastTextLength=status.textLen;' +
        '}' +
        
        'if(stableCount>=1||elapsed>=MAX_WAIT){' +
          'var prices=readPrices();' +
          'sendDebug("done:"+prices.length);' +
          'clearInterval(poll);' +
          'sendResult(prices);' +
        '}' +
      '}' +
      
      'if(elapsed>=MAX_WAIT){' +
        'var prices=readPrices();' +
        'sendDebug("timeout:"+prices.length);' +
        'clearInterval(poll);' +
        'sendResult(prices);' +
      '}' +
    '},POLL_INTERVAL);' +
  '})();'
}

// ==================== 对外暴露 ====================

export async function fetchYyypMarketSellByWebview(
  templateId: string,
  gameId = 730
): Promise<YyypMarketSellModel> {
  const url = `https://www.youpin898.com/market/goods-list?listType=10&templateId=${templateId}&gameId=${gameId}`
  const result = await fetchByWebviewUltimate<YyypWebviewScrapeResult>(url, 10, 30000)

  return {
    Code: 0,
    Msg: 'ok',
    Data: {
      commodityList: result.list.map((item, idx) => ({
        price: Math.round(item.price * 100),
        commodityId: String(idx),
        name: item.name
      })),
      total: result.list.length
    }
  }
}

export async function fetchYyypPurchaseOrderByWebview(
  templateId: string,
  gameId = 730
): Promise<YyypPurchaseOrderModel> {
  const url = `https://www.youpin898.com/market/goods-list?listType=20&templateId=${templateId}&gameId=${gameId}`
  const result = await fetchByWebviewUltimate<YyypWebviewScrapeResult>(url, 20, 30000)

  return {
    Code: 0,
    Msg: 'ok',
    Data: result.list.map((item, idx) => ({
      price: item.price,
      orderId: String(idx),
      itemName: item.name
    }))
  }
}