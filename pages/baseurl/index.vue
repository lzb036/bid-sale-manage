<template>
  <view :class="['baseurl-container', themeClass]">
    <!-- 椤堕儴瀵艰埅鏍?-->
    <view class="navbar" :style="navbarStyle">
      <view class="navbar-content">
        <view class="back-btn" @click="handleGoBack">
          <u-icon name="arrow-left" size="24" color="var(--t-primary)"></u-icon>
        </view>
        <text class="nav-title">{{ t('baseurl.title') }}</text>
        <view class="nav-actions">
          <view class="add-btn" @click="showAddPopup = true">
            <u-icon name="plus" size="20" color="var(--t-primary)"></u-icon>
          </view>
        </view>
      </view>
    </view>

    <!-- 鍐呭鍖哄煙 -->
    <view class="content">
      <!-- 褰撳墠 baseURL 鏄剧ず -->
      <view class="current-card">
        <view class="card-header">
          <text class="header-title">{{ t('baseurl.current') }}</text>
          <view class="current-badge">{{ t('baseurl.using') }}</view>
        </view>
        <view class="current-url">
          <text class="url-text">{{ currentURL || DEFAULT_BASE_URL }}</text>
        </view>
      </view>

      <!-- baseURL 鍒楄〃 -->
      <view class="list-section">
        <view class="section-header">
          <text class="section-title">{{ t('baseurl.savedList') }}</text>
          <text class="section-count">({{ baseURLList.length }})</text>
        </view>

        <view v-if="baseURLList.length === 0" class="empty-state">
          <text class="empty-text">{{ t('baseurl.noSaved') }}</text>
        </view>

        <view v-else class="url-list">
          <view
            v-for="item in baseURLList"
            :key="item.id"
            :class="['url-item', { active: item.url === currentURL }]"
            @click="handleSelectURL(item)"
          >
            <view class="url-info">
              <view class="url-header">
                <text class="url-name">{{ item.name }}</text>
                <view v-if="item.url === currentURL" class="active-badge">
                  <text class="badge-text">{{ t('baseurl.active') }}</text>
                </view>
              </view>
              <text class="url-address">{{ item.url }}</text>
            </view>
            <view v-if="!item.isDefault && item.url !== currentURL" class="url-delete" @click.stop="handleDeleteURL(item)">
              <u-icon name="trash" size="18" color="var(--t-secondary)"></u-icon>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 娴嬭瘯杩為€氭€ч伄缃╁眰 -->
    <view v-if="showTestingModal" class="testing-overlay" @touchmove.stop.prevent>
      <view class="testing-modal">
        <view class="testing-content">
          <u-loading-icon size="48" color="var(--c-main)"></u-loading-icon>
          <text class="testing-title">{{ t('baseurl.testingTitle') }}</text>
          <text class="testing-current">{{ testingCurrentName }}</text>
        </view>
      </view>
    </view>

    <!-- 娣诲姞鏈嶅姟鍣ㄥ脊绐?-->
    <u-popup :show="showAddPopup" mode="center" :round="16" :close-on-click-overlay="true" @close="handleClosePopup">
      <view class="add-popup">
        <view class="popup-header">
          <text class="popup-title">{{ t('baseurl.addNew') }}</text>
        </view>

        <view class="popup-body">
          <view class="form-group">
            <text class="form-label">{{ t('baseurl.nameLabel') }}</text>
            <u-input
              v-model="newItem.name"
              :placeholder="t('baseurl.namePlaceholder')"
              border="none"
              :custom-style="inputStyle"
              :placeholder-style="placeholderStyle"
            />
          </view>

          <view class="form-group">
            <text class="form-label">{{ t('baseurl.urlLabel') }}</text>
            <u-input
              v-model="newItem.url"
              :placeholder="t('baseurl.urlPlaceholder')"
              border="none"
              :custom-style="inputStyle"
              :placeholder-style="placeholderStyle"
            />
          </view>

          <u-button
            type="primary"
            :loading="saving"
            :custom-style="buttonStyle"
            @click="handleAddURL"
          >
            {{ saving ? t('common.loading') : t('baseurl.addButton') }}
          </u-button>
        </view>
      </view>
    </u-popup>

    <!-- 鍒囨崲鏈嶅姟鍣ㄧ‘璁ゅ脊绐?-->
    <u-modal
      :show="showSwitchModal"
      :title="t('baseurl.switchTitle')"
      :show-cancel-button="true"
      :confirm-text="t('common.confirm')"
      :cancel-text="t('common.cancel')"
      confirm-color="var(--c-main)"
      @confirm="handleConfirmSwitch"
      @cancel="showSwitchModal = false"
    >
      <view class="switch-modal-content">
        <view class="switch-info-row">
          <text class="switch-label">{{ t('baseurl.nameLabel') }}</text>
          <text class="switch-value">{{ selectedItem?.name }}</text>
        </view>
        <view class="switch-info-row">
          <text class="switch-label">{{ t('baseurl.urlLabel') }}</text>
          <text class="switch-value">{{ selectedItem?.url }}</text>
        </view>
      </view>
    </u-modal>

    <!-- 鍒犻櫎鏈嶅姟鍣ㄧ‘璁ゅ脊绐?-->
    <u-modal
      :show="showDeleteModal"
      :title="t('baseurl.deleteTitle')"
      :show-cancel-button="true"
      :confirm-text="t('common.confirm')"
      :cancel-text="t('common.cancel')"
      confirm-color="#EF4444"
      @confirm="handleConfirmDelete"
      @cancel="showDeleteModal = false"
    >
      <view class="delete-modal-content">
        <view class="delete-info-row">
          <text class="delete-label">{{ t('baseurl.nameLabel') }}</text>
          <text class="delete-value">{{ deleteItem?.name }}</text>
        </view>
        <view class="delete-info-row">
          <text class="delete-label">{{ t('baseurl.urlLabel') }}</text>
          <text class="delete-value">{{ deleteItem?.url }}</text>
        </view>
        <view class="delete-warning">
          <text class="warning-text">{{ t('baseurl.deleteWarning') }}</text>
        </view>
      </view>
    </u-modal>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/store/app'
