# 变更日志 (Changelog)

本文档记录项目的所有重要变更和版本更新。

 ---

## [2026-09-05] - 文章业务分层与开发环境一致性

### 架构调整

- 新增 `shared/articles`：集中管理字段规范化、必填校验、ID、时间字段与文章增删改查；VPS、Vite 和 Pages 备用 API 共用业务服务。
- `server/app.mjs` 从 270 行缩减为 10 行组装入口，Node HTTP 处理、鉴权和请求体限制分别归入处理器与 HTTP 模块；生产服务不再依赖 Pages 目录。
- Vite 改用与 VPS 相同的 HTTP 处理器，注入独立的内存存储；每次启动从种子深拷贝，写入使用串行队列。
- Pages 以 KV 适配器接入共享服务，保留备用平台的 Request/Response 和 CORS 边界；KV 本身的并发及一致性限制保持不变。
- lint 扩展覆盖 `shared`、`dev`、`functions`；没有新增依赖或修改生产文章文件格式。

### 行为与发布修正

- 三个环境统一创建/更新必填校验、字段整理和时间字段；拒绝非法 JSON、非对象载荷、非法方法覆盖及会被截断的文章 ID。
- Node/Vite 继续限制请求体为 2 MiB；错误请求后数据及服务保持可用。
- 后台登录与配置错误提示去掉旧的 Cloudflare KV 专属说明。
- 发布复制清单补齐 `shared`，切换 `current` 前验证运行时模块可导入。首次发布需先同步服务器独立安装的发布脚本，步骤见 `docs/DEPLOYMENT.md`。
- 新增 `docs/ARCHITECTURE.md`，同步 README 与部署说明，明确模块边界、存储契约和扩展入口。

### 验证与状态

- 自动化从 69 项增加到 **116 项，全量通过**；新增 39 项跨环境接口契约测试、7 项文件/内存存储隔离测试及 1 项请求体限制测试。
- lint、typecheck、生产构建、差异空白检查和发布脚本语法检查通过。
- 按发布脚本实际复制清单构造临时 release，在没有 `node_modules` 的目录中验证模块导入、`/healthz`、生产入口及 SIGTERM 正常退出。
- 本地浏览器验证首页种子文章、原文章详情、后台登录、新建临时文章、列表自动刷新、新文章 Markdown 正文和退出登录；退出后的提示文案正确。
- Pages 测试使用本地模拟 KV 调用真实函数，未访问或部署远端 Pages。浏览器验收文章仅存在临时开发服务器内存，收尾停止服务器后丢弃。
- 构建仍有既有 Browserslist 数据过期提示，本次没有升级依赖。
- **状态：本地完成并提交；尚未推送或部署。**

## [2026-08-25] - 🎮 《雨姐的心动时刻》v2.4 人格养成与老蒯攻略扩展

### 🧭 养成机制、剧情规模与多结局体系
- **内容规模升级**：全篇扩充至 62 个事件、145 条对白、147 个分支选择与 14 个结局；完整保留既有 9 个旧结局，新增 5 个专属结局，唯一准确 ID 与名称为：`ending_love_soft`（倚怀向晚）、`ending_love_power`（盛木为荫）、`ending_laokuai_soulmate`（匠心同舟）、`ending_laokuai_romance`（默契生温）、`ending_shura`（冰碎雪崩）。
- **告别全加好感**：分支选择引入 35.37% 风险/混合/负面收益，支持根据玩家当前属性与好感度动态计算判定结果（`outcomes`）并附带沉浸式叙事反馈（`feedback`）。
- **雨姐相处性格回响**：雨姐性格回响划分为三种状态——`yujieSoftness > 10` 为“柔软依恋”，`[-10, 10]` 为“平衡搭档”，`< -10` 为“强势主导”；玩家强势担当会推动雨姐展现柔软依恋，玩家弱势/跟随则会推动雨姐强势主导。
- **老蒯羁绊与双向路线**：新增老蒯 5 幕知己与成年双向浪漫路线；若同时触发脚踩两条船的 `doublePromise` 标记，将在第 12 天终局前夕直通修罗场。
- **状态字段与存档迁移**：新增准确顶层状态字段 `yujieSoftness`、`laokuaiBond`、`laokuaiRomance`、`integrity`、`historyLog`；增加 `laokuaiAlert` 警觉机制与 flags 中的 `doublePromise` 等标记；接入特殊插曲、预警与木薯粉条补救逻辑，实现旧存档平滑向后兼容迁移。
- **阶段词与旅途手记**：首周目采用性格阶段词隐去精确数值，通关后开启二周目精确数值手记与回响提示。

### 📱 界面布局与移动端适配
- 360px 与 390px 移动端视口下自由行动地图自适应双列排布，状态栏平铺展示无遮挡，核心交互按钮保持 44px 触控标准；1280px 桌面端视口保持完整视觉与交互体验。

### 🎨 视觉素材独立配图
- **独立素材生成**：内置 imagegen identity-preserve 生成 20 个新增事件独立 CG + 5 个新增结局独立画面。
- **规格与哈希独立**：25 张全为 1672x941 PNG；25/25 SHA-256 唯一；与旧素材零内容哈希碰撞。
- **设计与演出规范**：人物身份保持一致但成品文件、像素和构图完全不复用；CG 场景仍自动隐藏前景立绘，防止画面重叠。

### 📊 验证与流程测试
- ESLint 0 错；Vitest 63/63（含 49 项雨姐专项测试、精确映射与 Set 唯一性断言、500 局随机仿真）通过；另完成 25 文件、25/25 SHA-256 唯一、旧素材零碰撞、bad_dimensions=0 的独立机器检查；生产构建成功。
- 本地内置浏览器三视口巡检，控制台零报错；实机交互完成 D2 厨房普通支线行动点 AP 从 2 准确扣减至 1 的验证；D3、D6、D9、D12 等固定日程时序与分支判定由自动化测试完整覆盖。

### 🤝 协作与责任边界
- 视觉资产由 Codex 使用内置 imagegen 生成并验图；事件/结局映射、自动化测试及工程文档由 gemini-3.7-flash-high 编写；Codex 原样应用、审查并独立验收。
- **当前状态**：本地完成，尚未提交、推送或部署。

### 📌 影响范围
- `src/data/yujieGameData.js`
- `src/data/yujieGameEngine.js`
- `src/data/yujieGameEvents.js`
- `src/components/YujieGame.jsx`
- `src/components/YujieGame.css`
- `src/pages/GameHub.jsx`
- `test/yujieGameData.test.js`
- `test/yujieGameFlow.test.js`
- `docs/雨姐游戏开发文档.md`
- `docs/雨姐游戏使用说明.md`
- `docs/雨姐游戏v2.4剧情与养成设计.md`
- `docs/CHANGELOG.md`
- `public/images/yujie/README.md`
- `public/images/yujie/v24_*.png`（25 张）

## [2026-08-25] - 🔐 正式域名源站访问加固

### 🛡️ Cloudflare 源站限制
- **关闭直连绕过路径**：正式域名 `jumaomaomaoju.cn` 与 `www.jumaomaomaoju.cn` 的 Caddy 站点块只接受 Cloudflare 官方 IPv4/IPv6 地址；使用正确 SNI/Host 直连源站现返回 HTTP 403。
- **保持共享服务边界**：限制仅作用于橘猫正式域名，没有全局封锁 VPS 的 80/443 端口，因此 DSH、VPS Watch、`sbjumao.com` 和预览站继续按原配置运行。
- **平滑生效与可回滚**：通过 Caddy graceful reload 生效，没有重启游戏/API 服务；上线前配置保存在 `/root/vps-change-backups/20260824T160321Z-orange-cat-cloudflare-only/Caddyfile.before`。

### ✅ 线上验收
- 分享页 `/games/yujie`、首页、文章 API 与健康检查经 Cloudflare 均返回 HTTP 200；无效文章写请求仍返回 HTTP 401。
- 真实浏览器完成分享页打开、刷新、继续入口可见、返回游戏列表及再次进入的往返验收；v2.3 封面完整加载，控制台无错误。
- 同机 `sbjumao.com`、`vps.doroai.net` 与 `dsh.doroai.net` 均无 5xx；仓库同步更新 Caddy 模板、部署说明和安全检查清单。

## [2026-08-24] - 🎮 《雨姐的心动时刻》v2.3 剧情回响与交互体验升级

