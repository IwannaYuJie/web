# 🎮 游戏合集反向代理 - Cloudflare Worker 部署指南

## 📋 方案概述

使用 **Cloudflare Worker 反向代理**,让游戏合集页面通过完全不同的域名访问,隐藏主站域名。

**访问效果**:
```
用户访问: https://game.your-domain.com
实际访问: https://main-site.pages.dev/secret-games (对用户完全透明)
```

**优势**:
- ✅ **完全免费** (每天 10 万次请求)
- ✅ **隐藏主站域名** (别人看不到原站地址)
- ✅ **独立访问入口** (游戏页面看起来是独立网站)
- ✅ **自动资源重写** (JS/CSS/图片等自动加载)

---

## 🚀 部署步骤

### 第 1 步: 修改配置

编辑 `workers/game-proxy.js` 第 22 行,修改为你的主站域名:

```javascript
const TARGET_DOMAIN = 'your-main-site.pages.dev'; // 改成你的实际域名
```

**示例**:
- 如果主站是 `my-blog.pages.dev`,填 `my-blog.pages.dev`
- 如果主站是自定义域名 `blog.com`,填 `blog.com`

---

### 第 2 步: 安装 Wrangler CLI

在项目根目录运行:

```bash
npm install -g wrangler
```

验证安装:
```bash
wrangler --version
```

---

### 第 3 步: 登录 Cloudflare

```bash
wrangler login
```

会自动打开浏览器,登录你的 Cloudflare 账号并授权。

---

### 第 4 步: 部署 Worker

在项目根目录运行:

```bash
cd workers
wrangler deploy
```

**输出示例**:
```
✅ Successfully published your Worker
🌍 https://game-proxy.your-account.workers.dev
```

记下这个 `workers.dev` 地址,这是临时测试地址。

---

### 第 5 步: 测试代理

访问 `https://game-proxy.your-account.workers.dev`,应该能看到游戏合集页面。

**检查要点**:
- [x] 页面正常显示
- [x] 游戏卡片可以点击
- [x] 浏览器地址栏显示 `workers.dev` 域名(不是主站域名)
- [x] 控制台没有资源加载错误

---

### 第 6 步: 绑定自定义域名 (推荐)

`workers.dev` 域名不太好看,建议绑定自定义域名。

#### 6.1 添加域名到 Cloudflare

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 点击 **Add a Site**
3. 输入你的域名(如 `your-domain.com`)
4. 选择 **Free** 计划
5. 按提示修改域名 NS 服务器

#### 6.2 绑定子域名到 Worker

1. 进入 **Workers & Pages** 页面
2. 点击 `game-proxy` Worker
3. 点击 **Settings** → **Triggers** → **Custom Domains**
4. 点击 **Add Custom Domain**
5. 输入子域名,如 `game.your-domain.com`
6. 点击 **Add Custom Domain**

**等待生效** (通常 1-5 分钟):
```
✅ game.your-domain.com → game-proxy Worker
```

---

### 第 7 步: 最终测试

访问 `https://game.your-domain.com`,验证:

- [x] 游戏页面正常显示
- [x] 地址栏显示 `game.your-domain.com`(没有主站域名)
- [x] 点击游戏可以正常进入
- [x] 所有资源(图片/JS/CSS)正常加载

---

## 🔧 高级配置

### 1️⃣ 启用缓存 (提升速度)

修改 `workers/game-proxy.js`,在 `fetch()` 函数中添加:

```javascript
// 在第 48 行后添加
const cache = caches.default;
const cacheKey = new Request(targetUrl, request);
let cachedResponse = await cache.match(cacheKey);

if (cachedResponse) {
  console.log('[Cache] Hit:', targetUrl);
  return cachedResponse;
}

// ...原有代码...

// 在返回前添加缓存
if (response.ok) {
  await cache.put(cacheKey, response.clone());
}
```

### 2️⃣ 自定义 404 页面

在 `workers/game-proxy.js` 中添加:

```javascript
if (response.status === 404) {
  return new Response('🎮 游戏不存在', {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
```

### 3️⃣ 添加访问日志

Cloudflare Dashboard → Workers → game-proxy → **Logs** 可查看实时日志。

---

## 💰 费用说明

Cloudflare Workers **完全免费**,限额:

| 项目 | 免费额度 |
|------|---------|
| 每日请求 | 100,000 次 |
| CPU 时间 | 10ms/请求 |
| 自定义域名 | 无限制 |

**超出免费额度**: 
- 付费计划 $5/月,1000 万次请求

对于个人项目,免费额度完全够用! 🎉

---

## 🛠️ 常见问题

### Q1: 资源加载失败?

**原因**: 路径重写不正确。

**解决**: 检查 `game-proxy.js` 第 73-76 行,确保路径替换正确:

```javascript
html = html.replace(/\/secret-games\//g, '/');
```

### Q2: 样式丢失?

**原因**: CSS 文件路径错误。

**解决**: 在浏览器按 F12,查看 Network 面板,找到加载失败的资源,调整路径重写规则。

### Q3: Worker 部署失败?

**原因**: wrangler.toml 配置错误。

**解决**: 
1. 确保 `workers/wrangler.toml` 存在
2. 运行 `wrangler whoami` 检查登录状态
3. 重新运行 `wrangler deploy`

### Q4: 自定义域名不生效?

**原因**: DNS 未生效。

**解决**:
1. 检查域名 NS 服务器是否已更新到 Cloudflare
2. 等待 DNS 传播 (最多 24 小时)
3. 用 `nslookup game.your-domain.com` 检查解析

---

## 📝 更新 Worker

修改 `workers/game-proxy.js` 后,重新部署:

```bash
cd workers
wrangler deploy
```

**自动生效**,无需等待! ⚡

---

## 🔒 安全建议

1. **不要在 Worker 中硬编码敏感信息** (如 API Key)
2. **使用环境变量**: 在 Dashboard → Workers → game-proxy → **Settings** → **Variables**
3. **启用速率限制**: Cloudflare Dashboard → Security → WAF → **Rate Limiting Rules**

---

## 📚 参考资料

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [反向代理最佳实践](https://developers.cloudflare.com/workers/examples/respond-with-another-site/)

---

## ✅ 部署检查清单

- [ ] 修改 `TARGET_DOMAIN` 为实际主站域名
- [ ] 安装并登录 Wrangler CLI
- [ ] 运行 `wrangler deploy` 部署 Worker
- [ ] 测试 `workers.dev` 临时域名
- [ ] (可选) 绑定自定义域名
- [ ] 验证游戏页面完全正常
- [ ] 确认主站域名完全隐藏

🎉 **完成后,你就有了一个完全独立的游戏访问入口!**