import {
  getCurrentBaseURL,
  getBaseURLList,
  addBaseURL,
  deleteBaseURL,
  switchBaseURL,
  validateURL,
  formatURL,
  DEFAULT_BASE_URL,
  type BaseURLItem
} from '@/utils/baseurl'
import UIcon from 'uview-plus/components/u-icon/u-icon.vue'
import ULoadingIcon from 'uview-plus/components/u-loading-icon/u-loading-icon.vue'
import UPopup from 'uview-plus/components/u-popup/u-popup.vue'
import UInput from 'uview-plus/components/u-input/u-input.vue'
import UButton from 'uview-plus/components/u-button/u-button.vue'
import UModal from 'uview-plus/components/u-modal/u-modal.vue'

const { t } = useI18n()
const appStore = useAppStore()

const themeClass = computed(() => appStore.theme)
const statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 0
const navbarStyle = {
  paddingTop: `calc(32rpx + ${statusBarHeight}px)`
}

// 褰撳墠 baseURL
const currentURL = ref<string>('')

// baseURL 鍒楄〃
const baseURLList = ref<BaseURLItem[]>([])

// 寮圭獥鏄剧ず鐘舵€?
const showAddPopup = ref(false)
const showSwitchModal = ref(false)
const showDeleteModal = ref(false)

// 閫変腑鐨勫垏鎹㈤」
const selectedItem = ref<BaseURLItem | null>(null)
// 閫変腑鐨勫垹闄ら」
const deleteItem = ref<BaseURLItem | null>(null)

const showTestingModal = ref(false)
const testing = ref(false)
const testingCurrentName = ref('')