### 🧭 剧情回响与叙事连续性
- **D12 专属路线回响与通用兜底**：第 12 天根据玩家实际完成的支线、关键选择与数值条件，提供五条专属剧情回响分支，并配备完善的通用兜底逻辑，确保每条旅程均有独特的阶段反馈。
- **D6 粉条剧情桥接**：补全第 6 天粉条剧情桥接，强化前后线索衔接与核心梗事件的逻辑连贯性。
- **猪名叙事连续性**：统一并修复杀猪与养猪相关剧情中的小猪命名逻辑，保持全篇上下文称呼与设定连贯。
- **路人结局图鉴提示修正**：标题页图鉴的“路人结局”提示已从错误的好感不足50条件改为“无条件：终章始终可选”，与 D13 final_bye 实际逻辑一致。

### 🌐 独立分享路由与导航流转
- **保留游戏中心并新增独立直达路由**：保留 `/games` 游戏中心总览；新增 `/games/yujie` 独立直达路由，正式分享地址为 `https://jumaomaomaoju.cn/games/yujie`。
- **直达与导航交互**：支持直接访问 `/games/yujie` 或页面刷新直达雨姐游戏；在 `/games` 游戏中心点击雨姐卡片后地址同步切换至独立路由；游戏内左上角“← 返回游戏列表”入口可正常返回 `/games`。
- **其他小游戏兼容**：贪吃蛇、俄罗斯方块、扫雷、2048 与华容道等其他小游戏的原有挂载与交互行为保持不变。

### 📱 界面布局与 HUD 语义优化
- **HUD 语义精细化**：重构 HUB、夜间结算、D12 终局前夕及 D13 结算节点的 HUD 语义展示，清晰传达各时序状态与当前场景目标。
- **里程碑提示与多选项排版**：增加已完成路线的里程碑提示；对于 4 个及以上选项的场景自动启用双列布局，减少长列表滑动并提升交互体验。
- **移动端视口适配**：390px 移动端规则已全面实现与优化，紧凑排布防止溢出，复杂机型场景仍建议在真机环境下进行复核。

### 📊 验证与流程测试
- **测试全量通过**：49/49 项自动化测试全部通过，200 局随机流程仿真测试无死局；生产环境构建顺利完成。
- **端到端流程巡检**：在 1280×720 视口浏览器环境下完成 D1 至 D13 直播路线全流程实机验证。

### 🤝 协作与责任边界
- 前端交互逻辑、路由分流、独立分享适配及工程文档由 gemini-3.7-flash-high 编写；最终由 Codex 原样应用并完成独立检查、浏览器验收与部署。

## [2026-08-24] - 🎮 《雨姐的心动时刻》v2.2 流程指引与视觉演出升级

### 🧭 流程与机制重构
- **序章 + 四个正篇阶段结构**：重构流程为序章 + 四个正篇阶段（acts 共 5 段：D1 / D2-5 / D6-8 / D9-11 / D12-13），使 13 天乡村旅程节奏更加紧凑明晰。
- **愿望系统与指引定位**：六种愿望仅作为指引推荐，不强行锁死玩家路线；第 3 天固定事件免费保留 2 AP，第 6/9 天各消耗 1 AP 并保留 1 AP 供自由探索，第 12 天接入 `specialSchedule` 机制。
- **行动点与分支交互优化**：睡觉结算增加剩余 AP 内联确认提示；分支锁定仅在具备明确 `lockedHint` 时显示对应条件提示。

### 🎨 画面与演出升级
- **全新剧情 CG**：新增 6 张 1672x941 PNG 高清 CG，覆盖徒手扛猪、灶台做菜、杀猪大宴、大鹅突袭、深入鹅巢及热闹直播全套高潮剧情。
- **立绘体系与视效适配**：新增 7 张透明背景动作立绘，大幅减少重复动作；CG 事件自动隐藏前景人物立绘；引入 `ResizeObserver` 动态计算 `--dialogue-height`，彻底解决全身立绘被底部对话框截腿的问题；CG 采用 `contain` 配合模糊渐变底图，防止手机端画面裁切。

### 📱 界面与移动端体验
- **旅程指引与面板丰富**：新增旅程指引、固定日程倒计时、推荐路线及旅途手记模块。
- **数据兼容与 HUD 重构**：`wishId` 机制向下兼容旧版 `yujie_save_v2` 存档；360x800 与 390x844 常见移动端分辨率下，HUD 五项核心状态完整平铺展示，无需横向滑动。

### 📊 数据与自动化测试
- **内容数据扩充**：全量升级至 36 个事件（events）、59 条对话脚本（dialogue lines）与 83 个分支选项（choices）。
- **测试矩阵与唯一映射**：补齐调度流程、心愿指引、姿态切换、CG 唯一映射和多分支推进测试套件。

### 🤝 协作与责任边界
- 视觉素材由 Codex 生成并进行质量检查；前端交互逻辑、视觉适配及工程文档由 gemini-3.7-flash-high 编写；最终由 Codex 原样应用并完成独立验收。

### ✅ 本地验证（未正式上线）
- ESLint 检查 0 warning；`tsc --noEmit` 类型校验通过。
- Vitest 6 个测试文件、43 项自动化测试全量通过；`npm run build` 生产构建成功。
- 本地 Chrome 1440x900、390x844、360x800 分辨率实机完成巡检，验证 D3 行动点结算、全身立绘比例、CG 唯一映射、睡觉内联确认及移动端 HUD 显示无异常。

### 📌 影响范围
- `src/components/YujieGame.jsx`
- `src/components/YujieGame.css`
- `src/data/yujieGameData.js`
- `src/data/yujieGameEngine.js`
- `src/data/yujieGameEvents.js`
- `test/yujieGameData.test.js`
- `test/yujieGameFlow.test.js`
- `docs/雨姐游戏开发文档.md`
- `docs/雨姐游戏使用说明.md`
- `docs/CHANGELOG.md`
- `public/images/游戏图片说明.md`
- `public/images/yujie/`（13 张新增 v2 PNG 素材）

## [2026-08-24] - 🎮 《雨姐的心动时刻》v2.1 存档机制与 UI 深度优化

### ✨ 新特性与存档机制
- **自动存档系统**：游戏进行中的每个行动点与对话节点自动写入持久化存档，支持“继续上次旅程”、“重新开始”与“保存并回标题”完整闭环。
- **容错与生命周期管理**：引入严格坏档检测与防御机制，损坏或版本不匹配的存档自动安全降级忽略；触发结局时自动清理进行中的活动存档，同时完整保留浏览器本地图鉴与收集记录。

### 🎨 UI 与视效体验优化
- **布局遮挡与裁切修复**：修复开始页顶部内容裁切问题，解决返回按钮遮挡角色状态栏、物品栏与地图层叠遮挡等排版冲突。
- **移动端与立绘调优**：手机端重构为双行 HUD 紧凑布局；优化旁白立绘过暗问题；修复地点枢纽（Hub）切换时的动画跳位现象。

### ♿ 无障碍与键盘交互
- 优化“继续”等核心推进按钮的语义化标记与全键盘无障碍操作支持。
- 选项效果飘字提示接入 `aria-live` 动态播报；动画与过渡动效严格限定于局部作用域，完整兼容系统的 `prefers-reduced-motion` 设置。

### ✅ 验证与回归测试
- `npm run lint`、32 项自动化测试套件（`npm test`）、`npm run typecheck` 与 `npm run build` 全部通过。
- 完成 1470x723 桌面端与 390x844 手机端响应式实机巡检。
- 验证游戏流程中断后退出重进可精准恢复至同一句剧情；验证第 2 天后山榛蘑采集等支线地点的界面与状态交互完全正常。

## [2026-08-23] - 🚀 创意工坊与 Git 自动发布

### ✨ 新特性
- 新增 `/creative` 创意工坊，集中展示 30 套独立博客排版方案与完整预览。
- 30 个主题全部获得独立刊物身份、主叙事、至少 3 个次级栏目、资料模块、专属交互和收尾区。
- 首页和导航加入创意工坊入口，预览资源统一放在 `public/creative-blogs/`。
- 新增 `docs/CREATIVE_WORKSHOP_CONTENT_DESIGN.md`，记录 30 个主题的完整内容设计、叙事架构与排版规范。

### 🔧 部署自动化
- 甲骨文新增 `orange-cat-blog-deploy.timer`，每分钟检查 GitHub `main`。
- 新提交先在独立低权限账号下完成依赖安装、lint、测试、类型检查和生产构建，通过后才原子切换 release。
- 本机健康检查失败会自动回滚；文章数据、环境变量和管理员密钥保持在 release 目录之外。
- 历史 release 暂不自动清理，保留手动回滚能力。
- 橘猫域名防嵌入策略调整为 `SAMEORIGIN`，继续阻止外站嵌入，同时允许创意工坊加载本站快速预览。

