# 变更日志 (Changelog)

本文档记录项目的所有重要变更和版本更新。

---

## [2025-01-15] - 🔒 重大安全更新：移除所有硬编码 API Key

### 🚨 安全修复（Critical）

#### 问题描述
在全面安全审计中发现多处硬编码的 API Key，存在严重的安全隐患：
- 七牛云 AI API Key 硬编码在 2 个文件中
- 火山引擎 API Key 硬编码在 4 个文件中
- 其中 1 处在前端代码中（最危险）

#### 影响范围
如果代码仓库为公开状态，任何人都能看到这些 API Key，可能导致：
- API 额度被盗用
- 产生意外费用
- 服务被滥用

#### 解决方案
**全面移除硬编码，采用环境变量方案**：

1. **后端 API 函数**（Cloudflare Functions）
   - ✅ `functions/api/ai-chat.js` - 移除硬编码，仅从 `context.env.QINIU_AI_API_KEY` 读取
   - ✅ `functions/api/generate-image.js` - 移除硬编码，仅从 `context.env.ARK_API_KEY` 读取
   - ✅ `api/generate-image.js` - 移除硬编码，仅从 `process.env.ARK_API_KEY` 读取
   - ✅ 添加环境变量检查，缺少时返回 500 错误和提示信息

2. **开发环境配置**（Vite）
   - ✅ `vite.config.js` - 从 `process.env` 读取，提供占位符
   - ✅ 支持通过 `.env` 文件配置本地开发 API Key

3. **前端代码**
   - ✅ `src/pages/ImageGenerator.jsx` - 移除硬编码的 API Key
   - ✅ 前端不再包含任何敏感信息

### 📝 配置变更

#### 新增文件
- **SECURITY_CHECKLIST.md** - 安全检查清单和最佳实践文档
  - 包含快速安全扫描命令
  - API Key 泄露修复步骤
  - 定期检查项目清单

#### 修改文件
- **README.md** - 添加环境变量配置说明
  - 本地开发 `.env` 配置步骤
  - Cloudflare Pages 环境变量配置说明
  - 安全提醒和注意事项

- **.env.example** - 已存在，无需修改
  - 提供环境变量模板
  - 不包含真实 API Key

- **.gitignore** - 已包含 `.env`（无需修改）
  - 确保环境变量文件不被提交

### 🔧 使用指南

#### 本地开发配置

1. 复制环境变量模板：
   ```bash
   cp .env.example .env
   ```

2. 编辑 `.env` 文件，填入真实 API Key：
   ```env
   ARK_API_KEY=你的火山引擎API密钥
   QINIU_AI_API_KEY=你的七牛云AI API密钥
   ```

3. 启动开发服务器：
   ```bash
   npm run dev
   ```

#### Cloudflare Pages 生产环境配置

1. 登录 Cloudflare Dashboard
2. 进入项目 Settings → Environment variables
3. 添加以下环境变量：
   - `ARK_API_KEY` = 火山引擎 API 密钥
   - `QINIU_AI_API_KEY` = 七牛云 AI API 密钥
4. 保存后重新部署

### ✅ 安全检查结果

- ✅ 所有硬编码 API Key 已移除
- ✅ 前端代码不包含任何敏感信息
- ✅ 后端增加环境变量校验
- ✅ `.env` 文件已在 `.gitignore` 中
- ✅ 未发现个人信息泄露（penghaoxiang、958656603 等）

### ⚠️ 重要提醒

1. **立即更换旧 API Key**（如果仓库曾公开）：
   - 登录火山引擎控制台，重置 API Key
   - 登录七牛云控制台，重置 API Key
   - 更新 Cloudflare Pages 环境变量

2. **Git 历史清理**（如果敏感信息已提交）：
   - 参考 `SECURITY_CHECKLIST.md` 中的清理步骤
   - 使用 BFG Repo-Cleaner 或 git-filter-branch