// 鏂板椤?
const newItem = ref({
  name: '',
  url: ''
})

// 淇濆瓨涓姸鎬?
const saving = ref(false)

// 杈撳叆妗嗘牱寮?
const inputStyle = computed(() => ({
  backgroundColor: 'var(--c-bg)',
  borderRadius: '16rpx',
  padding: '24rpx',
  fontSize: '28rpx',
  color: 'var(--t-primary)',
  border: '2rpx solid var(--c-border)'
}))

const placeholderStyle = computed(() => ({
  color: 'var(--t-secondary)'
}))

const buttonStyle = computed(() => ({
  width: '100%',
  height: '88rpx',
  borderRadius: '16rpx',
  fontSize: '32rpx',
  fontWeight: '500',
  marginTop: '32rpx',
  backgroundColor: 'var(--c-main)',
  border: 'none'
}))

onMounted(() => {
  loadData()
})

const loadData = () => {
  currentURL.value = getCurrentBaseURL()
  baseURLList.value = getBaseURLList()
}

const handleGoBack = () => {
  uni.navigateBack()
}

const handleClosePopup = () => {
  showAddPopup.value = false
  // 閲嶇疆琛ㄥ崟
  newItem.value = {
    name: '',
    url: ''
  }
}

const handleSelectURL = (item: BaseURLItem) => {
  if (item.url === currentURL.value) {
    return
  }
  selectedItem.value = item
  showSwitchModal.value = true
}

const handleConfirmSwitch = async () => {
  if (!selectedItem.value) return

  // 鍏抽棴鍒囨崲纭寮圭獥
  showSwitchModal.value = false

  testing.value = true
  showTestingModal.value = true
  testingCurrentName.value = selectedItem.value.name

  const result = await testConnection(selectedItem.value)

  showTestingModal.value = false
  testingCurrentName.value = ''

  if (result === 'success') {
    // 娴嬭瘯鎴愬姛锛屾墽琛屽垏鎹?
    switchBaseURL(selectedItem.value.url)
    currentURL.value = selectedItem.value.url
    selectedItem.value = null

    uni.showToast({
      title: t('baseurl.switchSuccess'),
      icon: 'success'
    })
  } else {
    // 娴嬭瘯澶辫触锛屾樉绀洪敊璇彁绀?
    uni.showModal({
      title: t('baseurl.switchTestFailed'),
      content: t('baseurl.switchTestFailedMessage'),
      showCancel: false,
      confirmText: t('common.confirm')
    })
  }

  testing.value = false
}

const handleDeleteURL = (item: BaseURLItem) => {
  if (item.url === currentURL.value) {
    uni.showToast({
      title: t('baseurl.deleteCurrentNotAllowed'),
      icon: 'none'
    })
    return
  }

  deleteItem.value = item
  showDeleteModal.value = true
}

const handleConfirmDelete = () => {
  if (!deleteItem.value) return

  if (deleteItem.value.url === currentURL.value) {
    showDeleteModal.value = false
    deleteItem.value = null
    uni.showToast({
      title: t('baseurl.deleteCurrentNotAllowed'),
      icon: 'none'
    })
    return
  }

  deleteBaseURL(deleteItem.value.id)
  loadData()
  showDeleteModal.value = false
  deleteItem.value = null

  uni.showToast({
    title: t('baseurl.deleteSuccess'),
    icon: 'success'
  })
}