### ✅ 验证
- 本地自动化脚本语法检查、项目 lint、测试、类型检查和生产构建通过。
- 甲骨文定时器、首次 Git 自动发布、无变更复检、服务健康和正式域名页面已验证。
- 完成桌面端与 390x844 手机端全量巡检，30 套页面切换器、阅读进度、无横向溢出与控制台零错误均已确认。
- 主题 08 失效图片修复与主题 17 手机端导航适配修复完成，创意工坊快速预览和代表性交互全部通过验证。

## [2026-08-13] - 🚚 正式迁移到甲骨文 VPS

### 🔧 部署架构
- 新增零外部运行时依赖的 Node 文章 API、文件存储、systemd 服务、Caddy 配置和每日备份定时器。
- 正式站点与文章数据迁移到甲骨文 VPS `168.110.59.224`；Cloudflare 仅保留 DNS、代理和缓存。
- 原 Cloudflare Pages 项目解除正式域名绑定，但保留 `web-b0b.pages.dev` 与 KV 作为至少 14 天的回滚副本。

### 🗄️ 数据与安全
- 文章数据写入采用临时文件加原子替换，并保留上一版本与每日备份。
- Node API 仅监听 `127.0.0.1:8361`，写操作继续要求 `X-Admin-Key`。
- VPS 不暴露原 `/api/init-articles` 初始化入口。

### ✅ 验证
- 切换前 Cloudflare API、VPS 数据与切换后正式 API 均为 16 篇文章，规范化 SHA-256 一致。
- lint、32 项自动化测试、类型检查和生产构建通过。
- 正式域名、www、健康检查、文章 API、主要页面、深层链接刷新和管理后台权限校验通过。
- 保留旧 Pages 地址、VPS 上一个 Caddy 配置与数据快照，可快速回滚。

## [2026-08-06] - 💕 《雨姐的心动时刻》推翻重做 v2.0

### ✨ 新特性
- 剧情全面重制：序章 → 13 天自由行动（每天 2 行动点、6 条支线地点）→ 固定日期事件（大鹅突袭/赶集日/雨姐的烦恼/杀猪菜大宴）→ 终章多结局判定。
- 结局从 5 个扩充到 9 个：心动、东北一家人、金牌帮工、带货新星、翻车彩蛋（木薯粉条）、好友、路人、大鹅之主（隐藏）、被赶走（警觉≥45 强制触发）。
- 新增结局图鉴（localStorage 收集）、物品栏展示、选项效果飘字、自由行动地图 UI。
- 引擎与 UI 解耦：纯逻辑抽到 `src/data/yujieGameEngine.js`，组件与测试共用。

### 🐞 修复
- 修复旧引擎 `day`、`addItem` 等选项效果从不生效的问题（物品/天数此前全是摆设）。
- 修复选项条件过滤误传整个 choice 对象导致条件全部放行的隐患。

### 🎨 素材
- 接入真实照片素材：雨姐/老蒯立绘与多场景照片（`public/images/yujie/`），场景缺失时用渐变兜底。

### ✅ 验证
- 新增 `test/yujieGameData.test.js`（数据完整性 7 项）与 `test/yujieGameFlow.test.js`（流程仿真 10 项：九结局全部可达、随机 50 局无死局）。
- `npm run lint`、`npm test`、`npm run build` 通过。

## [2026-08-06] - 🧹 移除七牛云 AI 与 AI 创意工作室

### ✂️ 调整
- 移除七牛云 AI 相关全部代码与 AI 创意工作室模块：`/secret-chat`、`/deepseek-chat`、雨姐 AI 版游戏、相关 Functions 与本地代理。
- 站点配色做减法，回归暖纸感单色点缀。
- 全站文案口语化修订。

## [2026-07-17] - 📰 当下 AI 专题文章更新

### ✨ 新增文章
- 文章 ID `14`：**《GPT-5.6 来了：Sol、Terra、Luna 不是三个名字，而是一套新的 AI 成本分层》**，梳理 GPT-5.6 三档模型、程序化工具调用、多 Agent 并行与成本路由思路。
- 文章 ID `15`：**《Claude Tag 把 AI 拉进 Slack：当 Agent 成为团队成员，真正难的是什么？》**，分析共享 Agent、频道记忆、异步协作、权限与责任边界。
- 文章 ID `16`：**《AI Agent 为什么都在抢“联网可信度”？Google 接入 Parallel Web Search 之后，我看到的下一场竞争》**，解释 Web Grounding、实时引用、多模型编排及企业 RAG 的关系。

### 📝 内容维护
- 新增 `content/articles/`，保留三篇已发布文章的 Markdown 源稿，方便后续校对、改写和灾备。
- 新增 `content/articles/README.md`，说明线上 KV 与本地源稿的职责边界及密钥安全要求。
- 三篇文章均引用 2026 年 6—7 月的官方一手资料，并在正文中区分厂商数据与作者判断。

### ✅ 验证
- 发布前完成必填字段、标签、正文长度和管理员权限校验。
- 发布后逐篇对比本地源稿与线上 API 数据，标题、摘要、日期、分类、阅读时间、正文、标签和作者完全一致。
- 线上文章详情页 `/article/14`、`/article/15`、`/article/16` 均返回 HTTP 200。

### 📌 影响范围
- `content/articles/2026-07-17-gpt-5-6.md`
- `content/articles/2026-07-17-claude-tag.md`
- `content/articles/2026-07-17-agent-web-grounding.md`
- `content/articles/README.md`
- Cloudflare KV 线上文章 ID `14`、`15`、`16`

## [2026-05-25] - 🧭 个人博客完全体改造

### ✨ 新特性
- `src/pages/Archive.jsx`：新增文章归档页，支持年份分组、全文搜索、分类筛选、标签筛选和时间排序。
- `src/pages/Tags.jsx`：新增标签与主题页，支持标签云、URL 标签筛选和分类地图。
- `src/pages/About.jsx` & `src/data/blogProfile.js`：新增关于页与个人博客资料源，集中维护作者档案、近期主题、项目入口和站点时间线。
- `src/pages/ArticleDetail.jsx`：文章详情页新增相关阅读和上一篇/下一篇导航，并将分享操作改为页面内状态提示。
- `src/pages/Home.jsx` & `src/components/home/HomeHero.jsx`：首页升级为个人博客中枢，补齐站点统计、精选阅读、作者档案、分类地图、标签云和项目入口。

### 🔧 优化改进
- `src/components/Navbar.jsx` & `src/components/Footer.jsx`：导航重排为首页、归档、标签、关于、工具箱、游戏、管理，页脚同步补齐博客核心入口。
- `src/utils/blogInsights.js`：新增博客统计、精选文章、年份归档、标签云、分类概览和相关阅读计算工具。
- `src/index.css` & `docs/DESIGN_GUIDE.md`：调整主题色，保留橘猫橙，同时引入青绿/蓝紫辅助色，降低单一橘色和奶油色占比。
- `index.html`：标题与描述改为个人博客定位。
- `README.md`：重写为当前项目真实结构、路由、API、部署和维护规则。

### 🐞 修复
- `src/components/SlidingPuzzle.jsx`、`src/components/WhackAMole.jsx`、`src/pages/tools/TimestampConverter.jsx`：修正项目级 lint 规则警告，保证 `npm run lint` 可通过。

### ✅ 验证
- `npm run lint` 通过。
- `npm test` 通过，新增 `test/blogInsights.test.js` 覆盖博客统计、归档、标签云和相关阅读。
- `npm run typecheck` 通过。
- `npm run build` 通过。
- 使用本地浏览器检查 `/`、`/archive`、`/tags`、`/about`、`/article/1`，关键标题和内容块均渲染，未发现横向溢出或控制台错误。

### 📌 影响范围
- `src/App.jsx`
- `src/components/Navbar.jsx`
- `src/components/Footer.jsx`
- `src/components/home/HomeHero.jsx`
- `src/pages/Home.jsx`
- `src/pages/Archive.jsx`
- `src/pages/Tags.jsx`
- `src/pages/About.jsx`
- `src/pages/ArticleDetail.jsx`
- `src/data/blogProfile.js`
- `src/utils/blogInsights.js`
- `src/index.css`
- `index.html`
- `README.md`
- `docs/DESIGN_GUIDE.md`
- `test/blogInsights.test.js`

## [2026-03-12] - ⚡ 前端加载与文章链路优化

