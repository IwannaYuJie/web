# 橘猫小窝 - 个人博客

橘猫小窝是一个基于 **Vite + React + Cloudflare Pages Functions** 的个人博客项目。它不只是文章列表，还包含个人档案、文章归档、标签索引、文章管理、工具箱和小游戏，适合长期维护个人技术内容和项目记录。

## 项目定位

- **个人博客主页**：展示作者档案、最新文章、精选阅读、分类地图、标签云和项目入口。
- **内容沉淀**：用文章、分类、标签、归档和相关阅读把知识串起来。
- **项目索引**：把工具箱、小游戏等实验能力作为个人项目的一部分展示。
- **可在线维护**：通过 Cloudflare KV + 管理后台支持文章新增、编辑、删除。
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

### 文章详情 `/article/:id`

- 展示文章标题、描述、作者、发布日期、标签和 Markdown 正文。
- 支持阅读进度条、目录、复制分享链接、点赞。
- 自动根据同分类和重叠标签推荐相关阅读。
- 提供上一篇/下一篇导航。

### 文章管理 `/admin/articles`

- 使用管理员密钥登录。
- 支持新增、编辑、删除文章。
- 文章数据通过 `/api/articles` 写入 Cloudflare KV。
- Cloudflare 自定义域名下使用查询参数与 `X-HTTP-Method-Override` 兼容 PUT / DELETE。

### 其他入口

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
│       ├── articles.js                 # Cloudflare Pages 文章 API
│       └── init-articles.js            # 初始化文章种子数据
├── shared/
│   └── content/articlesSeed.js         # 本地开发/初始化文章种子
├── test/                               # Vitest 测试
├── docs/                               # 部署、安全、设计与变更文档
├── vite.config.js
├── wrangler.toml
└── package.json
```

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

### 可选环境变量

管理功能依赖环境变量。开发时可复制 `.env.example`：

```bash
cp .env.example .env
```

常见变量：

- `DEV_ADMIN_KEY`：本地文章管理后台管理员密钥。

生产环境请在 Cloudflare Pages 项目环境变量中配置，不要硬编码到前端代码。

## 常用脚本

```bash
npm run lint
npm test
npm run typecheck
npm run build
npm run preview
```

本次个人博客完全体改造已验证：

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

Cloudflare Pages Functions 对路径匹配较严格，自定义域名上不要使用 `/api/articles/<id>` 作为写操作路径；项目已统一使用查询参数。

## 部署要点

### Cloudflare Pages

1. 构建命令：`npm run build`
2. 输出目录：`dist`
3. Functions 目录：`functions/`
4. KV 绑定变量名：`ARTICLES_KV`
5. 初始化文章：部署后访问 `/api/init-articles`

详细流程见：

- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- [docs/KV_SETUP_GUIDE.md](docs/KV_SETUP_GUIDE.md)
- [docs/SECURITY_CHECKLIST.md](docs/SECURITY_CHECKLIST.md)

## 设计约定

- 主色保留橘猫橙，辅助色使用青绿和蓝紫，避免页面只剩单一橘色/奶油色。
- 页面以真实博客内容为第一屏，不做营销落地页。
- 卡片用于文章、项目、工具等重复项；页面大区块使用全宽布局或玻璃面板。
- 导航优先呈现博客核心路径：主页、归档、标签、关于。

详细视觉规范见 [docs/DESIGN_GUIDE.md](docs/DESIGN_GUIDE.md)。

## 开发维护规则

- 新增博客资料：优先更新 `src/data/blogProfile.js`。
- 新增文章筛选或统计逻辑：优先放在 `src/utils/articleFilters.js` 或 `src/utils/blogInsights.js`，并补 Vitest。
- 新增路由：在 `src/App.jsx` 中注册，并检查 `Navbar.jsx` / `Footer.jsx` 是否需要露出入口。
- 修改功能后同步更新 `docs/CHANGELOG.md` 或对应专题文档。

## 许可证

MIT License
