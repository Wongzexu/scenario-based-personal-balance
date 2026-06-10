CSS整理并优化，提取文字大小和颜色等相关变量。

确认是否文字大小固定？导致图标也会固定？？？？？

选择加载方式的模态框，点击返回没有到上一级模态框，而是直接退出了

刷新按钮我希望增加一个动画，看看是否可以纯css解决？就是点击后，刷新图标svg转一圈360度即可。

导出PDF的格式我需要更换一下，不是简单地按照目前来，而是有更专业的排布和设置，需要我后续提供信息。或许可以在另一个git上进行？然后先建立一个test进行确认？

后台管理系统-目前是icon管理 后端处理 ✅ 已完成（见 `old/adjust/icon-manager-multi-select-fix.md`）

---

## 🎯 推荐执行顺序（前4项）

### 第1项：提取 `zeroChanges()` / `zeroBase()` 工厂函数

**收益**：消除6处重复对象定义，修改一处全局生效  
**风险**：极低（纯函数，无副作用）  
**耗时**：5分钟

**执行步骤**：

1. 在 `storage.js`（或新建 `utils/initialState.js`）添加：

```javascript
// storage.js
export function zeroChanges() {
  return {
    cash: 0,
    investment: 0,
    fixed: 0,
    liabilityShort: 0,
    liabilityLong: 0,
    profit: 0,
  };
}

export function zeroBase() {
  return {
    cash: 0,
    investment: 0,
    fixed: 0,
    liabilityShort: 0,
    liabilityLong: 0,
  };
}
```

2. 全局替换：
   - `{ cash:0, investment:0, fixed:0, liabilityShort:0, liabilityLong:0, profit:0 }` → `zeroChanges()`
   - `{ cash:0, investment:0, fixed:0, liabilityShort:0, liabilityLong:0 }` → `zeroBase()`
   - 注意：先导入函数（`import { zeroChanges, zeroBase } from './storage.js'`）

---

### 第2项：提取 `formatLabel(now)` 函数

**收益**：统一4处快照标签格式，以后改格式只需改一处  
**风险**：极低  
**耗时**：3分钟

**执行步骤**：

1. 在 `snapshot.js` 顶部添加：

```javascript
function formatSnapshotLabel(now) {
  return now.toLocaleString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
```

2. 将4处（行103、135、243、271）的整段 `toLocaleString` 调用替换为：

```javascript
formatSnapshotLabel(now);
```

---

### 第3项：魔法数字提取常量

**收益**：代码自文档化，修改超时/延迟只需改一处  
**风险**：低（纯值替换）  
**耗时**：10分钟

**执行步骤**：

1. 在各文件顶部添加常量定义（或统一放在 `constants.js`）：

**calculator.js**：

```javascript
const PRECISION = 100; // 两位小数精度
```

**state.js**：

```javascript
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const MS_PER_HOUR = 1000 * 60 * 60;
const MS_PER_MIN = 1000 * 60;
```

**report.js**：

```javascript
const PRINT_DELAY_MS = 500;
```

**snapshot.js**：

```javascript
const MAX_SNAPSHOTS = 50;
```

**modal.js**：

```javascript
const TRANSITION_MS = 350;
const CLOSE_MS = 300;
const TOAST_CLEANUP_MS = 400;
const DEFAULT_TOAST_MS = 3000;
```

2. 搜索替换：比如 `500` → `PRINT_DELAY_MS`（注意确认确实是打印延迟，而非其他500）

---

### 第4项：合并 `overwriteSnapshot` 和 `overwriteSnapshotFromSave`

**收益**：95%重复代码合并为一个函数，维护成本减半  
**风险**：低（逻辑相同，仅是否关闭弹窗的区别）  
**耗时**：10分钟

**执行步骤**：

1. 保留 `overwriteSnapshot`，为其添加第二个参数：

```javascript
// snapshot.js
function overwriteSnapshot(id, options = {}) {
  const { closeModalAfter = false } = options;

  // ... 原来的 overwriteSnapshot 逻辑 ...

  if (closeModalAfter) {
    closeModal();
  }
}
```

2. 删除 `overwriteSnapshotFromSave` 函数（原222行）

3. 将其调用处改为：

```javascript
// 原来调用 overwriteSnapshotFromSave(id) 的地方
overwriteSnapshot(id, { closeModalAfter: true });
```

---

## 📋 剩余任务（按优先级排序，暂不执行）

完成上面4项后，按以下顺序继续：

| 优先级 | 任务                                               | 预估耗时 | 风险 |
| ------ | -------------------------------------------------- | -------- | ---- |
| ⭐⭐   | 魔法字符串提取常量（localStorage keys, toast类型） | 15分钟   | 低   |
| ⭐⭐   | 抽取 `resetState()` 函数（消除4处重复重置代码）    | 10分钟   | 低   |
| ⭐⭐   | 拆分 `checkPeriodAndShowUI` 为两个函数             | 5分钟    | 低   |
| ⭐     | 重命名5个肥胖函数（需全局替换）                    | 15分钟   | 中   |
| ⭐     | 拆分 `snapshot.js`（686行拆为4个文件）             | 30分钟   | 中   |
| ⭐     | 拆分 `style.css`（1284行）                         | 1小时    | 中   |

---

## ✅ 快速验证清单（每完成一项后检查）

- [ ] 页面刷新后数据加载正常
- [ ] 创建新快照、加载快照功能正常
- [ ] 控制台无报错
- [ ] 原有的单元测试通过（如有）

---

## 🚀 立即开始的建议

**如果你只有15分钟**：只做第1项和第2项（zero对象 + formatLabel），这是纯纯的“减肥”，不改任何逻辑，但代码干净度明显提升。

**如果你有30分钟**：完成前4项（zero对象 + formatLabel + 魔法数字 + overwrite合并）。

**如果你愿意让我帮你写具体代码**：告诉我你想先改哪个文件（比如 `snapshot.js` 或 `state.js`），我可以给出精确到行的修改版本。你现在的自查报告质量很高，执行起来会非常顺畅。