### 🔧 优化改进
- `src/pages/GameHub.jsx`：游戏中心改为按需懒加载，各小游戏拆成独立 chunk，避免进入 `/games` 时一次性下载全部游戏代码。
- `src/hooks/useGoogleCSE.js` & `index.html`：Google CSE 改为首页按需注入，不再全站常驻加载第三方搜索脚本。
- `src/hooks/useIntervalValue.js`、`src/components/home/HomeHero.jsx`、`src/components/home/HomeQuoteCard.jsx`、`src/components/home/HomeStatsCard.jsx`、`src/pages/Home.jsx`：将首页定时刷新与引用数据拆到独立组件，减少首页整页重渲染范围。
- `src/hooks/useArticles.js`、`src/pages/Home.jsx`、`src/pages/ArticleManager.jsx`：统一文章列表获取、加载态与错误态，收敛首页和后台重复的数据流逻辑。
- `src/components/article-manager/ArticleEditor.jsx`、`src/components/article-manager/ArticleListPanel.jsx`、`src/pages/ArticleManager.jsx`：拆分文章管理页编辑区与列表区，后台预览区改为按需加载 Markdown 组件。
- `src/pages/ArticleDetail.jsx` & `src/components/MarkdownRenderer.jsx`：目录提取只计算一次，文章正文改为懒加载；同时移除 `rehype-sanitize`，改为直接忽略 Markdown 中的原生 HTML，减少无效依赖。
- `vite.config.js`：新增更保守的 vendor 分块策略，抽离 `react`、`react-router` 与 `gif.js` 等稳定公共依赖，缩小主入口业务包体。

### 🐞 修复
- `src/components/Minesweeper.jsx`：修复开始新游戏后偶现空棋盘、无格子可点的问题。
- `src/components/SnakeGame.jsx`、`src/components/TetrisGame.jsx`、`src/components/Minesweeper.jsx`、`src/components/Game2048.jsx`：修正一批 Hook 依赖与闭包相关 lint 告警，避免状态过期和行为不稳定。

### 🎯 结果
- `/games` 路由从单块加载改为按需分发，首屏不再携带所有小游戏资源。
- 主入口 `index` 构建产物由约 `169.15 kB` 降至约 `6.35 kB`，公共依赖转为独立缓存。
- 文章详情页外壳可以先于 Markdown 正文渲染，后台编辑页也不再默认加载预览依赖。
- `npm run lint`、`npm test`、`npm run build` 均通过。

### 📌 影响范围
- `src/pages/GameHub.jsx`
- `src/hooks/useGoogleCSE.js`
- `index.html`
- `src/hooks/useIntervalValue.js`
- `src/components/home/HomeHero.jsx`
- `src/components/home/HomeQuoteCard.jsx`
- `src/components/home/HomeStatsCard.jsx`
- `src/pages/Home.jsx`
- `src/hooks/useArticles.js`
- `src/pages/ArticleManager.jsx`
- `src/components/article-manager/ArticleEditor.jsx`
- `src/components/article-manager/ArticleListPanel.jsx`
- `src/pages/ArticleDetail.jsx`
- `src/components/MarkdownRenderer.jsx`
- `src/components/Minesweeper.jsx`
- `src/components/SnakeGame.jsx`
- `src/components/TetrisGame.jsx`
- `src/components/Game2048.jsx`
- `vite.config.js`
- `package.json`
- `package-lock.json`

---

## [2025-12-11] - 🐧 七牛文生图 image_config 切换

### ✂️ 调整
- `src/pages/SeedreamStudio.jsx`：七牛文生图移除旧 `size` 字段，改用 `image_config` 统一下发 `aspect_ratio` 与 `image_size`，默认不传比例、分辨率默认 2K。
- `src/pages/SeedreamStudio.jsx`：参数面板新增最新官方比例选项，Coser 快速生成也复用新的 `image_config` 默认值（2K）。
- `src/pages/SeedreamStudio.jsx`：七牛面板新增 Key 选择下拉（自动/主 Key/备用 Key），请求携带 `X-Qiniu-Key` 头部。
- `functions/api/qiniu-images.js` & `functions/api/qiniu-image-edits.js`：新增备用 Key `QINIU_API_KEY_2` 自动降级并支持前端强制选择；统一错误文案为字符串，避免前端出现 [object Object]。
- `api/qiniu-images.js` & `api/qiniu-image-edits.js`：Vercel 版本同样支持 `X-Qiniu-Key` 选择与备用 Key。

### 📌 影响范围
- `src/pages/SeedreamStudio.jsx`

---

## [2025-12-09] - ✨ 提示词优化双引擎上线

### ✨ 新特性
- `src/pages/SeedreamStudio.jsx`：在 Fal 与七牛提示词输入框旁新增“✨ 优化提示词”按钮，仅在输入非空时可用，调用优化接口围绕用户原文进行深描且不跑题。
- `functions/api/coser-optimize.js` & `api/coser-optimize.js`：新增提示词优化端点，使用七牛文本对话 API 深度扩写用户提示词，严格限制只补充相关细节。

### 🔧 开发支持
- `vite.config.js`：为 `/api/coser-optimize` 增加本地开发代理，便于直接调用优化端点。

### 📌 影响范围
- `src/pages/SeedreamStudio.jsx`
- `functions/api/coser-optimize.js`
- `api/coser-optimize.js`
- `vite.config.js`

---

## [2025-12-08] - 🐾 Seedream v4 默认与调用统一

### ✨ 调整
- `src/pages/SeedreamStudio.jsx`：将隐藏页 Fal 默认模型切换为 Seedream v4，避免初次进入误用 v4.5。
- `src/pages/SeedreamStudio.jsx`：统一 Seedream v4 与 v4.5 的调用参数模板，移除 enhance/max_images 旧字段，编辑模式与随机 Coser 调用保持一致。
- `src/pages/SeedreamStudio.jsx`：清理已失效的提示增强、批量上限输入项，界面与实际 payload 同步。

### 📌 影响范围
- `src/pages/SeedreamStudio.jsx`

---

## [2025-12-03] - 🚀 Seedream v4.5 与体验升级

### ✨ 新特性
- `src/pages/SeedreamStudio.jsx`：新增 **Seedream v4.5** 模型支持，并启用编辑模式 (Edit Mode)，提供更强大的图像生成与编辑能力。
- `src/pages/SeedreamStudio.jsx`：在 Fal 和七牛面板中均增加了 **随机提示词** 功能按钮，方便用户快速获取灵感。
- `src/pages/SeedreamStudio.jsx`：优化 **随机提示词** 逻辑，现在会基于输入框中现有的内容进行扩写，而不是直接覆盖，实现更智能的辅助创作。

### 🔧 优化改进
- `src/pages/SeedreamStudio.jsx`：优化 Fal 图片下载体验，改为 **直接下载** 文件，不再跳转新窗口打开图片。
- `src/pages/SeedreamStudio.jsx`：更新七牛云 (Qiniu) 图片生成尺寸选项，适配最新模型规范。

### 📌 影响范围
- `src/pages/SeedreamStudio.jsx`
- `src/pages/SeedreamStudio.css`

---

## [2025-12-02] - 🎀 随机 Coser 写真生成器

### ✨ 新特性
- `src/pages/SeedreamStudio.jsx`：隐藏入口 `/secret-seedream` 新增「随机 Coser」功能模块，与 Fal.ai / 七牛并列展示。
- `src/pages/SeedreamStudio.jsx`：一键生成中国年轻女生 Coser 写真，流程为：
  1. 调用七牛文本对话 API（gemini-2.5-flash）生成随机动漫/游戏角色 Cosplay 提示词
  2. 并行调用 Fal Seedream v4 与七牛 Gemini 3.0 Pro Image Preview 双引擎生图
  3. 双栏对比展示两个引擎的生成结果
- `functions/api/coser-random.js`：新增 Cloudflare Pages 函数端点 `/api/coser-random`，使用七牛文本对话 API 生成随机 Coser 写真提示词，复用 `QINIU_AI_API_KEY` 环境变量。
- `vite.config.js`：开发环境新增 `/api/coser-random` 代理配置，自动注入本地 API Key。

### 🎨 UI 体验
- `src/pages/SeedreamStudio.css`：新增粉色主题的 Coser 按钮、介绍卡片、提示词展示区域与双引擎对比布局样式。

### 🔧 优化改进 (2025-12-02 第二次更新)
- `src/pages/SeedreamStudio.jsx`：图片即时展示，哪个引擎先返回就先显示，无需等待两个都完成。
- `src/pages/SeedreamStudio.jsx`：统一图片比例，随机选择 1:1 / 9:16 / 16:9 / 3:4 / 4:3 中的一种，两个引擎使用相同比例。
- `src/pages/SeedreamStudio.jsx`：新增自定义输入框，用户可输入想要的元素，AI 会在此基础上生成提示词。
- `src/pages/SeedreamStudio.css`：新增比例徽章样式和加载状态动画。
- `functions/api/coser-random.js` & `api/coser-random.js`：支持 `userInput` 参数，可在用户输入的基础上生成提示词。

