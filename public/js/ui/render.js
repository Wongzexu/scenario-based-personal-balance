// ==================== 8. 预览/暂存列表 ====================
function submitPending() {
  if (pendingTransactions.length === 0) {
    showToast("暂无暂存记录可提交。", "warning");
    return;
  }
  var changesBefore = getChangesData();
  rebuildAllChanges();
  var changesAfter = getChangesData();
  var sessionChanges = {
    cash: round2(changesAfter.cash - changesBefore.cash),
    investment: round2(changesAfter.investment - changesBefore.investment),
    fixed: round2(changesAfter.fixed - changesBefore.fixed),
    liabilityShort: round2(
      changesAfter.liabilityShort - changesBefore.liabilityShort,
    ),
    liabilityLong: round2(
      changesAfter.liabilityLong - changesBefore.liabilityLong,
    ),
    profit: round2(changesAfter.profit - changesBefore.profit),
  };
  var sessions = getSessions();
  var newIndex = sessions.length + 1;
  var session = {
    id: "sess_" + Date.now(),
    time: new Date().toLocaleString("zh-CN"),
    sessionIndex: newIndex,
    transactions: JSON.parse(JSON.stringify(pendingTransactions)),
    changesSnapshot: sessionChanges,
  };
  sessions.push(session);
  saveSessions(sessions);
  var count = pendingTransactions.length;
  pendingTransactions = [];
  transactionIdCounter = 0;
  persistPending();
  calculate();
  renderPendingList();
  document.getElementById("status-msg").innerHTML =
    icon("list-checks") +
    " 第" +
    session.sessionIndex +
    "次记账已提交 " +
    count +
    " 条记录到资产负债表";
  document.getElementById("status-msg").className = "status success";
}
function renderPendingList() {
  var container = document.getElementById("preview-content");
  var sessions = getSessions();
  var hasSessions = sessions.length > 0;
  var hasPending = pendingTransactions.length > 0;

  if (!hasPending && !hasSessions) {
    container.innerHTML =
      '<div class="preview-empty">暂无记录，记账后将显示在此处</div>';
    return;
  }

  var html = "";

  if (hasPending) {
    html +=
      '<div class="pending-header-row">' +
      '<div class="pending-header-left">' +
      '<span class="pending-header-label">' +
      icon("sticky-note") +
      " 待提交记录</span>" +
      '<span class="pending-header-count">待提交 ' +
      pendingTransactions.length +
      " 条</span>" +
      "</div>" +
      '<button class="clear-all-btn" onclick="clearAllPending()">清空全部</button>' +
      "</div>";
    html +=
      '<table class="preview-table"><thead><tr><th>#</th><th>时间</th><th>场景</th><th>金额</th><th>效果</th><th></th></tr></thead><tbody>';
    pendingTransactions.forEach(function (t, i) {
      html +=
        "<tr><td>" +
        (i + 1) +
        "</td><td>" +
        t.time +
        "</td><td>" +
        t.scenarioName +
        "</td><td>¥" +
        t.displayAmount +
        '</td><td style="font-size:0.78rem;">' +
        t.effects +
        '</td><td class="preview-row-delete" onclick="deletePending(' +
        t.id +
        ')" title="撤销此记录">删除</td></tr>';
    });
    html += "</tbody></table>";
  }

  if (hasPending) {
    html +=
      '<button class="submit-btn" onclick="submitPending()">' + icon("check-check", 18) + ' 提交到资产负债表</button>';
  }

  if (hasSessions) {
    html +=
      '<div style="display:flex;justify-content:space-between;align-items:center;margin:20px 0 8px;">' +
      '<h4 style="margin:0;color:var(--gray-600);font-size:0.85rem;">' +
      icon("sticky-note-check") +
      " 已提交记账</h4>" +
      '<button class="undo-last-btn" onclick="undoLastSession()" title="撤销最近一次提交">' +
      icon("iteration-cw") +
      " 撤销提交</button>" +
      "</div>";
    html +=
      '<table class="preview-table sessions-table"><thead><tr><th>#</th><th>时间</th><th>记录数</th><th>变动摘要</th></tr></thead><tbody>';
    sessions.forEach(function (s) {
      var snap = s.changesSnapshot;
      var parts = [];
      if (snap.cash !== 0)
        parts.push(
          "现金" + (snap.cash > 0 ? "+" : "") + formatUserNum(snap.cash),
        );
      if (snap.investment !== 0)
        parts.push(
          "投资" +
            (snap.investment > 0 ? "+" : "") +
            formatUserNum(snap.investment),
        );
      if (snap.fixed !== 0)
        parts.push(
          "固资" + (snap.fixed > 0 ? "+" : "") + formatUserNum(snap.fixed),
        );
      if (snap.liabilityShort !== 0)
        parts.push(
          "短债" +
            (snap.liabilityShort > 0 ? "+" : "") +
            formatUserNum(snap.liabilityShort),
        );
      if (snap.liabilityLong !== 0)
        parts.push(
          "长债" +
            (snap.liabilityLong > 0 ? "+" : "") +
            formatUserNum(snap.liabilityLong),
        );
      if (snap.profit !== 0)
        parts.push(
          "利润" + (snap.profit > 0 ? "+" : "") + formatUserNum(snap.profit),
        );
      var summary = parts.length > 0 ? parts.join(" ") : "—";
      html +=
        '<tr class="session-row" onclick="toggleSessionDetail(\'' +
        s.id +
        '\')" title="点击查看详情">' +
        "<td>" +
        s.sessionIndex +
        "</td>" +
        "<td>" +
        s.time +
        "</td>" +
        "<td>" +
        s.transactions.length +
        " 条</td>" +
        '<td style="font-size:0.78rem;">' +
        summary +
        "</td>" +
        "</tr>";
      html +=
        '<tr id="session-detail-' +
        s.id +
        '" class="session-detail" style="display:none;"><td colspan="4" style="padding:0;">';
      html += '<table class="preview-table session-detail-table"><tbody>';
      s.transactions.forEach(function (t, j) {
        html +=
          "<tr><td>" +
          (j + 1) +
          "</td>" +
          "<td>" +
          t.time +
          "</td>" +
          "<td>" +
          t.scenarioName +
          "</td>" +
          "<td>¥" +
          t.displayAmount +
          "</td>" +
          '<td style="font-size:0.78rem;">' +
          t.effects +
          "</td></tr>";
      });
      html += "</tbody></table>";
      html += "</td></tr>";
    });
    html += "</tbody></table>";
  }

  container.innerHTML = html;
}
function toggleSessionDetail(sessionId) {
  var detailRow = document.getElementById("session-detail-" + sessionId);
  if (detailRow) {
    detailRow.style.display =
      detailRow.style.display === "none" ? "table-row" : "none";
  }
}
function deletePending(id) {
  var idx = pendingTransactions.findIndex(function (t) {
    return t.id === id;
  });
  if (idx === -1) return;
  pendingTransactions.splice(idx, 1);
  rebuildAllChanges();
  calculate();
  renderPendingList();
  updateStatus();
}
function clearAllPending() {
  if (pendingTransactions.length === 0) {
    showToast("暂无暂存记录可清空。", "info");
    return;
  }
  showConfirm(
    "清空确认",
    "确定要清空当前 " +
      pendingTransactions.length +
      " 条暂存记录吗？\n已提交的记账不受影响。",
    "清空",
    "取消",
  ).then(function (confirmed) {
    if (!confirmed) return;
    pendingTransactions = [];
    transactionIdCounter = 0;
    rebuildAllChanges();
    persistPending();
    calculate();
    renderPendingList();
    updateStatus();
  });
}
