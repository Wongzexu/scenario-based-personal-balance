// ==================== 4. 更新子选项 ====================
function updateSubOptions() {
  var typeSelect = document.getElementById("scenario-type");
  var subSelect = document.getElementById("scenario-sub");
  var selectedType = typeSelect.value;
  subSelect.innerHTML = '<option value="">-- 请选择 --</option>';
  subSelect.disabled = !selectedType;
  if (selectedType && SCENARIO_MAP[selectedType]) {
    var subGroup = SCENARIO_MAP[selectedType];
    var keys = Object.keys(subGroup);
    keys.forEach(function (key) {
      var option = document.createElement("option");
      option.value = key;
      option.textContent = subGroup[key].name;
      subSelect.appendChild(option);
    });
    if (keys.length === 1) {
      subSelect.value = keys[0];
    }
  }
  updateStatus();
}

// ==================== 表单验证 ====================
function validateForm(type, sub, amountStr) {
  if (!type) return { valid: false, level: "info", error: "请选择场景大类" };
  if (!sub) return { valid: false, level: "info", error: "请选择具体情景" };
  if (!amountStr) return { valid: false, level: "info", error: "请输入金额" };
  var parsed = parseAmount(amountStr);
  if (isNaN(parsed.value)) return { valid: false, level: "error", error: parsed.error || "请输入有效的金额" };
  var isInvestmentDividend = type === "investment" && sub === "investment_dividend";
  if (!isInvestmentDividend && parsed.value < 0) return { valid: false, level: "error", error: "此场景不支持负数金额" };
  if (parsed.value === 0) return { valid: false, level: "error", error: "金额不能为零" };
  var scenario = SCENARIO_MAP[type][sub];
  return { valid: true, parsed: parsed, scenario: scenario };
}

// ==================== 5. 金额输入处理 ====================
function onAmountInput() {
  document.getElementById("clear-input").style.display =
    document.getElementById("amount").value.length > 0 ? "block" : "none";
  updateStatus();
}
function onAmountFocus() {
  document.getElementById("clear-input").style.display =
    document.getElementById("amount").value.length > 0 ? "block" : "none";
}
function onAmountKeydown(e) {
  if (e.key === "Enter") {
    confirmTransaction();
  }
}
function clearAmount() {
  document.getElementById("amount").value = "";
  document.getElementById("clear-input").style.display = "none";
  updateStatus();
}
function toggleCalcMode() {
  calcMode = !calcMode;
  var toggle = document.getElementById("calc-toggle");
  var input = document.getElementById("amount");
  if (calcMode) {
    toggle.innerHTML = icon("calculator", 16);
    toggle.classList.add("active");
    toggle.title = "计算模式已开启，点击切换为直接输入";
    input.placeholder = "例如: 100+50*2-30/3";
  } else {
    toggle.innerHTML = icon("text-cursor-input", 16);
    toggle.classList.remove("active");
    toggle.title = "点击切换为计算模式";
    input.placeholder = "请输入金额";
  }
}

// ==================== 6. 状态提示 ====================
function updateStatus() {
  var type = document.getElementById("scenario-type").value;
  var sub = document.getElementById("scenario-sub").value;
  var amountStr = document.getElementById("amount").value.trim();
  var status = document.getElementById("status-msg");
  status.className = "status";

  var validation = validateForm(type, sub, amountStr);
  if (!validation.valid) {
    status.innerHTML = validation.error;
    status.classList.add(validation.level === "error" ? "error" : "info");
    return;
  }

  status.innerHTML =
    icon("square-check") + " 就绪 — " + validation.scenario.name + " ¥" + formatUserNum(validation.parsed.value);
  status.classList.add("success");
}

// ==================== 7. 确认记账 ====================
function confirmTransaction() {
  var type = document.getElementById("scenario-type").value;
  var sub = document.getElementById("scenario-sub").value;
  var amountStr = document.getElementById("amount").value.trim();
  var status = document.getElementById("status-msg");

  var validation = validateForm(type, sub, amountStr);
  if (!validation.valid) {
    status.innerHTML = validation.error;
    status.className = "status error";
    return;
  }

  var scenario = validation.scenario;
  var amount = validation.parsed.value;
  var effects = calcEffects(scenario, amount);
  transactionIdCounter++;
  pendingTransactions.push({
    id: transactionIdCounter,
    type: type,
    sub: sub,
    amount: amount,
    displayAmount: formatUserNum(amount),
    scenarioName: scenario.name,
    effects: effects,
    time: new Date().toLocaleTimeString("zh-CN"),
  });
  document.getElementById("amount").value = "";
  document.getElementById("clear-input").style.display = "none";
  persistPending();
  renderPendingList();
  updateStatus();
  status.innerHTML =
    icon("circle-check") + " 已记录：" + scenario.name + " ¥" + formatUserNum(amount);
  status.className = "status success";
  // 清空下拉框和金额，方便连续录入
  document.getElementById("scenario-type").value = "";
  document.getElementById("scenario-sub").innerHTML =
    '<option value="">-- 请先选择大类 --</option>';
  document.getElementById("scenario-sub").disabled = true;
  updateStatus();
}
