# 橘猫小窝架构与维护入口

## 2026-09-05 整理结果

文章 API 已拆为业务、接口、存储三层。本地开发、VPS 生产和 Pages 备用环境共用文章校验与增删改查；前端页面、路由、文章字段、管理密钥请求头、游戏存档及 JSON 数据格式保持兼容。本次架构调整已提交到本地 Git 仓库，尚未推送或部署。

原先 `server/app.mjs` 同时处理 HTTP、鉴权和文章业务，并从 Pages 的 `functions/_shared` 导入规则；Vite 和 Pages 又各写了一套增删改查，造成校验不一致。现在业务规则集中在 `shared/articles`，平台代码单向依赖共享模块。

```mermaid
flowchart TD
    UI[React 页面] --> Hooks[hooks 与 services]
    Hooks --> API["/api/articles"]
    API --> Node[Node HTTP 处理器]
    API --> Pages[Pages Request/Response 适配]
    Node --> Service[shared/articles 业务服务]
    Pages --> Service
    Service --> Store[read / update 存储契约]
    Store --> File[VPS：JSON 文件、写队列、原子替换]
    Store --> Memory[Vite：隔离的内存数据、写队列]
    Store --> KV[Pages：备用 KV 存储]
```

## 模块职责

| 位置 | 职责 | 修改时机 |
| --- | --- | --- |
| `shared/articles/model.js` | 字段规范化、必填规则、列表排序、ID 分配 | 新增文章字段或调整校验 |
| `shared/articles/service.js` | 查询、创建、部分更新、删除、时间字段与 ID 保护 | 修改文章业务行为 |
| `shared/articles/errors.js` | 可向客户端展示的预期错误及响应状态 | 新增业务错误 |
| `shared/articles/request.js` | 两个平台共用的 URL、方法覆盖与文章 ID 提取 | 调整接口兼容规则 |
| `server/http.mjs` | Node 请求体大小限制、JSON 编解码、密钥校验 | 修改 Node 传输规则 |
| `server/articleHandler.mjs` | HTTP 分发、健康检查、鉴权入口、错误映射 | 修改 VPS/Vite 接口行为 |
| `server/app.mjs` | 组装文件存储与 HTTP 服务 | 改换生产存储 |
| `server/articleStore.mjs` | 文件读写、串行写队列、原子替换与 `.previous` 备份 | 修改持久化实现 |
| `dev/memoryArticleStore.js` | 深拷贝隔离、内存写队列 | 修改本地临时数据存储 |
| `dev/viteMocks.js` | 挂载相同 Node 处理器，其余请求交回 Vite | 调整开发环境集成 |
| `functions/api/articles.js` | Pages 的 Web Request/Response 适配 | 修改备用平台接入 |
| `functions/_shared/articleStore.js` | 以 KV 实现同一存储接口 | 调整备用存储 |

`shared/articles/model.js` 和 `service.js` 不依赖 Node、React、Vite 或 Cloudflare；业务服务只通过注入的存储读写。`server` 不再反向依赖 `functions`；前端继续通过 HTTP 调用 API，不导入服务端存储或密钥。

## 存储契约与限制

- `read()` 返回文章数组快照。调用者修改快照不应改变已保存数据。
- `update(mutator)` 提供可修改的快照，回调返回 `{ articles, result }`，提交成功后返回 `result`。
- 回调失败时不提交数据；文件和内存实现的后续写入仍能继续。
- 文件与内存实现的串行队列只保证**同一个存储实例**内的写入隔离。当前部署保持单 Node 进程，不能用多个实例同时写同一 JSON 文件。
- Pages KV 仍是整表读改写，没有跨请求事务和并发写入保障。共用业务代码没有改变 KV 的一致性限制。
- Vite 每次启动使用 `shared/content/articlesSeed.js` 的深拷贝，编辑只保留在该开发服务器的内存中；重启恢复种子，生产数据不参与本地测试。

以后需要多人并发编辑或多进程运行时，可以新增数据库存储适配器，通过同一契约接入；具体事务保证仍由适配器实现。

## 接口兼容与收敛

保留 `/api/articles`、`?id=<id>`、`?id=auth-check`、`X-Admin-Key` 及 `POST + X-HTTP-Method-Override: PUT/DELETE`。Node/Vite 支持文章 ID 路径形式；Pages 处理函数也能解析该形式，但线上 Pages 的文件路由仍以查询参数为准。

本次有意统一的行为：

- 创建与更新都校验 `title`、`description`、`category`、`readTime`，空白字段返回 400。
- Vite 同样执行字段修剪、标签整理、作者默认值与创建/更新时间维护。
- JSON 格式错误、非对象载荷、非法方法覆盖返回 400；不支持的方法返回 405。
- ID 必须是正的安全整数；`1oops` 等值返回 400，避免 `parseInt` 截断后误读或误删其他文章。
- 多余路径段返回 404；部分更新保留原日期、正文、标签和创建时间，客户端不能改写 ID。
- Node/Vite 共用原有 2 MiB 请求体限制与同源策略，本地不再使用通配 CORS。Pages 保留原有 CORS 适配，未统一为 Node 流式请求体限制。
- 本地未设置 `DEV_ADMIN_KEY` 时公开读取可用，写入和登录校验返回“未配置密钥”的 500；配置后错误密钥返回 401。

旧 Pages 初始化函数保持原状，VPS 和 Vite 的共享处理器不挂载它。本次没有重新部署或启用备用站。

## 前端现状

`src/App.jsx` 负责按页面延迟加载，`src/pages/GameHub.jsx` 已对每个游戏分别延迟加载，独立雨姐分发页继续使用 Vite 多页面入口。文章数据访问位于 `src/services/articles.js`，请求状态位于 `src/hooks/useArticles.js`，展示和筛选逻辑仍在各自组件与工具模块中。本次没有移动前端文件或变更游戏数据。

## 发布与回滚

`deploy/auto-deploy.sh` 的 release 复制清单现在包含 `dist`、`server`、`shared`、`functions` 及包元数据；在切换 `current` 前以低权限账号导入 `server/app.mjs`，提前发现运行时依赖遗漏。Node 运行时没有新增第三方依赖。

**首次上线前需要同步服务器上已安装的发布脚本**。systemd 使用的是 `/usr/local/sbin/orange-cat-blog-deploy`，不会自动执行仓库里的新版脚本；旧脚本漏复制 `shared` 会导致新版 API 启动失败。具体顺序见 [DEPLOYMENT.md](DEPLOYMENT.md#首次发布此次架构调整)。应用与文章文件格式兼容，仍可切回旧 release。

## 验证与进度

- 基线：69 项测试、lint、typecheck、生产构建通过。
- 新增三个环境共用的接口契约测试，覆盖鉴权、CRUD、规范化、部分更新、拒绝错误载荷后再次写入、非法 ID 和路径。
- 新增文件/内存存储测试，覆盖 20 次并发创建、失败恢复、快照隔离、磁盘备份与重开读取。
- 发布验证按脚本的实际复制清单生成临时 release，在没有 `node_modules` 的目录中验证模块导入、HTTP 健康检查、生产入口启动及 SIGTERM 正常退出。
- 最终：116 项测试、lint、typecheck、生产构建、差异空白与发布脚本语法检查通过；浏览器完成文章读取、登录、新建、列表刷新、正文和退出验收。详细检查与浏览器结果见 [CHANGELOG.md](CHANGELOG.md)。Pages 检查使用本地模拟 KV 调用真实函数，不代表已验收远端 Pages 部署。
