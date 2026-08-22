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

## 自动发布流程

1. `orange-cat-blog-deploy.timer` 每分钟检查公开 GitHub 仓库的 `main`。
2. 发现新提交后，`orange-cat-deploy` 低权限账号在隔离工作目录运行 `npm ci`、lint、测试、类型检查和构建。
3. 所有门禁通过后，将新 release 写入 `/opt/orange-cat-blog/releases/<timestamp>-<commit>`。
4. `/opt/orange-cat-blog/current` 原子切换到新 release，并重启 `orange-cat-blog.service`。
5. 本机 `/healthz` 失败时自动切回上一个 release；构建失败时完全不触碰当前版本。
6. 运行时文章数据始终保留在 `/var/lib/orange-cat-blog/articles.json`，不会被 Git 构建产物覆盖。

自动发布只跟踪 GitHub `main`，不自动删除历史 release。运行状态可用以下命令查看：

```text
systemctl status orange-cat-blog-deploy.timer
journalctl -u orange-cat-blog-deploy.service
cat /var/lib/orange-cat-blog-deploy/deployed-commit
```

服务器配置模板位于：

- `deploy/orange-cat-blog.service`
- `deploy/auto-deploy.sh`
- `deploy/orange-cat-blog-deploy.service`
- `deploy/orange-cat-blog-deploy.timer`
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
- 自动发布：先停用 `orange-cat-blog-deploy.timer`，再执行应用回滚；重新启用前确认 GitHub `main` 已修复，否则定时器会再次发布该提交。
- 数据：先停止写入，再从 `articles.json.previous` 或每日备份恢复。
- 域名：将 Cloudflare Pages 自定义域名重新绑定到 `web` 项目；观察期内保留 Pages 与 KV。

更完整的迁移记录、路径和验收结果见 [ORACLE_MIGRATION.md](ORACLE_MIGRATION.md)。

## 安全提醒

- `.env`、管理员密钥、文章快照和服务器备份都不提交到 Git。
- API 端口保持 loopback，不在主机防火墙或 OCI 安全列表额外开放。
- 写操作继续要求 `X-Admin-Key`；无效密钥应返回 HTTP 401。
- 橘猫域名使用 `X-Frame-Options: SAMEORIGIN`：外部网站不能嵌入，本站 `/creative` 可以加载同域快速预览。
