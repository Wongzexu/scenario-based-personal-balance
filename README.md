<p align="center">
  <img src="https://img.icons8.com/fluency/96/null/piggy-bank.png" alt="logo" width="96" />
</p>

<h1 align="center">情景记账版个人财务管理系统</h1>

<p align="center">
  <strong>场景化记账 · 自动联动资产负债表 · 前后端渐进式架构</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/版本-2.0.1-emerald?style=flat-square" alt="version" />
  <img src="https://img.shields.io/badge/构建-纯前端+Express后端-059669?style=flat-square" alt="build" />
  <img src="https://img.shields.io/badge/图标-Lucide_SVG-0d9488?style=flat-square" alt="icons" />
  <img src="https://img.shields.io/badge/浏览器-现代浏览器-6366f1?style=flat-square" alt="browsers" />
</p>

---

## 简介

一个基于浏览器的个人财务管理系统，采用**情景记账**模式，将复杂的财务操作简化为三步：**选场景 → 填金额 → 自动联动**。v2.0 重构项目结构，引入 Node.js + Express 后端架起前后端桥梁，纯前端模式仍零依赖打开即用。

> 适合场景：个人/家庭日常收支管理、月度财务盘点、资产负债追踪。

---

## 快速开始

### 纯前端模式（零依赖）
```bash
# 用浏览器直接打开 public/index.html 即可
open public/index.html
```

### 服务端模式（推荐）
```bash
# 1. 安装依赖
npm install

# 2. 启动后端服务
node server.js

# 3. 浏览器访问 http://localhost:3000
```

> 纯前端模式无需 Node.js、无需 npm install、无需构建步骤。服务端模式开启云空间 API 接口，为后续数据同步做准备。

---

## 操作流程

```
① 选择大类 → ② 选择情景 → ③ 输入金额 → ④ 确认记账 → ⑤ 提交到资产负债表
```

### 首次使用

打开页面后点击「开始本期」，两种设定期初数据的方式：

| 方式 | 说明 |
| --- | --- |
| **从历史存档开始** | 选择已有快照，期末数据转为新时期初 |
| **手动输入期初数据** | 自行填写各资产负债项目的期初金额 |

设定期初后进入记账主界面。

### 日常记账

1. **选择场景大类** — 工资与收入 / 日常消费 / 投资理财 / 固定资产
2. **选择具体情景** — 如"工资收入"、"投资支出(买入)"等
3. **输入金额** — 支持算式模式（点击输入框左侧图标切换为计算器）
4. **点击「确认」** — 记录进入暂存列表（尚未更新资产负债表）
5. **检查暂存列表** — 确认无误后点击「提交到资产负债表」
6. **查看右侧** — 资产负债表实时更新

> 为什么要两步？暂存允许你在提交前检查和修改，避免误操作直接影响资产负债表。

---

## 功能一览

| 功能 | 说明 |
| --- | --- |
| **情景化记账** | 预置 12 种常见财务情景，覆盖收入、消费、投资、固定资产四大类 |
| **自动联动** | 每笔记账自动同步更新现金、投资、固定资产、负债及利润五大维度 |
| **内置计算器** | 金额输入框支持算式模式（`100+50*2-30/3`），按回车自动计算 |
| **资产负债盘点** | 实时展示期初金额 → 期初资产/负债 → 本期变动 → 期末余额 |
| **快照存档** | 保存到浏览器缓存、导出/导入 JSON 文件，跨设备迁移数据 |
| **报表导出** | 支持 PNG 图片下载和 PDF 打印两种格式 |
| **暂存确认** | 记账先入暂存区，审核无误后批量提交到资产负债表 |
| **快照覆盖** | 支持覆盖已有存档，类似游戏存档槽位机制 |
| **SVG 图标系统** | 63 个 Lucide 风格 SVG 图标，内联渲染，支持颜色继承和相对尺寸 |
| **云空间预留** | 云同步功能接口预留，支持后端连接测试 |
| **确认弹窗系统** | 统一的确认弹窗，覆盖危险操作场景，降低误触风险 |

---

## 情景映射表

系统通过 `SCENARIO_MAP` 定义每类情景对财务数据的影响：

