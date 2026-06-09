// ==================== 3. 开始本期相关函数 ====================
function openStartPeriodModal() {
  if (isPeriodActive()) {
    transitionToFormView();
    calculate();
    renderPendingList();
    updatePeriodDisplay();
    showToast(icon("circle-check") + " 已恢复本期记账状态", "success");
    return;
  }
  openModal("start-period-modal");
}
function startFromHistory() {
  startingNewPeriod = true;
  closeModal("start-period-modal");
  openHistoryModal("start-period-modal");
}
function startFromJSON() {
  startingNewPeriod = true;
  closeModal("start-period-modal");
  document.getElementById("snapshot-import").click();
}
function startManual() {
  document.getElementById("manual-cash").value = "";
  document.getElementById("manual-investment").value = "";
  document.getElementById("manual-fixed").value = "";
  document.getElementById("manual-liability-short").value = "";
  document.getElementById("manual-liability-long").value = "";
  switchModal("start-period-modal", "manual-start-modal");
}
function confirmManualStart() {
  var cash =
    parseFloat(document.getElementById("manual-cash").value) || 0;
  var investment =
    parseFloat(document.getElementById("manual-investment").value) || 0;
  var fixed =
    parseFloat(document.getElementById("manual-fixed").value) || 0;
  var liabilityShort =
    parseFloat(document.getElementById("manual-liability-short").value) || 0;
  var liabilityLong =
    parseFloat(document.getElementById("manual-liability-long").value) || 0;
  saveBaseData({
    cash: cash,
    investment: investment,
    fixed: fixed,
    liabilityShort: liabilityShort,
    liabilityLong: liabilityLong,
  });
  saveChangesData({
    cash: 0,
    investment: 0,
    fixed: 0,
    liabilityShort: 0,
    liabilityLong: 0,
    profit: 0,
  });
  pendingTransactions = [];
  transactionIdCounter = 0;
  sessionIndexCounter = 0;
  saveSessions([]);
  localStorage.removeItem("finance_Pending");
  var now = new Date().toLocaleString("zh-CN");
  localStorage.setItem("finance_BeginTime", now);
  document.getElementById("period-begin-time").textContent = now;
  closeModal("manual-start-modal");
  transitionToFormView();
  updatePeriodDisplay();
  calculate();
  renderPendingList();
  updateStatus();
}

// ==================== 3.2 快照覆盖相关函数 ====================
function startOverwriteMode() {
  overwriteMode = true;
  switchModal("save-choice-modal", "history-modal");
  modalReturnTo = null;
  var backBtn = document.getElementById("history-back-btn");
  if (backBtn) backBtn.style.display = "none";
  renderHistoryList();
}
function overwriteSnapshot(id) {
  var snapshots = getSnapshots();
  var snap = snapshots.find(function (s) {
    return s.id === id;
  });
  if (!snap) return;
  showConfirm(
    "覆盖存档",
    "确定用当前数据覆盖这条存档吗？\n\n存档时间：" + (snap.label || snap.savedAt) + "\n此操作不可撤销。",
    "覆盖",
    "取消"
  ).then(function (confirmed) {
    if (!confirmed) return;
    var now = new Date();
    snap.version = "2.0";
    snap.baseData = getBaseData();
    snap.changes = getChangesData();
    snap.pending = pendingTransactions;
    snap.sessions = getSessions();
    snap.endTime = now.toLocaleString("zh-CN");
    snap.savedAt = now.toISOString();
    snap.label = now.toLocaleString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    saveSnapshots(snapshots);
    overwriteMode = false;
    closeHistoryModal();
    showToast(icon("circle-check") + " 存档已覆盖！", "success");
  });
}

