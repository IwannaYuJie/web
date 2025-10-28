# 橘猫小窝 🐱 - Java技术分享网站

这是一个使用 Vite + React + JavaScript 构建的Java技术分享网站，专注于Java核心技术、Spring框架、微服务架构等内容分享。

## 📦 项目特性

- ⚡️ **Vite** - 极速的开发体验
- ⚛️ **React 18** - 最新的 React 版本
- 🎨 **现代化 UI** - 响应式设计,支持深色模式
- 🔄 **React Router** - 前端路由管理
- 🌐 **API 集成** - 调用外部 API 获取随机名言
- 🖼️ **AI 图片生成** - 集成火山引擎 Seedream 4.0 API
- 📱 **移动端适配** - 完美支持各种屏幕尺寸

## 📁 项目结构

```
web/
├── index.html              # HTML 入口文件
├── package.json            # 项目依赖配置
├── vite.config.js          # Vite 配置文件
└── src/
    ├── main.jsx            # React 应用入口
    ├── App.jsx             # 主应用组件(路由配置)
    ├── App.css             # 应用样式
    ├── index.css           # 全局样式
    └── pages/
        ├── Home.jsx        # 首页组件
        ├── ArticleDetail.jsx  # 文章详情页组件
        └── ImageGenerator.jsx # AI 图片生成页面
```

## 🚀 本地运行

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

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

本项目使用 Cloudflare Pages Functions 解决 API 跨域问题。

#### 通过 Cloudflare Dashboard 部署

1. **登录 Cloudflare Dashboard**
   - 访问 https://dash.cloudflare.com
   - 选择 "Workers & Pages"

2. **创建新项目**
   - 点击 "Create application" → "Pages"
   - 选择 "Connect to Git"
   - 选择你的 GitHub 仓库

3. **配置构建设置**
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node version**: 18 或更高

4. **重要：Functions 配置**
   - 项目中的 `functions/` 目录会自动部署为 Cloudflare Pages Functions
   - `functions/api/generate-image.js` 会映射到 `/api/generate-image` 路由
   - 无需额外配置，Cloudflare 会自动识别

5. **环境变量（可选）**
   - 在 Settings → Environment variables 中添加
   - `ARK_API_KEY`: 你的火山引擎 API Key

6. **部署**
   - 点击 "Save and Deploy"
   - 等待构建完成

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

- **Java技术文章**: 展示12篇Java技术相关文章（Spring Boot、微服务、JVM调优等）
- **技术分类**: 支持按Java核心、Spring框架、微服务、数据库等分类筛选
- **编程名言**: 展示经典编程智慧语录
- **学习路线**: 提供Java学习路线推荐（基础、进阶、高级）
- **响应式布局**: 自适应不同屏幕尺寸

### 文章详情页

- **Java技术文章**: 包含详细的Java技术内容（代码示例、最佳实践等）
- **动态路由**: 通过 `/article/:id` 访问不同文章
- **文章分类**: 显示文章所属技术类别
- **返回首页**: 点击左上角返回链接
- **404 处理**: 访问不存在的文章 ID 会显示 404 页面

### AI 图片生成页面 🎨

- **文本生成图片**: 输入描述词，AI 自动生成图片
- **参考图片**: 可选提供参考图片 URL，生成更符合预期的图片
- **多种尺寸**: 支持 1K、2K、4K 三种分辨率
- **实时预览**: 生成后立即展示图片和详细信息
- **使用提示**: 提供使用技巧，帮助生成更好的图片
- **API 集成**: 使用火山引擎 Seedream 4.0 图片生成 API

## 🛠️ 技术栈

- **构建工具**: Vite 5.x
- **前端框架**: React 18.x
- **路由管理**: React Router 6.x
- **样式方案**: 原生 CSS (支持 CSS 变量和深色模式)
- **API 调用**: Fetch API
- **AI 服务**: 火山引擎 Seedream 4.0 图片生成 API

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

## 📄 许可证

MIT License

## 👨‍💻 作者

Doro 🐕💕

---

如有问题,欢迎提 Issue!
