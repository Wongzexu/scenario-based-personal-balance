# 从零开始搭建你的第一个前后端小项目（Node.js + Express）

> 写给完全新手的指引：用文件夹当数据库，在本地电脑上跑通前端页面与后端接口的完整流程。  
> 本指南会澄清你最困惑的几个概念，并给出一份能直接跑的代码示例。

---

## 一、概念澄清：回答你最开始的几个疑问

### 1. “我可以用文件夹来管理数据吗？”
**可以。**  
在小项目、单人学习阶段，直接用 JSON 文件存数据完全没问题，不需要装 MySQL 等数据库。  
- 方式：后端代码用 `fs.readFileSync` / `fs.writeFileSync` 读写一个 `.json` 文件。  
- 优点：零安装，数据直观可见。  
- 缺点：查询不方便、没有并发保护、不适合存大量复杂关联数据。  
等你熟悉后，很容易切换到 SQLite（一个单文件数据库）或 MySQL。

### 2. “前端直接读文件和通过后端调取有什么区别？”
- **前端直接读文件（例如 `fetch('/data.json')`）**  
  - 任何人通过浏览器都能看到完整的 JSON 内容，毫无安全性。  
  - 数据一大，浏览器性能会下降。  
  - 无法做登录验证、权限控制等。  
- **通过后端接口获取（例如 `fetch('/api/users')`）**  
  - 浏览器只拿到后端处理后的结果，后端可以隐藏敏感字段。  
  - 可以在后端加入身份校验、数据过滤、复杂运算。  
  - 前后端分离，以后换数据库或改逻辑，前端代码不用动。

**结论：即使数据存储在文件里，也必须由后端去读，再通过接口提供给前端。**

### 3. “为什么浏览器直接打开 HTML 不能读本地文件，但 VS Code 调试时可以？”
- 浏览器打开 `file:///C:/Users/.../index.html` → 受到严格的安全策略限制，**禁止动态读取其他本地文件**（防止网页偷你的隐私文件）。  
- VS Code 的 Live Server 插件或调试功能会在本地悄悄启动一个 **HTTP 服务器**，把你的页面运行在 `http://localhost:xxxx` 下。  
  HTTP 协议下，浏览器把当前服务器目录当作同源网站，允许正常请求数据文件。  
所以真相是：**不是浏览器变强了，而是你有了一个本地 HTTP 服务。**

### 4. “后端用 Java 编写，并且可以在 Node.js 环境中使用？”
你可能听岔了。**Java 和 Node.js 是两套完全独立的后端方案，不能混用。**  
- Java 后端：需要 JDK + Spring Boot 等，运行在 JVM 上。  
- Node.js 后端：用 JavaScript 编写，运行在 Chrome V8 引擎上。  
你初学阶段二选一即可。本指南用 **Node.js**，因为前后端都是 JavaScript，上手最快。

---

## 二、准备工作：你需要安装什么

