# 部署说明

## 当前生产架构

- 正式域名：`https://jumaomaomaoju.cn`
- 运行主机：甲骨文 VPS `168.110.59.224`
- Cloudflare：负责权威 DNS、代理和缓存，不再承载站点运行时与文章数据
- 静态站点：Caddy 从 `/opt/orange-cat-blog/current/dist` 提供
- 文章 API：`orange-cat-blog.service`，仅监听 `127.0.0.1:8361`
- 文章数据：`/var/lib/orange-cat-blog/articles.json`
- 回滚站点：`https://web-b0b.pages.dev`

## 管理密钥

管理员密钥只保存在服务器的 `/etc/orange-cat-blog-admin-key`，权限为仅服务用户可读。仓库、构建产物、日志和文档都不保存真实密钥。

本地开发可复制 `.env.example` 为 `.env`，使用 `DEV_ADMIN_KEY` 配合 Vite mock。直接运行 VPS API 时使用：

```text
ADMIN_KEY=本地测试密钥
ARTICLES_DATA_FILE=./data/articles.json
API_HOST=127.0.0.1
API_PORT=8361
```

## 发布流程

1. 运行 `npm run lint`、`npm test`、`npm run typecheck`、`npm run build`。
2. 上传新 release 到 `/opt/orange-cat-blog/releases/<timestamp>`。
3. 不用构建产物覆盖 `/var/lib/orange-cat-blog/articles.json`。
4. 将 `/opt/orange-cat-blog/current` 原子切换到新 release。
5. 重启 `orange-cat-blog.service`，验证并重载 Caddy。
6. 检查 `/healthz`、`/api/articles`、首页、文章详情、管理后台和所有深层路由。

服务器配置模板位于：

- `deploy/orange-cat-blog.service`
- `deploy/orange-cat-blog-backup.service`
- `deploy/orange-cat-blog-backup.timer`
- `deploy/backup-articles.sh`
- `deploy/Caddyfile`

## 数据保护

- 每次写入使用临时文件加原子替换，并保留 `articles.json.previous`。
- `orange-cat-blog-backup.timer` 每日将快照写入 `/var/backups/orange-cat-blog/`。
- 发布只切换应用 release，文章数据与应用目录分离。
- `/api/init-articles` 不在 VPS 暴露，避免未授权覆盖数据。

## 回滚

- 应用：把 `/opt/orange-cat-blog/current` 指回上一个 release，重启 API 并重载 Caddy。
- 数据：先停止写入，再从 `articles.json.previous` 或每日备份恢复。
- 域名：将 Cloudflare Pages 自定义域名重新绑定到 `web` 项目；观察期内保留 Pages 与 KV。

更完整的迁移记录、路径和验收结果见 [ORACLE_MIGRATION.md](ORACLE_MIGRATION.md)。

## 安全提醒

- `.env`、管理员密钥、文章快照和服务器备份都不提交到 Git。
- API 端口保持 loopback，不在主机防火墙或 OCI 安全列表额外开放。
- 写操作继续要求 `X-Admin-Key`；无效密钥应返回 HTTP 401。
