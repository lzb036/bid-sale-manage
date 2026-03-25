# 游戏装备销售数据模块

## 目录结构

```
equipment-sales/
├── overview/          # 数据概览
│   └── index.vue
├── account/           # 账号管理
│   └── index.vue
├── sync/              # 数据同步
│   └── index.vue
├── transactions/      # 交易记录
│   └── index.vue
└── inventory/         # 饰品库存
    └── index.vue
```

## 页面说明

### 1. 数据概览 (overview)
- 路径: `/pages/tabs/equipment-sales/overview/index`
- 功能: 展示所有账号的汇总数据
- 状态: 基础框架已完成，待实现业务逻辑

### 2. 账号管理 (account)
- 路径: `/pages/tabs/equipment-sales/account/index`
- 功能: 管理Steam账号和平台账号绑定
- 状态: 基础框架已完成，待实现业务逻辑

### 3. 数据同步 (sync)
- 路径: `/pages/tabs/equipment-sales/sync/index`
- 功能: 手动触发数据同步，查看同步历史
- 状态: 基础框架已完成，待实现业务逻辑

### 4. 交易记录 (transactions)
- 路径: `/pages/tabs/equipment-sales/transactions/index`
- 功能: 查看所有平台的销售和提现记录
- 状态: 基础框架已完成，待实现业务逻辑

### 5. 饰品库存 (inventory)
- 路径: `/pages/tabs/equipment-sales/inventory/index`
- 功能: 查看Steam背包中的所有饰品
- 状态: 基础框架已完成，待实现业务逻辑

## 底部Tab导航

所有页面都使用自定义的 `equipment-tabbar` 组件实现底部Tab导航。

### 组件位置
`/components/equipment-tabbar/equipment-tabbar.vue`

### 特性
- 使用emoji图标（临时方案，可替换为图片图标）
- 自动识别当前页面并高亮对应Tab
- 点击Tab切换页面
- 响应式设计，适配不同屏幕尺寸
- 支持安全区域适配（iPhone X等）

### 图标说明
当前使用emoji作为临时图标：
- 📊 数据概览
- 👤 账号管理
- 🔄 数据同步
- 📝 交易记录
- 🎮 饰品库存

如需使用图片图标，请参考 `/static/tabbar/README.md`

## 如何访问

### 方式1: 直接跳转
```javascript
uni.navigateTo({
  url: '/pages/tabs/equipment-sales/overview/index'
})
```

### 方式2: 从主应用入口
可以在主应用的某个页面添加入口按钮，跳转到概览页面。

## 开发指南

### 添加业务逻辑
1. 在对应页面的 `<script setup>` 中添加业务逻辑
2. 使用 Pinia store 管理状态（需要创建对应的store）
3. 调用API获取数据（需要创建对应的API模块）

### 样式定制
- 修改各页面的 `<style scoped>` 部分
- 使用全局CSS变量（定义在 App.vue）
- 支持明暗主题切换

### 状态管理
建议创建以下store：
- `salesAccountStore`: 账号管理状态
- `syncStatusStore`: 同步状态管理
- `transactionStore`: 交易记录状态
- `inventoryStore`: 库存数据状态

### API模块
建议创建以下API模块：
- `api/modules/equipment-account.ts`: 账号管理API
- `api/modules/equipment-platform.ts`: 平台数据同步API
- `api/modules/equipment-data.ts`: 数据上传API

## 测试

在HBuilderX中运行项目：
1. 打开项目
2. 运行 -> 运行到浏览器 -> Chrome
3. 访问任意一个Tab页面
4. 测试Tab切换功能

## 注意事项

1. 所有页面使用 `navigationStyle: "custom"` 自定义导航栏
2. 页面底部需要预留120rpx空间给Tab导航栏
3. Tab切换使用 `uni.redirectTo` 而不是 `uni.switchTab`（因为不是原生tabBar）
4. 如果需要使用原生tabBar，需要准备图标文件并修改 pages.json

## 下一步

1. 实现各页面的业务逻辑
2. 创建对应的store和API模块
3. 添加数据加载、错误处理等功能
4. 优化UI和交互体验
5. 准备正式的图标资源