### 必须安装的软件
| 软件 | 作用 | 下载地址 |
|------|------|----------|
| **Node.js** | 运行后端的 JavaScript 环境 | [https://nodejs.org](https://nodejs.org)（选 LTS 长期支持版） |
| **VS Code**（或其他编辑器） | 写代码 | 你已经在用了 |

安装 Node.js 时一路点击 “Next”，安装完成后在终端验证：

```bash
node -v   # 应显示版本号，如 v20.11.0
npm -v    # 应显示版本号，如 10.2.4
```

### 不需要安装的东西
- **不需要数据库**：我们先用 JSON 文件。  
- **不需要 Nginx / Apache**：Node.js 自己就是一个 HTTP 服务器。  
- **不需要 Java / JDK**：本指南与 Java 无关。

---

## 三、项目结构（照此创建文件夹和文件）

```bash
my-first-app/
├── server.js          ← 后端主程序（我们自己写）
├── package.json       ← 项目描述文件（由 npm 自动生成）
├── data/
│   └── users.json     ← 模拟数据库，存放用户数据
└── public/            ← 前端的“家”
    ├── index.html
    ├── style.css
    └── script.js
```

*别担心，接下来会一步步创建。*

---

## 四、从零开始写出第一个接口

### 1. 初始化项目，安装 Express

打开终端（或 VS Code 内置终端），进入你想要创建项目的文件夹，依次执行：

```bash
# 创建一个名为 my-first-app 的文件夹并进入
mkdir my-first-app
cd my-first-app

# 初始化项目，一路回车即可（会生成 package.json）
npm init -y

# 安装 Express 框架（一个让 Node.js 写接口变得简单的工具）
npm install express
```

### 2. 手动创建数据文件 `data/users.json`

在项目根目录下创建 `data` 文件夹，里面新建 `users.json`，写入以下内容：

```json
[
  { "id": 1, "name": "张三", "age": 25 },
  { "id": 2, "name": "李四", "age": 30 }
]
```

### 3. 编写后端 `server.js`

在根目录新建 `server.js`，完整代码如下（每一行都有注释）：

```javascript
const express = require('express');   // 引入 Express
const fs = require('fs');             // 引入文件系统模块，用来读写 JSON
const path = require('path');         // 引入路径处理模块

const app = express();                // 创建 Express 应用
const port = 3000;                    // 端口号，可以随便改成你喜欢的

// 1. 让 Express 把 public 文件夹作为静态文件服务器
//    这样浏览器访问 http://localhost:3000 就会自动加载 public/index.html
app.use(express.static('public'));

// 2. 编写一个接口：获取所有用户数据
app.get('/api/users', (req, res) => {
  // 读取 data/users.json 文件
  const filePath = path.join(__dirname, 'data', 'users.json');
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const users = JSON.parse(rawData);  // 把字符串转成 JS 数组
  
  // 把数据以 JSON 格式返回给浏览器
  res.json(users);
});

// 3. 再写一个简单的测试接口
app.get('/api/hello', (req, res) => {
  res.json({ message: '你好，后端已经启动啦！' });
});

// 4. 启动服务
app.listen(port, () => {
  console.log(`✅ 服务已启动，请在浏览器访问：http://localhost:${port}`);
});
```

### 4. 编写前端页面

在 `public` 文件夹下创建三个文件：

**`public/index.html`**
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>我的第一个前后端项目</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>用户列表（从后端 API 获取）</h1>
  <button id="loadUsersBtn">加载用户</button>
  <ul id="userList"></ul>

  <hr>
  <p id="helloMessage"></p>

  <script src="script.js"></script>
</body>
</html>
```

**`public/style.css`**（可选，随意写点样式）
```css
body {
  font-family: Arial, sans-serif;
  margin: 40px;
}
button {
  padding: 8px 16px;
  font-size: 16px;
}
```

**`public/script.js`**（负责调用后端接口）
```javascript
// 点击按钮，从后端获取用户列表
document.getElementById('loadUsersBtn').addEventListener('click', async () => {
  try {
    // 向后端发起请求（注意这里用的是 /api/users，不是直接读文件！）
    const response = await fetch('/api/users');
    const users = await response.json();

    // 把数据渲染到页面上
    const userList = document.getElementById('userList');
    userList.innerHTML = ''; // 清空旧内容
    users.forEach(user => {
      const li = document.createElement('li');
      li.textContent = `${user.name}，年龄 ${user.age}`;
      userList.appendChild(li);
    });
  } catch (error) {
    console.error('请求失败：', error);
  }
});

// 页面加载完自动测试 hello 接口
(async () => {
  try {
    const res = await fetch('/api/hello');
    const data = await res.json();
    document.getElementById('helloMessage').textContent = data.message;
  } catch (err) {
    console.error('hello 接口请求失败', err);
  }
})();
```

---

## 五、运行与调试（最重要的步骤）

### ✅ 正确做法：使用 HTTP 服务器
1. 在终端中确保当前目录是 `my-first-app`。
2. 输入命令：
   ```bash
   node server.js
   ```
3. 看到 `✅ 服务已启动，请在浏览器访问：http://localhost:3000` 后，打开浏览器。
4. 地址栏输入 **`http://localhost:3000`**，回车。
5. 你会看到页面，点击 “加载用户” 按钮，数据从后端接口加载并显示出来。

### ❌ 错误做法：直接双击 `index.html`
- 地址栏会是 `file:///C:/Users/.../index.html`，浏览器会因为安全策略阻止 `fetch` 请求。
- **从此请忘掉“双击 HTML 文件”这个调试习惯，永远使用 `http://localhost:xxxx`。**

### 如果端口被占用？
- 修改 `server.js` 里的 `const port = 3000` 为其他数字，比如 `3001`，再重启。

### 如何停止服务？
- 在终端按 `Ctrl + C` 即可。

---

## 六、常见疑问补充

### Q1：没有 Node.js 就真的没法开本地服务吗？
不是。如果你**只是要预览静态页面（不涉及后端接口）**，可以用：
- VS Code 的 **Live Server 插件**（右键 → Open with Live Server）。
- 或者电脑里装了 Python 的话，运行 `python -m http.server 8080`。

