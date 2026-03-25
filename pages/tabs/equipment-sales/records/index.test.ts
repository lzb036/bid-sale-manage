import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── 用 vi.hoisted 确保 mock 变量在提升后可用 ────────────────────────────────
const { mockSync, mockGetItemsApi, mockLoadAuthState, mockShowToast } = vi.hoisted(() => ({
  mockSync: vi.fn(),
  mockGetItemsApi: vi.fn(),
  mockLoadAuthState: vi.fn(),
  mockShowToast: vi.fn()
}))

// ─── Mock uni API ───────────────────────────────────────────────────────────
;(globalThis as unknown as Record<string, unknown>)['uni'] = {
  showToast: mockShowToast,
  getStorageSync: vi.fn().mockReturnValue(''),
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn()
}

// ─── Mock SyncService ────────────────────────────────────────────────────────
vi.mock('@/utils/sync-service', () => ({
  SyncService: { sync: mockSync }
}))

// ─── Mock getItemsApi ────────────────────────────────────────────────────────
vi.mock('@/api/modules/equipment-sales/items.service', () => ({
  getItemsApi: mockGetItemsApi
}))

// ─── Mock PlatformAuthCache ──────────────────────────────────────────────────
vi.mock('@/utils/platform-auth-cache', () => ({
  PlatformAuthCache: { loadAuthState: mockLoadAuthState }
}))

// ─── 模拟 triggerSync 逻辑（从 RecordsPage 提取）────────────────────────────
import { SyncService } from '@/utils/sync-service'
import type { PlatformType } from '@/types/platform-auth'

/**
 * 模拟 RecordsPage 中 triggerSync 的核心逻辑
 * 与 pages/tabs/equipment-sales/records/index.vue 中的实现保持一致
 */
async function triggerSync(
  platform: PlatformType,
  defaultSteamId: string,
  syncingState: { yyyp: boolean; buff: boolean },
  onRefresh: () => Promise<void>
): Promise<void> {
  if (!defaultSteamId) return
  if (platform === 'yyyp' && syncingState.yyyp) return
  if (platform === 'buff' && syncingState.buff) return

  if (platform === 'yyyp') syncingState.yyyp = true
  else syncingState.buff = true

  try {
    await SyncService.sync(defaultSteamId, platform)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'YYYP_TOKEN_NOT_FOUND') {
      uni.showToast({ title: '请先绑定悠悠有品账号', icon: 'none', duration: 2000 })
    } else {
      const msg = error instanceof Error ? error.message : '同步失败，请稍后重试1'
      uni.showToast({ title: msg, icon: 'none', duration: 2000 })
    }
    return
  } finally {
    if (platform === 'yyyp') syncingState.yyyp = false
    else syncingState.buff = false
  }

  await onRefresh()
  uni.showToast({ title: '同步成功', icon: 'success' })
}

