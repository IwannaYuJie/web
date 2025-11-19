# Cloudflare KV 配置指南 🗄️

本项目使用 Cloudflare KV 存储文章数据。按照以下步骤配置 KV 命名空间。

## 📋 配置步骤

### 1️⃣ 创建 KV 命名空间

在 Cloudflare Dashboard 中创建 KV 命名空间：

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 选择你的账户
3. 进入 **Workers & Pages** → **KV**
4. 点击 **Create a namespace**
5. 输入命名空间名称：`ARTICLES_KV`（或其他你喜欢的名称）
6. 点击 **Add**
7. 记录下生成的 **Namespace ID**（类似 `abc123def456...`）

### 2️⃣ 绑定 KV 到 Pages 项目

#### 方法一：通过 Cloudflare Dashboard 绑定（推荐）

1. 进入 **Workers & Pages**
2. 选择你的 Pages 项目
3. 进入 **Settings** → **Functions**
4. 找到 **KV namespace bindings** 部分
5. 点击 **Add binding**
6. 填写以下信息：
   - **Variable name**: `ARTICLES_KV`（必须与代码中一致）
   - **KV namespace**: 选择刚才创建的命名空间
7. 点击 **Save**

#### 方法二：通过 wrangler.toml 配置（本地开发）

编辑项目根目录的 `wrangler.toml` 文件：

```toml
[[kv_namespaces]]
binding = "ARTICLES_KV"
id = "YOUR_KV_NAMESPACE_ID"  # 替换为你的 KV 命名空间 ID
```

### 3️⃣ 初始化文章数据

部署项目后，访问以下 URL 初始化默认文章数据：

```
https://your-project.pages.dev/api/init-articles
```

或使用 POST 请求强制重新初始化：

```bash
curl -X POST https://your-project.pages.dev/api/init-articles
```

成功后会返回：

```json
{
  "success": true,
  "message": "文章数据初始化成功！",
  "count": 12,
  "articles": [...]
}
```

## 🔌 API 端点说明

项目提供以下 API 端点：

### 获取所有文章
```
GET /api/articles
```

### 获取单篇文章
```
GET /api/articles/:id
```

### 创建新文章
```
POST /api/articles
Content-Type: application/json

{
  "title": "文章标题",
  "description": "文章描述",
  "category": "Java核心",
  "readTime": "15 分钟",
  "date": "2025-01-27"
}
```

### 更新文章
```
PUT /api/articles/:id
Content-Type: application/json

{
  "title": "更新后的标题",
  "description": "更新后的描述",
  ...
}
```

### 删除文章
```
DELETE /api/articles/:id
```

### 初始化文章数据
```
POST /api/init-articles
```

## 🎯 使用文章管理页面

访问 `/admin/articles` 路径即可进入文章管理页面，支持：

- ➕ **新增文章**：填写表单创建新文章
- ✏️ **编辑文章**：修改现有文章内容
- 🗑️ **删除文章**：删除不需要的文章
- 🔄 **刷新列表**：重新加载文章列表

## 🛠️ 本地开发

### 使用 Wrangler 本地开发

1. 安装 Wrangler CLI：
```bash
npm install -g wrangler
```

2. 登录 Cloudflare：
```bash
wrangler login
```

3. 创建本地 KV 命名空间（用于测试）：
```bash
wrangler kv:namespace create "ARTICLES_KV"
```

4. 更新 `wrangler.toml` 中的 KV ID

5. 启动本地开发服务器：
```bash
npm run dev
```

### 使用 Cloudflare Pages 本地开发

```bash
npx wrangler pages dev dist --kv ARTICLES_KV
```

## 📊 KV 数据结构

文章数据以 JSON 数组形式存储在 KV 中：

**Key**: `articles_list`

**Value**:
```json
[
  {
    "id": 1,
    "title": "☕ Spring Boot 3.0 新特性深度解析",
    "description": "探索Spring Boot最新版本的革命性改进...",
    "date": "2025-01-27",
    "category": "Spring框架",
    "readTime": "15 分钟"
  },
  ...
]
```

## ⚠️ 注意事项

1. **KV 绑定名称**：代码中使用的绑定名称是 `ARTICLES_KV`，必须与 Cloudflare Dashboard 中配置的一致
2. **数据持久化**：KV 数据是持久化的，删除后无法恢复，请谨慎操作
3. **初始化数据**：首次部署后必须访问 `/api/init-articles` 初始化数据
4. **访问限制**：建议为文章管理页面添加身份验证（当前未实现）

## 🔐 安全建议

生产环境建议添加以下安全措施：

1. **身份验证**：为文章管理 API 添加 JWT 或其他认证机制
2. **权限控制**：限制只有管理员才能访问 `/admin/articles` 页面
3. **CORS 配置**：根据实际需求调整 CORS 策略
4. **输入验证**：加强表单输入验证，防止 XSS 攻击

## 📚 相关文档

- [Cloudflare KV 官方文档](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [Cloudflare Pages Functions 文档](https://developers.cloudflare.com/pages/platform/functions/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)

---

如有问题，欢迎提 Issue！🐱💕
