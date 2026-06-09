// ==================== 11. 数据持久化 ====================
function getBaseData() {
  var stored = localStorage.getItem("finance_BaseData");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {}
  }
  return {
    cash: 0,
    investment: 0,
    fixed: 0,
    liabilityShort: 0,
    liabilityLong: 0,
  };
}
function saveBaseData(data) {
  localStorage.setItem("finance_BaseData", JSON.stringify(data));
}
function getChangesData() {
  var stored = localStorage.getItem("finance_Changes");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {}
  }
  return {
    cash: 0,
    investment: 0,
    fixed: 0,
    liabilityShort: 0,
    liabilityLong: 0,
    profit: 0,
  };
}
function saveChangesData(data) {
  localStorage.setItem("finance_Changes", JSON.stringify(data));
}
function getSessions() {
  try {
    return JSON.parse(localStorage.getItem("finance_Sessions") || "[]");
  } catch (e) {
    return [];
  }
}
function saveSessions(list) {
  localStorage.setItem("finance_Sessions", JSON.stringify(list));
}