| 字段 | 说明 | 取值 |
| --- | --- | --- |
| `asset` | 影响的资产类型 | `"cash"` / `"investment"` / `null` |
| `amount` | 资产变动系数 | `1`(增加) / `-1`(减少) / `0`(不变) |
| `liability` | 影响的负债类型 | `"short"` / `"long"` / `0` |
| `liabilityDir` | 负债变动方向 | `1`(增加) / `-1`(减少) |
| `fixedChange` | 固定资产变动 | `1`(增加) / `0`(不变) |
| `profit` | 利润影响 | `1`(收入) / `-1`(支出) / `0`(中性) |

<details>
<summary>💰 工资与收入</summary>

| 情景 | 代码 | 现金 | 投资 | 固定资产 | 负债 | 利润 |
| --- | --- | :-: | :-: | :-: | :-: | :-: |
| 工资收入 | `salary` | +金额 | — | — | — | +金额 |

</details>

<details>
<summary>🛒 日常消费</summary>

| 情景 | 代码 | 现金 | 投资 | 固定资产 | 负债 | 利润 |
| --- | --- | :-: | :-: | :-: | :-: | :-: |
| 日常消费(信用卡) | `credit_buy` | — | — | — | +金额(短) | −金额 |
| 现金消费/转账 | `cash_buy` | −金额 | — | — | — | −金额 |
| 消费退款(信用卡) | `credit_refund` | — | — | — | −金额(短) | +金额 |
| 现金退款/转回 | `cash_refund` | +金额 | — | — | — | +金额 |
| 信用卡还款 | `repay_short` | −金额 | — | — | −金额(短) | — |

</details>

<details>
<summary>📈 投资理财</summary>

| 情景 | 代码 | 现金 | 投资 | 固定资产 | 负债 | 利润 |
| --- | --- | :-: | :-: | :-: | :-: | :-: |
| 投资支出(买入) | `investment_buy` | −金额 | +金额 | — | — | — |
| 本期赎回(卖出) | `investment_sell` | +金额 | −金额 | — | — | — |
| 投资收益(分红/亏损) | `investment_dividend` | +金额 | — | — | — | +金额 |

> `investment_dividend` 是唯一支持**负数金额**的情景（表示投资亏损）。

</details>

<details>
<summary>🏠 固定资产</summary>

| 情景 | 代码 | 现金 | 投资 | 固定资产 | 负债 | 利润 |
| --- | --- | :-: | :-: | :-: | :-: | :-: |
| 偿还贷款(长期) | `repay_long` | −金额 | — | — | −金额(长) | — |
| 资产增加 | `asset_increase` | — | — | +金额 | — | — |
| 添加贷款(长期) | `add_long_loan` | +金额 | — | — | +金额(长) | — |

</details>

---

## 数据模型

```
baseData (期初)          changes (本期变动)          end (期末)
├── cash                 ├── cash                    ├── cash = base + change
├── investment           ├── investment              ├── investment = base + change
├── fixed                ├── fixed                   ├── fixed = base + change
├── liabilityShort       ├── liabilityShort          ├── liabilityShort = base + change
└── liabilityLong        └── liabilityLong           ├── liabilityLong = base + change
                                                       └── profit
```

### localStorage 键

| 键名 | 内容 | 触发时机 |
| --- | --- | --- |
| `finance_BaseData` | 期初资产负债数据 | 设定期初 / 加载快照 |
| `finance_Changes` | 本期累计变动 | 提交暂存 / 删除记录 |
| `finance_Pending` | 暂存记账明细 | 确认记账 / 提交后清空 |
| `finance_BeginTime` | 期初时间 | 开始新的一期 |
| `finance_Snapshots` | 快照列表 (≤50 条) | 保存 / 覆盖 / 删除 |
| `finance_Sessions` | 已提交会话记录 | 每次提交 |
| `finance_Requests` | 用户情景建议 | 申请增加 |

---

## SVG 图标系统

项目使用内联 SVG 图标替代传统 emoji，共 63 个 Lucide 风格图标。

### HTML 中使用

```html
<!-- 固定尺寸 -->
<span data-icon="wallet" data-size="16"></span>

<!-- 跟随父元素字号（如 h3 标题中的图标） -->
<span data-icon="clipboard-pen-line" data-size="1em"></span>
```

### JS 中使用

```js
// 固定像素
html += icon("circle-check") + " 操作成功";

// 相对单位
html += icon("check-check", "1em") + " 提交";
```

### 图标管理工具

```bash
# 注册新图标（自动写入 icons-data.js）
node tools/icon-tools/add-icon.js camera star

# 搜索可用图标
node tools/icon-tools/add-icon.js --search chart

# 查看未注册图标列表
node tools/icon-tools/add-icon.js --sync
```

