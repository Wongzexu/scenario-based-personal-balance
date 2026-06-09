// ==================== 工具函数 ====================
function round2(n) { return Math.round(n * 100) / 100; }

// ==================== 10. 格式化函数 ====================
function formatTableNum(num) {
  if (isNaN(num) || num === null || num === undefined) return "0.00";
  return num.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
function formatUserNum(num) {
  if (isNaN(num) || num === null || num === undefined) return "0";
  var rounded = Math.round(num * 100) / 100;
  if (Number.isInteger(rounded)) {
    return rounded.toLocaleString("zh-CN");
  }
  return rounded.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
function formatChange(num) {
  if (isNaN(num) || num === null || num === undefined || num === 0) {
    return "0.00";
  }
  var sign = num > 0 ? "+" : "";
  return sign + formatTableNum(num);
}

// ==================== 计算工具 ====================
function calculateTotals(baseData, changes) {
  var end = {
    cash: baseData.cash + changes.cash,
    investment: baseData.investment + changes.investment,
    fixed: baseData.fixed + changes.fixed,
    liabilityShort: baseData.liabilityShort + changes.liabilityShort,
    liabilityLong: baseData.liabilityLong + changes.liabilityLong,
  };
  var totalAssetsBegin = baseData.cash + baseData.investment + baseData.fixed;
  var totalLiabilitiesBegin = baseData.liabilityShort + baseData.liabilityLong;
  var netWorthBegin = totalAssetsBegin - totalLiabilitiesBegin;
  var totalAssetsEnd = end.cash + end.investment + end.fixed;
  var totalLiabilitiesEnd = end.liabilityShort + end.liabilityLong;
  var netWorthEnd = totalAssetsEnd - totalLiabilitiesEnd;
  return {
    end: end,
    totalAssetsBegin: totalAssetsBegin,
    totalLiabilitiesBegin: totalLiabilitiesBegin,
    netWorthBegin: netWorthBegin,
    totalAssetsEnd: totalAssetsEnd,
    totalLiabilitiesEnd: totalLiabilitiesEnd,
    netWorthEnd: netWorthEnd,
  };
}

// ==================== 7. 情景效果计算 ====================
function calcEffects(scenario, amount) {
  var effects = [];
  if (scenario.asset === "cash" && scenario.amount) {
    var v1 = scenario.amount * amount;
    effects.push("现金 " + (v1 >= 0 ? "+" : "") + formatUserNum(v1));
  }
  if (scenario.asset === "investment" && scenario.amount) {
    var v2 = scenario.amount * amount;
    effects.push("投资 " + (v2 >= 0 ? "+" : "") + formatUserNum(v2));
  }
  if (scenario.fixedChange) {
    var v3 = scenario.fixedChange * amount;
    effects.push("固定资产 " + (v3 >= 0 ? "+" : "") + formatUserNum(v3));
  }
  if (scenario.liability && scenario.liabilityDir) {
    var v4 = scenario.liabilityDir * amount;
    var label = scenario.liability === "short" ? "短期负债" : "长期负债";
    effects.push(label + " " + (v4 >= 0 ? "+" : "") + formatUserNum(v4));
  }
  if (scenario.profit !== 0) {
    var v5 = scenario.profit * amount;
    effects.push("利润 " + (v5 >= 0 ? "+" : "") + formatUserNum(v5));
  }
  return effects.join("，");
}

function applyScenarioToChanges(scenario, amount, changes) {
  if (scenario.asset === "cash" && scenario.amount) {
    changes.cash = round2(changes.cash + scenario.amount * amount);
  } else if (scenario.asset === "investment" && scenario.amount) {
    changes.investment = round2(changes.investment + scenario.amount * amount);
  }
  if (scenario.fixedChange) {
    changes.fixed = round2(changes.fixed + scenario.fixedChange * amount);
  }
  if (scenario.liability && scenario.liabilityDir) {
    if (scenario.liability === "short") {
      changes.liabilityShort = round2(changes.liabilityShort + scenario.liabilityDir * amount);
    } else if (scenario.liability === "long") {
      changes.liabilityLong = round2(changes.liabilityLong + scenario.liabilityDir * amount);
    }
  }
  if (scenario.profit !== 0) {
    changes.profit = round2(changes.profit + scenario.profit * amount);
  }
}

function applyTransaction(scenario, amount) {
  var changes = getChangesData();
  applyScenarioToChanges(scenario, amount, changes);
  saveChangesData(changes);
  persistPending();
}

function rebuildAllChanges() {
  var changes = {
    cash: 0,
    investment: 0,
    fixed: 0,
    liabilityShort: 0,
    liabilityLong: 0,
    profit: 0,
  };
  var sessions = getSessions();
  sessions.forEach(function (s) {
    s.transactions.forEach(function (t) {
      var scenario = SCENARIO_MAP[t.type]
        ? SCENARIO_MAP[t.type][t.sub]
        : null;
      if (!scenario) return;
      applyScenarioToChanges(scenario, t.amount, changes);
    });
  });
  pendingTransactions.forEach(function (t) {
    var scenario = SCENARIO_MAP[t.type]
      ? SCENARIO_MAP[t.type][t.sub]
      : null;
    if (!scenario) return;
    applyScenarioToChanges(scenario, t.amount, changes);
  });
  saveChangesData(changes);
  persistPending();
}

// ==================== 9. 计算与渲染资产负债表 ====================
function calculate() {
  var baseData = getBaseData();
  var changes = getChangesData();
  var totals = calculateTotals(baseData, changes);
  var end = totals.end;

  document.getElementById("asset-cash-begin").textContent =
    formatTableNum(baseData.cash);
  document.getElementById("asset-investment-begin").textContent =
    formatTableNum(baseData.investment);
  document.getElementById("asset-fixed-begin").textContent =
    formatTableNum(baseData.fixed);
  document.getElementById("total-assets-begin").textContent =
    formatTableNum(totals.totalAssetsBegin);
  document.getElementById("liability-short-begin").textContent =
    formatTableNum(baseData.liabilityShort);
  document.getElementById("liability-long-begin").textContent =
    formatTableNum(baseData.liabilityLong);
  document.getElementById("total-liabilities-begin").textContent =
    formatTableNum(totals.totalLiabilitiesBegin);
  document.getElementById("net-worth-begin").textContent =
    formatTableNum(totals.netWorthBegin);
  document.getElementById("total-cash-change").textContent = formatChange(
    changes.cash,
  );
  document.getElementById("total-investment-change").textContent =
    formatChange(changes.investment);
  document.getElementById("total-fixed-change").textContent =
    formatChange(changes.fixed);
  document.getElementById("total-liability-change").textContent =
    formatChange(changes.liabilityShort + changes.liabilityLong);
  document.getElementById("total-profit-impact").textContent =
    formatChange(changes.profit);
  document.getElementById("asset-cash-end").textContent = formatTableNum(
    end.cash,
  );
  document.getElementById("asset-investment-end").textContent =
    formatTableNum(end.investment);
  document.getElementById("asset-fixed-end").textContent = formatTableNum(
    end.fixed,
  );
  document.getElementById("total-assets-end").textContent =
    formatTableNum(totals.totalAssetsEnd);
  document.getElementById("liability-short-end").textContent =
    formatTableNum(end.liabilityShort);
  document.getElementById("liability-long-end").textContent =
    formatTableNum(end.liabilityLong);
  document.getElementById("total-liabilities-end").textContent =
    formatTableNum(totals.totalLiabilitiesEnd);
  document.getElementById("net-worth-end").textContent =
    formatTableNum(totals.netWorthEnd);
}

// ==================== 5. 金额输入处理 ====================
function parseAmount(rawStr) {
  if (!rawStr || !rawStr.trim())
    return { value: NaN, expression: rawStr };
  var str = rawStr.replace(/,/g, "").trim();
  if (calcMode) {
    var sanitized = str.replace(/\s/g, "");
    if (!/^[\d+\-*/().%]+$/.test(sanitized)) {
      return { value: NaN, expression: str, error: "算式包含无效字符" };
    }
    try {
      var result = new Function("return (" + sanitized + ")")();
      if (typeof result !== "number" || !isFinite(result)) {
        return { value: NaN, expression: str, error: "计算结果无效" };
      }
      return { value: round2(result), expression: str };
    } catch (e) {
      return { value: NaN, expression: str, error: "算式格式错误" };
    }
  } else {
    var num = parseFloat(str);
    return { value: round2(num), expression: str };
  }
}
