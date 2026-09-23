# 橘猫小窝 - 个人博客

橘猫小窝是一个基于 **Vite + React + Node.js + Caddy** 的个人博客项目。生产站运行在甲骨文 VPS，Cloudflare 负责 DNS、代理和缓存；原 Cloudflare Pages 项目仅作为迁移观察期内的回滚副本。它不只是文章列表，还包含个人档案、文章归档、标签索引、文章管理、创意工坊、工具箱和小游戏，适合长期维护个人技术内容和项目记录。

## 项目定位

- **个人博客主页**：展示作者档案、最新文章、精选阅读、分类地图、标签云和项目入口。
- **内容沉淀**：用文章、分类、标签、归档和相关阅读把知识串起来。
- **项目索引**：把工具箱、小游戏等实验能力作为个人项目的一部分展示。
- **可在线维护**：通过 VPS 文件存储 + 管理后台支持文章新增、编辑、删除，并保留原子写入和每日备份。
- **文档同步**：功能变更需要同步更新 README、CHANGELOG 或对应 docs 文件。

## 当前主要功能

### 博客首页 `/`

- 个人博客 Hero：作者介绍、站点统计、最新文章、当前维护主题。
- 精选阅读：默认展示最近更新的 3 篇文章。
- 文章列表：支持标题、描述、分类、标签搜索，支持分类筛选和分页。
- 侧边栏：作者档案、每日智慧、分类地图、标签云、项目入口、工具箱、站点统计。

### 文章归档 `/archive`

- 按年份分组展示全部文章。
- 支持全文搜索、分类筛选、标签筛选和时间排序。
- 展示文章总数、分类数、标签数、累计阅读分钟数。
- 侧边栏提供热门标签和分类概览。

### 标签与主题 `/tags`

- 标签云按照出现次数排序。
- 支持 `?tag=<tag>` 链接直达指定标签筛选。
- 支持分类筛选，并展示对应文章列表。
- 分类地图展示每类文章数量和累计阅读量。

### 关于页 `/about`

- 展示作者定位、维护原则、近期主题、项目入口和站点时间线。
- 项目入口包括工具箱和小游戏中心。
- 联系邮箱为 `jumaomaomaoju@gmail.com`（2026-09-10 更新）；页脚的「Email」和关于页的「邮件」共用 `src/data/blogProfile.js` 中的邮箱配置。

### 文章详情 `/article/:id`

- 展示文章标题、描述、作者、发布日期、标签和 Markdown 正文。
- 支持阅读进度条、目录、复制分享链接、点赞。
- 自动根据同分类和重叠标签推荐相关阅读。
- 提供上一篇/下一篇导航。

### 文章管理 `/admin/articles`

- 使用管理员密钥登录。
- 支持新增、编辑、删除文章。
- 文章数据通过 `/api/articles` 写入 VPS 的 `/var/lib/orange-cat-blog/articles.json`。
- 写操作使用查询参数与 `X-HTTP-Method-Override` 兼容 PUT / DELETE，前端无需因迁移改接口。

### 资讯草稿箱 `/admin/articles?tab=news`（本地新增，待部署验收）

- 沿用管理员密钥登录，提供待审阅与已发布列表、Markdown 预览、标题/摘要/正文/标签编辑、保存和丢弃。
- Cloudflare Python Worker + Workflows 读取 Cloudflare Blog、OpenAI News 官方 RSS，通过 Workers AI 整理中文草稿；每天 UTC+8 09:00 触发，也可手动「采集一批」。
- 每天最多保存 3 条新草稿，按原文链接去重，保留来源与原文日期。草稿独立存储，仅管理员可见；明确点击「发布为文章」后才创建公开文章，分类为 `AI 资讯`。
- 后台展示采集状态、上次执行和当日剩余额度；采集中自动刷新，失败或长时间等待后可以手动刷新。采集器密钥没有文章发布权限。
- 首版面向 VPS/Vite 接口，未扩展旧 Pages 回滚 API。配置、验收与进度见 [docs/NEWS_DRAFTS.md](docs/NEWS_DRAFTS.md)，Python 采集器说明见 [workers/news-drafts/README.md](workers/news-drafts/README.md)。

### 其他入口

