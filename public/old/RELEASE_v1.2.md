## 🎨 SVG 图标系统

全面替换项目内所有 emoji，改用 65 个 Lucide 风格内联 SVG 图标。

- **内联渲染** — path 数据直接嵌入，无外部依赖，`file://` 协议无 CORS 问题
- **颜色继承** — `fill="currentColor"` 自动匹配父元素上下文颜色（按钮 hover、状态栏等）
- **相对尺寸** — HTML 用 `data-size="1em"` 跟随父元素字号；JS 用 `icon("name", "1em")`
- **零帧开销** — `processDataIcons()` 页面加载时自动替换全部 `[data-icon]` 元素

## 🔄 switchModal 原子切换

模态框切换不再闪烁。`switchModal(from, to)` 先激活目标再停用源，避免 backdrop 空窗帧。

- 4 个安全细节：激活顺序 / 只响应 opacity transitionend / 清除 setTimeout 竞态 / 同 ID 短路
- 6 处调用改造：`snapshot.js` 中所有 modal→modal 跳转全部切换

## 📐 结构优化

- **期初金额分区** — 资产负债表新增独立的「期初金额」section-header，与资产/负债/变动/期末余额并列
- **简化为双选项** — 开始本期界面从三种方式精简为两种（移除 JSON 导入入口）
- **统一模态框 header** — `[icon] h3 [×]` 标准布局；含返回按钮的用 `[← 返回] [icon] h3 [×]`
- **快照来源区分** — 快照列表自动根据 `snap_imported_` ID 前缀显示本地/导入来源图标

## 🛠 图标管理工具

`tools/icon-tools/` 下新增两套工具，配合 427 个 SVG 源文件使用：

| 工具 | 用法 |
|------|------|
| `add-icon.js` | CLI：`node tools/icon-tools/add-icon.js camera star` 直接写入 `icons-data.js` |
| `manager.html` | 浏览器：可视化浏览 427 图标、搜索、一键生成注册代码或 CLI 命令 |

## 🧹 代码重组

- 从旧版单文件拆分为 `js/core/` `js/ui/` `js/snapshot/` 模块化结构
- `showToast()` 改用 `innerHTML` 渲染，支持图标 SVG
- `processDataIcons()` 带防御性检查，缺失图标不崩溃

---

**Full Changelog**: [`v1.1.1...v1.2`](https://github.com/Wongzexu/scenario-based-personal-balance/compare/v1.1.1...v1.2)
