# SVG 图标替换 + 模态框优化 实施计划

> 基于 `what next.md`，经 `tests/icon-modal-test.html` 实测验证后的最终执行版。

---

## 〇、测试验证结论

通过 `tests/icon-modal-test.html` 实测，确认以下关键技术决策：

| 测试项 | 结论 |
|--------|------|
| `<img src="xxx.svg">` | ✅ 显示正常，但无法 CSS 改色 |
| CSS `mask-image: url(xxx.svg)` | ❌ Chrome `file://` 协议下触发 CORS 拦截 |
| CSS `mask-image` + data URI | ✅ 可行，但需转换所有 SVG |
| **Inline `<svg>` 元素** | **✅ 通过，最可靠方案** |
| `fill="currentColor"` 颜色继承 | ✅ 按钮、状态条、标题等场景全部正常 |
| `vertical-align: text-bottom` 对齐 | ✅ 图标与文字基线对齐良好 |
| `switchModal` 原子切换 | ✅ backdrop 无闪烁，测试通过 |
| 返回按钮布局：`[← 返回] [icon] 标题 [×]` | ✅ 同一行水平居中 |

---

## 一、最终图标映射表

> 所有图标使用 inline SVG 方案，`fill="currentColor"` 自动继承上下文颜色。
> 数据文件：`js/core/icons-data.js`（63 个图标 path）。

### HTML 静态图标

| 原先的位置和名称 | SVG 名称 |
|---|---|
| 🚀 情景记账版个人财务管理系统 | `layout-dashboard` |
| 📝 情景记账录入 | `notepad-text` |
| 📊（start-icon） | `chart-column-big` |
| 🚀 开始本期 (start-btn) | `clipboard-pen` |
| ↩ 退出 | `arrow-left` |
| 🔄 开始新的一期 | `repeat-2` |
| 💰 工资与收入 | `wallet` |
| 🛒 日常消费 | `shopping-cart` |
| 📈 投资理财 | `chart-candlestick` |
| 🏠 固定资产 | `house-plus` |
| 📝 (id="calc-toggle") | `text-cursor-input` |
| ✕（id="clear-input"） | `circle-x` |
| 💾 保存快照 | `save` |
| 📋 快照历史 | `clipboard-clock` |
| 📥 打印报表 | `printer` |
| 🔄 重置 | `refresh-ccw-dot` |
| 🔃 刷新 | `rotate-cw` |
| 📅 期初时间 | `calendar-fold` |
| 📅 本期时间 | `calendar` |
| ⏱ 间隔 | `calendar-clock` |
| 🏠 资产 | `house` |
| 💳 负债 | `credit-card` |
| （new）期初金额 | `clipboard` |
| 📈 本期变动 | `clipboard-plus` |
| 📉 期末余额 | `clipboard-list` |
| 🖨️ 打印报表h3 | `printer-check` |
| ✕ modal-close | `x` |
| 🖼️ PNG | `images` |
| 📄 PDF | `file-text` |
| 💾 保存快照h3 | `save-all` |
| ➕ save-new-icon | `circle-fading-plus` |
| 📁 导出JSON | `folder-output` |
| 📦 保存并导出 | `package-open` |
| 🗄️ 数据管理 | `database` |
| 📁 从JSON导入 | `folder-input` |
| 🚀 开始本期h3 | `clipboard-pen-line` |
| 📋 从历史存档开始 | `database-search` |
| 📁 从JSON导入(title) | `folder-search` |
| ✏️ 手动输入期初(title) | `pen-line` |
| ✏️ 手动输入期初h3 | `square-pen` |
| ✅ 确认开始 | `square-check-big` |
| 🔄 开始新的一期h3 | `repeat` |
| 💾 导出期末开始新一期 | `clipboard-paste` |
| 🗑️ 不保存重新开始 | `clipboard-x` |
| 📋 选择加载方式h3 | `square-dashed-mouse-pointer` |
| 📈 导入为新一期 | `clipboard-copy` |
| 🔄 继续本期 | `file-pen-line` |
| ← 返回按钮 | `chevron-left` |

### JS 动态图标