### 📌 影响范围
- `src/pages/SeedreamStudio.jsx`
- `src/pages/SeedreamStudio.css`
- `functions/api/coser-random.js`
- `api/coser-random.js`
- `vite.config.js`

---

## [2025-11-25] - 🧹 移除七牛提示卡片

### ✂️ 调整
- `src/pages/SeedreamStudio.jsx`：删除隐藏 Seedream 页面中七牛 Gemini 文生图的说明卡片，避免额外文案暴露并让界面更简洁。

### 📌 影响范围
- `src/pages/SeedreamStudio.jsx`

---

## [2025-11-25] - 🧼 七牛编辑输入精简

### ✂️ 调整
- `src/pages/SeedreamStudio.jsx`：移除图像编辑模式的在线 URL 粘贴选项，仅支持本地文件上传，并将遮罩设置合并进高级参数面板，界面更加紧凑。
- `src/pages/SeedreamStudio.jsx`：七牛画质 (quality) 下拉新增“默认(不传)”选项并设置为默认值，便于保持官方默认画质。
- `src/pages/SeedreamStudio.jsx`：Fal Prompt、七牛 Prompt 以及七牛负面提示词均新增“清空”按钮，便于快速重写提示词。
- `src/pages/SeedreamStudio.jsx`：默认加载时直接展示七牛分页，方便优先使用七牛 Gemini 模块。

### 📌 影响范围
- `src/pages/SeedreamStudio.jsx`

---

## [2025-11-25] - 🛰️ 七牛图生图代理

### ✨ 新特性 / 调整
- `functions/api/qiniu-image-edits.js`：Cloudflare Pages 函数新增 `/api/qiniu-image-edits` 代理，包含 CORS 处理、参数校验与 JSON 解析兜底，默认模型为 `gemini-3.0-pro-image-preview`。
- `api/qiniu-image-edits.js`：Vercel/本地 Serverless 版本与 Cloudflare 保持一致，实现 prompt/image 校验与错误提示。
- `vite.config.js`：开发模式增加 `/api/qiniu-image-edits` 代理，自动注入 `QINIU_AI_API_KEY`，便于前端在本地直接调用编辑端点。

### 📌 影响范围
- `functions/api/qiniu-image-edits.js`
- `api/qiniu-image-edits.js`
- `vite.config.js`

---

## [2025-11-25] - ♻️ 移除 Kling 相关配置

### ✂️ 调整
- `src/pages/SeedreamStudio.jsx`：删除 Kling scene/style/subject 输入与对应状态，仅保留 Gemini 3.0 Pro Image Preview 相关参数，界面更聚焦七牛官方字段。
- `src/pages/SeedreamStudio.css`：移除已无引用的 Kling 主体样式，减轻样式噪音。

### 📌 影响范围
- `src/pages/SeedreamStudio.jsx`
- `src/pages/SeedreamStudio.css`

---

## [2025-11-25] - 🎭 七牛图像编辑面板升级

### ✨ 新特性 / 调整
- `src/pages/SeedreamStudio.jsx`：七牛卡片新增模式切换、批量图像上传、遮罩输入、Kling 主体参考及全量高级参数面板，所有可配置字段均与前端状态联动，并为可选 payload 增加解析逻辑。
- `src/pages/SeedreamStudio.css`：补充上传列表、遮罩状态、Kling 主体输入等样式，保持橘猫圆角与阴影体系。

### 📌 影响范围
- `src/pages/SeedreamStudio.jsx`
- `src/pages/SeedreamStudio.css`

---

## [2025-11-24] - 🐧 七牛文生图实验室切换

### ✨ 新特性 / 调整
- `src/pages/SeedreamStudio.jsx`：隐藏入口 `/secret-seedream` 新增“Fal.ai / 七牛”双 API 切换，沿用原有 Seedream v4 面板，同时为七牛 Text-to-Image 补齐文档列出的全部参数（model/prompt/n/size/quality/style/temperature/top_p/top_k/negative_prompt/image/image_reference/image_fidelity/human_fidelity/aspect_ratio）。
- `functions/api/qiniu-images.js` & `api/qiniu-images.js`：新增七牛 `/v1/images/generations` 代理，统一复用 `QINIU_AI_API_KEY`，默认模型 `gemini-3.0-pro-image-preview`，并提供 JSON 解析兜底。
- `vite.config.js`：开发环境新增 `/api/qiniu-images` 代理，自动注入本地环境变量，便于无后端场景调试。

### 🎨 UI 体验
- `src/pages/SeedreamStudio.css`：新增 API 切换按钮、七牛用量徽章与移动端适配。

### 📌 影响范围
- `src/pages/SeedreamStudio.jsx`
- `src/pages/SeedreamStudio.css`
- `functions/api/qiniu-images.js`
- `api/qiniu-images.js`
- `vite.config.js`

---

## [2025-11-24] - 🤖 AI 对话模型精简

### ✨ 新特性 / 调整
- `src/pages/AIChat.jsx`：移除模型目录分组，改为单层列表，让移动端切换模型无需二次点击。
- 只保留 `gemini-3.0-pro-preview`、`gemini-2.5-pro`、`openai/gpt-5`、`claude-4.5-sonnet`、`deepseek/deepseek-v3.2-exp-thinking`，与最新后端可用模型保持一致。
- 为卡片补充描述与 ID badge，方便排查调用参数。

### 📌 影响范围
- `src/pages/AIChat.jsx`

---

## [2025-11-22] - 🛠️ Gemini 3 Pro 改图端点修复

### 🐞 问题
- 隐藏页面 Seedream Studio 的 Gemini 3 Pro 改图模式依旧调用文生图端点，Fal 上传的 `image_urls` 被忽略，生成结果不再基于用户上传图片

### ✅ 修复
- `src/pages/SeedreamStudio.jsx` 中针对 Gemini 3 Pro 区分文生图与改图端点，改图模式切换为官方文档要求的 `fal-ai/gemini-3-pro-image-preview/edit`
- 为逻辑新增注释，明确端点差异与 `image_urls` 依赖关系，避免未来回归时误用
- 同步调整 Gemini 3 Pro 的默认纵横比与分辨率至 `1:1 @ 2K`，保持与最新需求一致

### 🔎 影响范围
- `src/pages/SeedreamStudio.jsx`

---

## [2025-11-19] - 🔐 管理员校验路由兼容 (Cloudflare)

### 🐞 问题
- 在自定义域名 `jumaomaomaoju.cn` 上，文章管理页的密码验证请求使用 `POST /api/articles/auth-check`
- Cloudflare Pages Functions 只会将精确匹配 `/api/articles` 的请求交给 `functions/api/articles.js`
- 结果：`/api/articles/auth-check` 在边缘直接返回 `405 Method Not Allowed`

### ✅ 修复
- 将管理员校验改为 `POST /api/articles?id=auth-check`，通过查询参数把动作标识传递给现有函数
- 在 `src/pages/ArticleManager.jsx` 增加注释，说明为什么必须使用查询参数以保持与 Cloudflare 路由兼容

### 🔎 影响范围
- `src/pages/ArticleManager.jsx`

---

## [2025-11-19] - 🎨 全站 UI 重构：高互动与设计感升级

### ✨ 核心重构 (Core Refactor)
- **全局样式系统升级** (`index.css`)：
  - 引入现代化 CSS 变量系统（字体、圆角、阴影、渐变）。
  - 新增玻璃拟态 (`.glass`)、淡入 (`animate-fade-in`)、上滑 (`animate-slide-up`) 等动效工具类。
  - 优化深色模式支持，确保全站主题统一。
  - 美化滚动条与全局 typography。

- **布局组件化** (`src/components/Layout`):
  - 抽离 `Navbar` 为独立组件，实现玻璃拟态吸顶效果与移动端响应式菜单。
  - 抽离 `Footer` 为独立组件，整合站点统计与版权信息。
  - 创建 `Layout` 容器，统一管理页面结构与路由包裹。

### 🏠 页面改版 (Page Redesign)
- **首页 (`Home.jsx`)**：
  - **Hero Section**：全新设计的欢迎区域，包含动态问候、心情展示与头像弹跳动画。
  - **文章网格**：采用 Masonry 风格布局，卡片增加悬停上浮与光影效果。
  - **侧边栏**：整合名言、搜索与统计模块，采用卡片式设计。
  - **交互增强**：分类标签切换动画、返回顶部按钮平滑过渡。

