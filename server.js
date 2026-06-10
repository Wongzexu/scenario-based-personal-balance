const express = require("express");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const multer = require("multer");
const upload = multer({ dest: "temp/" });
const app = express();
const port = 3000;

// ============ 静态文件服务 ============

// 根路径：返回 public/index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 托管 public 目录
app.use(express.static("public"));

// 托管 admin 目录（两种访问方式都支持）
app.use("/admin", express.static("admin")); // 方式1: /admin/icon-manager.html
app.use("/icon-admin", express.static("admin")); // 方式2: /icon-admin/icon-manager.html

// 快捷访问：/icon-admin 默认返回管理页面
app.get("/icon-admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin", "icon-manager.html"));
});

// 解析 JSON 格式的请求体
app.use(express.json());

// ============ 接口区域 ============

// 测试接口：确认后端已启动
app.get("/api/hello", (req, res) => {
  res.json({ message: "你好，后端已经启动啦！" });
});

// 获取所有用户数据
app.get("/api/users", (req, res) => {
  const filePath = path.join(__dirname, "data", "users.json");
  const rawData = fs.readFileSync(filePath, "utf-8");
  const users = JSON.parse(rawData);
  res.json(users);
});

// ============ 错误捕获============
process.on("uncaughtException", (err) => {
  console.error("❌ 未捕获的异常:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ 未处理的 Promise 拒绝:", reason);
});

// ============ 图标管理 API（优化版）============

const ICONS_DIR = path.join(__dirname, "src", "assets", "icons");
const ICONS_DATA_FILE = path.join(
  __dirname,
  "public",
  "js",
  "core",
  "icons-data.js",
);
const DB_FILE = path.join(__dirname, "finance.db");

const initSqlJs = require("sql.js");
let db;

// 防抖定时器
let saveTimer = null;
let syncTimer = null;

/** 保存数据库到文件（防抖，3秒无操作后落盘） */
function debouncedSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const data = db.export();
    fs.writeFileSync(DB_FILE, Buffer.from(data));
    console.log("💾 数据库已落盘");
    saveTimer = null;
  }, 3000);
}

/** 同步到 icons-data.js（防抖，1秒无操作后同步） */
function debouncedSyncToFile() {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    // 从数据库读取所有图标
    const result = db.exec("SELECT name, paths_data FROM icons");
    const rows = result[0]?.values || [];
    const paths = {};
    for (const row of rows) {
      paths[row[0]] = row[1];
    }

    // 生成安全的 JS 文件（使用 JSON.stringify，避免 eval）
    const content = `// 此文件由 server.js 自动同步生成，请勿手动编辑\n\nvar ICON_PATHS = ${JSON.stringify(paths, null, 2)};\n\nif (typeof module !== 'undefined' && module.exports) { module.exports = ICON_PATHS; }`;
    fs.writeFileSync(ICONS_DATA_FILE, content, "utf-8");
    console.log(
      `✅ 已同步 ${Object.keys(paths).length} 个图标到 icons-data.js`,
    );
    syncTimer = null;
  }, 1000);
}

/** 安全解析 icons-data.js（优先 JSON.parse，兼容旧格式用 vm） */
function parseIconPaths() {
  try {
    const content = fs.readFileSync(ICONS_DATA_FILE, "utf-8");
    // 匹配 var ICON_PATHS = {...}; 中的 JSON 部分
    const match = content.match(/var ICON_PATHS = (\{[\s\S]*?\});/);
    if (!match) return {};

    // 优先使用 JSON.parse 安全解析
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      // 兼容旧格式：使用 vm 安全解析
      const sandbox = { ICON_PATHS: null };
      vm.runInNewContext("ICON_PATHS = " + match[1], sandbox);
      return sandbox.ICON_PATHS;
    }
  } catch (e) {
    console.error("解析 icons-data.js 失败:", e.message);
    return {};
  }
}

/** 从 SVG 文件中提取 <path> 元素内容，并清除硬编码 fill */
function extractPaths(svgPath) {
  try {
    let raw = fs.readFileSync(svgPath, "utf-8");
    raw = raw.replace(/\s+fill="(?!none)[^"]*"/g, "");
    const matches = raw.match(/<path[\s\S]*?\/path>/g);
    return matches ? matches.join("") : "";
  } catch (e) {
    return "";
  }
}

