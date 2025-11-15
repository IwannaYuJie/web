# Worker 反向代理安全加固指南 🔒

## 概述
本文档说明如何保护 Cloudflare Worker 反向代理，防止原站域名泄露。

---

## ✅ 已实施的安全措施

### 1. **Source Map 禁用**（关键！）
**位置**: `vite.config.js`

```javascript
build: {
  sourcemap: false,        // 🔒 禁用 Source Map
  minify: 'terser',        // 深度混淆
  terserOptions: {
    compress: {
      drop_console: true,   // 移除 console.log
      drop_debugger: true,  // 移除 debugger
    },
    format: {
      comments: false,      // 移除所有注释
    },
  },
}
```

**风险**: 如果启用 Source Map，攻击者可直接查看源代码，包括：
- 文件路径
- 变量名
- 注释（可能含敏感信息）
- 硬编码的配置

---

### 2. **响应头清理**（防指纹识别）
**位置**: `workers/game-proxy.js`

移除了以下可能暴露源站的响应头：
```javascript
const headersToRemove = [
  'x-powered-by',           // 服务器软件版本
  'server',                 // 服务器类型
  'x-vercel-id',            // Vercel 部署 ID
  'x-cloudflare-request-id',// CF 请求 ID
  'x-amz-cf-id',            // AWS CloudFront ID
  'via',                    // 代理链信息
  'cf-ray',                 // Cloudflare Ray ID
  // ... 等 13 个头部
];
```

**新增安全头部**:
```javascript
'x-content-type-options': 'nosniff'     // 防止 MIME 嗅探
'x-frame-options': 'DENY'               // 防止点击劫持
'referrer-policy': 'no-referrer'        // 🔒 防止 Referer 泄露！
'content-security-policy': '...'        // 内容安全策略
```

---

### 3. **CSP（内容安全策略）**
限制浏览器只能加载当前域名的资源：

```javascript
content-security-policy: 
  "default-src 'self'; " +
  "connect-src 'self'; " +  // 🔒 禁止连接外部 API
  "object-src 'none'; " +
  "base-uri 'self'"
```

**作用**: 即使攻击者注入脚本，也无法连接到外部服务器获取数据。

---

### 4. **错误处理**
所有异常都被捕获，返回通用错误信息：

```javascript
try {
  // ... 代理逻辑
} catch (error) {
  return new Response(JSON.stringify({ 
    error: 'Service temporarily unavailable'  // 🔒 不暴露具体错误
  }), { status: 503 });
}
```

**防止泄露**: 原站的 500 错误不会传递给用户。

---

## ⚠️ 仍存在的理论风险

### 1. **时序攻击** ⏱️
**方法**: 测量响应时间推测服务器位置  
**风险等级**: 🟡 低  
**缓解措施**: 
- Cloudflare 的边缘缓存已经混淆了实际延迟
- 建议启用 Argo Smart Routing（付费功能）

### 2. **TLS 指纹识别** 🔍
**方法**: 分析 SSL/TLS 握手特征  
**风险等级**: 🟡 低  
**缓解措施**: 
- Worker 使用 Cloudflare 的 TLS 证书，不会暴露原站
- 原站建议使用 Cloudflare 的 Full (Strict) SSL 模式

### 3. **侧信道攻击** 📊
**方法**: 通过资源加载顺序、大小推测源站架构  
**风险等级**: 🟢 极低  
**缓解措施**: 
- 已启用深度混淆（Terser）
- 文件名已哈希化（Vite 默认行为）

### 4. **社会工程学** 👤
**方法**: 通过 WHOIS、DNS 记录查询域名  
**风险等级**: 🔴 中（需人工防范）  
**缓解措施**: 
- 使用隐私保护 WHOIS（推荐 Cloudflare Registrar）
- 不在公开场合提及原站域名
- DNS 记录设置为 Proxied（橙色云朵）

---

## 🛡️ 额外建议

### 1. 定期检查构建产物
```bash
# 生产构建后检查
npm run build

# 确认没有 .map 文件
ls dist/assets/*.map  # 应该没有输出

# 检查 JS 文件是否已混淆
cat dist/assets/index-*.js  # 应该难以阅读
```

### 2. 内容安全扫描
使用在线工具检查：
- **SecurityHeaders.com** - 检查 HTTP 头安全性
- **SSL Labs** - 检查 TLS 配置
- **Mozilla Observatory** - 综合安全评分

### 3. 监控异常流量
在 Cloudflare Dashboard 查看：
- Worker 的请求来源国家
- 异常高频请求（可能是扫描器）
- 403/503 错误率（CSP 拦截）

### 4. 限速保护
在 `game-proxy.js` 添加（可选）：
```javascript
// 使用 KV 存储 IP 访问记录
const rateLimitKey = `ratelimit:${clientIP}`;
const requests = await env.RATE_LIMIT_KV.get(rateLimitKey);
if (parseInt(requests) > 100) {  // 每分钟 100 次
  return new Response('Too many requests', { status: 429 });
}
```

---

## 📋 部署检查清单

部署前确认：
- [ ] `vite.config.js` 已设置 `sourcemap: false`
- [ ] 运行 `npm run build` 无警告
- [ ] `dist/assets/` 中无 `.map` 文件
- [ ] Worker 代码已更新到最新版本
- [ ] 在 Cloudflare Dashboard 测试访问
- [ ] 使用开发者工具检查响应头（无敏感信息）
- [ ] 使用 SecurityHeaders.com 扫描域名

---

## 🔄 维护规范

### 每次代码更新后：
1. 重新检查是否有硬编码域名
   ```bash
   grep -r "jumaomaomaoju.cn" src/
   ```

2. 确认 Source Map 仍然禁用
   ```bash
   grep "sourcemap" vite.config.js
   ```

3. 测试错误页面
   ```bash
   # 访问不存在的路径，检查是否泄露信息
   curl https://your-worker-domain.com/nonexistent
   ```

---

## 🆘 应急响应

如果怀疑域名已泄露：

1. **立即行动**:
   - 更换原站域名（迁移到新域名）
   - 在旧域名设置 301 重定向到新域名
   - 更新 Worker 中的 `TARGET_DOMAIN`

2. **长期方案**:
   - 使用 Cloudflare Tunnel（零信任架构）
   - 原站完全隐藏，不分配公网 IP
   - 所有流量通过 Cloudflare 加密隧道

---

## 📚 参考资料

- [Cloudflare Workers Security Best Practices](https://developers.cloudflare.com/workers/learning/security-model/)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [CSP Evaluator (Google)](https://csp-evaluator.withgoogle.com/)

---

**最后更新**: 2025-11-15  
**维护者**: Doro 🐕