const handleAddURL = () => {
  if (!newItem.value.name) {
    uni.showToast({
      title: t('baseurl.nameRequired'),
      icon: 'none'
    })
    return
  }

  if (!newItem.value.url) {
    uni.showToast({
      title: t('baseurl.urlRequired'),
      icon: 'none'
    })
    return
  }

  const formattedURL = formatURL(newItem.value.url)

  if (!validateURL(formattedURL)) {
    uni.showToast({
      title: t('baseurl.urlInvalid'),
      icon: 'none'
    })
    return
  }

  // 妫€鏌ユ槸鍚﹀凡瀛樺湪
  const exists = baseURLList.value.some(item => item.url === formattedURL)
  if (exists) {
    uni.showToast({
      title: t('baseurl.urlExists'),
      icon: 'none'
    })
    return
  }

  saving.value = true

  try {
    addBaseURL(newItem.value.name, formattedURL)
    loadData()

    // 鍏抽棴寮圭獥骞堕噸缃〃鍗?
    showAddPopup.value = false
    newItem.value = {
      name: '',
      url: ''
    }

    uni.showToast({
      title: t('baseurl.addSuccess'),
      icon: 'success'
    })
  } catch (error) {
    uni.showToast({
      title: t('common.error'),
      icon: 'none'
    })
  } finally {
    saving.value = false
  }
}

const testConnection = (item: BaseURLItem): Promise<'success' | 'error'> => {
  return new Promise((resolve) => {
    // 娴嬭瘯杩炴帴锛氬彂閫佷竴涓畝鍗曠殑 HEAD 璇锋眰
    uni.request({
      url: `${item.url}/api/app/auth-manager/public-key`,
      method: 'HEAD',
      timeout: 5000,
      success: () => {
        resolve('success')
      },
      fail: () => {
        // 濡傛灉 HEAD 璇锋眰澶辫触锛屽皾璇?GET 璇锋眰
        uni.request({
          url: `${item.url}/api/app/auth-manager/public-key`,
          method: 'GET',
          timeout: 5000,
          success: () => {
            resolve('success')
          },
          fail: () => {
            resolve('error')
          }
        })
      }
    })
  })
}
</script>

<style scoped>
.baseurl-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--c-bg);
}

.baseurl-container.light {
  --c-bg: #F5F7FA;
  --c-card: #FFFFFF;
  --c-main: #2563EB;
  --c-main-light: #EFF6FF;
  --t-primary: #1F2937;
  --t-regular: #6B7280;
  --t-secondary: #9CA3AF;
  --c-border: #E5E7EB;
  --c-shadow: rgba(0, 0, 0, 0.06);
}

.baseurl-container.dark {
  --c-bg: #0F172A;
  --c-card: #1E293B;
  --c-main: #3B82F6;
  --c-main-light: #1E3A5F;
  --t-primary: #F1F5F9;
  --t-regular: #94A3B8;
  --t-secondary: #64748B;
  --c-border: #334155;
  --c-shadow: rgba(0, 0, 0, 0.25);
}

/* 瀵艰埅鏍?*/
.navbar {
  background-color: var(--c-card);
  border-bottom: 2rpx solid var(--c-border);
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  min-height: 88rpx;
}

.back-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.back-btn:active {
  background-color: var(--c-border);
}

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 32rpx;
  font-weight: 600;
  color: var(--t-primary);
}

.nav-actions {
  display: flex;
  gap: 12rpx;
}

