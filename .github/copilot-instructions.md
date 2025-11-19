# AI 编程助手指南

## 🌐 项目背景与架构
- **技术栈:** React 18, Vite 5, Tailwind CSS.
- **后端:** 混合模式。
  - **生产环境:** Cloudflare Pages Functions (`functions/api`) 使用 Cloudflare KV (`ARTICLES_KV`) 进行存储。
  - **本地开发:** `vite.config.js` 中的自定义 Vite 插件提供 `/api/articles` 的 **Mock API**。
- **主题:** "橘猫" (Orange Cat) - 暖色调，圆角，俏皮的 UI。详见 `docs/DESIGN_GUIDE.md`。

## 🏗️ 关键工作流
- **本地开发:**
  - 运行 `npm run dev`。这将启动带有 **内存 Mock API** 的 Vite。
  - **重要:** 本地开发中的数据更改是临时的（重启后重置）。
  - 要在本地测试真实的 Cloudflare Functions，请使用 `npx wrangler pages dev dist`。
- **部署:**
  - 通过 `wrangler.toml` 配置 Cloudflare Pages。
  - 也支持 Vercel (`vercel.json`)。

## 🧩 核心规范与模式
- **API 逻辑:**
  - 修改文章 CRUD 逻辑时，必须 **同时** 更新：
    1. `functions/api/articles.js` (生产环境逻辑)
    2. `vite.config.js` (`mock-articles-api` 插件内的本地 Mock 逻辑)
- **样式:**
  - 使用 Tailwind CSS 进行布局和间距设置。
  - 使用 `src/index.css` 中定义的 CSS 变量 (`--primary-color` 等) 进行主题设置。
  - 保持 UI "可爱" 和 "温暖"，与橘猫主题保持一致。
- **环境变量:**
  - 本地: `.env` (AI 服务的 API 密钥)。
  - 生产: 在 Cloudflare/Vercel 仪表板中设置。
  - **切勿** 硬编码 API 密钥。

## 📂 重要文件
- `vite.config.js`: 包含 **Mock API Server** 实现。阅读此文件以了解本地数据处理。
- `functions/api/`: 用于 AI 对话、图像生成和文章管理的 Serverless 函数。
- `wrangler.toml`: Cloudflare KV 绑定和配置。
- `src/data/`: "雨姐" 游戏的静态数据 (`yujieGameData.js`)。

## 🤖 AI/Agent 准则
- **Mock 意识:** 始终假设 `npm run dev` 使用 Mock API。如果用户报告数据未保存，请检查他们是否期望在本地开发中持久化数据。
- **双重更新:** 如果添加新的 API 端点，请在 `functions/api/` 中实现它，**并且** 在 `vite.config.js` 中添加一个 Mock 处理程序，以确保本地开发的连续性。
- **安全性:** 在处理 `generate-image.js` 或 `ai-chat.js` 时，确保从 `context.env` (Cloudflare) 或 `process.env` (Local/Vercel) 读取 API 密钥。
