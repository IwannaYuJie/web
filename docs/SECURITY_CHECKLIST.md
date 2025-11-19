# 🔒 项目安全检查清单

本文档用于快速检查项目中的安全隐患，确保敏感信息不会泄露。

## ✅ 已完成的安全措施

### 1. API Key 保护
- [x] **后端 API 代理**：所有外部 API 调用通过 Cloudflare Functions 代理
- [x] **移除硬编码**：已移除所有源代码中的 API Key 硬编码
- [x] **环境变量**：API Key 仅通过环境变量读取
- [x] **前端安全**：前端代码不包含任何 API Key

### 2. 开发环境安全
- [x] **.env 文件**：已添加到 `.gitignore`，不会提交到 Git
- [x] **.env.example**：提供模板文件，不包含真实 API Key
- [x] **Vite 代理**：开发环境通过环境变量读取 API Key

### 3. 生产环境安全
- [x] **Cloudflare 环境变量**：生产 API Key 配置在 Cloudflare Dashboard
- [x] **错误处理**：缺少环境变量时返回友好错误提示
- [x] **CORS 保护**：仅允许必要的跨域请求

## 🚨 需要定期检查的项目

### 每次修改代码后检查

```bash
# 检查是否有硬编码的 API Key（应该返回 0 个匹配）
grep -r "sk-" --include="*.js" --include="*.jsx" src/ functions/ api/
grep -r "d5409697-4157-4ea2-9265" --include="*.js" --include="*.jsx" src/ functions/ api/
```

### 提交代码前检查

```bash
# 检查是否有个人信息泄露
grep -r "penghaoxiang" .
grep -r "958656603" .

# 检查 .env 文件是否在 .gitignore 中
cat .gitignore | grep ".env"

# 检查 Git 暂存区是否包含敏感文件
git status
```

## 📋 安全配置检查表

### 本地开发环境

- [ ] 已复制 `.env.example` 为 `.env`
- [ ] 已在 `.env` 中填入真实 API Key（仅本地使用）
- [ ] 确认 `.env` 在 `.gitignore` 中
- [ ] 确认 `.env` 未被 Git 跟踪（`git status` 不显示）

### Cloudflare Pages 生产环境

- [ ] 已在 Cloudflare Dashboard 配置 `ARK_API_KEY`
- [ ] 已在 Cloudflare Dashboard 配置 `QINIU_AI_API_KEY`
- [ ] 已测试 AI 功能是否正常工作
- [ ] 确认后端代码不包含硬编码 API Key

### GitHub 仓库

- [ ] 仓库设为私有（推荐）或确保代码中无敏感信息
- [ ] `.gitignore` 包含 `.env` 和 `.env.local`
- [ ] README 中不包含真实 API Key
- [ ] 所有文档中的 API Key 都是占位符

## 🛡️ 安全最佳实践

### DO（应该做的）✅

1. **使用环境变量**：所有敏感配置通过环境变量读取
2. **后端代理**：前端通过后端 API 代理访问外部服务
3. **错误处理**：缺少环境变量时返回清晰错误，不暴露内部信息
4. **分离配置**：开发环境和生产环境使用不同的配置方式
5. **定期审查**：定期检查代码中是否有新的硬编码 API Key

### DON'T（不应该做的）❌

1. **硬编码敏感信息**：永远不要在代码中硬编码 API Key
2. **前端存储密钥**：永远不要在前端代码中存储 API Key
3. **公开仓库泄密**：不要在公开仓库中提交包含 API Key 的代码
4. **日志打印密钥**：不要在日志中打印完整的 API Key
5. **共享环境变量**：不要将 `.env` 文件分享给他人

## 🔍 快速安全扫描命令

### 扫描所有可能的 API Key 硬编码

```bash
# 扫描常见的 API Key 模式
grep -rE "(sk-[a-zA-Z0-9]{40,}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})" \
  --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=dist .
```

### 扫描个人信息

```bash
# 扫描可能的个人信息（根据实际情况调整）
grep -rE "(penghaoxiang|958656603|你的姓名|你的手机号)" \
  --exclude-dir=node_modules --exclude-dir=dist .
```

## 📝 修复步骤（如果发现泄露）

### 1. 立即撤销泄露的 API Key

- 登录对应的服务商控制台（火山引擎、七牛云）
- 删除或重置泄露的 API Key
- 生成新的 API Key

### 2. 从代码中移除敏感信息

```bash
# 移除硬编码的 API Key，改为环境变量
# 参考本项目的修复示例
```

### 3. 清理 Git 历史（如果已提交）

```bash
# 警告：这会重写 Git 历史，谨慎操作！
# 使用 BFG Repo-Cleaner 或 git-filter-branch

# 方法 1: 使用 BFG（推荐）
# 下载 BFG：https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --replace-text passwords.txt
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 方法 2: 使用 git-filter-branch
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/sensitive/file" \
  --prune-empty --tag-name-filter cat -- --all
```

### 4. 强制推送（如果已推送到远程）

```bash
# 警告：这会覆盖远程仓库，团队成员需要重新克隆
git push origin --force --all
git push origin --force --tags
```

### 5. 通知团队成员

- 告知团队 API Key 已更换
- 要求团队成员更新本地 `.env` 文件
- 更新 Cloudflare Pages 环境变量

## 🎯 当前项目安全状态

### ✅ 安全措施已就位

1. **函数级 API Key 保护**：
   - `functions/api/ai-chat.js` - 仅从 `context.env.QINIU_AI_API_KEY` 读取
   - `functions/api/generate-image.js` - 仅从 `context.env.ARK_API_KEY` 读取
   - `api/generate-image.js` - 仅从 `process.env.ARK_API_KEY` 读取

2. **开发环境保护**：
   - `vite.config.js` - 从环境变量读取，提供占位符提示

3. **前端安全**：
   - `src/pages/ImageGenerator.jsx` - 不包含 API Key
   - `src/components/YujieAIGame.jsx` - 仅调用后端代理

### ⚠️ 注意事项

- 本地开发需要配置 `.env` 文件
- Cloudflare 部署需要配置环境变量
- 定期检查新增代码是否引入硬编码

---

**最后更新**: 2025年1月15日  
**检查频率**: 每次代码修改后 + 每月定期审查