.add-btn {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.add-btn:active {
  background-color: var(--c-border);
}

/* 鍐呭鍖哄煙 */
.content {
  flex: 1;
  padding: 40rpx;
}

/* 褰撳墠鍗＄墖 */
.current-card {
  background-color: var(--c-card);
  border-radius: 24rpx;
  padding: 32rpx;
  border: 2rpx solid var(--c-main);
  box-shadow: 0 8rpx 32rpx var(--c-shadow);
  margin-bottom: 40rpx;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.header-title {
  font-size: 28rpx;
  color: var(--t-regular);
}

.current-badge {
  padding: 8rpx 20rpx;
  background-color: var(--c-main);
  border-radius: 8rpx;
  font-size: 24rpx;
  color: #FFFFFF;
  font-weight: 500;
}

.current-url {
  padding: 24rpx;
  background-color: var(--c-bg);
  border-radius: 16rpx;
  border: 2rpx solid var(--c-border);
}

.url-text {
  font-size: 28rpx;
  color: var(--t-primary);
  font-weight: 500;
  word-break: break-all;
}

/* 鍒楄〃鍖哄煙 */
.list-section {
  margin-bottom: 40rpx;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--t-primary);
}

.section-count {
  font-size: 28rpx;
  color: var(--t-secondary);
  margin-left: 8rpx;
}

.empty-state {
  padding: 80rpx 0;
  text-align: center;
}

.empty-text {
  font-size: 28rpx;
  color: var(--t-secondary);
}

.url-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.url-item {
  background-color: var(--c-card);
  border-radius: 16rpx;
  padding: 24rpx;
  border: 2rpx solid var(--c-border);
  display: flex;
  align-items: center;
  gap: 16rpx;
  transition: all 0.2s ease;
}

.url-item.active {
  border-color: var(--c-main);
  background-color: var(--c-main-light);
}

.url-item:active {
  transform: scale(0.98);
}

.url-info {
  flex: 1;
  min-width: 0;
}

.url-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.url-name {
  font-size: 30rpx;
  font-weight: 500;
  color: var(--t-primary);
}

.active-badge {
  padding: 4rpx 16rpx;
  background-color: var(--c-main);
  border-radius: 6rpx;
}

.badge-text {
  font-size: 20rpx;
  color: #FFFFFF;
}

.url-address {
  font-size: 24rpx;
  color: var(--t-regular);
  word-break: break-all;
}

.url-delete {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 16rpx;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.url-delete:active {
  background-color: var(--c-border);
}

/* 寮圭獥鏍峰紡 */
.add-popup {
  width: 600rpx;
  background-color: var(--c-card);
  border-radius: 24rpx;
  overflow: hidden;
}

.popup-header {
  padding: 32rpx 32rpx 24rpx;
  border-bottom: 2rpx solid var(--c-border);
}

.popup-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--t-primary);
  text-align: center;
}

.popup-body {
  padding: 32rpx;
}

.form-group {
  margin-bottom: 24rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: var(--t-regular);
  margin-bottom: 16rpx;
}

/* 鍒囨崲纭寮圭獥鍐呭鏍峰紡 */
.switch-modal-content {
  padding: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.switch-info-row {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  padding: 20rpx;
  background-color: var(--c-bg);
  border-radius: 12rpx;
  border: 2rpx solid var(--c-border);
}

.switch-label {
  font-size: 26rpx;
  color: var(--t-secondary);
}

.switch-value {
  font-size: 30rpx;
  color: var(--t-primary);
  font-weight: 500;
  word-break: break-all;
}

/* 鍒犻櫎纭寮圭獥鍐呭鏍峰紡 */
.delete-modal-content {
  padding: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.delete-info-row {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  padding: 20rpx;
  background-color: var(--c-bg);
  border-radius: 12rpx;
  border: 2rpx solid var(--c-border);
}

.delete-label {
  font-size: 26rpx;
  color: var(--t-secondary);
}

.delete-value {
  font-size: 30rpx;
  color: var(--t-primary);
  font-weight: 500;
  word-break: break-all;
}

.delete-warning {
  padding: 24rpx;
  background-color: rgba(239, 68, 68, 0.1);
  border-radius: 12rpx;
  border: 2rpx solid rgba(239, 68, 68, 0.3);
}

.warning-text {
  font-size: 28rpx;
  color: #EF4444;
  text-align: center;
}

/* 娴嬭瘯杩為€氭€ч伄缃╁眰 */
.testing-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.testing-modal {
  width: 560rpx;
  background-color: var(--c-card);
  border-radius: 24rpx;
  padding: 48rpx 40rpx;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.3);
}

.testing-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
}

.testing-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--t-primary);
}

.testing-current {
  font-size: 28rpx;
  color: var(--t-regular);
  text-align: center;
}
</style>