- `/creative`：百工坊（创意工坊），集中展示 30 套独立博客排版方案及其完整预览。
- `/toolbox`：实用工具箱。
- `/games`：小游戏中心。

## 项目结构

```text
web/
├── src/
│   ├── App.jsx                         # 路由配置
│   ├── main.jsx                        # React 入口
│   ├── index.css                       # 全局主题变量与基础样式
│   ├── components/
│   │   ├── Layout.jsx
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   └── home/                       # 首页拆分组件
│   ├── data/
│   │   └── blogProfile.js              # 作者、项目、时间线等个人博客资料
│   ├── hooks/
│   │   └── useArticles.js              # 文章列表与详情数据 Hook
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Archive.jsx
│   │   ├── Tags.jsx
│   │   ├── About.jsx
│   │   ├── ArticleDetail.jsx
│   │   └── ArticleManager.jsx
│   └── utils/
│       ├── articleFilters.js           # 搜索、筛选、排序、分页
│       ├── blogInsights.js             # 统计、归档、标签云、相关阅读
│       └── markdownUtils.js            # Markdown 目录提取
├── functions/
│   └── api/
│       ├── articles.js                 # Cloudflare Pages 回滚 API
│       └── init-articles.js            # 回滚环境初始化入口
├── server/
│   ├── app.mjs                         # 组装生产 API 与文件存储
│   ├── articleHandler.mjs              # VPS/Vite 共用 HTTP 处理器
│   ├── http.mjs                        # JSON、请求体限制与密钥校验
│   ├── articleStore.mjs                # 原子写入与写队列
│   ├── newsDraftHandler.mjs            # 私有草稿管理与采集器接口
│   ├── newsDraftStore.mjs              # 独立草稿文件与原子写入
│   └── index.mjs                       # 生产进程入口
├── deploy/                              # systemd、Caddy 与备份配置
├── dev/                               # Vite 接入与内存存储
├── shared/
│   ├── articles/                       # 跨环境文章模型、业务服务与请求契约
│   ├── news-drafts/                    # 来源白名单、每日额度、去重与人工发布
│   └── content/articlesSeed.js         # 本地开发/初始化文章种子
├── workers/news-drafts/                # Cloudflare Python Worker + Workflows
├── test/                               # Vitest 测试
├── docs/                               # 部署、安全、设计与变更文档
├── vite.config.js
├── wrangler.toml
└── package.json
```

架构分层、存储契约及维护入口见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)。

## 本地开发

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

默认访问地址是 `http://localhost:5173`。如果端口被占用，Vite 会自动切换到下一个可用端口。

开发 API 与 VPS 共用 HTTP 处理器和文章业务规则，只把存储换成隔离内存。每次启动载入种子文章，本地编辑会在重启后重置；可访问 `/healthz` 检查开发 API。设置 `DEV_ADMIN_KEY` 后即可测试后台增删改查。

资讯草稿在开发环境单独保存到 `data/dev-news-drafts.json`，可通过 `DEV_NEWS_DRAFTS_DATA_FILE` 指定隔离测试文件。开发文章仍是内存数据，因此本地发布的测试文章会在 Vite 重启后重置。没有连接采集器时可进入草稿箱，采集按钮显示未启用。

### 可选环境变量

管理功能依赖环境变量。开发时可复制 `.env.example`：

```bash
cp .env.example .env
```

常见变量：

- `DEV_ADMIN_KEY`：本地文章管理后台管理员密钥。
- `DEV_NEWS_DRAFTS_DATA_FILE`、`DEV_NEWS_COLLECTOR_TOKEN`、`DEV_NEWS_WORKER_URL`：本地草稿文件及采集服务配置；请使用独立测试配置。
- `NEWS_DRAFTS_DATA_FILE`：生产草稿文件路径，默认与文章文件同目录的 `news-drafts.json`。
- `NEWS_COLLECTOR_TOKEN_FILE`（或 `NEWS_COLLECTOR_TOKEN`）、`NEWS_WORKER_URL`：服务端采集密钥及 Worker 根地址。密钥必须与 Worker secret 一致，不能写入前端。

生产环境密钥放在 VPS 的 `/etc/orange-cat-blog-admin-key`，其他参数放在 `/etc/orange-cat-blog.env`，不要硬编码到前端或提交到仓库。

## 常用脚本

