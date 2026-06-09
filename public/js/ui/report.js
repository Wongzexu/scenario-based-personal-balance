// ==================== 13. 打印报表 ====================
function exportReport() {
  if (pendingTransactions.length > 0) {
    showConfirm(
      "未提交记录",
      "还有 " + pendingTransactions.length + " 条未提交的记账记录\n\n这些记录的变动将不会体现在报表中。\n\n是否继续导出？",
      "直接导出",
      "去提交"
    ).then(function (confirmed) {
      if (!confirmed) {
        document.getElementById("preview-area").scrollIntoView({ behavior: "smooth" });
        return;
      }
      openModal("print-choice-modal");
    });
    return;
  }
  openModal("print-choice-modal");
}

function doExportPNG() {
  closeModal("print-choice-modal");
  var baseData = getBaseData(),
    changes = getChangesData();
  var totals = calculateTotals(baseData, changes);
  var end = totals.end;
  var beginTimeStr =
    document.getElementById("period-begin-time").textContent;
  var currentTimeStr = document.getElementById(
    "period-current-time",
  ).textContent;

  var canvas = document.createElement("canvas"),
    ctx = canvas.getContext("2d");
  var W = 680,
    rowH = 26,
    col1X = 20,
    col2X = 380,
    colW = 280,
    rows = [];
  var FONT = "14px -apple-system, BlinkMacSystemFont, sans-serif";
  var FONT_BOLD =
    "bold 14px -apple-system, BlinkMacSystemFont, sans-serif";
  var FONT_SMALL = "12px -apple-system, BlinkMacSystemFont, sans-serif";
  function addRow(label, value, opts) {
    rows.push(Object.assign({ label: label, value: value }, opts));
  }

  addRow("资产负债盘点表", "", {
    bold: true,
    section: true,
    color: "#059669",
  });
  addRow("期初: " + beginTimeStr + "  |  本期: " + currentTimeStr, "", {
    small: true,
    color: "#6b7280",
  });
  addRow("", "", { spacer: true });
  addRow("资产", "", { section: true });
  addRow("期初流动资产 (现金/存款)", formatTableNum(baseData.cash));
  addRow("期初投资资产 (股票/基金)", formatTableNum(baseData.investment));
  addRow("期初固定资产 (房产/车辆)", formatTableNum(baseData.fixed));
  addRow("期初资产总计", formatTableNum(totals.totalAssetsBegin), {
    bold: true,
    bg: "#e5e7eb",
  });
  addRow("负债", "", { section: true });
  addRow(
    "期初短期负债 (信用卡/花呗)",
    formatTableNum(baseData.liabilityShort),
  );
  addRow(
    "期初长期负债 (房贷/车贷)",
    formatTableNum(baseData.liabilityLong),
  );
  addRow("期初负债总计", formatTableNum(totals.totalLiabilitiesBegin), {
    bold: true,
    bg: "#e5e7eb",
  });
  addRow("期初净资产", formatTableNum(totals.netWorthBegin), {
    bold: true,
    bg: "#dbeafe",
  });
  addRow("本期变动", "", { section: true, bg: "#d1fae5" });
  addRow("本期现金变动", formatChange(changes.cash));
  addRow("本期投资变动", formatChange(changes.investment));
  addRow("本期固定资产变动", formatChange(changes.fixed));
  addRow(
    "本期负债变动",
    formatChange(changes.liabilityShort + changes.liabilityLong),
  );
  addRow("本期利润影响", formatChange(changes.profit));
  addRow("期末余额", "", { section: true, bg: "#d1fae5" });
  addRow("期末流动资产", formatTableNum(end.cash), { bold: true });
  addRow("期末投资资产", formatTableNum(end.investment), { bold: true });
  addRow("期末固定资产", formatTableNum(end.fixed), { bold: true });
  addRow("期末资产总计", formatTableNum(totals.totalAssetsEnd), {
    bold: true,
    bg: "#e5e7eb",
  });
  addRow("期末短期负债", formatTableNum(end.liabilityShort), {
    bold: true,
  });
  addRow("期末长期负债", formatTableNum(end.liabilityLong), {
    bold: true,
  });
  addRow("期末负债总计", formatTableNum(totals.totalLiabilitiesEnd), {
    bold: true,
    bg: "#e5e7eb",
  });
  addRow("期末净资产", formatTableNum(totals.netWorthEnd), {
    bold: true,
    bg: "#dbeafe",
  });

  var H = (rows.length + 0.5) * rowH + 20;
  canvas.width = W;
  canvas.height = H;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  rows.forEach(function (r, i) {
    var y = 20 + (i + 0.5) * rowH;
    if (r.section) {
      ctx.fillStyle = r.bg || "#f9fafb";
      ctx.fillRect(0, y - rowH / 2 + 2, W, rowH);
    }
    if (r.bg && !r.section) {
      ctx.fillStyle = r.bg;
      ctx.fillRect(0, y - rowH / 2 + 2, W, rowH);
    }
    if (r.spacer) return;
    ctx.fillStyle = r.color || "#1f2937";
    ctx.font = r.small ? FONT_SMALL : r.bold ? FONT_BOLD : FONT;
    ctx.textBaseline = "middle";
    if (r.section) {
      ctx.textAlign = "center";
      ctx.fillText(r.label, W / 2, y);
    } else {
      ctx.textAlign = "left";
      ctx.fillText(r.label, col1X, y);
      ctx.textAlign = "right";
      ctx.fillText(r.value, col2X + colW, y);
    }
  });
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(col2X - 10, 0);
  ctx.lineTo(col2X - 10, H);
  ctx.stroke();

  canvas.toBlob(function (blob) {
    var now = new Date(),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download =
      "资产负债表_" +
      now.toISOString().replace(/[:.]/g, "-").slice(0, 10) +
      ".png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, "image/png");
}

function doExportPDF() {
  closeModal("print-choice-modal");
  var baseData = getBaseData(),
    changes = getChangesData();
  var totals = calculateTotals(baseData, changes);
  var end = totals.end;
  var beginTimeStr =
    document.getElementById("period-begin-time").textContent;
  var currentTimeStr = document.getElementById(
    "period-current-time",
  ).textContent;

  function tr(label, value, cls) {
    return (
      "<tr" +
      (cls ? ' class="' + cls + '"' : "") +
      "><td>" +
      label +
      "</td><td>" +
      value +
      "</td></tr>"
    );
  }
  function sec(label) {
    return '<tr><td colspan="2" class="sec">' + label + "</td></tr>";
  }

  var html =
    "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>资产负债表</title><style>" +
    "body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:30px;color:#1f2937;}" +
    "h2{text-align:center;color:#059669;border-bottom:2px solid #059669;padding-bottom:10px;}" +
    ".info{text-align:center;color:#6b7280;font-size:0.85rem;margin-bottom:16px;}" +
    "table{width:100%;border-collapse:collapse;font-size:0.9rem;}" +
    "th,td{border:1px solid #d1d5db;padding:8px 12px;text-align:left;}" +
    ".sec{background:#f9fafb;font-weight:bold;text-align:center;color:#4b5563;}" +
    ".bold{background:#e5e7eb;font-weight:bold;}.blue{background:#dbeafe;font-weight:bold;}" +
    ".green{background:#d1fae5;font-weight:bold;text-align:center;}" +
    "@media print{body{padding:0;}}</style></head><body>" +
    "<h2>资产负债盘点表</h2>" +
    '<div class="info">期初: ' +
    beginTimeStr +
    " &nbsp;|&nbsp; 本期: " +
    currentTimeStr +
    "</div>" +
    "<table>" +
    sec("资产") +
    tr("期初流动资产 (现金/存款)", formatTableNum(baseData.cash)) +
    tr("期初投资资产 (股票/基金)", formatTableNum(baseData.investment)) +
    tr("期初固定资产 (房产/车辆)", formatTableNum(baseData.fixed)) +
    tr("期初资产总计", formatTableNum(totals.totalAssetsBegin), "bold") +
    sec("负债") +
    tr("期初短期负债 (信用卡/花呗)", formatTableNum(baseData.liabilityShort)) +
    tr("期初长期负债 (房贷/车贷)", formatTableNum(baseData.liabilityLong)) +
    tr("期初负债总计", formatTableNum(totals.totalLiabilitiesBegin), "bold") +
    tr("期初净资产", formatTableNum(totals.netWorthBegin), "blue") +
    sec("本期变动") +
    tr("本期现金变动", formatChange(changes.cash)) +
    tr("本期投资变动", formatChange(changes.investment)) +
    tr("本期固定资产变动", formatChange(changes.fixed)) +
    tr("本期负债变动", formatChange(changes.liabilityShort + changes.liabilityLong)) +
    tr("本期利润影响", formatChange(changes.profit)) +
    sec("期末余额") +
    tr("期末流动资产", formatTableNum(end.cash), "bold") +
    tr("期末投资资产", formatTableNum(end.investment), "bold") +
    tr("期末固定资产", formatTableNum(end.fixed), "bold") +
    tr("期末资产总计", formatTableNum(totals.totalAssetsEnd), "bold") +
    tr("期末短期负债", formatTableNum(end.liabilityShort), "bold") +
    tr("期末长期负债", formatTableNum(end.liabilityLong), "bold") +
    tr("期末负债总计", formatTableNum(totals.totalLiabilitiesEnd), "bold") +
    tr("期末净资产", formatTableNum(totals.netWorthEnd), "blue") +
    "</table></body></html>";

  var w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
  setTimeout(function () {
    w.print();
  }, 500);
}
