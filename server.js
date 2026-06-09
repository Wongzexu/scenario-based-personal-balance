const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// 让 Express 把 public 文件夹作为静态文件服务器
// 浏览器访问 http://localhost:3000 就会自动加载 public/index.html
app.use(express.static('public'));

// 解析 JSON 格式的请求体（后面做增删改时会用到）
app.use(express.json());

// ============ 接口区域 ============

// 测试接口：确认后端已启动
app.get('/api/hello', (req, res) => {
  res.json({ message: '你好，后端已经启动啦！' });
});

// 获取所有用户数据
app.get('/api/users', (req, res) => {
  const filePath = path.join(__dirname, 'data', 'users.json');
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const users = JSON.parse(rawData);
  res.json(users);
});

// ============ 图标管理 API ============

const ICONS_DIR = path.join(__dirname, 'src', 'assets', 'icons');
const ICONS_DATA_FILE = path.join(__dirname, 'public', 'js', 'core', 'icons-data.js');

/** 从 SVG 文件中提取 <path> 元素内容，并清除硬编码 fill（保留 fill="none"）*/
function extractPaths(svgPath) {
  try {
    let raw = fs.readFileSync(svgPath, 'utf-8');
    // 去掉硬编码 fill 颜色，让 CSS currentColor 统一控制
    // 保留 fill="none"（镂空图标需要）
    raw = raw.replace(/\s+fill="(?!none)[^"]*"/g, '');
    const matches = raw.match(/<path[\s\S]*?\/path>/g);
    return matches ? matches.join('') : '';
  } catch (e) {
    return '';
  }
}

/** 清除 SVG 内容中的硬编码 fill 颜色 */
function stripFillAttrs(svgContent) {
  return svgContent.replace(/\s+fill="(?!none)[^"]*"/g, '');
}

/** 解析 icons-data.js 返回 ICON_PATHS 对象 */
function parseIconPaths() {
  try {
    const content = fs.readFileSync(ICONS_DATA_FILE, 'utf-8');
    const match = content.match(/var ICON_PATHS = (\{[\s\S]*?\});/);
    if (!match) return {};
    // 用 eval 解析对象字面量（安全：这是项目自己的文件）
    return eval('(' + match[1] + ')');
  } catch (e) {
    return {};
  }
}

// 1. 获取所有 SVG 文件名列表
app.get('/api/icons/list', (req, res) => {
  try {
    const files = fs.readdirSync(ICONS_DIR)
      .filter(f => f.endsWith('.svg'))
      .map(f => path.basename(f, '.svg'))
      .filter(n => !n.includes('副本'))
      .sort();
    res.json({ success: true, data: files });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// 2. 获取已注册图标名列表
app.get('/api/icons/registered', (req, res) => {
  try {
    const paths = parseIconPaths();
    res.json({ success: true, data: Object.keys(paths) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// 3. 获取完整 ICON_PATHS 对象
app.get('/api/icons/paths', (req, res) => {
  try {
    const paths = parseIconPaths();
    res.json({ success: true, data: paths });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// 4. 获取单个 SVG 文件内容（清除硬编码 fill，统一用 currentColor）
app.get('/api/icons/svg/:name', (req, res) => {
  try {
    const svgPath = path.join(ICONS_DIR, req.params.name + '.svg');
    if (!fs.existsSync(svgPath)) {
      return res.status(404).json({ success: false, message: 'SVG 文件不存在' });
    }
    let content = fs.readFileSync(svgPath, 'utf-8');
    content = stripFillAttrs(content);
    res.set('Content-Type', 'image/svg+xml');
    res.send(content);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// 5. 注册图标
app.post('/api/icons/register', (req, res) => {
  const { names } = req.body;
  if (!Array.isArray(names) || names.length === 0) {
    return res.status(400).json({ success: false, message: '请提供要注册的图标名列表' });
  }

  const failed = [];
  let added = 0;
  let skipped = 0;

  try {
    let content = fs.readFileSync(ICONS_DATA_FILE, 'utf-8');
    const paths = parseIconPaths();
    const existingNames = Object.keys(paths);

    for (const name of names) {
      // 检查 SVG 文件是否存在
      const svgFile = path.join(ICONS_DIR, name + '.svg');
      if (!fs.existsSync(svgFile)) {
        failed.push({ name, reason: 'SVG 文件不存在' });
        continue;
      }

      // 检查是否已注册
      if (existingNames.includes(name)) {
        skipped++;
        continue;
      }

      // 提取 path 数据
      const pathData = extractPaths(svgFile);
      if (!pathData) {
        failed.push({ name, reason: '提取 path 数据失败' });
        continue;
      }

      // 在最后一个图标条目之后插入
      const lastMatch = content.match(/^  '[^']*':.*$/gm);
      if (!lastMatch || lastMatch.length === 0) {
        failed.push({ name, reason: '找不到插入位置' });
        continue;
      }

      const lastLine = lastMatch[lastMatch.length - 1];
      const newLine = "  '" + name + "': '" + pathData + "',";
      content = content.replace(lastLine, lastLine + '\n' + newLine);
      existingNames.push(name);
      added++;
    }

    if (added > 0) {
      fs.writeFileSync(ICONS_DATA_FILE, content);
    }
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }

  res.json({
    success: true,
    message: '已注册 ' + added + ' 个图标' + (skipped > 0 ? '，跳过 ' + skipped + ' 个已存在' : ''),
    added,
    skipped,
    failed,
  });
});

// 6. 注销（删除）图标
app.delete('/api/icons/:name', (req, res) => {
  try {
    let content = fs.readFileSync(ICONS_DATA_FILE, 'utf-8');
    const name = req.params.name;

    // 匹配并删除该图标行
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp("\\s*'?" + escaped + "'?:\\s*'[^']*',?\\n?", 'g');
    const newContent = content.replace(regex, '');

    if (newContent === content) {
      return res.status(404).json({ success: false, message: '图标未注册: ' + name });
    }

    fs.writeFileSync(ICONS_DATA_FILE, newContent);
    res.json({ success: true, message: '已注销: ' + name });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ============ 启动服务 ============
app.listen(port, () => {
  console.log(`✅ 服务已启动，请在浏览器访问：http://localhost:${port}`);
});