// ─── 测试套件 ─────────────────────────────────────────────────────────────────
describe('RecordsPage - 悠悠有品同步流程', () => {
  const DEFAULT_STEAM_ID = '76561199002934034'
  let syncingState: { yyyp: boolean; buff: boolean }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let onRefresh: any

  beforeEach(() => {
    vi.clearAllMocks()
    syncingState = { yyyp: false, buff: false }
    onRefresh = vi.fn().mockResolvedValue(undefined)
    mockGetItemsApi.mockResolvedValue({ list: [], pager: { total: 0 } })
  })

  // ── 正常流程 ──────────────────────────────────────────────────────────────

  it('同步成功后应调用 SyncService.sync 并刷新列表', async () => {
    mockSync.mockResolvedValue(undefined)

    await triggerSync('yyyp', DEFAULT_STEAM_ID, syncingState, onRefresh)

    expect(mockSync).toHaveBeenCalledOnce()
    expect(mockSync).toHaveBeenCalledWith(DEFAULT_STEAM_ID, 'yyyp')
    expect(onRefresh).toHaveBeenCalledOnce()
  })

  it('同步成功后应显示成功 Toast', async () => {
    mockSync.mockResolvedValue(undefined)

    await triggerSync('yyyp', DEFAULT_STEAM_ID, syncingState, onRefresh)

    expect(mockShowToast).toHaveBeenCalledWith({ title: '同步成功', icon: 'success' })
  })

  it('同步成功后 yyyypSyncing 应恢复为 false', async () => {
    mockSync.mockResolvedValue(undefined)

    await triggerSync('yyyp', DEFAULT_STEAM_ID, syncingState, onRefresh)

    expect(syncingState.yyyp).toBe(false)
  })

  // ── Token 不存在 ──────────────────────────────────────────────────────────

  it('Token 不存在时应显示"请先绑定悠悠有品账号"提示', async () => {
    mockSync.mockRejectedValue(new Error('YYYP_TOKEN_NOT_FOUND'))

    await triggerSync('yyyp', DEFAULT_STEAM_ID, syncingState, onRefresh)

    expect(mockShowToast).toHaveBeenCalledWith({
      title: '请先绑定悠悠有品账号',
      icon: 'none',
      duration: 2000
    })
  })

  it('Token 不存在时不应刷新列表', async () => {
    mockSync.mockRejectedValue(new Error('YYYP_TOKEN_NOT_FOUND'))

    await triggerSync('yyyp', DEFAULT_STEAM_ID, syncingState, onRefresh)

    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('Token 不存在时 yyyypSyncing 应恢复为 false', async () => {
    mockSync.mockRejectedValue(new Error('YYYP_TOKEN_NOT_FOUND'))

    await triggerSync('yyyp', DEFAULT_STEAM_ID, syncingState, onRefresh)

    expect(syncingState.yyyp).toBe(false)
  })

  // ── 接口失败 ──────────────────────────────────────────────────────────────

  it('第三方平台接口失败时应显示错误信息', async () => {
    mockSync.mockRejectedValue(new Error('悠悠有品接口请求失败，状态码: 500'))

    await triggerSync('yyyp', DEFAULT_STEAM_ID, syncingState, onRefresh)

    expect(mockShowToast).toHaveBeenCalledWith({
      title: '悠悠有品接口请求失败，状态码: 500',
      icon: 'none',
      duration: 2000
    })
  })

  it('接口失败后 yyyypSyncing 应恢复为 false（按钮可点击）', async () => {
    mockSync.mockRejectedValue(new Error('网络错误'))

    await triggerSync('yyyp', DEFAULT_STEAM_ID, syncingState, onRefresh)

    expect(syncingState.yyyp).toBe(false)
  })

  // ── 防重复触发 ────────────────────────────────────────────────────────────

  it('同步进行中时重复点击应被忽略', async () => {
    // 模拟同步中状态
    syncingState.yyyp = true
    mockSync.mockResolvedValue(undefined)

    await triggerSync('yyyp', DEFAULT_STEAM_ID, syncingState, onRefresh)

    expect(mockSync).not.toHaveBeenCalled()
  })

  // ── 未设置默认账号 ────────────────────────────────────────────────────────

  it('未设置默认账号时不应触发同步', async () => {
    mockSync.mockResolvedValue(undefined)

    await triggerSync('yyyp', '', syncingState, onRefresh)

    expect(mockSync).not.toHaveBeenCalled()
    expect(onRefresh).not.toHaveBeenCalled()
  })

  // ── 平台状态独立 ──────────────────────────────────────────────────────────

  it('悠悠有品同步中时不影响 BUFF 的同步状态', async () => {
    syncingState.yyyp = true

    // 触发 BUFF 同步（不受 yyyp 状态影响）
    mockSync.mockResolvedValue(undefined)
    await triggerSync('buff', DEFAULT_STEAM_ID, syncingState, onRefresh)

    expect(mockSync).toHaveBeenCalledWith(DEFAULT_STEAM_ID, 'buff')
  })

  // ── 同步失败不影响刷新 ────────────────────────────────────────────────────

  it('同步失败时不应调用刷新列表', async () => {
    mockSync.mockRejectedValue(new Error('接口超时'))

    await triggerSync('yyyp', DEFAULT_STEAM_ID, syncingState, onRefresh)

    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('同步成功但刷新列表失败时不影响按钮状态恢复', async () => {
    mockSync.mockResolvedValue(undefined)
    onRefresh.mockRejectedValue(new Error('刷新失败'))

    // 刷新失败会抛出，但按钮状态应已在 finally 里恢复
    await expect(triggerSync('yyyp', DEFAULT_STEAM_ID, syncingState, onRefresh)).rejects.toThrow('刷新失败')

    expect(syncingState.yyyp).toBe(false)
  })
})
