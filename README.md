# 橘猫小窝 🐱 - Java技术分享网站

这是一个使用 Vite + React + JavaScript 构建的Java技术分享网站，专注于Java核心技术、Spring框架、微服务架构等内容分享。

## 📦 项目特性

- ⚡️ **Vite** - 极速的开发体验
- ⚛️ **React 18** - 最新的 React 版本
- 🎨 **现代化 UI** - 响应式设计,支持深色模式
- 🔄 **React Router** - 前端路由管理
- 🌐 **API 集成** - 调用外部 API 获取随机名言
- 🎮 **游戏中心** - 内置趣味小游戏集合
- 📱 **移动端适配** - 完美支持各种屏幕尺寸
- 🗄️ **Cloudflare KV 存储** - 文章数据持久化存储
- 📝 **文章管理系统** - 完整的增删改查功能

## 📁 项目结构

```
web/
├── index.html              # HTML 入口文件
├── package.json            # 项目依赖配置
├── vite.config.js          # Vite 配置文件
├── wrangler.toml           # Cloudflare Workers/Pages 配置
├── functions/              # Cloudflare Pages Functions (API)
│   └── api/
│       ├── articles.js     # 文章 CRUD API
│       ├── init-articles.js # 文章数据初始化 API
│       ├── ai-chat.js      # AI 对话 API
│       └── generate-image.js # AI 图片生成 API
└── src/
    ├── main.jsx            # React 应用入口
    ├── App.jsx             # 主应用组件(路由配置)
    ├── App.css             # 应用样式
    ├── index.css           # 全局样式
    └── pages/
        ├── Home.jsx        # 首页组件
        ├── ArticleDetail.jsx  # 文章详情页组件
        ├── ArticleManager.jsx # 文章管理页面
        ├── GameHub.jsx     # 游戏中心页面
        └── AIChat.jsx      # AI 对话页面
```

## 🚀 本地运行

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量（可选，用于 AI 功能）

如果你需要使用 AI 对话或图片生成功能，需要配置 API Key：

```bash
# 复制环境变量模板文件
cp .env.example .env

# 编辑 .env 文件，填入你的 API Key
# ARK_API_KEY=你的火山引擎API密钥
# QINIU_AI_API_KEY=你的七牛云AI API密钥
```

**⚠️ 安全提醒**：
- `.env` 文件已添加到 `.gitignore`，不会被提交到 Git
- 请勿在任何公开场合分享你的 API Key
- 生产环境请使用 Cloudflare Pages 环境变量，不要硬编码在代码中

### 3. 启动开发服务器

```bash
npm run dev
```

启动后,在浏览器中打开 `http://localhost:5173` 即可查看项目。

### 3. 构建生产版本

```bash
npm run build
```

构建产物会输出到 `dist` 目录。

### 4. 预览生产版本

```bash
npm run preview
```

## 🌐 部署

### 部署到 Vercel（推荐）

本项目使用 Serverless 函数解决 API 跨域问题，推荐部署到 Vercel。

1. **连接 GitHub 仓库**
   - 访问 https://vercel.com
   - 点击 "Import Project"
   - 选择你的 GitHub 仓库

2. **配置构建设置**
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. **配置环境变量（可选）**
   - 添加 `ARK_API_KEY` 环境变量
   - 值为你的火山引擎 API Key

4. **部署**
   - 点击 "Deploy"
   - 等待构建完成

### 部署到 Cloudflare Pages

本项目使用 Cloudflare Pages Functions 和 KV 存储。

#### 通过 Cloudflare Dashboard 部署

1. **登录 Cloudflare Dashboard**
   - 访问 https://dash.cloudflare.com
   - 选择 "Workers & Pages"

2. **创建 KV 命名空间（重要！）**
   - 进入 "KV" 选项卡
   - 点击 "Create a namespace"
   - 命名为 `ARTICLES_KV`
   - 记录下生成的 Namespace ID

3. **创建新项目**
   - 点击 "Create application" → "Pages"
   - 选择 "Connect to Git"
   - 选择你的 GitHub 仓库

4. **配置构建设置**
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node version**: 18 或更高

5. **重要：配置 KV 绑定**
   - 部署完成后，进入项目 Settings → Functions
   - 找到 "KV namespace bindings"
   - 点击 "Add binding"
   - **Variable name**: `ARTICLES_KV`
   - **KV namespace**: 选择刚才创建的命名空间
   - 点击 "Save"

6. **Functions 配置**
   - 项目中的 `functions/` 目录会自动部署为 Cloudflare Pages Functions
   - `functions/api/articles.js` 会映射到 `/api/articles` 路由
   - 无需额外配置，Cloudflare 会自动识别

