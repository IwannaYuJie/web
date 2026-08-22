# 甲骨文 VPS 部署与回滚

## 迁移状态

2026-08-13 已完成正式切换：

- `jumaomaomaoju.cn` 与 `www.jumaomaomaoju.cn` 的源站均为 `168.110.59.224`，Cloudflare 只保留 DNS、代理和缓存职责。
- 原 Pages 自定义域名已解除，`https://web-b0b.pages.dev` 和原 KV 保留为观察期回滚副本。
- 生产文章共 16 篇；切换前快照、VPS 数据和切换后正式 API 的规范化 SHA-256 均为 `2ddf91d95825015578e15a17d5b65452ab85751a04a1785c78f0eb949ca60f06`。
- 正式站 `/`、`/archive`、`/tags`、`/about`、`/article/16`、`/admin/articles`、`/games`、`/toolbox`、`/healthz` 和 `/api/articles` 均已返回 HTTP 200。
- `orange-cat-blog.service`、`caddy.service` 和 `orange-cat-blog-backup.timer` 均为 active；管理员正确密钥返回 200，错误密钥返回 401。

预览入口 `https://orange-cat-preview.168.110.59.224.nip.io` 暂时保留，便于绕过正式域名路径排查源站。

## 架构

- Caddy 对外提供 HTTPS、静态文件、SPA 路由回退和 `/api/*` 反向代理。
- React/Vite 构建产物位于 `/opt/orange-cat-blog/current/dist`。
- Node 文章 API 仅监听 `127.0.0.1:8361`，由 `orange-cat-blog.service` 管理。
- 文章运行时数据位于 `/var/lib/orange-cat-blog/articles.json`，写入采用临时文件加原子替换。
- 每次写入保留 `articles.json.previous`，每日定时备份保留在 `/var/backups/orange-cat-blog/`。
- 管理员密钥只放在 `/etc/orange-cat-blog-admin-key`，不进入代码仓库和部署产物。

## 服务器路径

| 用途 | 路径 |
|---|---|
| 当前版本 | `/opt/orange-cat-blog/current` |
| 历史版本 | `/opt/orange-cat-blog/releases/` |
| 文章数据 | `/var/lib/orange-cat-blog/articles.json` |
| 环境变量 | `/etc/orange-cat-blog.env` |
| 管理员密钥 | `/etc/orange-cat-blog-admin-key` |
| Caddy 配置 | `/etc/caddy/Caddyfile` |
| 每日备份 | `/var/backups/orange-cat-blog/` |

## 发布流程

2026-08-23 起，甲骨文由 `orange-cat-blog-deploy.timer` 每分钟检查 GitHub `main`：

1. 新提交在 `orange-cat-deploy` 低权限账号下安装依赖并完成 lint、测试、类型检查和构建。
2. 门禁通过后生成带提交号的 release，并原子切换 `/opt/orange-cat-blog/current`。
3. 重启 `orange-cat-blog.service` 后检查本机 `/healthz`；失败时自动回滚到上一个 release。
4. 正式域名健康检查作为发布后验证；Cloudflare 或外网单点异常不会覆盖本机已通过的回滚判断。
5. 文章数据、环境变量和管理员密钥都在 release 之外，自动发布不会覆盖它们。

构建失败只记入 `orange-cat-blog-deploy.service` 日志，线上继续运行原版本。历史 release 暂不自动清理。

## 数据迁移记录

- Cloudflare KV 切换前通过生产 `/api/articles` 导出完整 JSON，并在切换前再次导出确认没有新增写入。
- 两次快照均为 16 篇，规范化 SHA-256 一致；VPS 导入后再次核对同一哈希。
- 切换期间没有发生新旧后端同时写入。
- Cloudflare Pages 和 KV 至少保留 14 天，只移除正式域名路由，便于快速回滚。

## 回滚

### 应用回滚

将 `current` 指回上一个 release，重启 `orange-cat-blog.service` 并重载 Caddy。

### 数据回滚

先停止文章写入，再从 `articles.json.previous` 或每日备份恢复；恢复前保留故障数据副本。

### 域名回滚

将 Cloudflare DNS 和 Pages 自定义域名恢复到原 Pages 项目。原 `.pages.dev` 地址和 KV 数据在观察期内保持不动。

## 安全边界

- API 只监听 loopback，不在防火墙开放额外端口。
- 不迁移旧的公开 `/api/init-articles` 初始化入口，避免未授权覆盖文章数据。
- 写操作继续要求 `X-Admin-Key`，并兼容现有 `POST + X-HTTP-Method-Override` 客户端。
- 备份和环境文件不得提交到 Git。