| 原先的位置和名称 | SVG 名称 |
|---|---|
| 🧮 计算模式 toggle | `calculator` |
| 📝 手动输入模式 toggle | `text-cursor-input` |
| ✅ 就绪 (form.js) | `square-check` |
| ✅ 已记录 (form.js) | `circle-check` |
| ✅ 第X次记账已提交 (render.js) | `list-checks` |
| ✅ 已提交记账 (render.js) | `sticky-note-check` |
| 📋 待提交记录 (render.js) | `sticky-note` |
| ↩ 撤销提交按钮 (render.js) | `iteration-cw` |
| ↩ 撤销提交确认弹窗 (snapshot.js) | `iteration-cw` |
| ⚠ 未提交记录警告 (report.js) | `circle-alert` |
| ✅ 感谢建议 (app.js) | `circle-check` |
| 📝 申请增加 (app.js) | `send` |
| ✅ 存档已覆盖 (snapshot.js) | `circle-check` |
| ✅ 已从存档开始新一期 (snapshot.js) | `circle-check` |
| ✅ 存档已恢复 (snapshot.js) | `circle-check` |
| ✅ 记账已撤销 (snapshot.js) | `circle-check` |
| ✅ 本期已重置 (snapshot.js) | `circle-check` |
| ✅ 时间已刷新 (snapshot.js) | `circle-check` |
| ⚠ 文件格式错误 (snapshot.js) | `triangle-alert` |
| ⚠ 文件解析失败 (snapshot.js) | `triangle-alert` |
| 📝 覆盖存档确认 (snapshot.js) | `replace` |
| 📝 覆盖存档确认另一处 (snapshot.js) | `replace` |
| 📝 选择覆盖存档 (snapshot.js) | `replace` |
| 💾 快照已保存 (snapshot.js) | `inbox` |
| 💾 保存快照成功 (snapshot.js) | `inbox` |
| 📭 暂无存档 (snapshot.js) | `archive-x` |
| 📁 导入确认弹窗 (snapshot.js) | `folder-input` |
| 📁 导入快照标签 (snapshot.js) | `file-input` |

### 已删除项

| 原先的位置和名称 | 处理方式 |
|---|---|
| ↩ 返回初始界面确认弹窗 | 删除 emoji |
| 🔄 重置本期确认弹窗 | 删除 emoji |

---

## 二、结构修改

### 2.1 手动输入期初模态框 → 添加返回按钮

在 `manual-start-modal` 的 `.modal-header` 中添加返回按钮，点击返回 `start-period-modal`。

### 2.2 返回按钮布局

经过测试验证，最终方案：返回按钮与标题同一行，置于最左侧。

```
[← 返回]  [icon]  标题文字              [×]
```

- 返回按钮 `flex-shrink: 0`，灰色小字 (`0.78rem`, `var(--gray-400)`)
- h3 `flex: 1` 撑开中间空间
- 关闭按钮在最右
- `align-items: center` 统一垂直居中
- 所有按钮 `line-height: 1` 避免行高参差

### 2.3 删除"从JSON文件导入"选择项

`start-period-modal` 中删除 `startFromJSON()` 对应的 choice-btn。

### 2.4 资产负债表添加"期初金额"区域抬头

在表二 `<tr class="section-header">🏠 资产</tr>` 之前添加：
```html
<tr><td colspan="2" class="section-header">期初金额</td></tr>
```

### 2.5 快照列表"获取方式"区分图标

- 本地保存：名称前加 `inbox` 图标
- JSON 导入：名称前加 `file-input` 图标
- 判断：`snap.id` 是否以 `snap_imported_` 开头

---

## 三、模态框闪烁修复：`switchModal`

### 函数

```js
function switchModal(fromId, toId) {
  if (fromId === toId) return;
  var fromEl = document.getElementById(fromId);
  var toEl = document.getElementById(toId);
  if (!fromEl || !toEl) return;

  toEl.style.display = "flex";
  void toEl.offsetHeight;
  toEl.classList.add("active");       // 先激活 TO
  fromEl.classList.remove("active");   // 再停用 FROM

  var cleanup = function () {
    if (!fromEl.classList.contains("active") && fromEl.style.display !== "none")
      fromEl.style.display = "none";
  };
  var cleanupTimer = setTimeout(cleanup, 350);
  fromEl.addEventListener("transitionend", function handler(e) {
    if (e.propertyName === "opacity") {
      clearTimeout(cleanupTimer);
      fromEl.removeEventListener("transitionend", handler);
      cleanup();
    }
  });
}
```

### 四个关键细节

| # | 风险 | 处理 |
|---|------|------|
| 1 | 先关 FROM 再开 TO 会导致空窗 | **先 `add("active")` TO，后 `remove("active")` FROM** |
| 2 | `transitionend` 对 opacity/transform 各触发一次 | `e.propertyName === "opacity"` |
| 3 | 兜底 setTimeout 竞态 | `clearTimeout(cleanupTimer)` |
| 4 | 极端 `fromId === toId` | 函数第一行 guard return |

### 调用方改造

