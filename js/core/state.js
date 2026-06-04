// ==================== 2. 全局状态 ====================
var calcMode = false;
var pendingTransactions = [];
var transactionIdCounter = 0;
var startingNewPeriod = false; // 标记是否处于"开始本期"流程中
var overwriteMode = false; // 标记是否处于覆盖存档模式
var sessionIndexCounter = 0; // 本期内会话序号
var pendingSnapshotLoad = null; // 待加载的快照数据（等待用户选择模式）
var pendingJsonSnapshot = null; // 待导入的JSON快照数据（等待用户选择模式）
var modalReturnTo = null; // 记录模态框跳转来源，用于返回导航

// ==================== 3.1 周期状态检测 ====================
function isPeriodActive() {
  var beginTime = localStorage.getItem("finance_BeginTime");
  if (!beginTime) return false;
  var bd = getBaseData();
  var hasBaseData = !(
    bd.cash === 0 &&
    bd.investment === 0 &&
    bd.fixed === 0 &&
    bd.liabilityShort === 0 &&
    bd.liabilityLong === 0
  );
  if (hasBaseData) return true;
  var sessions = getSessions();
  if (sessions.length > 0) return true;
  if (pendingTransactions.length > 0) return true;
  return false;
}
function checkPeriodAndShowUI() {
  var startSection = document.getElementById("start-section");
  var formSection = document.getElementById("form-section");
  if (isPeriodActive()) {
    startSection.style.display = "none";
    formSection.style.display = "block";
  } else {
    startSection.style.display = "block";
    formSection.style.display = "none";
  }
}
function transitionToFormView() {
  document.getElementById("start-section").style.display = "none";
  document.getElementById("form-section").style.display = "block";
}

// ==================== 12. 恢复与持久化 ====================
function restoreData() {
  // 恢复暂存数据
  var storedPending = localStorage.getItem("finance_Pending");
  if (storedPending) {
    try {
      pendingTransactions = JSON.parse(storedPending);
      if (pendingTransactions.length > 0) {
        transactionIdCounter = Math.max.apply(
          null,
          pendingTransactions.map(function (t) {
            return t.id;
          }),
        );
      }
    } catch (e) {
      pendingTransactions = [];
    }
  }
  // 恢复期初时间
  var beginTime = localStorage.getItem("finance_BeginTime");
  if (beginTime) {
    document.getElementById("period-begin-time").textContent = beginTime;
  }
  // 迁移旧数据：如果没有 sessions 但有 changes，包装为单次 session
  if (localStorage.getItem("finance_Sessions") === null) {
    var changes = getChangesData();
    var hasChanges =
      changes.cash !== 0 ||
      changes.investment !== 0 ||
      changes.fixed !== 0 ||
      changes.liabilityShort !== 0 ||
      changes.liabilityLong !== 0 ||
      changes.profit !== 0;
    if (hasChanges) {
      var session = {
        id: "sess_migrated_" + Date.now(),
        time: beginTime || new Date().toLocaleString("zh-CN"),
        sessionIndex: 1,
        transactions: JSON.parse(JSON.stringify(pendingTransactions)),
        changesSnapshot: JSON.parse(JSON.stringify(changes)),
      };
      saveSessions([session]);
      sessionIndexCounter = 1;
      pendingTransactions = [];
      transactionIdCounter = 0;
      persistPending();
      localStorage.setItem("finance_MigratedV2", "true");
    } else {
      saveSessions([]);
      sessionIndexCounter = 0;
    }
  } else {
    var sessions = getSessions();
    if (sessions.length > 0) {
      sessionIndexCounter = sessions.reduce(function (max, s) {
        return Math.max(max, s.sessionIndex || 0);
      }, 0);
    }
  }
}
function persistPending() {
  localStorage.setItem(
    "finance_Pending",
    JSON.stringify(pendingTransactions),
  );
  var beginEl = document.getElementById("period-begin-time");
  if (beginEl.textContent !== "未设定") {
    localStorage.setItem("finance_BeginTime", beginEl.textContent);
  }
}

// ==================== 12.5 期初时间管理 ====================
function updatePeriodDisplay() {
  var beginEl = document.getElementById("period-begin-time");
  var currentEl = document.getElementById("period-current-time");
  var diffEl = document.getElementById("period-diff");
  var diffText = document.getElementById("period-diff-text");
  var now = new Date();
  currentEl.textContent = now.toLocaleString("zh-CN");
  var beginTimeStr = localStorage.getItem("finance_BeginTime");
  if (beginTimeStr) {
    beginEl.textContent = beginTimeStr;
    try {
      var beginDate = new Date(beginTimeStr);
      if (!isNaN(beginDate.getTime())) {
        var diffMs = now.getTime() - beginDate.getTime();
        var diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        var diffHours = Math.floor(
          (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );
        var diffMins = Math.floor(
          (diffMs % (1000 * 60 * 60)) / (1000 * 60),
        );
        var diffStr = "";
        if (diffDays > 0) diffStr += diffDays + "天";
        if (diffHours > 0) diffStr += diffHours + "小时";
        if (diffDays === 0) diffStr += diffMins + "分钟";
        diffText.textContent = diffStr || "刚刚";
        diffEl.style.display = "inline";
      }
    } catch (e) {
      diffEl.style.display = "none";
    }
  } else {
    beginEl.textContent = "未设定";
    diffEl.style.display = "none";
  }
}

// ==================== 快照持久化 ====================
function getSnapshots() {
  try {
    return JSON.parse(localStorage.getItem("finance_Snapshots") || "[]");
  } catch (e) {
    return [];
  }
}
function saveSnapshots(list) {
  localStorage.setItem("finance_Snapshots", JSON.stringify(list));
}