// ==================== 3.3 开始新的一期 ====================
function startNewPeriod() {
  openModal("new-period-modal");
}
function doStartNewPeriod(saveFirst) {
  closeModal("new-period-modal");
  if (saveFirst) {
    var now = new Date();
    var snapshot = {
      id: "snap_" + now.getTime(),
      version: "2.0",
      type: "finance-snapshot",
      beginTime:
        localStorage.getItem("finance_BeginTime") ||
        now.toLocaleString("zh-CN"),
      endTime: now.toLocaleString("zh-CN"),
      savedAt: now.toISOString(),
      label: now.toLocaleString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
      baseData: getBaseData(),
      changes: getChangesData(),
      pending: pendingTransactions,
      sessions: getSessions(),
    };
    var snapshots = getSnapshots();
    snapshots.unshift(snapshot);
    if (snapshots.length > 50) snapshots.length = 50;
    saveSnapshots(snapshots);
    showToast(icon("inbox") + " 当前数据已保存为快照。", "success");
  }
  localStorage.removeItem("finance_BeginTime");
  saveBaseData({
    cash: 0, investment: 0, fixed: 0,
    liabilityShort: 0, liabilityLong: 0,
  });
  saveChangesData({
    cash: 0, investment: 0, fixed: 0,
    liabilityShort: 0, liabilityLong: 0, profit: 0,
  });
  pendingTransactions = [];
  transactionIdCounter = 0;
  sessionIndexCounter = 0;
  saveSessions([]);
  localStorage.removeItem("finance_Pending");
  checkPeriodAndShowUI();
  updatePeriodDisplay();
  calculate();
  renderPendingList();
  updateStatus();
}

// ==================== 15. 保存快照 ====================
function saveSnapshot() {
  renderSaveSlots();
  openModal("save-choice-modal");
}

function renderSaveSlots() {
  var section = document.getElementById("save-slots-section");
  var listEl = document.getElementById("save-slots-list");
  var snapshots = getSnapshots();
  if (snapshots.length === 0) {
    section.style.display = "none";
    return;
  }
  section.style.display = "block";
  var html = "";
  snapshots.forEach(function (snap) {
    var endCash = (snap.baseData.cash || 0) + (snap.changes.cash || 0);
    var endInvestment = (snap.baseData.investment || 0) + (snap.changes.investment || 0);
    var endFixed = (snap.baseData.fixed || 0) + (snap.changes.fixed || 0);
    var endLiabShort = (snap.baseData.liabilityShort || 0) + (snap.changes.liabilityShort || 0);
    var endLiabLong = (snap.baseData.liabilityLong || 0) + (snap.changes.liabilityLong || 0);
    var endNetWorth = endCash + endInvestment + endFixed - endLiabShort - endLiabLong;
    html +=
      '<div class="save-slot-item">' +
      '<div class="save-slot-info">' +
      '<div class="save-slot-label">' +
      (snap.id && snap.id.indexOf('snap_imported_') === 0 ? icon('file-input') + ' ' : icon('inbox') + ' ') + (snap.label || snap.savedAt) +
      "</div>" +
      '<div class="save-slot-meta">期末: ' +
      (snap.endTime || "—") +
      " | 净资产: ¥" +
      formatTableNum(endNetWorth) +
      "</div>" +
      "</div>" +
      '<button class="save-slot-overwrite" onclick="overwriteSnapshotFromSave(\'' +
      snap.id +
      "')\">覆盖</button>" +
      "</div>";
  });
  listEl.innerHTML = html;
}

function doSaveNewSnapshot() {
  doSaveSnapshot("local");
}

function overwriteSnapshotFromSave(id) {
  var snapshots = getSnapshots();
  var snap = snapshots.find(function (s) {
    return s.id === id;
  });
  if (!snap) return;
  showConfirm(
    "覆盖存档",
    "确定用当前数据覆盖「" + (snap.label || snap.savedAt) + "」吗？\n此操作不可撤销。",
    "覆盖",
    "取消"
  ).then(function (confirmed) {
    if (!confirmed) return;
    var now = new Date();
    snap.version = "2.0";
    snap.baseData = getBaseData();
    snap.changes = getChangesData();
    snap.pending = pendingTransactions;
    snap.sessions = getSessions();
    snap.endTime = now.toLocaleString("zh-CN");
    snap.savedAt = now.toISOString();
    snap.label = now.toLocaleString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    saveSnapshots(snapshots);
    showToast(icon("circle-check") + " 存档已覆盖！", "success");
    closeModal("save-choice-modal");
  });
}

function doSaveSnapshot(mode) {
  closeModal("save-choice-modal");
  var now = new Date();
  var beginTimeStr =
    localStorage.getItem("finance_BeginTime") ||
    now.toLocaleString("zh-CN");
  var currentTimeStr = now.toLocaleString("zh-CN");
  var snapshot = {
    id: "snap_" + now.getTime(),
    version: "2.0",
    type: "finance-snapshot",
    beginTime: beginTimeStr,
    endTime: currentTimeStr,
    savedAt: now.toISOString(),
    label: now.toLocaleString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    }),
    baseData: getBaseData(),
    changes: getChangesData(),
    pending: pendingTransactions,
    sessions: getSessions(),
  };

  var msg = "";
  if (mode === "local" || mode === "both") {
    var snapshots = getSnapshots();
    snapshots.unshift(snapshot);
    saveSnapshots(snapshots);
    msg += "已保存到本地缓存";
  }
  if (mode === "json" || mode === "both") {
    var blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: "application/json",
    });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download =
      "财务快照_" +
      now.toISOString().replace(/[:.]/g, "-").slice(0, 19) +
      ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (msg) msg += "，同时已下载JSON文件";
    else msg += "已下载JSON文件";
  }

  showToast(icon("inbox") + " " + msg, "success");
}

