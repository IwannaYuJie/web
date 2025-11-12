# 变更日志 (Changelog)

本文档记录项目的所有重要变更和版本更新。

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
