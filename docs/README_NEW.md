# 🎨 橘猫小窝 - AI 创意工作室

一个基于 React + Vite 构建的现代化 Web 应用，集成了 AI 图片生成功能，采用温暖的橘猫主题设计。

🌟 **最新更新** (2025-12-03)
- 🚀 新增 Seedream v4.5 模型支持，图像生成更强力
- 🎀 上线随机 Coser 写真生成器，一键生成精美角色图
- ✨ 优化随机提示词功能，支持基于现有内容智能扩写
- 🔧 改进图片下载体验与七牛云参数配置

## 🌟 主要特性

### 🎨 AI 图片生成
- **文生图**：输入文字描述，生成精美图片
- **图生图**：上传参考图片，进行二次创作
- **预设模板**：10+ 精心设计的提示词模板
- **艺术风格**：10种不同艺术风格可选
- **批量生成**：支持连续生成多达15张图片
- **历史记录**：自动保存生成历史，方便回顾和复用

### 🐱 橘猫主题设计
- **温暖配色**：橙色系主色调，营造温馨氛围
- **可爱元素**：橘猫表情、猫爪装饰等趣味元素
- **动态交互**：橘猫心情指示器、浮动动画
- **智慧语录**：橘猫日常语录和名人名言

### ✨ 用户体验
- **响应式布局**：适配桌面、平板、手机等设备
- **流畅动画**：精心设计的过渡和动画效果
- **快速导航**：直观的功能卡片式导航
- **分类筛选**：文章分类标签，快速找到感兴趣内容

### 🚀 技术栈
- **前端框架**：React 18 + React Router 6
- **构建工具**：Vite 5.4
- **API 集成**：火山引擎 Seedream 4.0
- **部署平台**：Netlify / Vercel / Cloudflare Pages

## 📝 页面结构

### 🏠 首页 (`/`)
- 橘猫心情指示器
- 访客统计与时间显示
- 快速导航卡片
- 每日智慧名言
- 文章分类筛选
- 橘猫小贴士

### 🎨 AI 绘画 (`/image-generator`)
- 提示词输入区
- 预设模板选择
- 艺术风格选择
- 图片上传（图生图）
- 参数设置（尺寸、数量、水印）
- 历史记录查看
- 生成结果展示

### 📚 文章详情 (`/article/:id`)
- 文章标题和元信息
- 文章内容展示
- 返回首页导航

## 🎨 设计规范

### 核心理念
- **温暖感**：使用橙色系营造温馨舒适的氛围
- **可爱风**：圆角设计、柔和阴影、趣味表情
- **橘猫元素**：融入猫咪相关的图标和装饰
- **轻量化**：保持简洁，避免过度装饰

### 配色方案
```css
--primary-color: #FF9F45;        /* 橘猫主色 */
--primary-hover: #FF8C1A;        /* 悬停色 */
--secondary-color: #FFB366;      /* 辅助色 */
--bg-color: #FFF8F0;             /* 背景色 */
--text-color: #5C4033;           /* 文字色 */
```

更多详细规范请查看 [DESIGN_GUIDE.md](./DESIGN_GUIDE.md)

## 📦 项目结构

```
web/
├── src/
│   ├── pages/           # 页面组件
│   │   ├── Home.jsx         # 首页（增强版）
│   │   ├── ArticleDetail.jsx
│   │   └── ImageGenerator.jsx # AI绘画页（增强版）
│   ├── App.jsx          # 主应用组件
│   ├── App.css          # 全局样式（增强版）
│   └── index.css        # CSS 变量定义
├── functions/           # Serverless 函数
│   └── api/
│       └── generate-image.js
├── DESIGN_GUIDE.md     # 设计规范文档
├── package.json
├── vite.config.js      # Vite 配置
└── vercel.json         # Vercel 部署配置
```

## 🚀 本地运行

### 1. 安装依赖
```bash
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 构建生产版本
```bash
npm run build
```

### 4. 预览生产版本
```bash
npm run preview
```

## 🌐 部署指南

### 部署到 Vercel（推荐）

1. **连接 GitHub 仓库**
   - 访问 https://vercel.com
   - 点击 "Import Project"
   - 选择你的 GitHub 仓库

2. **配置构建设置**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **配置环境变量**
   - 添加 `ARK_API_KEY` 环境变量

4. **部署**
   - 点击 "Deploy"
   - 等待构建完成

### 部署到 Cloudflare Pages

1. **登录 Cloudflare Dashboard**
   - 访问 https://dash.cloudflare.com
   - 选择 "Workers & Pages"

2. **创建新项目**
   - 点击 "Create application" → "Pages"
   - 选择 "Connect to Git"

3. **配置构建设置**
   - Framework preset: Vite
   - Build command: `npm run build`
   - Build output directory: `dist`

## 🎯 功能亮点

### AI 图片生成
- 支持文字描述生成图片
- 可上传参考图片进行二次创作
- 10种预设艺术风格
- 多种分辨率选择（1K/2K/4K）
- 批量生成功能
- 历史记录自动保存

### 首页特色
- 实时橘猫心情变化
- 访客统计展示
- 时间动态更新
- 文章分类筛选
- 每日智慧名言
- 橘猫小贴士轮播

### 用户体验优化
- 流畅的页面过渡动画
- 响应式设计适配各种设备
- 加载状态提示
- 错误处理友好提示
- 快捷操作按钮

## 🆕 新增功能详解

### 预设提示词模板
系统提供了多个精心设计的提示词模板，包括：
- 🐱 橘猫系列：慵懒橘猫、橘猫玩耍
- 🌸 自然风景：樱花盛开、日落海滩
- 🍰 美食诱惑：精致甜点、咖啡时光
- 👤 人物肖像：温柔少女、勇敢战士
- 🏙️ 城市建筑：未来都市、古风建筑

### 艺术风格选择
支持10种不同的艺术风格：
- 动漫风格、写实摄影、油画艺术
- 水彩画风、赛博朋克、奇幻世界
- 极简主义、复古怀旧、卡通漫画、超现实

### 历史记录功能
- 自动保存最近10条生成记录
- 支持查看历史图片
- 一键复用历史提示词
- 本地存储，刷新不丢失

## 🆔 未来计划

- [ ] 添加深色模式支持
- [ ] 创建关于页面和联系页面
- [ ] 集成更多 AI 功能（文本生成、音乐创作等）
- [ ] 用户账号系统
- [ ] 作品分享社区
- [ ] 多语言支持

## 👥 贡献

欢迎提交 Issue 和 Pull Request！

### 贡献指南
1. Fork 本项目
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🐾 致谢

感谢所有为这个项目做出贡献的开发者！

---

**最后更新**：2025-12-03  
**版本**：v2.1  
**维护者**：Doro 🐕💕

如有问题，欢迎提 Issue！