/** 安全获取文件路径（防路径遍历攻击） */
function safePath(filename) {
  const fullPath = path.resolve(ICONS_DIR, filename);
  if (!fullPath.startsWith(path.resolve(ICONS_DIR))) {
    throw new Error("非法的文件路径");
  }
  return fullPath;
}

/** 清除 SVG 内容中的硬编码 fill 颜色 */
function stripFillAttrs(svgContent) {
  return svgContent.replace(/\s+fill="(?!none)[^"]*"/g, "");
}

/** 初始化数据库 */
async function initDatabase() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(fileBuffer);
    console.log("📁 加载现有数据库");
  } else {
    db = new SQL.Database();
    console.log("🆕 创建新数据库");

    // 创建表
    db.run(`
      CREATE TABLE IF NOT EXISTS icons (
        name TEXT PRIMARY KEY,
        paths_data TEXT NOT NULL,
        registered_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 从现有的 icons-data.js 导入数据
    const existingPaths = parseIconPaths();
    const insertStmt = db.prepare(
      "INSERT OR IGNORE INTO icons (name, paths_data) VALUES (?, ?)",
    );
    let importedCount = 0;
    for (const [name, paths] of Object.entries(existingPaths)) {
      insertStmt.run([name, paths]);
      if (db.getRowsModified() > 0) importedCount++;
    }
    console.log(`📥 从 icons-data.js 导入 ${importedCount} 个图标`);

    debouncedSave();
    debouncedSyncToFile();
  }
}

// 1. 获取所有 SVG 文件名列表
app.get("/api/icons/list", (req, res) => {
  try {
    const files = fs
      .readdirSync(ICONS_DIR)
      .filter((f) => f.endsWith(".svg"))
      .map((f) => path.basename(f, ".svg"))
      .filter((n) => !n.includes("副本"))
      .sort();
    res.json({ success: true, data: files });
  } catch (e) {
    if (e.code === "ENOENT") {
      res.status(404).json({ success: false, message: "图标目录不存在" });
    } else if (e.code === "EACCES") {
      res.status(403).json({ success: false, message: "没有权限访问图标目录" });
    } else {
      console.error("获取图标列表失败:", e);
      res.status(500).json({ success: false, message: "服务器内部错误" });
    }
  }
});

// 2. 获取已注册图标名列表
app.get("/api/icons/registered", (req, res) => {
  try {
    const result = db.exec("SELECT name FROM icons ORDER BY name");
    const names = result[0]?.values.map((row) => row[0]) || [];
    res.json({ success: true, data: names });
  } catch (e) {
    console.error("获取已注册列表失败:", e);
    res.status(500).json({ success: false, message: "服务器内部错误" });
  }
});

// 3. 获取完整 ICON_PATHS 对象
app.get("/api/icons/paths", (req, res) => {
  try {
    const result = db.exec("SELECT name, paths_data FROM icons");
    const rows = result[0]?.values || [];
    const paths = {};
    for (const row of rows) {
      paths[row[0]] = row[1];
    }
    res.json({ success: true, data: paths });
  } catch (e) {
    console.error("获取图标路径失败:", e);
    res.status(500).json({ success: false, message: "服务器内部错误" });
  }
});

// 4. 获取单个 SVG 文件内容（清除硬编码 fill，统一用 currentColor）
app.get("/api/icons/svg/:name", (req, res) => {
  try {
    const svgPath = safePath(req.params.name + ".svg");
    if (!fs.existsSync(svgPath)) {
      return res
        .status(404)
        .json({ success: false, message: "SVG 文件不存在" });
    }
    let content = fs.readFileSync(svgPath, "utf-8");
    content = stripFillAttrs(content);
    res.set("Content-Type", "image/svg+xml");
    res.send(content);
  } catch (e) {
    if (e.message === "非法的文件路径") {
      res.status(400).json({ success: false, message: "非法的文件名" });
    } else {
      console.error("获取 SVG 文件失败:", e);
      res.status(500).json({ success: false, message: "服务器内部错误" });
    }
  }
});

// 5. 注册图标（优化：消除冗余查询）
app.post("/api/icons/register", (req, res) => {
  const { names } = req.body;
  if (!Array.isArray(names) || names.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "请提供要注册的图标名列表" });
  }

  const failed = [];
  let added = 0;
  let skipped = 0;

  try {
    const insertStmt = db.prepare(
      "INSERT OR IGNORE INTO icons (name, paths_data) VALUES (?, ?)",
    );

    for (const name of names) {
      const svgFile = safePath(name + ".svg");
      if (!fs.existsSync(svgFile)) {
        failed.push({ name, reason: "SVG 文件不存在" });
        continue;
      }

      const pathData = extractPaths(svgFile);
      if (!pathData) {
        failed.push({ name, reason: "提取 path 数据失败" });
        continue;
      }

      insertStmt.run([name, pathData]);

      // sql.js 通过 getRowsModified() 获取影响行数
      if (db.getRowsModified() === 0) {
        skipped++;
      } else {
        added++;
      }
    }

    if (added > 0) {
      debouncedSave(); // 防抖落盘
      debouncedSyncToFile(); // 防抖同步文件
    }
  } catch (e) {
    console.error("注册图标失败:", e);
    return res.status(500).json({ success: false, message: "服务器内部错误" });
  }

  res.json({
    success: true,
    message: `已注册 ${added} 个图标${skipped > 0 ? `，跳过 ${skipped} 个已存在` : ""}`,
    added,
    skipped,
    failed,
  });
});

// 6. 注销（删除）图标
app.delete("/api/icons/:name", (req, res) => {
  try {
    const name = req.params.name;

    // 检查是否存在
    const check = db.exec("SELECT name FROM icons WHERE name = ?", [name]);
    if (check[0]?.values.length === 0) {
      return res.status(404).json({ success: false, message: "图标未注册" });
    }

    db.run("DELETE FROM icons WHERE name = ?", [name]);
    debouncedSave(); // 防抖落盘
    debouncedSyncToFile(); // 防抖同步文件

    res.json({ success: true, message: `已注销: ${name}` });
  } catch (e) {
    console.error("注销图标失败:", e);
    res.status(500).json({ success: false, message: "服务器内部错误" });
  }
});

// 7. 添加上传接口

app.post("/api/icons/upload", upload.single("svg"), (req, res) => {
  try {
    const { originalname } = req.file;
    const targetPath = path.join(ICONS_DIR, originalname);

    if (fs.existsSync(targetPath)) {
      return res.status(400).json({ success: false, message: "图标已存在" });
    }

    fs.renameSync(req.file.path, targetPath);

    res.json({
      success: true,
      message: `已添加图标: ${originalname.replace(".svg", "")}`,
      name: originalname.replace(".svg", ""),
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// 8. 删除图标（含文件）
app.post("/api/icons/delete", (req, res) => {
  try {
    const names = req.body.names;
    if (!Array.isArray(names) || names.length === 0) {
      return res.status(400).json({ success: false, message: "请指定要删除的图标" });
    }

    var deleted = 0, notFound = 0;

    names.forEach(function (name) {
      // 1. 清理数据库注册记录（如果有）
      db.run("DELETE FROM icons WHERE name = ?", [name]);

      // 2. 删除 SVG 文件
      var filePath = path.join(ICONS_DIR, name + ".svg");
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        deleted++;
      } else {
        notFound++;
      }
    });

    debouncedSave();
    debouncedSyncToFile();

    res.json({
      success: true,
      message: "已删除 " + deleted + " 个图标" + (notFound > 0 ? "（" + notFound + " 个文件不存在）" : ""),
      deleted: deleted,
    });
  } catch (e) {
    console.error("删除图标失败:", e);
    res.status(500).json({ success: false, message: "删除失败: " + e.message });
  }
});

// ============ 启动服务 ============
initDatabase()
  .then(() => {
    console.log("🗄️ 数据库初始化完成");
    app.listen(port, () => {
      console.log(`✅ 服务已启动，请在浏览器访问：http://127.0.0.1:${port}`);
    });
  })
  .catch((err) => {
    console.error("❌ 数据库初始化失败:", err);
    process.exit(1);
  });
