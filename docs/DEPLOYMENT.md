# 🚀 部署说明

## API Key 安全配置

本项目使用后端代理方式保护 API Key，避免在前端暴露敏感信息。

### 生产环境（Cloudflare Pages）

生产环境下，需要在 Cloudflare Pages 的环境变量中配置 API Key：

1. 登录 Cloudflare Dashboard
2. 进入你的 Pages 项目
3. 点击 **Settings** → **Environment variables**
4. 添加以下环境变量：

```
ADMIN_KEY=你的文章管理密码（建议设置复杂密码）
```

### 安全优势

✅ API Key 存储在服务器端，不会暴露给用户  
✅ 前端代码中不包含任何敏感信息  
✅ 支持环境变量配置，便于管理  
✅ 解决 CORS 跨域问题  

## 部署步骤

1. 推送代码到 Git 仓库
2. 在 Cloudflare Pages 创建项目
3. 配置环境变量（见上文）
4. 自动部署完成

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 注意事项

⚠️ 不要将 `.env` 文件提交到 Git 仓库  
⚠️ 定期更换 API Key 以提高安全性  
⚠️ 生产环境必须配置环境变量，否则会使用默认值（不安全）
