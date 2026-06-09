// ==================== SVG 图标辅助函数 ====================
function icon(name, size) {
  size = size || 16;
  var paths = ICON_PATHS[name] || "";
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 1024 1024" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="icon-svg">' + paths + "</svg>";
}

function processDataIcons() {
  var els = document.querySelectorAll("[data-icon]");
  for (var i = 0; i < els.length; i++) {
    var el = els[i];
    var name = el.getAttribute("data-icon");
    var sizeAttr = el.getAttribute("data-size") || "16";
    // 支持相对单位（如 1em、1.2rem），纯数字保持 px 行为
    var size = /^d+$/.test(sizeAttr) ? parseInt(sizeAttr) : sizeAttr;
    var pathData = ICON_PATHS[name];
    if (!pathData) continue; // 跳过未注册的图标
    var wrapper = document.createElement("span");
    wrapper.innerHTML = icon(name, size);
    var svgEl = wrapper.firstChild;
    // 保留原有的 class 和 id
    var cls = el.getAttribute("class");
    if (cls) svgEl.setAttribute("class", "icon-svg " + cls);
    var id = el.getAttribute("id");
    if (id) svgEl.setAttribute("id", id);
    el.parentNode.replaceChild(svgEl, el);
  }
}

// ==================== 应用入口 ====================
window.onload = function () {
  processDataIcons();
  document
    .getElementById("scenario-type")
    .addEventListener("change", updateSubOptions);
  document
    .getElementById("amount")
    .addEventListener("input", onAmountInput);
  document
    .getElementById("amount")
    .addEventListener("keydown", onAmountKeydown);
  document
    .getElementById("amount")
    .addEventListener("focus", onAmountFocus);
  updatePeriodDisplay();
  restoreData();
  checkPeriodAndShowUI();
  calculate();
  updateStatus();
  renderPendingList();
};

// ==================== 18. 申请增加 ====================
function requestAdd(type) {
  var suggestion = prompt(
    "申请增加" +
      type +
      "\n\n请填写您希望增加的" +
      type +
      "名称及简要说明：\n（您的建议将被记录，后续版本会考虑添加）",
  );
  if (suggestion && suggestion.trim()) {
    var requests = JSON.parse(
      localStorage.getItem("finance_Requests") || "[]",
    );
    requests.push({
      type: type,
      content: suggestion.trim(),
      time: new Date().toISOString(),
    });
    localStorage.setItem("finance_Requests", JSON.stringify(requests));
    showToast(
      icon("circle-check") + " 感谢您的建议！您申请的" +
        type +
        "「" +
        suggestion.trim() +
        "」已记录。",
      "success",
    );
  }
}

// ==================== 19. 页面卸载前保存 ====================
window.addEventListener("beforeunload", function () {
  persistPending();
});
