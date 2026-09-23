# 橘猫小窝 · 设计规范「云深处」

> 2026-09-23 起，全站改为仙侠 / 中国古典风格。宣纸为底，黛墨为字，朱砂点睛，泥金勾线。
> 远山、流云、灵光只做氛围，正文始终要清楚好读。

## 设计原则

1. **留白与细线**：用字体、留白、1px 细线和泥金双线分层次，不用粗边框和硬阴影。
2. **朱砂只点睛**：强调色只有朱砂一种，用在当前态、印章、悬停与关键按钮上。
3. **毛笔字只做标题**：`Ma Shan Zheng` 只用于页面大标题、序号和印章，正文与长句不用。
4. **氛围不抢戏**：远山、云雾、灵光都在内容之后，`pointer-events: none`，并尊重 `prefers-reduced-motion`。
5. **雅称加白话**：栏目用雅称，但必须同时给出白话（导航悬停、页头小字），不能让人猜。

## 设计令牌（`src/index.css`）

| 令牌 | 浅色（宣纸晨雾） | 深色（月夜） | 用途 |
| --- | --- | --- | --- |
| `--paper` / `--paper-2` | `#F4EFE4` / `#EBE4D4` | `#0D1216` / `#131A20` | 页面底色 |
| `--surface` | `#FAF7F0` | `#121A20` | 卡片、卷面 |
| `--ink` / `--ink-soft` / `--ink-mute` | 黛墨三档 | 月白三档 | 正文 / 次要 / 注释 |
| `--o`（朱砂） | `#B8432F` | `#E0674F` | 唯一强调色 |
| `--gold` / `--gold-soft` | `#A8844A` / `#CDB88C` | `#CDB07A` / `#7E6A45` | 泥金细线、小标题 |
| `--jade` / `--celadon` | 石青 / 天青 | — | 辅助色 |
| `--mount-far/mid/near` | 远山三层 | 夜山三层 | 水墨远山 |
| `--tone-1…5` | 朱砂、石青、黛紫、泥金、竹青 | 提亮版 | 分类小菱形（`categoryTone()`） |

深色模式跟随系统 `prefers-color-scheme`。小游戏仍在引用的旧变量（`--berry`、`--sun`、`--k1-bg` 等）保留为别名，别删。

Tailwind 的 `primary`、`surface` 已映射为带 alpha 的 RGB 变量，`bg-primary/10`、`bg-surface/80` 这类写法可以用，并且会跟着深色模式变。不要再写 `bg-white`。

## 字体

| 变量 | 字体 | 用途 |
| --- | --- | --- |
| `--brush` | Ma Shan Zheng | 大标题、序号、印章 |
| `--elegant` | ZCOOL XiaoWei | 副标题、导航、按钮、标签、元信息 |
| `--serif` / `--body` | Noto Serif SC | 标题与正文 |
| `--latin` | Cormorant Garamond 斜体 | 数字、日期 |
| `--sans` | Noto Sans SC | 表单、表格 |
| `--mono` | 系统等宽 | 代码 |

## 装饰组件（`src/components/xian/`）

- `Mountains`：三层水墨远山，可带小亭（`pavilion`）。
- `Cloud` / `CloudDivider`：祥云纹与祥云分隔线。
- `Seal`：朱砂印，两字竖排或四字成方（右列先读）。
- `Moon`、`Birds`：明月与飞鸟。
- `Atmosphere`：全站固定背景层，飘动的云雾和上升的灵光（在 `Layout` 中挂载）。
- `PageHeader`：内页页头，参数为 `title`（雅称）、`plain`（白话）、`seal`、`sub`，`children` 放统计或按钮。

## 全局样式类

- 按钮：`.btn`（墨色，悬停变朱砂）、`.btn.accent`、`.btn.ghost`、`.btn.sm`；内衬细框像匾额。
- 文字链接：`.link-arrow`，下划线从左划出，箭头放在 `<span className="arr">` 里。
- 标签：`.chip`（`.on` 为选中），`.tabs` + `.tab`（选中态下方一枚朱砂菱形）。
- 卷面：`.scroll-card`，宣纸底加泥金内框。
- 其他：`.kicker`（泥金小字，配 `.rule` 细线）、`.panel-h`（菱形引首的小标题）、`.section-h`（毛笔标题 + `<small>` 白话）、`.field-line`（下划线输入框）。
- 状态：`.state`，配 `.state-mark`（单个毛笔字，如「空」「迷」）或 `.loading-bar`。
- 动效：`.rise`（用 `--i` 控制错峰）、`.ink-in`（墨迹晕开）、`.float`。
- 中文数字：`src/utils/xianText.js` 中的 `toHanNumeral`、`toHanYear`、`toHanMonth`、`toShichen`。

## 栏目雅称

| 路径 | 雅称 | 白话 |
| --- | --- | --- |
| `/` | 山门 | 首页 |
| `/archive` | 藏经阁 | 归档 |
| `/tags` | 万象 | 标签 |
| `/creative` | 百工坊 | 创意 |
| `/games` | 游仙境 | 游戏 |
| `/toolbox` | 法宝阁 | 工具箱 |
| `/about` | 洞府 | 关于 |
| `/admin/articles` | 执笔 | 管理 |

新增栏目时，在 `src/components/Navbar.jsx` 的 `NAV_LINKS` 里同时写 `label` 和 `plain`。新增工具时，在 `src/data/tools.js` 里补上 `alias`（雅称）和 `glyph`（印章单字）。

## 注意事项

- ZCOOL XiaoWei 的「回」字字形是实心方块，`--elegant` 字体栈最前面的 `Elegant Glyph Fix` 专门替换这个字，不要删。

- **不要给 `main` 或页面根元素设置保留下来的 `transform` / `filter`**。它们会让内部 `position: fixed` 的弹窗改为相对该元素定位。换页动画只动 `opacity`，也不保留填充状态。
- 竖排文字（`writing-mode: vertical-rl`）只用于短句：标题、对联、心法。含英文的长标题一律横排。
- 移动端（≤ 760px）竖排大字改为横排，对联隐藏，菜单改为全屏竖排。