```bash
npm run lint
npm test
npm run typecheck
npm run build
npm run preview
npm run start:api
```

日常验证入口：

- `npm run lint`
- `npm test`
- `npm run typecheck`
- `npm run build`
- 浏览器检查 `/`、`/archive`、`/tags`、`/about`、`/article/1`

## 文章 API

文章 API 的主入口是 `/api/articles`：

- `GET /api/articles`：获取文章列表。
- `GET /api/articles?id=<id>`：获取单篇文章。
- `POST /api/articles`：创建文章，需要 `X-Admin-Key`。
- `POST /api/articles?id=<id>` + `X-HTTP-Method-Override: PUT`：更新文章。
- `POST /api/articles?id=<id>` + `X-HTTP-Method-Override: DELETE`：删除文章。
- `POST /api/articles?id=auth-check`：校验管理员密钥。

为兼容原 Cloudflare Pages 客户端，写操作继续统一使用查询参数。VPS API 也兼容读取 `/api/articles/<id>`。

资讯草稿使用独立的 `/api/news-drafts`：管理端读取、采集、编辑、丢弃和发布均需 `X-Admin-Key`；`/collector/*` 使用独立采集凭据且不能发布文章。接口与数据边界见 [架构说明](docs/ARCHITECTURE.md#资讯草稿箱2026-09-22新增)。

## 部署要点

### 甲骨文 VPS（当前生产）

1. `orange-cat-blog-deploy.timer` 每分钟检查 GitHub `main` 是否有新提交。
2. 新提交使用独立低权限账号安装依赖，并依次通过 lint、测试、类型检查和构建。
3. 通过后写入 `/opt/orange-cat-blog/releases/<timestamp>-<commit>`，原子切换 `current` 并重启 API。
4. 构建或健康检查失败时保留当前线上版本；切换后失败会自动指回上一个 release。
5. Caddy 为正式域名提供 HTTPS、静态站点与 `/api/*` 反代；文章数据独立保存在 `/var/lib/orange-cat-blog`。
6. `orange-cat-blog-backup.timer` 每日备份文章数据。

当前正式地址是 `https://jumaomaomaoju.cn`；原 Pages 回滚地址是 `https://web-b0b.pages.dev`。

详细流程见：

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/NEWS_DRAFTS.md](docs/NEWS_DRAFTS.md)（资讯草稿箱的配置与验收进度）
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- [docs/ORACLE_MIGRATION.md](docs/ORACLE_MIGRATION.md)
- [docs/KV_SETUP_GUIDE.md](docs/KV_SETUP_GUIDE.md)
- [docs/SECURITY_CHECKLIST.md](docs/SECURITY_CHECKLIST.md)
- [docs/CREATIVE_WORKSHOP_CONTENT_DESIGN.md](docs/CREATIVE_WORKSHOP_CONTENT_DESIGN.md)（30 主题的内容与验收设计稿）

## 设计约定

- 全站为仙侠 / 中国古典风格「云深处」：宣纸底、黛墨字、朱砂点睛、泥金细线，夜间跟随系统切换为月夜配色。
- 栏目用雅称并配白话：山门（首页）、藏经阁（归档）、万象（标签）、百工坊（创意）、游仙境（游戏）、法宝阁（工具箱）、洞府（关于）、执笔（管理）。URL 不变。
- 毛笔字只用于大标题、序号和印章；正文用 Noto Serif SC，保证长文好读。
- 远山、云雾、灵光等装饰放在 `src/components/xian/`，内页页头统一用 `PageHeader`。

详细视觉规范见 [docs/DESIGN_GUIDE.md](docs/DESIGN_GUIDE.md)。

## 开发维护规则

- 调整文章字段或业务规则：优先修改 `shared/articles/model.js` / `service.js`，通过三个环境共用的 `test/articleApiContract.test.js` 验证。
- 新增博客资料：优先更新 `src/data/blogProfile.js`。
- 新增文章筛选或统计逻辑：优先放在 `src/utils/articleFilters.js` 或 `src/utils/blogInsights.js`，并补 Vitest。
- 新增路由：在 `src/App.jsx` 中注册，并检查 `Navbar.jsx` / `Footer.jsx` 是否需要露出入口。
- 修改功能后同步更新 `docs/CHANGELOG.md` 或对应专题文档。

## 许可证

MIT License
