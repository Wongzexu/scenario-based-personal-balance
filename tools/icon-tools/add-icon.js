/**
 * SVG 图标注册脚本
 *
 * 用法:
 *   node scripts/add-icon.js <icon-name> [icon-name ...]
 *   node scripts/add-icon.js --list          查看未注册的图标
 *   node scripts/add-icon.js --all           批量注册所有未注册图标
 *
 * 示例:
 *   node scripts/add-icon.js camera wifi bluetooth
 */

const fs = require('fs');
const path = require('path');

const ICONS_DIR = 'src/assets/icons';
const DATA_FILE = 'js/core/icons-data.js';

// ---- 核心函数 ----

/** 从 SVG 文件中提取 <path> 元素内容 */
function extractPaths(svgPath) {
  const raw = fs.readFileSync(svgPath, 'utf-8');
  // 提取所有 <path ...>...</path> 内容
  const matches = raw.match(/<path[\s\S]*?\/path>/g);
  if (!matches) return '';
  return matches.join('');
}

/** 检查图标名是否已在 ICON_PATHS 中注册 */
function isRegistered(name) {
  const content = fs.readFileSync(DATA_FILE, 'utf-8');
  return new RegExp("'" + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "':").test(content);
}

/** 注册单个图标 */
function registerIcon(name) {
  const svgFile = path.join(ICONS_DIR, name + '.svg');

  if (!fs.existsSync(svgFile)) {
    console.log('  ❌ 文件不存在: ' + svgFile);
    return false;
  }

  if (isRegistered(name)) {
    console.log('  ⏭  已存在，跳过: ' + name);
    return true; // not an error, just skipped
  }

  const paths = extractPaths(svgFile);
  if (!paths) {
    console.log('  ❌ 提取 path 数据失败: ' + name);
    return false;
  }

  let content = fs.readFileSync(DATA_FILE, 'utf-8');

  // 在最后一个 'xxx': '...' 行之后插入
  const lastMatch = content.match(/^  '[^']*':.*$/gm);
  if (!lastMatch || lastMatch.length === 0) {
    console.log('  ❌ 找不到 ICON_PATHS 中的插入位置');
    return false;
  }

  const lastLine = lastMatch[lastMatch.length - 1];
  const newLine = "  '" + name + "': '" + paths + "',";

  content = content.replace(lastLine, lastLine + '\n' + newLine);
  fs.writeFileSync(DATA_FILE, content);

  console.log('  ✅ 已注册: ' + name);
  return true;
}

/** 列出所有未注册的 SVG 图标 */
function listUnregistered() {
  const files = fs.readdirSync(ICONS_DIR).filter(f => f.endsWith('.svg'));

  const unregistered = files
    .map(f => path.basename(f, '.svg'))
    .filter(name => !isRegistered(name));

  console.log('未注册的 SVG 图标（' + ICONS_DIR + ' → ' + DATA_FILE + '）：');
  console.log('');

  const cols = 2;
  const colWidth = 36;
  for (let i = 0; i < unregistered.length; i++) {
    process.stdout.write('  ' + unregistered[i].padEnd(colWidth));
    if ((i + 1) % cols === 0) process.stdout.write('\n');
  }
  if (unregistered.length % cols !== 0) process.stdout.write('\n');

  console.log('');
  console.log('共 ' + unregistered.length + ' 个未注册图标（共 ' + files.length + ' 个 SVG 文件）');
}

/** 按名称前缀搜索可用图标 */
function searchIcons(query) {
  const files = fs.readdirSync(ICONS_DIR).filter(f => f.endsWith('.svg'));
  const results = files
    .map(f => path.basename(f, '.svg'))
    .filter(name => name.toLowerCase().includes(query.toLowerCase()));

  if (results.length === 0) {
    console.log('未找到匹配 "' + query + '" 的图标');
    return;
  }

  console.log('匹配 "' + query + '" 的图标：');
  const cols = 2;
  const colWidth = 36;
  for (let i = 0; i < results.length; i++) {
    const marker = isRegistered(results[i]) ? ' ✓' : '  ';
    process.stdout.write('  ' + (results[i] + marker).padEnd(colWidth));
    if ((i + 1) % cols === 0) process.stdout.write('\n');
  }
  if (results.length % cols !== 0) process.stdout.write('\n');
  console.log('');
  console.log('共 ' + results.length + ' 个（✓ = 已注册）');
}

// ---- 主流程 ----

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('SVG 图标注册脚本');
  console.log('');
  console.log('用法:');
  console.log('  node tools/icon-tools/add-icon.js <icon-name> [icon-name ...]');
  console.log('  node tools/icon-tools/add-icon.js --list            查看未注册图标');
  console.log('  node tools/icon-tools/add-icon.js --all             批量注册全部未注册图标');
  console.log('  node tools/icon-tools/add-icon.js --search <关键词>   搜索可用图标');
  console.log('  node tools/icon-tools/add-icon.js --sync            刷新 icon-list.js（新增 SVG 后使用）');
  console.log('');
  console.log('示例:');
  console.log('  node tools/icon-tools/add-icon.js camera wifi bluetooth');
  process.exit(0);
}

if (args[0] === '--list' || args[0] === '-l') {
  listUnregistered();

} else if (args[0] === '--all' || args[0] === '-a') {
  console.log('批量注册所有未注册图标...');
  console.log('');
  const files = fs.readdirSync(ICONS_DIR).filter(f => f.endsWith('.svg'));
  let added = 0, skipped = 0, failed = 0;
  for (const f of files) {
    const name = path.basename(f, '.svg');
    if (isRegistered(name)) {
      skipped++;
      continue;
    }
    if (registerIcon(name)) added++;
    else failed++;
  }
  console.log('');
  console.log('完成: 新增 ' + added + ', 跳过 ' + skipped + ', 失败 ' + failed);

} else if (args[0] === '--search' || args[0] === '-s') {
  if (!args[1]) {
    console.log('请提供搜索关键词');
    process.exit(1);
  }
  searchIcons(args[1]);

} else if (args[0] === '--sync' || args[0] === '-S') {
  const files = fs.readdirSync(ICONS_DIR).filter(f => f.endsWith('.svg'));
  const names = files
    .map(f => path.basename(f, '.svg'))
    .filter(n => !n.includes('副本'))
    .sort();
  const listFile = 'tools/icon-tools/icon-list.js';
  const js = 'var SVGLIST = ' + JSON.stringify(names, null, 2) + ';';
  fs.writeFileSync(listFile, js);
  console.log('✅ 已刷新 icon-list.js（' + names.length + ' 个图标）');

} else {
  console.log('注册图标...');
  console.log('');
  let ok = 0;
  for (const name of args) {
    if (registerIcon(name)) ok++;
  }
  console.log('');
  console.log('完成: 成功 ' + ok + ' / 共 ' + args.length);
}