- **文章详情页 (`ArticleDetail.jsx`)**：
  - **沉浸式阅读体验**：优化文章排版，增加首字下沉与引言样式。
  - **头部元信息**：美观展示分类、阅读时间、作者信息。
  - **Markdown 渲染优化**：美化标题、列表与代码块样式。
  - **状态反馈**：增加加载中与错误状态的趣味动画展示。

- **AI 对话 (`AIChat.jsx`)**：
  - **界面重构**：玻璃拟态聊天窗口，浮动式输入框。
  - **侧边栏优化**：更清晰的模型分类与选择交互。
  - **气泡样式**：区分用户与 AI 消息样式，支持 Markdown 渲染。

- **AI 画板 (`ImageGenerator.jsx`)**：
  - **仪表盘布局**：左侧控制面板 + 右侧结果展示，操作更流畅。
  - **卡片式展示**：生成结果采用大图卡片，支持悬停预览与快捷下载。
  - **模板选择**：可视化模板与风格选择器。

- **文章管理 (`ArticleManager.jsx`)**：
  - **表格美化**：现代化表格样式，悬停高亮，清晰的操作按钮。
  - **弹窗表单**：新增/编辑采用模态框形式，体验更佳。

### 🛠️ 技术改进
- 重构 `App.jsx` 路由结构，采用更清晰的 Layout 包裹模式。
- 移除过时的内联样式，全面拥抱 CSS 类与变量。
- 增强移动端适配，确保所有交互元素符合触控标准。

---

## [2025-11-17 晚间] - 🧹 清理示例文章数据

### 📝 数据清理
- **清空开发环境示例文章**：
  - 文件：`vite.config.js`
  - 清理：删除 `mockArticles` 数组中的 2 篇测试文章
  - 状态：保留空数组结构 `mockArticles = []`
  - 用途：通过文章管理页面手动添加实际文章

- **清空生产环境示例文章**：
  - 文件：`functions/api/init-articles.js`
  - 清理：删除 `defaultArticles` 数组中的 12 篇测试文章
  - 状态：保留空数组结构 `defaultArticles = []`
  - 用途：通过文章管理页面添加真实博客内容

### ⚙️ 技术说明
- 数据结构保持不变，仅清空示例内容
- 文章 CRUD API 功能正常可用
- 开发环境和生产环境数据结构保持一致

---

## [2025-11-17 晚间] - 🎯 首页布局重构：聚焦开源项目

### 🔄 页面结构重大调整

#### 1. 快速导航区改版
- **移除内容**：删除原有四卡片导航区中的"Java核心"、"Spring生态"、"微服务架构"三个卡片
- **保留卡片**：仅保留"开源项目"卡片，作为页面核心入口
- **布局转换**：从横向网格布局转为左侧固定+右侧内容的两栏布局

#### 2. 左侧边栏 - 开源项目特色展示区
**组件更新**：`src/pages/Home.jsx`
- **新增元素**：
  - `.sidebar-project`：左侧边栏容器（宽度 280px）
  - `.project-card-featured`：特色项目大卡片
  - `.project-icon`：超大项目图标（💻，4rem）
  - `.project-description`：详细项目描述文案
  - `.project-button`：橘色渐变访问按钮（带箭头动画）
  - `.project-stats`：项目统计模块（Star/Fork 快捷入口）

- **卡片内容**：
  - 标题："开源项目"
  - 描述："查看我的 GitHub 代码仓库，探索技术实践与开源贡献"
  - 按钮："访问 GitHub" + 箭头图标（→）
  - 统计项：⭐ Star 项目、🔗 Fork 代码

#### 3. 两栏布局实现
**样式更新**：`src/App.css`
- **新增样式类**：
  - `.main-content-layout`：Flexbox 两栏容器（gap: 2rem）
  - `.sidebar-project`：左侧栏固定宽度 280px，sticky 定位（top: 120px）
  - `.main-content-area`：右侧主内容区（flex: 1）

#### 4. 视觉增强特性
**卡片交互设计**：
- **背景效果**：
  - 线性渐变背景（`var(--card-bg)` → `#FFF5E6`）
  - 3px 橘色实线边框
  - 悬停时触发径向渐变动态光晕（opacity 0 → 1）

- **悬停动画**：
  - 卡片整体向上提升 8px 并放大 1.03 倍
  - 图标旋转 10° 并放大 1.15 倍
  - 箭头图标向右平移 5px
  - 阴影从 24px 扩展至 48px（rgba(255, 159, 69, 0.4)）

- **按钮特效**：
  - 橘猫渐变背景（`var(--gradient-warm)`）
  - 点击时内部爆发 300px 直径白色光环（opacity: 0.3）
  - 胶囊圆角（`var(--radius-full)`）

#### 5. 响应式适配方案

**桌面端**（>1024px）：
- 左侧栏 280px + 右侧主内容区 flex-grow
- 卡片 sticky 定位，滚动时保持可见

**平板端**（768px - 1024px）：
- 左侧栏缩窄至 240px
- 图标缩小至 3.5rem
- 内边距适度压缩

**移动端**（<768px）：
- **布局转换**：flex-direction 改为 column（单列）
- **顺序调整**：开源项目卡片通过 `order: -1` 置顶显示
- **宽度调整**：侧边栏改为全宽（width: 100%）
- **定位变化**：从 sticky 改为 static（取消悬浮）

**超小屏**（<480px）：
- 图标缩至 3rem
- 标题字号降至 1.3rem
- 按钮改为全宽显示（width: 100%）

### 📁 影响文件清单
1. **src/pages/Home.jsx**
   - 删除 `.quick-nav-section` 快速导航网格
   - 新增 `.main-content-layout` 两栏容器
   - 新增 `.sidebar-project` 左侧项目卡片
   - 原有内容迁移至 `.main-content-area` 右侧区域

2. **src/App.css**
   - 新增首页两栏布局样式（第 2103 行后）
   - 新增特色项目卡片完整样式系统
   - 新增三断点响应式媒体查询
   - 保留原快速导航样式（标记为备用）

### 🎯 设计目标达成
✅ 突出开源项目核心入口，提升曝光度
✅ 桌面端左侧固定展示，移动端顶部优先
✅ 符合橘猫主题配色（橙色系 + 圆角设计）
✅ 响应式全覆盖（320px - 2560px 屏幕）
✅ 交互动画丰富（悬停/点击反馈充分）

---

## [2025-11-17] - 🎨 首页全面UI优化

### ✨ 视觉设计升级

#### 1. 全局字体与配色
- **现代字体栈**：在 `src/index.css` 中引入 `Noto Sans SC` 和 `PingFang SC` 作为优先字体，提升中文阅读体验
- **字号层级规范**：新增 CSS 变量定义标准字号体系
  - 基准字号 15px，大正文 16px，小字 13px
  - 标题层级：H1(28px) → H2(24px) → H3(20px) → H4(18px)
- **链接增强识别**：统一文本链接添加下划线与悬停高亮效果，提升可操作性辨识度

#### 2. 顶部导航栏增强
- **悬浮效果**：导航栏添加滚动监听，滚动后自动紧缩并增强阴影
- **Logo 交互**：Logo 悬停时产生缩放+旋转动画，增强品牌趣味性
- **菜单项优化**：
  - 增加菜单项间距至 1rem，避免拥挤感
  - 悬停时添加光晕扩散效果与 3D 提升动画
  - 按钮背景从半透明提升至 12%，激活态达 28%

#### 3. 卡片系统全面改版
- **文章卡片**：
  - 圆角从 16px 提升至 24px，营造更柔和视觉
  - 悬停时卡片提升 8px 并放大 1.02 倍，配合动态阴影变化
  - 顶部渐变色条从左向右展开作为激活指示器
  - 橘猫爪印装饰在悬停时放大旋转，增强趣味性
- **分类标签**：
  - 移至卡片右上角，采用胶囊形状设计
  - 悬停时标签本身也会缩放提升，与卡片形成联动
- **快速导航卡片**：
  - Icon 悬停时放大 1.2 倍并旋转 10 度
  - 卡片提升高度增至 10px，配合微缩放效果

#### 4. 分类标签胶囊设计
- **形状优化**：所有分类标签统一采用圆角胶囊形状（border-radius: 9999px）
- **交互反馈**：
  - 悬停时标签向上浮动 3px 并放大 1.05 倍
  - 添加内部光效扫过动画，从左至右滑动高光
  - 激活标签使用橘猫渐变填充，并自动提升显示
- **触控友好**：最小高度设置为 44px，符合移动端触控规范