// ==================== 16. 历史存档 ====================
function openHistoryModal(returnTo) {
  modalReturnTo = returnTo || null;
  openModal("history-modal");
  var backBtn = document.getElementById("history-back-btn");
  if (backBtn) {
    backBtn.style.display =
      modalReturnTo === "start-period-modal" ? "inline-flex" : "none";
  }
  renderHistoryList();
}
function closeHistoryModal() {
  overwriteMode = false;
  if (startingNewPeriod && modalReturnTo === "start-period-modal") {
    switchModal("history-modal", "start-period-modal");
    modalReturnTo = null;
  } else {
    closeModal("history-modal");
  }
  startingNewPeriod = false;
}

function renderHistoryList() {
  var listEl = document.getElementById("history-list");
  var snapshots = getSnapshots();
  if (snapshots.length === 0) {
    listEl.innerHTML =
      '<div class="modal-empty">' + icon("archive-x") + ' 暂无存档记录<br><small>保存快照后，快照将显示在此处</small></div>';
    return;
  }
  var html = "";
  if (overwriteMode) {
    html =
      '<div style="font-size:0.85rem;color:#6b7280;margin-bottom:12px;text-align:center;">' + icon("replace") + ' 选择要覆盖的存档（点击选择）</div>';
  }
  snapshots.forEach(function (snap) {
    var netWorth =
      (snap.baseData.cash || 0) +
      (snap.baseData.investment || 0) +
      (snap.baseData.fixed || 0) -
      (snap.baseData.liabilityShort || 0) -
      (snap.baseData.liabilityLong || 0);
    var changeTotal =
      (snap.changes.cash || 0) +
      (snap.changes.investment || 0) +
      (snap.changes.fixed || 0) -
      (snap.changes.liabilityShort || 0) -
      (snap.changes.liabilityLong || 0);
    if (overwriteMode) {
      html +=
        '<div class="snapshot-list-item" onclick="overwriteSnapshot(\'' +
        snap.id +
        '\')"><div class="info"><div class="period">' +
        (snap.id && snap.id.indexOf('snap_imported_') === 0 ? icon('file-input') + ' ' : icon('inbox') + ' ') + (snap.label || snap.savedAt) +
        '</div><div class="meta">期末: ' +
        (snap.endTime || "—") +
        "</div></div></div>";
    } else {
      html +=
        '<div class="snapshot-list-item" onclick="loadSnapshot(\'' +
        snap.id +
        '\')"><div class="info"><div class="period">' +
        (snap.id && snap.id.indexOf('snap_imported_') === 0 ? icon('file-input') + ' ' : icon('inbox') + ' ') + (snap.label || snap.savedAt) +
        '</div><div class="meta">期初: ' +
        (snap.beginTime || "—") +
        " → 期末: " +
        (snap.endTime || "—") +
        " | 净资产: ¥" +
        formatTableNum(netWorth + changeTotal) +
        '</div></div><button class="delete-snapshot" onclick="event.stopPropagation();deleteSnapshot(\'' +
        snap.id +
        "')\">删除</button></div>";
    }
  });
  listEl.innerHTML = html;
}

function loadSnapshot(id) {
  var snapshots = getSnapshots();
  var snap = snapshots.find(function (s) {
    return s.id === id;
  });
  if (!snap) return;
  pendingSnapshotLoad = snap;
  var wasStartingNew = startingNewPeriod;
  var returnTo = modalReturnTo;
  modalReturnTo = null;
  overwriteMode = false;
  startingNewPeriod = wasStartingNew;
  modalReturnTo = returnTo;
  if (startingNewPeriod) {
    switchModal("history-modal", "snapshot-load-mode-modal");
  } else {
    closeModal("history-modal");
    confirmSnapshotLoad("continuePeriod");
  }
}