也可以打开 `admin/icon-manager.html` 可视化浏览 427 个可用图标。

---

## 技术栈

| 层级 | 技术 |
| --- | --- |
| **前端** | HTML5 + CSS3 + JavaScript (Vanilla) |
| **布局** | CSS Grid 双栏响应式布局 |
| **图标** | Lucide SVG 内联渲染，`fill="currentColor"` 颜色继承 |
| **数据** | localStorage（持久化），未来可切换为后端 API |
| **导出** | Canvas 2D API（PNG）/ `window.print()`（PDF） |
| **后端** | Node.js + Express（v2.0 新增，可选） |

### 文件结构

```
finance/
├── server.js                       # Express 后端服务（v2.0 新增）
├── package.json                    # Node.js 项目配置（v2.0 新增）
├── data/
│   └── users.json                  # 用户示例数据（v2.0 新增）
├── public/                         # 前端静态资源（v2.0 移入 public/）
│   ├── index.html                  # 主页面
│   ├── css/
│   │   └── style.css               # 样式（CSS 变量设计系统）
│   ├── js/
│   │   ├── app.js                  # 入口、图标辅助函数
│   │   ├── cloud-sync.js           # 云空间同步模块（v2.0 新增）
│   │   ├── config/
│   │   │   └── scenarios.js        # 情景映射配置
│   │   ├── core/
│   │   │   ├── icons-data.js       # SVG path 数据（63 个图标）
│   │   │   ├── storage.js          # 数据读写
│   │   │   ├── state.js            # 全局状态、周期管理
│   │   │   └── calculator.js       # 计算引擎
│   │   ├── ui/
│   │   │   ├── modal.js            # 弹窗、Toast、switchModal
│   │   │   ├── form.js             # 表单验证、确认记账
│   │   │   ├── render.js           # 暂存列表渲染
│   │   │   └── report.js           # 报表导出
│   │   └── snapshot/
│   │       └── snapshot.js         # 快照保存/加载/导入
│   ├── tests/
│   │   └── icon-modal-test.html    # 图标模态框测试
│   └── todo/
│       ├── future-front-end.md     # 前端待办
│       ├── future-back-end.md      # 后端学习指引（v2.0 新增）
│       ├── svg-icon-plan.md        # SVG 图标计划
│       └── what next.md            # 下一步计划（v2.0 新增）
├── admin/                           # 管理后台界面（v2.1 新增）
│   └── icon-manager.html            # 图标管理器
├── tools/icon-tools/                # CLI 开发工具
│   └── add-icon.js                  # SVG 图标注册脚本
├── src/assets/icons/                # SVG 图标库（427 个）
├── version/                         # 版本索引
│   └── v2.0.md                     # v2.0 项目索引
└── README.md
```

---

## 版本历史

| 版本 | 日期 | 说明 |
| --- | --- | --- |
| **v2.0.1** | 2026-06-09 | **大型重构**：项目目录拆分至 `public/`，引入 Node.js + Express 后端架，云空间功能预留，CSS 变量设计系统，确认弹窗系统，统一图标管理，新建版本索引 |
| **v1.2** | 2026-06-09 | SVG 图标全面替换、switchModal 模态框平滑切换、期初金额分区、快照来源区分图标、图标管理工具、icon() 支持 em 相对单位 |
| **v1.1.1** | 2026-06-03 | 会话系统、快照双模式加载、快照覆盖、模态框返回、Toast 通知、浮点精度修复、UI 全面打磨 |
| **v1.0.3** | — | 开始本期流程、暂存确认、快照覆盖、新的一期重置 |
| **v1.0.2** | — | 历史存档弹窗、快照导入导出、打印/PNG导出 |
| **v1.0.1** | — | 计算器模式、情景映射完善、UI 优化 |
| **v1.0** | — | 情景记账核心功能：场景选择 + 自动联动资产负债表 |

---

## 后续计划

- [ ] 云空间数据同步（连接后端实现云端存取）
- [ ] 历史数据对比分析（多期净资产趋势图）
- [ ] 财务比率计算（资产负债率、流动比率等）
- [ ] 预算管理功能
- [ ] 更多情景支持（根据用户反馈）
- [ ] 数据导出为 Excel/CSV 格式
- [ ] 暗色模式
- [ ] 用户认证与权限系统

---

<p align="center">
  <sub>Made with ❤️ for personal finance management</sub>
</p>