7. **环境变量（重要！必须配置才能使用 AI 功能）**
   - 在 Settings → Environment variables 中添加：
   - `ARK_API_KEY`: 你的火山引擎 API Key（用于图片生成）
   - `QINIU_AI_API_KEY`: 你的七牛云 AI API Key（用于 AI 对话）
   - **⚠️ 注意**：必须配置这两个环境变量，否则 AI 功能会返回 500 错误

8. **部署**
   - 点击 "Save and Deploy"
   - 等待构建完成

9. **初始化文章数据**
   - 部署成功后，访问 `https://your-project.pages.dev/api/init-articles`
   - 这会将默认文章数据写入 KV 存储

#### 文件说明

- `functions/api/generate-image.js` - Cloudflare Pages Function（API 代理）
- `_headers` - 自定义响应头配置（CORS）
- `_redirects` - 重定向规则（SPA 路由支持）

### 方法二:使用 Wrangler CLI

1. **安装 Wrangler**
   ```bash
   npm install -g wrangler
   ```

2. **登录 Cloudflare**
   ```bash
   wrangler login
   ```

3. **构建项目**
   ```bash
   npm run build
   ```

4. **部署到 Pages**
   ```bash
   wrangler pages deploy dist --project-name=your-project-name
   ```

### 方法三:通过 Git 自动部署

1. **将代码推送到 GitHub/GitLab**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **在 Cloudflare Pages 中连接仓库**
   - 选择你的 Git 仓库
   - 配置构建设置(同方法一)
   - 每次推送代码都会自动触发部署

## 🎯 功能说明

### 首页功能

- **Java技术文章**: 从 Cloudflare KV 动态加载文章列表
- **技术分类**: 支持按Java核心、Spring框架、微服务、数据库等分类筛选
- **编程名言**: 展示经典编程智慧语录
- **学习路线**: 提供Java学习路线推荐（基础、进阶、高级）
- **响应式布局**: 自适应不同屏幕尺寸

### 文章管理功能 📝

访问 `/admin/articles` 进入文章管理页面：

- **新增文章**: 填写表单创建新文章，支持自定义标题、描述、分类、阅读时长等
- **编辑文章**: 修改现有文章的所有信息
- **删除文章**: 删除不需要的文章（需确认）
- **实时预览**: 表格形式展示所有文章，支持响应式布局
- **数据持久化**: 所有操作实时同步到 Cloudflare KV 存储

### 文章详情页

- **Java技术文章**: 包含详细的Java技术内容（代码示例、最佳实践等）
- **动态路由**: 通过 `/article/:id` 访问不同文章
- **文章分类**: 显示文章所属技术类别
- **返回首页**: 点击左上角返回链接
- **404 处理**: 访问不存在的文章 ID 会显示 404 页面

### 游戏中心 🎮

访问 `/games` 进入游戏中心：

- **多游戏集合**: 以卡片形式展示多个可用小游戏
- **内置游戏**: 雨姐的心动时刻、AI攻略雨姐、贪吃蛇、俄罗斯方块、2048、扫雷、记忆翻牌、打砖块
- **可扩展**: 支持在 `GameHub.jsx` 的 `games` 数组中添加新游戏

## 🛠️ 技术栈

- **构建工具**: Vite 5.x
- **前端框架**: React 18.x
- **路由管理**: React Router 6.x
- **样式方案**: 原生 CSS (支持 CSS 变量和深色模式)
- **API 调用**: Fetch API
- **AI 服务**: 七牛云 AI 对话 API

## 📚 文章列表

目前网站包含以下高质量Java技术文章：

1. **Spring Boot 3.0 新特性深度解析** - GraalVM原生镜像支持、观测性增强
2. **Java 21虚拟线程实战指南** - Project Loom的革命性改进
3. **微服务架构：Spring Cloud Gateway网关设计** - 路由、过滤、限流
4. **MySQL索引优化实战技巧** - B+树原理、索引策略
5. **Spring Security 6.0 JWT认证完整实现** - 无状态认证授权
6. **JVM调优实战：从理论到实践** - GC调优、内存模型
7. **Redis分布式锁的正确实现方式** - Redisson高可用方案
8. **Docker容器化Spring Boot应用最佳实践** - 云原生Java应用
9. **RabbitMQ消息队列高级特性详解** - 死信队列、延迟队列
10. **DDD领域驱动设计在Java项目中的落地** - 构建高内聚低耦合系统
11. **Elasticsearch全文搜索引擎实战** - 分词、高亮、聚合分析
12. **MyBatis-Plus高级用法与性能优化** - 动态SQL、分页插件

## 📝 开发建议

### 添加新页面

1. 在 `src/pages/` 目录下创建新组件
2. 在 `src/App.jsx` 中添加路由配置

### 修改样式