function restoreSnapshotState(snap) {
  var version = snap.version || "1.0";
  if (snap.baseData) {
    saveBaseData(snap.baseData);
  }
  if (snap.changes) {
    saveChangesData(snap.changes);
  } else {
    saveChangesData({
      cash: 0, investment: 0, fixed: 0,
      liabilityShort: 0, liabilityLong: 0, profit: 0,
    });
  }
  pendingTransactions = snap.pending || [];
  transactionIdCounter = 0;
  if (pendingTransactions.length > 0) {
    transactionIdCounter = Math.max.apply(
      null,
      pendingTransactions.map(function (t) {
        return t.id;
      }),
    );
  }
  persistPending();
  var sessions = snap.sessions || [];
  saveSessions(sessions);
  sessionIndexCounter = 0;
  if (sessions.length > 0) {
    sessionIndexCounter = sessions.reduce(function (max, s) {
      return Math.max(max, s.sessionIndex || 0);
    }, 0);
  }
  if (snap.beginTime) {
    localStorage.setItem("finance_BeginTime", snap.beginTime);
  }
}

function confirmSnapshotLoad(mode) {
  closeModal("snapshot-load-mode-modal");
  var snap = pendingSnapshotLoad || pendingJsonSnapshot;
  if (!snap) return;

  if (mode === "newPeriod") {
    if (snap.baseData && snap.changes) {
      var newBase = {
        cash: (snap.baseData.cash || 0) + (snap.changes.cash || 0),
        investment:
          (snap.baseData.investment || 0) + (snap.changes.investment || 0),
        fixed: (snap.baseData.fixed || 0) + (snap.changes.fixed || 0),
        liabilityShort:
          (snap.baseData.liabilityShort || 0) + (snap.changes.liabilityShort || 0),
        liabilityLong:
          (snap.baseData.liabilityLong || 0) + (snap.changes.liabilityLong || 0),
      };
      saveBaseData(newBase);
    } else if (snap.baseData) {
      saveBaseData(snap.baseData);
    }
    saveChangesData({
      cash: 0, investment: 0, fixed: 0,
      liabilityShort: 0, liabilityLong: 0, profit: 0,
    });
    pendingTransactions = [];
    transactionIdCounter = 0;
    sessionIndexCounter = 0;
    saveSessions([]);
    localStorage.removeItem("finance_Pending");
    if (snap.endTime) {
      localStorage.setItem("finance_BeginTime", snap.endTime);
    }
    showToast(icon("circle-check") + " 已从存档期末数据开始新的一期！", "success");
  } else {
    restoreSnapshotState(snap);
    showToast(icon("circle-check") + " 存档状态已完整恢复，继续本期记账！", "success");
  }

  if (
    pendingJsonSnapshot &&
    !getSnapshots().find(function (s) {
      return s.id === snap.id;
    })
  ) {
    var snapshots = getSnapshots();
    snapshots.unshift(snap);
    if (snapshots.length > 50) snapshots.length = 50;
    saveSnapshots(snapshots);
  }

  pendingSnapshotLoad = null;
  pendingJsonSnapshot = null;

  updatePeriodDisplay();
  calculate();
  renderPendingList();
  updateStatus();
  if (startingNewPeriod) {
    startingNewPeriod = false;
    transitionToFormView();
  }
  if (document.getElementById("start-section").style.display !== "none") {
    transitionToFormView();
  }
}

function cancelSnapshotLoad() {
  pendingSnapshotLoad = null;
  pendingJsonSnapshot = null;
  if (modalReturnTo === "history-modal") {
    switchModal("snapshot-load-mode-modal", "history-modal");
    modalReturnTo = "start-period-modal";
    var backBtn = document.getElementById("history-back-btn");
    if (backBtn) backBtn.style.display = "inline-flex";
    renderHistoryList();
  } else if (startingNewPeriod) {
    closeModal("snapshot-load-mode-modal");
    startingNewPeriod = false;
  } else {
    closeModal("snapshot-load-mode-modal");
  }
}

function deleteSnapshot(id) {
  showConfirm(
    "删除存档",
    "确定要删除这条存档记录吗？此操作不可撤销。",
    "删除",
    "取消"
  ).then(function (confirmed) {
    if (!confirmed) return;
    var snapshots = getSnapshots();
    var filtered = snapshots.filter(function (s) {
      return s.id !== id;
    });
    saveSnapshots(filtered);
    renderHistoryList();
  });
}