| 位置 | 原调用 | 改为 |
|------|--------|------|
| `startManual()` | closeModal→openModal | `switchModal("start-period-modal", "manual-start-modal")` |
| `startOverwriteMode()` | closeModal→openHistoryModal | `switchModal("save-choice-modal", "history-modal")` |
| `closeHistoryModal()` | closeModal→openModal | `switchModal("history-modal", "start-period-modal")` |
| `loadSnapshot()` | closeHistoryModal→openModal | `switchModal("history-modal", "snapshot-load-mode-modal")` |
| `cancelSnapshotLoad()` | closeModal→openHistoryModal | `switchModal("snapshot-load-mode-modal", "history-modal")` |
| `importSnapshot()` | closeHistoryModal→openModal | `switchModal("history-modal", "snapshot-load-mode-modal")` |

---

## 四、SVG 引用方式：Inline SVG（经测试验证）

### 4.1 为什么不用 mask-image

Chrome 对 `file://` 协议下的 CSS `mask-image: url(xxx.svg)` 触发 CORS 拦截：
```
Access to image at 'file:///...svg' from origin 'null' has been blocked by CORS policy
```
`<img>` 标签不受此限制，但无法通过 CSS 改色。因此最终采用 **Inline SVG** 方案。

### 4.2 数据文件：`js/core/icons-data.js`

```js
var ICON_PATHS = {
  'calculator': '<path d="M..."></path><path d="M..."></path>',
  'wallet': '<path d="..."></path>',
  // ... 63 个图标
};
```

包含所有计划内使用的图标 path 数据。如需新增图标，运行提取脚本即可。

### 4.3 辅助函数

**icon()** — JS 动态生成（写入 `app.js`）：

```js
function icon(name, size) {
  size = size || 16;
  var paths = ICON_PATHS[name] || '';
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 1024 1024" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="icon-svg">' + paths + '</svg>';
}
```

**processDataIcons()** — HTML 静态替换（写入 `app.js`，页面加载时调用）：

```js
function processDataIcons() {
  var els = document.querySelectorAll('[data-icon]');
  els.forEach(function(el) {
    var name = el.getAttribute('data-icon');
    var size = parseInt(el.getAttribute('data-size')) || 16;
    el.outerHTML = icon(name, size);
  });
}
```

### 4.4 使用方式

**HTML 静态：**
```html
<span data-icon="calculator" data-size="18"></span>
<!-- 页面加载后自动替换为 <svg>...</svg> -->
```

**JS 动态：**
```js
html += icon("circle-check") + " 操作成功";
toast.innerHTML = icon("circle-check", 16) + " 存档已覆盖！";
```

### 4.5 CSS

```css
.icon-svg {
  display: inline-block;
  vertical-align: text-bottom;
  flex-shrink: 0;
}
```

---

## 五、实施顺序

| # | 步骤 | 涉及文件 |
|---|------|---------|
| 1 | CSS 准备：`.icon-svg` 类 | `css/style.css` |
| 2 | 引入 icons-data.js + 添加 `icon()` / `processDataIcons()` | `index.html` (script 引用), `js/app.js` |
| 3 | HTML 图标替换：emoji → `<span data-icon="...">` | `index.html` |
| 4 | HTML 结构修改：期初金额抬头、删除JSON导入、返回按钮 | `index.html` |
| 5 | 模态框 header 布局统一 + `switchModal` 函数 | `js/ui/modal.js` |
| 6 | 模态框跳转调用方改造 (6处) | `js/snapshot/snapshot.js` |
| 7 | JS 图标替换：emoji → `icon()` | `js/app.js`, `js/ui/form.js`, `js/ui/render.js`, `js/ui/report.js`, `js/snapshot/snapshot.js` |
| 8 | 快照区分图标 | `js/snapshot/snapshot.js` |
| 9 | 全量 Checklist 验证 | 所有文件 |

---

## 六、最终 Checklist

