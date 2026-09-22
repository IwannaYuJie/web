# Python 资讯草稿采集器

这是部署到 Cloudflare 的 Python Worker，不是 VPS 定时脚本。`/run` 创建持久化 Workflow 后立即返回 202；每日 UTC 01:00 的 Cron 触发同一个流程。RSS、模型结果、草稿写入各自存为 Workflow 步骤，不依赖 HTTP `waitUntil()` 的 30 秒生命周期。

## 配置与部署

需要 Python 3.13+、[uv](https://docs.astral.sh/uv/) 0.12.3+ 和可运行 Wrangler 的 Node.js。当前目录执行：

```sh
uv sync
uv run pywrangler deploy --dry-run
uv run pywrangler secret put NEWS_COLLECTOR_TOKEN
uv run pywrangler deploy
```

部署者通过环境变量 `CLOUDFLARE_ACCOUNT_ID` 指定账户，使用既有 Wrangler 登录或 `CLOUDFLARE_API_TOKEN`。仓库不保存账户或密钥。`NEWS_COLLECTOR_TOKEN` 至少 32 字符，必须与博客服务同名密钥一致，只能写资讯草稿。博客配置 `NEWS_WORKER_URL=https://<worker>.workers.dev`（后端自行追加 `/run`）。本组件不创建 API key，不升级套餐或修改账单。

配置文件已声明 `AI`、`NEWS_WORKFLOW` 两个 binding，以及 `python_workers`、`python_workflows` compatibility flags。`BLOG_ORIGIN` 固定为正式博客 `https://jumaomaomaoju.cn`；默认 Workers AI 模型为支持中文的 `@cf/qwen/qwen3-30b-a3b-fp8`，无需 OpenAI key。

## 采集边界

- 仅访问代码固定的 Cloudflare Blog、OpenAI News 官方 RSS，拒绝 HTTP 跳转；不访问 RSS 内的文章地址或模型生成地址。
- XML 最多 2 MiB / 2,000 条；拒绝 DTD、实体声明、UTF-16/32 混淆。原文链接必须匹配所属官方 HTTPS 主机，删除追踪参数和片段。
- 仅使用 RSS `title`、`description`、`pubDate`，过滤过去 14 天以外、未来日期、过长/空摘要；HTML 转成纯文本并丢弃脚本等内容。
- 博客后端原子锁控制并发，并按 UTC+8 自然日最多保存 3 条。历史 URL 即使已发布/丢弃仍去重。
- 模型输入把来源视为不可信文本；模型输出必须是中文 JSON 且无网址/HTML，程序单独保存可信来源链接与原文日期。草稿 UI 显示这些不可编辑来源字段，发布后端统一在正文末尾追加一次真实来源、原文日期和 AI 整理说明，避免编辑后来源丢失或出现重复附注。
- 每条仅执行一次模型调用、最多生成 1,800 tokens。RSS 和幂等后端 API 允许有限重试；模型调用失败会记录采集错误。每天 3 条限制指成功保存的草稿数，并非 AI 调用次数：失败后再次手动采集可能重新调用模型、继续消耗 AI 额度。一次 Workflow 内模型调用不自动重试。
- API/模型错误会写入 collector finish 并显示到后台；若博客持续不可达，Workflow 会保留失败状态，博客 20 分钟过期锁可恢复。草稿始终需要管理员明确发布。

## 接口

- `GET /healthz`：无敏感信息的存活检查。
- `POST /run`：必须 `Authorization: Bearer <NEWS_COLLECTOR_TOKEN>`，返回 `{accepted:true,runId,status:"queued"}`（202）。响应只代表排队，采集结果以博客 collector 状态为准。
- Workflow 使用同一 Bearer token 调用博客 `/api/news-drafts/collector/start`、`ingest`、`finish`。`runId` 是 Workflow 实例 ID，后端 start/finish 重放及 ingest 来源去重保障幂等。

## 验证

```sh
python3 -m unittest discover -s tests -v
uv run pywrangler deploy --dry-run
```

生产验收需要真实 Worker 部署、一次手动采集到私有草稿、核对来源和模型输出，以及确认公开文章数量不变。单元测试与 dry-run 通过本身不代表线上采集成功。免费 Workers CPU、Workflows 和 AI 均有额度；超限按错误展示，部署过程不自动升级套餐。

### 2026-09-22 本地验收记录

- `python3 -m unittest discover -s tests -v`：29 项通过，包括 RSS 安全/日期/去重、模型 JSON 校验、Bearer 认证、工作流失败收尾、写入回执丢失后重放、定时事件重放。
- `uv run pywrangler deploy --dry-run`：Wrangler 4.136.1 打包通过，识别 AI 与 Workflow 两个绑定；未上传或部署。
- 使用生产相同的 `OrangeCatNewsDrafts/1.0` User-Agent 拉取真实 RSS 并解析：Cloudflare 9 条、OpenAI 32 条符合近 14 天窗口。默认 Python urllib User-Agent 在该网络中收到 403。
- 真实本地 workerd：`GET /healthz` 200、匿名 `POST /run` 401、`GET /run` 405、授权 `POST /run` 202（约 10ms）；确认创建 Workflow 并进入 Python `run`。烟测故意使用非法模型配置，在首次网络步骤前结束，未触及生产 API 或模型推理。临时配置已删除。
- 真实 Workers AI 推理、完整远程工作流和线上采集仍待有 Cloudflare 权限后验证。本地带 AI binding 的运行需要账户远程连接权限，当前未取得。
- 本机 uv 0.11.11 低于 workers-py 1.17.4 要求，已只在本组件 `.venv` 安装 uv 0.12.3；本机可用 `.venv/bin/uv run pywrangler ...`，未更新全局 uv。第一次 workerd 初始化的 Pyodide 下载受本地网络影响，烟测用组件内忽略的 `.wrangler` 缓存加载官方 bundle。

官方依据：[Python Workers](https://developers.cloudflare.com/workers/languages/python/)、[Python Workflows](https://developers.cloudflare.com/workflows/python/)、[Qwen 模型](https://developers.cloudflare.com/workers-ai/models/qwen3-30b-a3b-fp8/)。