- 全局样式: 编辑 `src/index.css`
- 组件样式: 编辑 `src/App.css`
- 使用 CSS 变量实现主题定制

### 集成更多 API

参考 `Home.jsx` 中的 `fetchRandomQuote` 函数,使用 `fetch` 调用其他 API。

### Cloudflare KV 配置

详细的 KV 配置步骤请参考：[docs/KV_SETUP_GUIDE.md](docs/KV_SETUP_GUIDE.md)

包含以下内容：
- 创建 KV 命名空间
- 绑定 KV 到 Pages 项目
- 初始化文章数据
- API 端点说明
- 本地开发配置
- 安全建议

## 🐛 常见问题

### 端口被占用

如果 5173 端口被占用,Vite 会自动使用下一个可用端口。

### 构建失败

确保 Node.js 版本 >= 14.18.0,推荐使用 18.x 或更高版本。

### 路由 404 问题

在 Cloudflare Pages 部署后,如果刷新页面出现 404,需要配置重定向规则:

在项目根目录创建 `public/_redirects` 文件:
```
/* /index.html 200
```

### 文章编辑/删除 405 错误

**问题描述**：在自定义域名上，文章的编辑和删除功能返回 405 Method Not Allowed 错误。

**原因分析**：
- Cloudflare 的安全规则会拦截 `POST /api/articles/1` 这种带数字路径参数的 POST 请求
- 这是为了防止 CSRF 攻击等安全威胁

**解决方案**：
本项目已采用查询参数替代路径参数的方式：
- ❌ 旧方式：`POST /api/articles/1`
- ✅ 新方式：`POST /api/articles?id=1`

配合 `X-HTTP-Method-Override` 头实现 PUT/DELETE 操作：
- 编辑：`POST /api/articles?id=1` + `X-HTTP-Method-Override: PUT`
- 删除：`POST /api/articles?id=1` + `X-HTTP-Method-Override: DELETE`

**技术细节**：
- 前端使用查询参数传递文章 ID
- 后端同时支持查询参数和路径参数（优先使用查询参数）
- 通过 Method Override 头将 POST 请求转换为实际的 PUT/DELETE 操作

此方案既解决了 Cloudflare 拦截问题，又保持了 RESTful API 的语义。

## 🎨 配色方案

本项目采用统一的橘色主题配色，温暖可爱的橘猫风格：

### 主色调
- **主色**: `#FF9F45` - 温暖的橙色
- **辅助色**: `#FFB366` - 浅橙色
- **强调色**: `#FF8C1A` - 深橙色
- **奶油橙**: `#FFC999` - 柔和的奶油橙

### 渐变效果
- **温暖渐变**: `linear-gradient(135deg, #FFB366 0%, #FF9F45 50%, #FF8C1A 100%)`
- **柔和渐变**: `linear-gradient(135deg, #FFF8F0 0%, #FFE6CC 100%)`

### 背景与文字
- **背景色**: `#FFF8F0` - 温暖的米白色
- **文字色**: `#5C4033` - 深棕色
- **次要文字**: `#8B6F47` - 浅棕色

### 变更记录
- **2026-03-13**: 移除 GameHub 首屏上方的 Hero 介绍区域（包含小游戏中心标题、橘猫游乐场标签及背景插图），精简页面头部视觉表现。
- **2026-03-13**: 重构优化 GameHub 首屏头图排版，调整精选游戏浮动标签（Orbit）的数量与布局位置，修复小屏重叠问题，并新增呼吸悬停效果
- **2026-03-13**: 优化所有小游戏（Breakout、MemoryCard、Game2048、SnakeGame、TetrisGame、Minesweeper）的模块样式，移除原本的硬编码颜色并统一使用橘猫主题 CSS 变量（如 `var(--primary-color)` 等），统一按钮圆角和阴影特效，保证与应用首页风格高度一致
- **2026-03-12**: 新增2048(`Game2048`)、扫雷(`Minesweeper`)、记忆翻牌(`MemoryCard`)、打砖块(`Breakout`)四个经典小游戏
- **2026-03-12**: 新增贪吃蛇(`SnakeGame`)和俄罗斯方块(`TetrisGame`)经典小游戏组件，替换游戏中心原有的"敬请期待"占位卡片
- **2026-03-12**: 删除 Seedream 实验室页面及相关组件/服务/工具函数；删除 AI 画板页面及相关服务；将游戏中心从隐藏页面(`/secret-games`)移至顶部导航(`/games`)；移除 `@fal-ai/client` 依赖
- **2025-01-12**: 统一首页配色，将游戏相关组件从粉色系改为橘色系，保持整体风格一致性

## 📄 许可证

MIT License

## 👨‍💻 作者

Doro 🐕💕

---

如有问题,欢迎提 Issue!