#### 5. 按钮系统统一设计
- **主要按钮**（.btn-primary）：
  - 橘猫渐变背景 + 圆角胶囊形状
  - 悬停时内部爆发圆形光效（300px 直径）
  - 提升 4px 并放大 1.05 倍，阴影强化至 0.4 透明度
- **次要按钮**（.btn-secondary）：
  - 白色背景 + 橘色边框，悬停时背景变暖色调
  - 一致的提升动画与阴影变化
- **操作按钮**（编辑/删除）：
  - 编辑按钮采用橘色系，删除按钮采用红色系
  - 悬停时按钮同样提升 2px 并放大 1.1 倍
  - 最小尺寸 40x40px，确保触控准确性

#### 6. 页脚与返回顶部
- **页脚装饰**：
  - 渐变背景从米白到橘黄过渡
  - 左右各添加大号半透明橘猫爪印装饰
  - 顶部橘色边框加粗至 3px
- **返回顶部按钮**：
  - 固定在右下角的圆形悬浮按钮（56x56px）
  - 滚动超过 400px 时平滑淡入显示
  - 悬停时提升 5px 并放大 1.1 倍，点击即平滑滚动至顶部

#### 7. 移动端响应式优化
- **汉堡菜单**：
  - 768px 以下屏幕显示汉堡图标按钮
  - 点击后从右侧滑出全屏抽屉式菜单（75% 宽度，最大 300px）
  - 菜单项垂直排列，每项高度不低于 48px
  - 菜单打开时背景添加半透明遮罩层
- **按钮尺寸**：
  - 所有交互元素最小尺寸统一为 48x48px（iOS 触控标准）
  - 卡片、标签、按钮均确保足够触控面积
- **防止横向滚动**：
  - 导航菜单改为垂直堆叠
  - 网格布局在移动端自动切换为单列

#### 8. 动效与微交互
- **页面加载动画**：
  - 页面标题从上方淡入下滑（fadeInDown）
  - 各区块从下方滑入（slideInUp）
  - 文章卡片依次出现，每张延迟 0.05 秒形成波浪效果
  - 分类标签以缩放淡入方式依次显示
- **快速导航动画**：
  - 四张卡片依次从下方滑入，延迟递增 0.1 秒
  - Icon 悬停旋转 + 放大组合动画
- **过渡优化**：
  - 所有动画采用 cubic-bezier(0.4, 0, 0.2, 1) 缓动函数
  - 颜色、阴影、变换统一过渡时间 0.3-0.4 秒

### 📂 文件变更清单

#### 修改文件
- `src/index.css`：全局字体、字号变量、链接与按钮基础样式
- `src/App.css`：导航栏、卡片、标签、按钮、页脚、动画等核心样式
- `src/App.jsx`：导航栏滚动监听、移动端菜单状态管理
- `src/pages/Home.jsx`：返回顶部按钮功能实现
- `CHANGELOG.md`：本次优化完整记录

### 🎯 优化效果

✅ **视觉层次更清晰**：字号体系规范，标题与正文对比明显
✅ **交互反馈更丰富**：所有可点击元素均有明确的悬停/点击动画
✅ **移动体验提升**：抽屉式菜单、触控友好按钮、无横向滚动
✅ **加载体验优化**：页面元素依次淡入，减少突兀感
✅ **品牌一致性**：橘猫主题色贯穿所有组件，统一圆角胶囊设计

---

## [2025-11-17] - 🖼️ Seedream v4 图像编辑能力

### ✨ 新功能

- 在 `src/pages/SeedreamStudio.jsx` 中加入模式切换，支持切换到改图模式并调用 `fal-ai/bytedance/seedream/v4/edit`
- 在改图模式下新增本地上传与 URL 粘贴两种入图方式、控制强度滑块，以及实时预览与移除入口

### 💅 样式更新

- `src/pages/SeedreamStudio.css` 新增模式切换、上传预览、标签按钮等橘猫主题样式，保持与现有面板视觉一致

### 🧪 行为优化

- 在 `SeedreamStudio.jsx` 中统一处理 Fal.ai 返回结构，沿用文生图解析逻辑以兼容 `result.data.images`
- 引入 Fal.ai 存储上传流程，确保本地文件可安全传递至改图 API

---

## [2025-11-17] - 🎨 新增 Seedream v4 隐藏实验室

### ✨ 新功能

- 在 `src/pages/SeedreamStudio.jsx` 中新增 Fal.ai Seedream v4 文生图实验室页面，支持尺寸预设、自定义尺寸、增强模式、同步模式以及安全检查等参数调节
- 结果面板支持查看生成种子、批量展示图片并提供下载入口，兼容 URL 与 Base64 两种返回格式

### 🔐 用户体验

- 提供本地 API Key 管理：页面允许输入、保存与清除 FAL_KEY，信息仅存储在浏览器 `localStorage`
- 在 `src/App.jsx` 注册隐藏路由 `/secret-seedream`，仅通过手动访问启用高级面板

### 📦 依赖调整

- 在 `package.json` 中新增 `@fal-ai/client` 依赖以调用 Fal.ai SDK

### 📚 文档同步

- 在 `README.md` 的 AI 图片生成章节补充隐藏实验室入口与使用说明

---

## [2025-11-15] - 🔒 Worker 反向代理安全加固

### 🛡️ 安全增强（Security Enhancement）

#### 问题背景
对现有的 Cloudflare Worker 反向代理进行安全审计，发现以下潜在风险：
1. **Source Map 泄露** - Vite 生产构建默认生成 `.map` 文件，可能暴露源代码
2. **响应头信息泄露** - 仅清理了 4 个响应头，存在服务器指纹识别风险
3. **错误处理缺失** - 原站错误信息可能直接传递给用户
4. **缺少安全策略头** - 无 CSP、Referrer Policy 等现代安全头部

#### 影响评估
- 🔴 **Source Map**: 高风险，攻击者可查看完整源码、文件路径、注释
- 🟡 **响应头泄露**: 中风险，可通过服务器指纹推测原站架构
- 🟡 **错误信息**: 中风险，可能暴露原站域名或配置信息
- 🟢 **缺少安全头**: 低风险，但违反安全最佳实践

### ✅ 实施的加固措施

#### 1. 禁用 Source Map（`vite.config.js`）
```javascript
build: {
  sourcemap: false,          // 🔒 禁用 Source Map
  minify: 'esbuild',         // 使用 esbuild（Vite 内置，速度更快）
  esbuildOptions: {
    drop: ['console', 'debugger'], // 移除 console.log 和 debugger
    legalComments: 'none',         // 移除所有注释
  },
}
```
**防护效果**: 生产环境不再生成 `.map` 文件，攻击者无法逆向源代码
**性能优化**: 从 Terser 切换到 esbuild，构建速度提升约 10 倍

#### 2. 增强响应头清理（`workers/game-proxy.js`）
新增清理的响应头（从 4 个增加到 13 个）：
```javascript
const headersToRemove = [
  'x-powered-by', 'server', 'x-vercel-id', 'x-cloudflare-request-id',
  'x-amz-cf-id', 'x-amz-cf-pop', 'x-cache', 'via',
  'x-served-by', 'x-timer', 'x-fastly-request-id',
  'cf-ray', 'cf-cache-status'
];
```

新增安全响应头：
```javascript
'x-content-type-options': 'nosniff'      // 防止 MIME 嗅探
'x-frame-options': 'DENY'                // 防止点击劫持
'referrer-policy': 'no-referrer'         // 🔒 防止 Referer 泄露
'content-security-policy': '...'         // 内容安全策略
```

#### 3. 添加严格的 CSP（内容安全策略）
```javascript
content-security-policy:
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
  "connect-src 'self'; " +  // 🔒 限制只能连接当前域名
  "object-src 'none'; " +
  "base-uri 'self'"
```
**防护效果**: 即使攻击者注入脚本，也无法连接外部服务器

#### 4. 完善错误处理
```javascript
try {
  // ... 代理逻辑
} catch (error) {
  return new Response(JSON.stringify({
    error: 'Service temporarily unavailable'  // 🔒 不暴露具体错误
  }), { status: 503 });
}
```
**防护效果**: 原站的 500/404 错误不会泄露给用户

### 📝 新增文档

- **WORKER_SECURITY_GUIDE.md** - Worker 安全加固完整指南
  - ✅ 已实施的安全措施详解
  - ⚠️ 仍存在的理论风险分析（时序攻击、TLS 指纹等）
  - 🛡️ 额外安全建议（限速、监控、内容扫描）
  - 📋 部署前检查清单
  - 🆘 应急响应流程

### 📊 安全测试建议

部署后执行以下检查：
```bash
# 1. 确认无 Source Map
ls dist/assets/*.map  # 应该没有输出

# 2. 检查响应头
curl -I https://your-worker-domain.com

# 3. 在线安全扫描
# 访问 https://securityheaders.com 输入域名
```