但如果你要写后端逻辑（如读写文件、处理数据），就必须有 **Node.js 运行时**（或换成 Python / Java 等）。  
本指南的目标就是让你拥有一个完整的后端，所以安装 Node.js 是最直接的。

### Q2：我现在就一个 HTML 文件，能不用 Node.js 调用后端吗？
不能。后端代码必须在一个运行时里执行，浏览器本身没有直接执行服务端代码的能力。  
你看到的 `http://localhost:3000/api/users` 能工作的原因，就是 Node.js 在背后处理请求。

### Q3：以后数据变多了，JSON 文件不够用怎么办？
当你需要：
- 频繁根据条件查询（如“年龄大于 25 的用户”）
- 多个表关联（如用户和订单）
- 多个人或程序同时写入

就可以引入 **SQLite**（一个文件数据库，无需安装服务端）或 MySQL。切换时只需修改后端读写逻辑，前端完全不用动。

---

## 七、下一步你可以尝试什么

1. **增加一个接口**：`POST /api/users`，允许前端提交新用户，后端写入 `users.json`。
2. **实现简单的删除/修改**：通过 ID 操作 JSON 数组。
3. **引入 SQLite**：使用 `better-sqlite3` 库，把文件操作替换为 SQL 语句。
4. **学习 RESTful API 规范**：让接口更清晰。

---

## 八、为什么要把后端文件也上传到 GitHub？

1. **保持项目完整性**：别人把你的仓库克隆下来，只需 `npm install && node server.js` 就能跑起来。如果只传前端文件，缺了 `server.js` 和 `package.json`，项目完全跑不了。
2. **版本回溯**：后端代码的修改历史同样需要记录，方便以后排查问题或回滚。
3. **方便自己多设备开发**：你在另一台电脑上 `git clone` 一下就能继续开发，不用手工补文件。

---

### ✅ 必须上传的
- `server.js`（后端主程序）
- `package.json` 和 `package-lock.json`（依赖清单，别人能据此安装一样的依赖）
- `public/` 下所有前端文件
- `data/` 下所有数据文件（如果里面是初始示例数据，可以传）
- 你自己的配置文件（比如 `.gitignore`）

### ❌ 绝对不要上传的
- **`node_modules/` 文件夹**——依赖包体积巨大，而且别人能通过 `npm install` 根据 `package.json` 精确复原。  
  做法：在项目根目录创建一个 `.gitignore` 文件，里面写一行：
  ```
  node_modules/
  ```
- 如果你后续加了真正的数据库（比如 SQLite 的 `.db` 文件），通常也会加入 `.gitignore`，除非是初始的空数据库模板。
- 任何包含**密码、API 密钥、Token** 的配置文件（如果以后用到，可以放一个 `.env.example` 作为模板，真正的 `.env` 不要传）。

---

### 给你一个实用的初始提交模板

在你的项目根目录（`my-first-app/`）下创建一个 `.gitignore` 文件，内容如下：

```
node_modules/
```

然后执行：

```bash
git init
git add .
git commit -m "初始提交：前后端一体项目，Node.js + Express"
git branch -M main
git remote add origin https://github.com/你的用户名/仓库名.git
git push -u origin main
```

完成之后，你的 GitHub 仓库里就会包含完整项目，别人 clone 后只需：

```bash
git clone 你的仓库地址
cd 仓库名
npm install
node server.js
```

就能在浏览器里 `http://localhost:3000` 看到效果了。

---

### 额外提醒：数据文件的注意事项

你现在 `data/users.json` 里可能就几条示例数据，上传完全没问题。  
但如果以后这个文件变成了**你自己的真实运行数据**（比如日记、私人笔记），就不要上传了，可以在 `.gitignore` 里再加一行 `data/`，然后单独手动备份。

**总结：整个项目文件夹（去掉 `node_modules`）都上传，这样才能保证项目在任何电脑上都能一键跑起来。**

---

## 结语

你现在已经理解了一个完整的前后端协作流程：  
**浏览器 → HTTP 请求 → Node.js 后端 → 读取文件/数据库 → 返回数据 → 浏览器更新页面**。

记住几个关键点：
- 永远通过 `http://localhost` 调试。
- 数据交给后端处理，前端只管展示和发起请求。
- JSON 文件在小项目里完全够用，不必过早引入数据库。

祝你敲码愉快！遇到问题就把错误信息复制去搜索，或者继续提问。🚀
```

**使用方法**：复制上面全部内容，在电脑上保存为 `快速上手.md`，用 VS Code 打开即可看到格式清晰的指引。