### HTML 静态图标
- [ ] 🚀 标题 → `layout-dashboard`
- [ ] 📝 记账录入 → `notepad-text`
- [ ] 📊 start-icon → `chart-column-big`
- [ ] 🚀 开始本期(start-btn) → `clipboard-pen`
- [ ] ↩ 退出 → `arrow-left`
- [ ] 🔄 开始新的一期 → `repeat-2`
- [ ] 💰 工资与收入 → `wallet`
- [ ] 🛒 日常消费 → `shopping-cart`
- [ ] 📈 投资理财 → `chart-candlestick`
- [ ] 🏠 固定资产 → `house-plus`
- [ ] 📝 calc-toggle → `text-cursor-input`
- [ ] ✕ clear-input → `circle-x`
- [ ] 💾 保存快照 → `save`
- [ ] 📋 快照历史 → `clipboard-clock`
- [ ] 📥 打印报表 → `printer`
- [ ] 🔄 重置 → `refresh-ccw-dot`
- [ ] 🔃 刷新 → `rotate-cw`
- [ ] 📅 期初时间 → `calendar-fold`
- [ ] 📅 本期时间 → `calendar`
- [ ] ⏱ 间隔 → `calendar-clock`
- [ ] 🏠 资产 → `house`
- [ ] 💳 负债 → `credit-card`
- [ ] [new] 期初金额 → `clipboard`
- [ ] 📈 本期变动 → `clipboard-plus`
- [ ] 📉 期末余额 → `clipboard-list`
- [ ] 🖨️ 打印报表h3 → `printer-check`
- [ ] ✕ modal-close → `x`
- [ ] 🖼️ PNG → `images`
- [ ] 📄 PDF → `file-text`
- [ ] 💾 保存快照h3 → `save-all`
- [ ] ➕ save-new-icon → `circle-fading-plus`
- [ ] 📁 导出JSON → `folder-output`
- [ ] 📦 保存并导出 → `package-open`
- [ ] 🗄️ 数据管理 → `database`
- [ ] 📁 从JSON导入 → `folder-input`
- [ ] 🚀 开始本期h3 → `clipboard-pen-line`
- [ ] 📋 从历史存档开始 → `database-search`
- [ ] 📁 从JSON导入(title) → `folder-search`
- [ ] ✏️ 手动输入期初(title) → `pen-line`
- [ ] ✏️ 手动输入期初h3 → `square-pen`
- [ ] ✅ 确认开始 → `square-check-big`
- [ ] 🔄 开始新的一期h3 → `repeat`
- [ ] 💾 导出期末开始新一期 → `clipboard-paste`
- [ ] 🗑️ 不保存重新开始 → `clipboard-x`
- [ ] 📋 选择加载方式h3 → `square-dashed-mouse-pointer`
- [ ] 📈 导入为新一期 → `clipboard-copy`
- [ ] 🔄 继续本期 → `file-pen-line`
- [ ] ← 返回按钮 → `chevron-left`

### JS 动态图标
- [ ] 🧮 计算模式 toggle → `calculator`
- [ ] 📝 手动输入 toggle → `text-cursor-input`
- [ ] ✅ 就绪 (form.js) → `square-check`
- [ ] ✅ 已记录 (form.js) → `circle-check`
- [ ] 📝 申请增加 (app.js) → `send`
- [ ] ✅ 感谢建议 (app.js) → `circle-check`
- [ ] ✅ 第X次记账已提交 (render.js) → `list-checks`
- [ ] 📋 待提交记录 (render.js) → `sticky-note`
- [ ] ✅ 已提交记账 (render.js) → `sticky-note-check`
- [ ] ↩ 撤销提交按钮 (render.js) → `iteration-cw`
- [ ] ↩ 撤销提交确认弹窗 (snapshot.js) → `iteration-cw`
- [ ] ⚠ 未提交警告 (report.js) → `circle-alert`
- [ ] ✅ 存档已覆盖 (snapshot.js) → `circle-check`
- [ ] ✅ 已从存档开始新一期 (snapshot.js) → `circle-check`
- [ ] ✅ 存档已恢复 (snapshot.js) → `circle-check`
- [ ] ✅ 记账已撤销 (snapshot.js) → `circle-check`
- [ ] ✅ 本期已重置 (snapshot.js) → `circle-check`
- [ ] ✅ 时间已刷新 (snapshot.js) → `circle-check`
- [ ] ⚠ 文件格式错误 (snapshot.js) → `triangle-alert`
- [ ] ⚠ 文件解析失败 (snapshot.js) → `triangle-alert`
- [ ] 📝 覆盖存档确认 (snapshot.js) → `replace`
- [ ] 📝 选择覆盖存档 (snapshot.js) → `replace`
- [ ] 💾 快照已保存 (snapshot.js) → `inbox`
- [ ] 💾 保存快照成功 (snapshot.js) → `inbox`
- [ ] 📭 暂无存档 (snapshot.js) → `archive-x`
- [ ] 📁 导入确认弹窗 (snapshot.js) → `folder-input`
- [ ] 📁 导入快照标签 (snapshot.js) → `file-input`

### 结构/逻辑修改
- [ ] 期初金额 section-header 添加
- [ ] 删除 start-period-modal 中 JSON 导入选项
- [ ] 手动输入模态框添加 `[← 返回]` 按钮
- [ ] 所有模态框 header 统一为 `[icon] h3 [×]` 布局
- [ ] 带返回按钮的 header：`[← 返回] [icon] h3 [×]`
- [ ] `switchModal` 函数加入 `modal.js`
- [ ] 6 处模态框跳转改为 `switchModal`
- [ ] 快照列表区分本地/导入图标
- [ ] ↩ 返回初始界面 emoji 删除
- [ ] 🔄 重置本期 emoji 删除