### 🔄 后续维护要求

每次代码更新后必须：
1. 确认 `sourcemap: false` 仍然生效
2. 检查是否有新的硬编码域名
3. 重新构建并验证 `dist/` 中无 `.map` 文件

### ⚠️ 已知限制

以下风险由于技术限制无法完全消除：
- **时序攻击**: 通过响应时间推测服务器位置（风险等级：低）
- **TLS 指纹**: SSL 握手特征分析（已使用 Cloudflare 证书缓解）
- **社会工程**: WHOIS/DNS 查询（需使用隐私保护 WHOIS）

详见 `WORKER_SECURITY_GUIDE.md` 的"仍存在的理论风险"章节。

---

## [2025-01-15] - 🔒 重大安全更新：移除所有硬编码 API Key

### 🚨 安全修复（Critical）

#### 问题描述
在全面安全审计中发现多处硬编码的 API Key，存在严重的安全隐患：
- 七牛云 AI API Key 硬编码在 2 个文件中
- 火山引擎 API Key 硬编码在 4 个文件中
- 其中 1 处在前端代码中（最危险）

#### 影响范围
如果代码仓库为公开状态，任何人都能看到这些 API Key，可能导致：
- API 额度被盗用
- 产生意外费用
- 服务被滥用

#### 解决方案
**全面移除硬编码，采用环境变量方案**：

1. **后端 API 函数**（Cloudflare Functions）
   - ✅ `functions/api/ai-chat.js` - 移除硬编码，仅从 `context.env.QINIU_AI_API_KEY` 读取
   - ✅ `functions/api/generate-image.js` - 移除硬编码，仅从 `context.env.ARK_API_KEY` 读取
   - ✅ `api/generate-image.js` - 移除硬编码，仅从 `process.env.ARK_API_KEY` 读取
   - ✅ 添加环境变量检查，缺少时返回 500 错误和提示信息

2. **开发环境配置**（Vite）
   - ✅ `vite.config.js` - 从 `process.env` 读取，提供占位符
   - ✅ 支持通过 `.env` 文件配置本地开发 API Key

3. **前端代码**
   - ✅ `src/pages/ImageGenerator.jsx` - 移除硬编码的 API Key
   - ✅ 前端不再包含任何敏感信息

### 📝 配置变更

#### 新增文件
- **SECURITY_CHECKLIST.md** - 安全检查清单和最佳实践文档
  - 包含快速安全扫描命令
  - API Key 泄露修复步骤
  - 定期检查项目清单

#### 修改文件
- **README.md** - 添加环境变量配置说明
  - 本地开发 `.env` 配置步骤
  - Cloudflare Pages 环境变量配置说明
  - 安全提醒和注意事项

- **.env.example** - 已存在，无需修改
  - 提供环境变量模板
  - 不包含真实 API Key

- **.gitignore** - 已包含 `.env`（无需修改）
  - 确保环境变量文件不被提交

### 🔧 使用指南

#### 本地开发配置

1. 复制环境变量模板：
   ```bash
   cp .env.example .env
   ```

2. 编辑 `.env` 文件，填入真实 API Key：
   ```env
   ARK_API_KEY=你的火山引擎API密钥
   QINIU_AI_API_KEY=你的七牛云AI API密钥
   ```

3. 启动开发服务器：
   ```bash
   npm run dev
   ```

#### Cloudflare Pages 生产环境配置

1. 登录 Cloudflare Dashboard
2. 进入项目 Settings → Environment variables
3. 添加以下环境变量：
   - `ARK_API_KEY` = 火山引擎 API 密钥
   - `QINIU_AI_API_KEY` = 七牛云 AI API 密钥
4. 保存后重新部署

### ✅ 安全检查结果

- ✅ 所有硬编码 API Key 已移除
- ✅ 前端代码不包含任何敏感信息
- ✅ 后端增加环境变量校验
- ✅ `.env` 文件已在 `.gitignore` 中
- ✅ 未发现个人信息泄露（penghaoxiang、958656603 等）

### ⚠️ 重要提醒

1. **立即更换旧 API Key**（如果仓库曾公开）：
   - 登录火山引擎控制台，重置 API Key
   - 登录七牛云控制台，重置 API Key
   - 更新 Cloudflare Pages 环境变量

2. **Git 历史清理**（如果敏感信息已提交）：
   - 参考 `SECURITY_CHECKLIST.md` 中的清理步骤
   - 使用 BFG Repo-Cleaner 或 git-filter-branch

3. **设置仓库为私有**（推荐）：
   - GitHub 仓库设置 → Settings → Danger Zone → Change visibility

---

## [2025-11-12] - 修复文章管理 API 405 错误

### 🐛 Bug 修复

#### 问题描述
在自定义域名 `jumaomaomaoju.cn` 上，文章的编辑和删除功能返回 405 Method Not Allowed 错误，但创建功能正常。

#### 根本原因
Cloudflare 的安全规则会拦截带数字路径参数的 POST 请求（如 `POST /api/articles/1`），这是为了防止 CSRF 攻击等安全威胁。

#### 解决方案
采用查询参数替代路径参数的方式：

**修改前**：
- 编辑：`PUT /api/articles/1`
- 删除：`DELETE /api/articles/1`
- 问题：被 Cloudflare 拦截返回 405

**修改后**：
- 编辑：`POST /api/articles?id=1` + `X-HTTP-Method-Override: PUT`
- 删除：`POST /api/articles?id=1` + `X-HTTP-Method-Override: DELETE`
- 结果：✅ 成功绕过拦截

### 📝 技术实现

#### 前端修改 (`src/pages/ArticleManager.jsx`)
```javascript
// 编辑文章
const url = editingArticle
  ? `/api/articles?id=${editingArticle.id}`  // 使用查询参数
  : '/api/articles'

const response = await fetch(url, {
  method: 'POST',  // 统一使用 POST
  headers: {
    'Content-Type': 'application/json',
    ...(editingArticle && { 'X-HTTP-Method-Override': 'PUT' })  // 通过头指定实际方法
  },
  body: JSON.stringify(formData)
})

// 删除文章
const response = await fetch(`/api/articles?id=${article.id}`, {
  method: 'POST',
  headers: {
    'X-HTTP-Method-Override': 'DELETE'
  }
})
```

#### 后端修改 (`functions/api/articles.js`)
```javascript
// 同时支持查询参数和路径参数，优先使用查询参数
const pathParts = url.pathname.split('/').filter(p => p)
const articleId = url.searchParams.get('id') || pathParts[2]

// 支持 X-HTTP-Method-Override 头
const methodOverride = request.headers.get('X-HTTP-Method-Override')
if (method === 'POST' && methodOverride) {
  method = methodOverride.toUpperCase()
}

// POST 请求检查，防止误匹配
case 'POST':
  if (articleId) {
    return errorResponse('POST 请求不应包含文章 ID，请使用 PUT 更新文章', 400)
  }
  const createData = await request.json()
  return await createArticle(env, createData)
```

### ✅ 验证结果

所有功能测试通过：
- ✅ GET 请求正常
- ✅ POST 创建文章正常
- ✅ POST + Override: PUT 编辑文章正常
- ✅ POST + Override: DELETE 删除文章正常

### 📚 相关文档更新

- 更新 `README.md` 常见问题章节，添加 405 错误解决方案
- 创建 `CHANGELOG.md` 记录此次重要变更

### 🎯 影响范围

- **前端**：`src/pages/ArticleManager.jsx` - 修改编辑和删除的请求方式
- **后端**：`functions/api/articles.js` - 支持查询参数和 Method Override
- **文档**：`README.md` - 添加常见问题说明

### 💡 经验总结

1. **Cloudflare 安全规则**：某些 HTTP 请求模式会被 CDN/WAF 拦截，需要采用兼容性更好的方案
2. **Method Override 模式**：是解决 HTTP 方法限制的标准做法，被广泛应用于各种框架
3. **查询参数 vs 路径参数**：在某些场景下，查询参数比路径参数更安全、更兼容
4. **向后兼容**：后端同时支持两种方式，确保平滑过渡

---

## [2025-11-19] - 🎨 首页新增网页模板展示模块

### ✨ 新增功能 (New Features)
- **首页 (`Home.jsx`)**：
  - 新增“精选网页模板”展示模块，位于文章列表上方。
  - 展示极简博客、创意作品集、文档中心等模板预览入口。
  - 采用卡片式设计，支持悬停动效与响应式布局。

### 🔎 影响范围
- `src/pages/Home.jsx`
