---
name: publish-article
description: 给「橘猫小窝」博客 (jumaomaomaoju.cn) 写文章并发布上线。当用户想写一篇某主题的博客文章、把文章发到博客、新增/更新博客文章，或说"发篇关于X的文章""加一篇文章到我的博客"时使用。封装了 /api/articles 接口的鉴权与调用，并内置该博客的写作风格规范。
---

# 发布文章到「橘猫小窝」博客

把"写一篇文章 → 发布到 jumaomaomaoju.cn"这件事自动化。文章数据通过 `/api/articles` 接口写入 Cloudflare KV，发布后立即在站点可见。

## 工作流程

### 1. 明确主题
从用户那里拿到文章主题。如果主题太宽泛（比如只说"写篇 Java 的"），先问清楚方向、深度、目标读者。

### 2. 看一眼现有文章（推荐）
发布前先运行 `list` 了解站点现状，对齐风格、避免撞分类：
```bash
node .claude/skills/publish-article/publish.mjs list
```
这会列出所有文章的 id / 日期 / 分类 / 标题，并汇总现有分类。

### 3. 按博客风格写文章
这个博客是**中文技术博客**，作者人设是"橘猫博主"，风格务实、口语化、直给结论。写作时遵循：

- **开头直给结论**：多数文章用 `## 先说结论` 开篇，先抛核心观点，再展开论证。
- **结构清晰**：用 `##` / `###` 分段，善用**有序列表**、**无序列表**、**表格**对比、**代码块**、**引用块**(`>`)。
- **正文是 Markdown**：站点用 react-markdown + remark-gfm 渲染，支持 GFM 表格、代码高亮、任务列表等。
- **结尾收口**：常以"## 一句话总结"或一段引用结尾。
- **语气**：像在跟同行讲人话，不堆砌术语，多用"换句话说""一句话""重点盯住"这类口语连接。

### 4. 组织文章字段
构造一个文章对象，字段如下：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | ✅ | 标题，可以带副标题/问句，吸引点击 |
| `description` | ✅ | 1~2 句话的摘要钩子，列表页和分享用 |
| `category` | ✅ | 分类。优先复用现有分类：**架构设计 / Java核心 / JVM / Spring框架**；确有必要再新建 |
| `readTime` | ✅ | 预计阅读分钟数，字符串数字，如 `"10"`（按正文长度估，约 350~450 字/分钟） |
| `content` | 建议 | 正文 Markdown 字符串 |
| `tags` | 建议 | 字符串数组，3~6 个，如 `["幂等性","接口设计","分布式"]` |
| `date` | 可选 | 发布日期 `YYYY-MM-DD`，默认今天 |
| `author` | 可选 | 默认 `"橘猫博主"`；AI/商业史类长文站内也用过 `"Doro"` |

把文章写成一个 **`.mjs` 文件**（用 `export default { ... }`），正文用反引号模板字符串——这样中文 Markdown 不用转义。写到临时路径即可，例如 `/tmp/article-draft.mjs`：

```js
export default {
  title: '接口幂等性设计：为什么重试不该把你的系统搞坏',
  description: '前端重复点击、网关重发、消息队列重投——重试无处不在……',
  category: '架构设计',
  readTime: '10',
  tags: ['幂等性', '接口设计', '分布式', '重试机制', '架构'],
  author: '橘猫博主',
  content: `## 先说结论

只要你的接口会被**重试**……

## 一句话总结

……`,
}
```

### 5. 发布前确认
发布会创建**公开可见**的内容，属于难撤销的对外操作。**先把草稿要点（标题、分类、标签、摘要，必要时附正文）展示给用户确认**，用户同意后再发布。若用户已明确说"直接发"，可跳过确认。

### 6. 发布
```bash
node .claude/skills/publish-article/publish.mjs publish /tmp/article-draft.mjs
```
成功会打印新文章的 **id** 和访问链接 `https://jumaomaomaoju.cn/article/<id>`。把链接给用户。

### 7.（可选）修改已发布的文章
```bash
node .claude/skills/publish-article/publish.mjs update <id> /tmp/article-draft.mjs
```

## 接口与鉴权（背景知识）

- **接口**：`POST {baseUrl}/api/articles`，请求头 `X-Admin-Key: <管理密码>`，JSON body。
- **服务端自动生成** `id`、`createdAt`、`updatedAt`；`id` 取当前最大值 +1。
- **更新/删除**：因 Cloudflare 兼容性，统一用 `POST + X-HTTP-Method-Override: PUT|DELETE`，id 走查询参数 `?id=<id>`。
- **配置**：`baseUrl` 和 `adminKey` 存在同目录 **`config.local.json`**（已被 .gitignore 忽略，**切勿写进会提交的文件或公开仓库**）。也可用环境变量 `BLOG_BASE_URL` / `BLOG_ADMIN_KEY` 覆盖。
- 脚本支持 `auth`（验证密码）、`list`（列出文章）、`publish`、`update` 四个子命令。

## 注意事项

- 管理密码是敏感信息：只放在 `config.local.json` 或环境变量里，不要打印到聊天、不要写进文章正文或任何会提交的文件。
- 分类尽量复用现有的几个，保持站点分类整洁。
- `readTime` 是字符串不是数字。
- 发布失败时脚本会打印 HTTP 状态码和服务端返回，按提示排查（401=密码错误，400=缺字段，500=KV 未配置等）。