// ==================== 17. 重置 / 刷新 / 退出 ====================
function undoLastSession() {
  var sessions = getSessions();
  if (sessions.length === 0) {
    showToast("没有已提交的记账会话可撤销。", "info");
    return;
  }
  var lastSession = sessions.pop();
  showConfirm(
    "撤销提交",
    "将撤销第" + lastSession.sessionIndex + "次提交的 " + lastSession.transactions.length + " 条记账记录，恢复为暂存状态。\n\n确定要撤销吗？",
    "撤销",
    "取消"
  ).then(function (confirmed) {
    if (!confirmed) {
      sessions.push(lastSession);
      return;
    }
    saveSessions(sessions);
    lastSession.transactions.forEach(function (t) {
      t.id = ++transactionIdCounter;
    });
    pendingTransactions =
      lastSession.transactions.concat(pendingTransactions);
    rebuildAllChanges();
    persistPending();
    calculate();
    renderPendingList();
    updateStatus();
    showToast(
      icon("circle-check") + " 第" + lastSession.sessionIndex + "次记账已撤销，记录已恢复为暂存状态。",
      "success",
    );
  });
}

function resetPeriod() {
  showConfirm(
    "重置本期",
    "确定要清空本期所有记账记录吗？\n期初数据将保留，所有变动和暂存记录将被清除。\n\n确定要重置吗？",
    "重置",
    "取消"
  ).then(function (confirmed) {
    if (!confirmed) return;
    pendingTransactions = [];
    transactionIdCounter = 0;
    sessionIndexCounter = 0;
    saveSessions([]);
    saveChangesData({
      cash: 0, investment: 0, fixed: 0,
      liabilityShort: 0, liabilityLong: 0, profit: 0,
    });
    localStorage.removeItem("finance_Pending");
    calculate();
    renderPendingList();
    updateStatus();
    showToast(icon("circle-check") + " 本期数据已重置，期初数据保持不变。", "success");
  });
}

function refreshPage() {
  updatePeriodDisplay();
  showToast(icon("circle-check") + " 时间已刷新", "success");
}

function initializeReport() {
  showConfirm(
    "初始化报表",
    "确定要清空所有数据吗？\n包括期初数据、本期变动、记账记录和时间，报表将回到全 0 状态。\n\n此操作不可撤销！",
    "初始化",
    "取消"
  ).then(function (confirmed) {
    if (!confirmed) return;
    doStartNewPeriod(false);
    showToast(icon("circle-check") + " 报表已初始化，所有数据已清空。", "success");
  });
}

function exitToStartScreen() {
  if (pendingTransactions.length > 0) {
    showConfirm(
      "返回初始界面",
      "当前有 " + pendingTransactions.length + " 条未提交的记录。\n返回后数据不会丢失，下次进入时可继续操作。\n\n确定要返回吗？",
      "返回",
      "取消"
    ).then(function (confirmed) {
      if (!confirmed) return;
      document.getElementById("start-section").style.display = "block";
      document.getElementById("form-section").style.display = "none";
    });
  } else {
    document.getElementById("start-section").style.display = "block";
    document.getElementById("form-section").style.display = "none";
  }
}

// ==================== JSON 导入 ====================
function importSnapshot(event) {
  var file = event.target.files[0];
  if (!file) return;
  showConfirm(
    "导入确认",
    "导入JSON快照将覆盖当前数据。确定要继续吗？",
    "导入",
    "取消"
  ).then(function (confirmed) {
    if (!confirmed) {
      event.target.value = "";
      return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var snapshot = JSON.parse(e.target.result);
        if (snapshot.type !== "finance-snapshot") {
          showToast(icon("triangle-alert") + " 文件格式不正确：不是有效的财务快照文件。", "error");
          return;
        }
        snapshot.id = "snap_imported_" + Date.now();
        snapshot.label = "导入 — " + new Date().toLocaleString("zh-CN");
        if (!snapshot.endTime) snapshot.endTime = snapshot.savedAt || "";
        if (!snapshot.beginTime)
          snapshot.beginTime = localStorage.getItem("finance_BeginTime") || "";
        pendingJsonSnapshot = snapshot;
        if (isPeriodActive()) {
          switchModal("history-modal", "snapshot-load-mode-modal");
        } else {
          openModal("snapshot-load-mode-modal");
        }
      } catch (err) {
        showToast(icon("triangle-alert") + " 文件解析失败：" + err.message, "error");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  });
}
