// ==================== 14. 通用弹窗 ====================
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

function openModal(id) {
  var el = document.getElementById(id);
  el.style.display = "flex";
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      el.classList.add("active");
    });
  });
}
function closeModal(id) {
  var el = document.getElementById(id);
  el.classList.remove("active");
  el.addEventListener("transitionend", function handler() {
    el.removeEventListener("transitionend", handler);
    if (!el.classList.contains("active")) {
      el.style.display = "none";
    }
  });
  setTimeout(function () {
    if (!el.classList.contains("active") && el.style.display !== "none") {
      el.style.display = "none";
    }
  }, 300);
}
document.addEventListener("click", function (e) {
  if (
    e.target.classList.contains("modal-overlay") &&
    e.target.classList.contains("active")
  ) {
    // 确认弹窗不允许点背景关闭
    if (e.target.id === "confirm-modal") return;
    closeModal(e.target.id);
  }
});

// ==================== 14.5 Toast 通知 ====================
function showToast(message, type, duration) {
  type = type || "info";
  duration = duration || 3000;
  var container = document.getElementById("toast-container");
  var toast = document.createElement("div");
  toast.className = "toast " + type;
  toast.innerHTML = message;
  container.appendChild(toast);
  setTimeout(function () {
    if (toast.parentNode) {
      toast.addEventListener("animationend", function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      });
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 400);
    }
  }, duration);
}

// ==================== 14.6 Confirm 弹窗 ====================
function showConfirm(title, message, confirmText, cancelText) {
  return new Promise(function (resolve) {
    document.getElementById("confirm-modal-title").textContent = title || "确认操作";
    document.getElementById("confirm-modal-message").textContent = message || "";
    document.getElementById("confirm-modal-confirm").textContent = confirmText || "确定";
    document.getElementById("confirm-modal-cancel").textContent = cancelText || "取消";
    window._confirmResolve = resolve;
    openModal("confirm-modal");
  });
}

function _confirmResult(result) {
  closeModal("confirm-modal");
  if (window._confirmResolve) {
    var resolve = window._confirmResolve;
    window._confirmResolve = null;
    resolve(result);
  }
}
