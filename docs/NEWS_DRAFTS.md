# 资讯草稿箱

## 目标与状态（2026-09-22）

入口：`/admin/articles?tab=news`，沿用文章管理密码。资讯保存在私有草稿箱，支持 Markdown 预览、编辑、保存、丢弃和明确发布。

当前：代码、本地测试和浏览器操作已完成；正在部署网站端。Cloudflare 现有凭据缺少 Workers / Workflows 部署权限，自动采集尚未启用，真实模型推理及定时任务尚未验收。后台会明确显示未启用，不能把试用草稿当作 Worker 的真实输出。

## 首版范围

- Cloudflare Blog、OpenAI News 官方 RSS，筛选近 14 天资讯。
- Python Worker 接受手动请求 / Cron，并创建持久化 Python Workflow。
- `0 1 * * *`：每天 UTC 01:00（UTC+8 09:00）；自动任务需 Worker 实际部署后才生效。
- Workers AI `@cf/qwen/qwen3-30b-a3b-fp8` 整理中文标题、摘要、正文和标签。
- 每天最多保存 3 条新草稿；按 UTC+8 计日，来源 URL 去重，丢弃或发布后仍保留去重记录。
- 3 条是成功保存上限，不是 AI 调用计费上限。单条推理失败不自动重试；后续手动采集可能再次调用模型。
- RSS 和模型输出视为不可信内容，来源必须是允许的官方 HTTPS 域名；不访问模型生成的链接。
- 管理员手动发布才写入文章库；来源、原文日期、AI 辅助说明在发布时统一追加。

## 数据和权限

- `articles.json`：公开文章，沿用现有格式。
- `news-drafts.json`：独立持久化草稿、已处理来源和采集状态；默认位于文章文件旁。
- `X-Admin-Key`：草稿列表、编辑、丢弃、发布、触发采集，沿用现有管理员密钥。
- `NEWS_COLLECTOR_TOKEN`：仅采集器状态、开始、写入草稿和结束接口；不能读管理列表、发布或编辑文章。
- 生产密钥采用文件注入，不进入 Git、Vite 构建、浏览器或日志。
- 单进程串行写入 + 临时文件原子替换；20 分钟活动锁，重复 runId 和相同来源写入可安全重放。
- 发布先写文章，再标记草稿；文章内保存 `newsDraftId`，中断或响应丢失后的重试返回同一篇文章。
- 备份先复制草稿、后复制文章，恢复时利用发布幂等修复“待审草稿 + 已发布文章”的中间状态。

## 环境配置

生产 `/etc/orange-cat-blog.env`：

```ini
NEWS_DRAFTS_DATA_FILE=/var/lib/orange-cat-blog/news-drafts.json
NEWS_COLLECTOR_TOKEN_FILE=/etc/orange-cat-news-collector-token
# 完成 Worker 部署后填入真实地址；留空时后台禁用自动采集。
NEWS_WORKER_URL=
```

Token 文件用随机值，至少 32 字符，归 `orange-cat:orange-cat`、权限 `0400`。Worker Secret 使用同一值，绝不使用文章管理员密码代替。

本地开发用 `.env.local` 的 `DEV_NEWS_DRAFTS_DATA_FILE`、`DEV_NEWS_COLLECTOR_TOKEN`、`DEV_NEWS_WORKER_URL`；草稿文件应放在隔离位置。Vite 的文章库是内存 mock，重启后复位；生产文章库使用文件持久化。

## Cloudflare 部署（尚待授权）

组件与完整步骤见 [`workers/news-drafts/README.md`](../workers/news-drafts/README.md)。本机全局 uv 版本较旧，本组件 `.venv/bin/uv` 已装兼容版本；不要修改全局工具来绕过组件依赖。

1. 在授权的 Cloudflare 账户登录 Wrangler，具备 Worker 脚本、Workflows 和 Workers AI 权限。不得借用其他域名的 DNS 专用 token。
2. 在 `workers/news-drafts/` 执行 `.venv/bin/uv run pywrangler deploy`，记录实际 Worker URL。
3. 用 stdin / 交互方式设置 `NEWS_COLLECTOR_TOKEN` Secret，不把值放进命令参数或文档。
4. 将该 URL 写入 VPS 的 `NEWS_WORKER_URL`，重启 `orange-cat-blog.service`。
5. 后台点一次“采集一批”，核对 Workflow 完成、草稿数增加、来源与中文内容可读。
6. 核对公开文章数、文章文件哈希未变化。不要为了验收自动发布真实资讯。

## 网站端发布与回滚

- 网站端继续由 GitHub main 自动部署；部署门禁包含 lint、测试、类型检查、构建与运行时模块导入。
- 独立的 `/usr/local/sbin/orange-cat-blog-backup` 需显式安装本次更新，自动发布不会替换系统脚本。
- 变更前记录 current release、deployed commit、文章哈希，备份 env、文章和备份脚本；不改其他服务。
- 先关闭 Worker cron/采集入口，再回滚网站版本；临时回滚时暂停 `orange-cat-blog-deploy.timer` 防止自动重部署。
- 将 current 切回上一 release、恢复 env 并重启博客服务；草稿文件保留，公开文章文件无需还原，避免覆盖用户新文章。
- 长期回滚应在 Git 中 revert 该功能提交，恢复自动部署计时器。

## 验收记录

- Node 测试覆盖鉴权、来源白名单、日额度、并发去重、锁超时、持久化与幂等发布；完整 127 项测试、lint、typecheck、build 通过；隔离 Vite 缓存后重跑的 39 项接口契约测试通过。
- 浏览器本地验收：登录、草稿列表、Markdown 预览、标题编辑、保存后刷新保留、试用文章发布及状态转换。
- 390px 手机宽度无横向溢出。修复测试与 Vite 开发页共享缓存导致的预览加载失败；重启刷新后 Markdown 预览恢复，并增加局部错误恢复，避免预览故障拖垮编辑页。
- Worker 的 29 项 Python 单元测试、两源真实 RSS 解析、部署 dry-run 已通过；实际 workerd 验证 health=200、无权限=401、错误方法=405、授权启动=202。烟测在首个网络步骤前主动终止，不包含真实 AI 推理。
- 线上验收和试用草稿信息待部署后补充。
