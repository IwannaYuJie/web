# 橘猫小窝 - AI Coding Instructions 🐱

## 项目概述

这是一个基于 **Vite + React 18 + JavaScript** 的 Java 技术博客网站，采用橘猫主题设计。项目同时包含一个隐藏的文字冒险游戏《雨姐的心动时刻》。

**核心技术栈**: Vite 5.x, React 18, React Router 6, Cloudflare Pages Functions, Cloudflare KV

## 架构关键点

### 双环境 API 架构

项目采用**开发/生产环境隔离**的 API 设计：

- **开发环境**: `vite.config.js` 中的自定义插件提供 Mock API（见第 24-184 行）
  - Mock 文章数据存储在内存中 (`mockArticles` 变量)
  - 支持完整的 CRUD 操作（GET/POST/PUT/DELETE）
  
- **生产环境**: Cloudflare Pages Functions（`functions/api/*.js`）
  - `articles.js` - 文章 CRUD，数据持久化到 KV
  - `ai-chat.js` - 七牛云 AI 对话代理
  - `generate-image.js` - 火山引擎图片生成代理
  - `init-articles.js` - KV 数据初始化

### 数据持久化: Cloudflare KV

- **KV 绑定名称**: `ARTICLES_KV`（在 `wrangler.toml` 中配置）
- **数据键**: `articles_list` - 存储文章数组的 JSON
- **本地开发**: 使用 Vite Mock，不依赖 KV
- **生产部署**: 必须在 Cloudflare Dashboard 中配置 KV binding

### API 安全模式

**不要在前端暴露 API Key**。所有外部 API 通过 Cloudflare Functions 代理：

```javascript
// ❌ 错误：前端直接调用
fetch('https://api.example.com', { headers: { 'Authorization': API_KEY } })

// ✅ 正确：通过代理
fetch('/api/ai-chat', { method: 'POST', body: JSON.stringify(data) })
```

API Keys 存储位置：
- 开发环境：`vite.config.js` 中硬编码（仅限测试）
- 生产环境：Cloudflare Pages 环境变量 `ARK_API_KEY`, `QINIU_AI_API_KEY`

## 设计系统

### 橘猫主题配色（严格遵守）

项目使用**统一的橘色系配色**，参考 `docs/DESIGN_GUIDE.md` 和 `src/App.css`：

```css
--primary-color: #FF9F45;    /* 橘猫主色 */
--primary-hover: #FF8C1A;    /* 深橙悬停 */
--bg-color: #FFF8F0;         /* 温暖米白背景 */
--text-color: #5C4033;       /* 深棕文字 */
--gradient-warm: linear-gradient(135deg, #FFB366 0%, #FF9F45 50%, #FF8C1A 100%);
```

**关键规则**:
1. 所有新组件必须使用橘色系，禁用其他主题色（如粉色）
2. 使用 CSS 变量而非硬编码颜色值
3. 悬停效果统一使用 `--primary-hover`
4. 参考 `src/App.css` 中的 `.navbar`, `.card` 等样式

### 响应式设计标准

```css
/* 移动端优先 */
@media (max-width: 768px) { /* 手机 */ }
@media (min-width: 769px) and (max-width: 1024px) { /* 平板 */ }
@media (min-width: 1025px) { /* 桌面 */ }
```

## 开发工作流

### 本地开发

```bash
npm install        # 安装依赖
npm run dev        # 启动 Vite 开发服务器（http://localhost:5173）
npm run build      # 构建生产版本到 dist/
npm run preview    # 预览生产构建
```

### 添加新页面的步骤

1. 在 `src/pages/` 创建组件（如 `NewPage.jsx`）
2. 在 `src/App.jsx` 添加路由：`<Route path="/new" element={<NewPage />} />`
3. （可选）在导航栏 `.nav-links` 添加链接
4. 使用橘猫主题样式

### Cloudflare 部署关键配置

**必须配置**（否则功能失效）:

1. **KV Namespace Binding**（Settings → Functions → KV namespace bindings）
   - Variable name: `ARTICLES_KV`
   - 选择已创建的 KV namespace

2. **环境变量**（Settings → Environment variables）
   ```
   ARK_API_KEY=火山引擎密钥
   QINIU_AI_API_KEY=七牛云密钥
   ```

3. **构建配置**
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`

4. **初始化数据**: 部署后访问 `/api/init-articles` 写入默认文章

### Cloudflare 安全拦截问题

**问题**: 自定义域名上 `POST /api/articles/1` 返回 405 错误  
**原因**: Cloudflare 拦截带数字路径参数的 POST 请求  
**解决方案**: 使用查询参数 + Method Override Header

```javascript
// ✅ 正确写法
fetch('/api/articles?id=1', {
  method: 'POST',
  headers: { 'X-HTTP-Method-Override': 'PUT' }
})

// ❌ 错误写法
fetch('/api/articles/1', { method: 'PUT' })
```

后端需同时支持路径参数和查询参数（优先使用查询参数）。

## 项目特定约定

### 文章数据结构

```javascript
{
  id: Number,              // 唯一ID
  title: String,           // 支持 emoji (如 "☕ Spring Boot...")
  description: String,     // 简短描述
  date: String,           // YYYY-MM-DD 格式
  category: String,       // "Java核心", "Spring框架", "微服务" 等
  readTime: String        // "15 分钟"
}
```

### 游戏组件结构（隐藏功能）

- **路由**: `/secret-games` （不在导航栏显示）
- **核心组件**: `src/components/YujieGame.jsx`
- **数据文件**: `src/data/yujieGameData.js`, `src/data/yujieGameEvents.js`
- **状态管理**: 使用 `useState` 管理好感度、警觉度、物品等
- **样式**: 必须使用橘色主题（已统一调整）

### SPA 路由配置

- `_redirects` 文件确保 SPA 路由正常工作（所有路径重定向到 `index.html`）
- `_headers` 文件配置 CORS 和安全头
- 不要修改这两个文件，除非添加新的 API 路由

## 常见任务参考

### 添加新 API 端点

1. 在 `functions/api/` 创建文件（如 `my-api.js`）
2. 导出 `onRequest` 函数（Cloudflare Pages Functions 标准）
3. 处理 CORS（参考 `ai-chat.js` 第 13-23 行）
4. 本地开发需在 `vite.config.js` 添加 Mock 逻辑

### 修改文章 CRUD

- 开发环境：编辑 `vite.config.js` 中的 `mockArticles` 和中间件逻辑
- 生产环境：编辑 `functions/api/articles.js`
- 保持两者逻辑一致

### 使用外部 API

1. 创建 Cloudflare Function 作为代理（参考 `ai-chat.js`）
2. API Key 从 `context.env.YOUR_KEY` 读取
3. 设置正确的 CORS 头
4. 前端调用 `/api/your-endpoint`

## 参考文档

- 橘猫配色规范: `docs/DESIGN_GUIDE.md`
- 游戏开发文档: `docs/雨姐游戏开发文档.md`
- 部署指南: `docs/DEPLOYMENT.md`, `docs/KV_SETUP_GUIDE.md`
- 完整 README: `README.md`

## 避免的错误

❌ 在前端直接使用外部 API（暴露 Key）  
❌ 使用非橘色系配色（破坏主题一致性）  
❌ 硬编码颜色值而非 CSS 变量  
❌ 在生产环境使用路径参数进行 PUT/DELETE（被 Cloudflare 拦截）  
❌ 忘记配置 KV Binding 导致文章功能失效  
❌ 修改 `_redirects` 导致 SPA 路由失效
