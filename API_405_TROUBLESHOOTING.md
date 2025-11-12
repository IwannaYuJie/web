# 🔧 API 405 错误排查指南

## 问题描述
在自定义域名 `jumaomaomaoju.cn` 上访问 API 时出现 405 Method Not Allowed 错误。

## 可能的原因

### 1. Cloudflare Pages 自定义域名未正确配置 Functions
自定义域名可能没有启用 Functions 支持，导致请求被当作静态文件处理。

### 2. DNS/CDN 配置问题
域名的 DNS 或 CDN 配置可能拦截了 API 请求。

### 3. _redirects 文件配置不完整
Cloudflare Pages 的重定向规则可能没有正确处理 API 路由。

## 诊断步骤

### ✅ 步骤 1: 测试 Functions 是否工作（已完成）
访问测试端点来确认 Cloudflare Functions 是否正常：

```
https://jumaomaomaoju.cn/api/test
```

**结果**：✅ **成功！** Functions 工作正常，GET 请求没有问题。

### 步骤 2: 使用测试工具诊断 POST 请求
访问测试页面：

```
https://jumaomaomaoju.cn/test-api.html
```

依次点击所有测试按钮，观察哪些请求成功，哪些失败：
1. **GET /api/test** - 应该成功 ✅
2. **POST /api/test** - 如果失败，说明 POST 被拦截 ❌
3. **POST + Method Override** - 如果失败，说明自定义头被拦截 ❌
4. **POST /api/articles** - 测试真实 API

### 步骤 2: 对比 Pages 默认域名
访问 Cloudflare Pages 提供的默认域名（通常是 `*.pages.dev`）：

```
https://[你的项目名].pages.dev/api/test
https://[你的项目名].pages.dev/api/articles
```

**如果默认域名正常**：说明问题出在自定义域名配置上

### 步骤 3: 检查 Cloudflare 安全规则（重点！）

**最可能的原因**：Cloudflare 的 WAF 或安全规则拦截了 POST 请求

1. 登录 Cloudflare Dashboard
2. 选择你的域名 `jumaomaomaoju.cn`
3. 检查以下设置：

#### A. WAF (Web Application Firewall)
- 进入 **Security** → **WAF**
- 查看 **Managed Rules** 是否有规则拦截 POST 请求
- 查看 **Custom Rules** 是否有自定义规则
- **临时解决方案**：为 `/api/*` 路径添加例外规则

#### B. Security Level
- 进入 **Security** → **Settings**
- 检查 **Security Level** 设置
- 如果设置为 "High" 或 "I'm Under Attack"，可能会拦截 POST 请求
- **建议**：设置为 "Medium" 或为 API 路径添加例外

#### C. Rate Limiting
- 进入 **Security** → **Rate Limiting Rules**
- 检查是否有规则限制了 API 请求频率

#### D. Page Rules
- 进入 **Rules** → **Page Rules**
- 检查是否有规则影响 `/api/*` 路径

## 解决方案

### 方案 A: 使用 Cloudflare Pages 默认域名（临时方案）

修改前端 API 请求，使用 Pages 默认域名：

```javascript
// 在 src/config.js 中配置
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://[你的项目名].pages.dev'
  : ''

// 使用时
fetch(`${API_BASE_URL}/api/articles`)
```

### 方案 B: 修复自定义域名配置（推荐）

#### B1. 检查 DNS 设置
确保你的域名 DNS 记录正确指向 Cloudflare Pages：

```
类型: CNAME
名称: @ 或 www
目标: [你的项目名].pages.dev
代理状态: 已代理（橙色云朵）
```

#### B2. 为 API 路径添加 WAF 例外规则（推荐！）

在 Cloudflare Dashboard 中：

1. 进入 **Security** → **WAF** → **Custom rules**
2. 点击 **Create rule**
3. 配置规则：
   - **Rule name**: `Allow API Requests`
   - **Field**: `URI Path`
   - **Operator**: `starts with`
   - **Value**: `/api/`
   - **Action**: `Skip` → 选择 `All remaining custom rules` 和 `All managed rules`
4. 点击 **Deploy**

这样可以让 `/api/*` 路径绕过所有 WAF 规则。

#### B3. 重新添加自定义域名
1. 在 Cloudflare Pages 项目中删除自定义域名
2. 等待 1-2 分钟
3. 重新添加自定义域名
4. 等待 DNS 传播（可能需要几分钟）

### 方案 C: 使用 Cloudflare Workers 作为中间层

如果自定义域名始终无法正常工作，可以创建一个 Worker 来代理请求：

```javascript
// worker.js
export default {
  async fetch(request) {
    const url = new URL(request.url)
    
    // 如果是 API 请求，转发到 Pages 默认域名
    if (url.pathname.startsWith('/api/')) {
      const targetUrl = `https://[你的项目名].pages.dev${url.pathname}${url.search}`
      return fetch(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body
      })
    }
    
    // 其他请求正常处理
    return fetch(request)
  }
}
```

### 方案 D: 使用 Vercel/Netlify 部署（替代方案）

如果 Cloudflare Pages 的自定义域名问题无法解决，可以考虑迁移到其他平台：

- **Vercel**：原生支持 Serverless Functions
- **Netlify**：原生支持 Netlify Functions

## 当前已实施的修复

✅ 后端支持 `X-HTTP-Method-Override` 头  
✅ 前端使用 POST + Override 替代 PUT/DELETE  
✅ 改进错误处理，避免 JSON 解析失败  
✅ 添加测试端点 `/api/test`

## 下一步行动

1. **立即测试**：访问 `https://jumaomaomaoju.cn/api/test`
2. **对比测试**：访问 Pages 默认域名的相同端点
3. **根据结果选择方案**：
   - 如果测试端点正常 → 问题已解决
   - 如果测试端点失败但默认域名正常 → 使用方案 B 修复自定义域名
   - 如果都失败 → 检查 Functions 部署

## 联系支持

如果以上方案都无法解决问题，建议：
1. 联系 Cloudflare 支持团队
2. 提供详细的错误日志和配置截图
3. 说明已尝试的解决方案

---

**创建时间**: 2025-11-12  
**最后更新**: 2025-11-12