3. **设置仓库为私有**（推荐）：
   - GitHub 仓库设置 → Settings → Danger Zone → Change visibility

---

## [2025-11-12] - 修复文章管理 API 405 错误

### 🐛 Bug 修复

#### 问题描述
在自定义域名 `jumaomaomaoju.cn` 上，文章的编辑和删除功能返回 405 Method Not Allowed 错误，但创建功能正常。

#### 根本原因
Cloudflare 的安全规则会拦截带数字路径参数的 POST 请求（如 `POST /api/articles/1`），这是为了防止 CSRF 攻击等安全威胁。

#### 解决方案
采用查询参数替代路径参数的方式：

**修改前**：
- 编辑：`PUT /api/articles/1`
- 删除：`DELETE /api/articles/1`
- 问题：被 Cloudflare 拦截返回 405

**修改后**：
- 编辑：`POST /api/articles?id=1` + `X-HTTP-Method-Override: PUT`
- 删除：`POST /api/articles?id=1` + `X-HTTP-Method-Override: DELETE`
- 结果：✅ 成功绕过拦截

### 📝 技术实现

#### 前端修改 (`src/pages/ArticleManager.jsx`)
```javascript
// 编辑文章
const url = editingArticle 
  ? `/api/articles?id=${editingArticle.id}`  // 使用查询参数
  : '/api/articles'

const response = await fetch(url, {
  method: 'POST',  // 统一使用 POST
  headers: {
    'Content-Type': 'application/json',
    ...(editingArticle && { 'X-HTTP-Method-Override': 'PUT' })  // 通过头指定实际方法
  },
  body: JSON.stringify(formData)
})

// 删除文章
const response = await fetch(`/api/articles?id=${article.id}`, {
  method: 'POST',
  headers: {
    'X-HTTP-Method-Override': 'DELETE'
  }
})
```

#### 后端修改 (`functions/api/articles.js`)
```javascript
// 同时支持查询参数和路径参数，优先使用查询参数
const pathParts = url.pathname.split('/').filter(p => p)
const articleId = url.searchParams.get('id') || pathParts[2]

// 支持 X-HTTP-Method-Override 头
const methodOverride = request.headers.get('X-HTTP-Method-Override')
if (method === 'POST' && methodOverride) {
  method = methodOverride.toUpperCase()
}

// POST 请求检查，防止误匹配
case 'POST':
  if (articleId) {
    return errorResponse('POST 请求不应包含文章 ID，请使用 PUT 更新文章', 400)
  }
  const createData = await request.json()
  return await createArticle(env, createData)
```

### ✅ 验证结果

所有功能测试通过：
- ✅ GET 请求正常
- ✅ POST 创建文章正常
- ✅ POST + Override: PUT 编辑文章正常
- ✅ POST + Override: DELETE 删除文章正常

### 📚 相关文档更新

- 更新 `README.md` 常见问题章节，添加 405 错误解决方案
- 创建 `CHANGELOG.md` 记录此次重要变更

### 🎯 影响范围

- **前端**：`src/pages/ArticleManager.jsx` - 修改编辑和删除的请求方式
- **后端**：`functions/api/articles.js` - 支持查询参数和 Method Override
- **文档**：`README.md` - 添加常见问题说明

### 💡 经验总结

1. **Cloudflare 安全规则**：某些 HTTP 请求模式会被 CDN/WAF 拦截，需要采用兼容性更好的方案
2. **Method Override 模式**：是解决 HTTP 方法限制的标准做法，被广泛应用于各种框架
3. **查询参数 vs 路径参数**：在某些场景下，查询参数比路径参数更安全、更兼容
4. **向后兼容**：后端同时支持两种方式，确保平滑过渡

---

## 版本说明

- 本项目采用日期版本号格式：`YYYY-MM-DD`
- 每次重要变更都会记录在此文档中
- 遵循 [Keep a Changelog](https://keepachangelog.com/) 规范
