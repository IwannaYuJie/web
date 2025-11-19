# 🐱 橘猫小窝 - 设计规范文档

## 📋 目录
- [设计理念](#设计理念)
- [配色方案](#配色方案)
- [字体规范](#字体规范)
- [圆角与阴影](#圆角与阴影)
- [组件规范](#组件规范)
- [图标使用](#图标使用)
- [动画效果](#动画效果)
- [响应式设计](#响应式设计)
- [开发扩展指南](#开发扩展指南)

---

## 🎨 设计理念

### 核心概念
**橘猫主题 - 温暖、可爱、治愈**

- 🧡 **温暖感**：使用橙色系营造温馨舒适的氛围
- 😊 **可爱风**：圆角设计、柔和阴影、趣味表情
- 🐾 **橘猫元素**：融入猫咪相关的图标和装饰
- 💫 **轻量化**：保持简洁，避免过度装饰

### 设计原则
1. **一致性**：所有页面保持统一的视觉风格
2. **可读性**：确保文字清晰易读，对比度适中
3. **互动性**：添加悬停效果和过渡动画
4. **可爱度**：适度使用表情符号和装饰元素

---

## 🎨 配色方案

### 主色调 - 橘猫橙色系

```css
/* 主要颜色 */
--primary-color: #FF9F45;        /* 橘猫主色 - 温暖的橙色 */
--primary-hover: #FF8C1A;        /* 悬停色 - 深橙色 */
--secondary-color: #FFB366;      /* 辅助色 - 浅橙色 */
--accent-color: #FFC999;         /* 强调色 - 奶油橙 */
```

**使用场景**：
- `primary-color`：按钮、链接、标题强调
- `primary-hover`：交互元素的悬停状态
- `secondary-color`：次要按钮、标签
- `accent-color`：高亮、提示信息

### 背景色系

```css
/* 背景颜色 */
--bg-color: #FFF8F0;             /* 背景色 - 温暖的米白色 */
--card-bg: #FFFAF5;              /* 卡片背景 - 奶白色 */
--card-hover: #FFF5E6;           /* 卡片悬停 - 浅奶油色 */
```

**使用场景**：
- `bg-color`：页面整体背景
- `card-bg`：卡片、面板背景
- `card-hover`：卡片悬停状态

### 文字色系

```css
/* 文字颜色 */
--text-color: #5C4033;           /* 文字色 - 深棕色 */
--text-secondary: #8B6F47;       /* 次要文字 - 浅棕色 */
```

**使用场景**：
- `text-color`：正文、标题
- `text-secondary`：辅助说明、日期

### 边框色系

```css
/* 边框颜色 */
--border-color: #FFD4A3;         /* 边框色 - 浅橙色 */
```

### 渐变色

```css
/* 渐变效果 */
--gradient-warm: linear-gradient(135deg, #FFB366 0%, #FF9F45 50%, #FF8C1A 100%);
--gradient-soft: linear-gradient(135deg, #FFF8F0 0%, #FFE6CC 100%);
```

**使用场景**：
- `gradient-warm`：导航栏、按钮、重要区域
- `gradient-soft`：页脚、背景装饰

### 深色模式配色

```css
/* 夜间模式 */
--bg-color: #2D1F1A;             /* 深棕背景 */
--text-color: #FFE6CC;           /* 浅橙文字 */
--card-bg: #3D2B20;              /* 深色卡片 */
```

---

## 📝 字体规范

### 字体家族

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
             'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 
             'Droid Sans', 'Helvetica Neue', sans-serif;
```

### 字体大小

| 用途 | 大小 | 字重 |
|------|------|------|
| 大标题 (h1) | 2.8rem | 800 |
| 中标题 (h2) | 2.2rem | 700 |
| 小标题 (h3) | 1.4rem | 700 |
| 正文 | 1rem | 400 |
| 辅助文字 | 0.9rem | 500 |

### 行高

- 标题：`1.3 - 1.4`
- 正文：`1.6 - 1.8`

---

## 🔲 圆角与阴影

### 圆角规范

```css
--radius-sm: 12px;    /* 小圆角 - 小元素 */
--radius-md: 16px;    /* 中圆角 - 卡片 */
--radius-lg: 24px;    /* 大圆角 - 大区块 */
--radius-full: 9999px; /* 完全圆角 - 按钮、标签 */
```

**使用指南**：
- 按钮、标签 → `radius-full`
- 卡片、面板 → `radius-md` 或 `radius-lg`
- 小装饰元素 → `radius-sm`

### 阴影规范

```css
--shadow: 0 2px 8px 0 rgba(255, 159, 69, 0.15);        /* 基础阴影 */
--shadow-lg: 0 8px 24px 0 rgba(255, 159, 69, 0.25);   /* 大阴影 */
--shadow-hover: 0 12px 32px 0 rgba(255, 159, 69, 0.3); /* 悬停阴影 */
```

**使用场景**：
- 卡片默认 → `shadow`
- 导航栏、弹窗 → `shadow-lg`
- 悬停效果 → `shadow-hover`

---

## 🧩 组件规范

### 按钮

#### 主要按钮
```css
.primary-button {
  background: var(--gradient-warm);
  color: white;
  padding: 0.9rem 2rem;
  border-radius: var(--radius-full);
  font-weight: 700;
  box-shadow: var(--shadow-lg);
}

.primary-button:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: var(--shadow-hover);
}
```

#### 次要按钮
```css
.secondary-button {
  background: white;
  color: var(--primary-color);
  border: 2px solid var(--border-color);
  padding: 0.7rem 1.5rem;
  border-radius: var(--radius-full);
}
```

### 卡片

```css
.card {
  background: var(--card-bg);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 2rem;
  box-shadow: var(--shadow);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-hover);
  border-color: var(--primary-color);
  background: var(--card-hover);
}
```

### 输入框

```css
.input {
  background: var(--card-bg);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0.8rem 1.2rem;
  color: var(--text-color);
  font-size: 1rem;
}

.input:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 3px rgba(255, 159, 69, 0.1);
}
```

---

## 😺 图标使用

### Emoji 表情规范

#### 橘猫相关
- 🐱 猫咪主图标
- 🐾 猫爪印（装饰、链接）
- 🧡 橙色心（喜欢、收藏）
- 😺 笑脸猫（成功提示）
- 😿 哭脸猫（错误提示）

#### 功能图标
- 🏠 首页
- 📚 文章/博客
- 🗓️ 日期
- 🎲 随机
- ✨ 特殊/亮点
- ☕ 咖啡（关于、休息）
- 💡 想法/提示
- 🔍 搜索
- ⚙️ 设置

### 使用原则
1. **适度使用**：每个标题/按钮最多 1-2 个表情
2. **保持一致**：同类功能使用相同图标
3. **语义清晰**：图标含义要明确
4. **可访问性**：重要功能不能只依赖图标

---

## 🎬 动画效果

### 过渡动画

```css
/* 标准过渡 */
transition: all 0.3s ease;

/* 快速过渡 */
transition: all 0.2s ease;

/* 慢速过渡 */
transition: all 0.5s ease;
```

### 悬停效果

#### 卡片悬停
```css
transform: translateY(-6px);
box-shadow: var(--shadow-hover);
```

#### 按钮悬停
```css
transform: translateY(-3px) scale(1.05);
```

#### 链接悬停
```css
transform: translateY(-2px);
```

### 装饰动画

```css
/* 橘猫爪印旋转 */
.card:hover::after {
  transform: scale(1.2) rotate(15deg);
}
```

---

## 📱 响应式设计

### 断点

```css
/* 移动端 */
@media (max-width: 768px) {
  /* 调整字体大小 */
  .page-header h1 { font-size: 2rem; }
  
  /* 单列布局 */
  .articles-grid { grid-template-columns: 1fr; }
}

/* 平板 */
@media (min-width: 769px) and (max-width: 1024px) {
  /* 两列布局 */
  .articles-grid { grid-template-columns: repeat(2, 1fr); }
}

/* 桌面 */
@media (min-width: 1025px) {
  /* 多列布局 */
  .articles-grid { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
}
```

---

## 🚀 开发扩展指南

### 添加新页面

1. **创建页面组件**
```jsx
// src/pages/NewPage.jsx
function NewPage() {
  return (
    <div className="container">
      <header className="page-header">
        <h1>🐱 页面标题</h1>
        <p>页面描述</p>
      </header>
      {/* 页面内容 */}
    </div>
  )
}
```

2. **添加路由**
```jsx
// src/App.jsx
<Route path="/new-page" element={<NewPage />} />
```

3. **添加导航链接**
```jsx
<Link to="/new-page">🔗 新页面</Link>
```

### 添加新组件

#### 遵循命名规范
```
组件名称：PascalCase (如 ArticleCard)
CSS 类名：kebab-case (如 article-card)
变量名：camelCase (如 articleData)
```

#### 组件模板
```jsx
/**
 * 组件名称
 * 组件描述
 */
function ComponentName({ prop1, prop2 }) {
  return (
    <div className="component-name">
      {/* 组件内容 */}
    </div>
  )
}

export default ComponentName
```

#### 样式模板
```css
/* 组件名称 - 简短描述 */
.component-name {
  background: var(--card-bg);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 2rem;
  transition: all 0.3s ease;
}

.component-name:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}
```

### 添加新功能

#### 1. API 调用
```jsx
const [data, setData] = useState(null)
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)

const fetchData = async () => {
  setLoading(true)
  setError(null)
  
  try {
    const response = await fetch('API_URL')
    const data = await response.json()
    setData(data)
  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}
```

#### 2. 表单处理
```jsx
const [formData, setFormData] = useState({
  field1: '',
  field2: ''
})

const handleChange = (e) => {
  setFormData({
    ...formData,
    [e.target.name]: e.target.value
  })
}

const handleSubmit = (e) => {
  e.preventDefault()
  // 处理提交
}
```

### 主题扩展

#### 添加新颜色
```css
/* 在 index.css 的 :root 中添加 */
:root {
  --new-color: #HEXCODE;
}
```

#### 添加新渐变
```css
--gradient-new: linear-gradient(135deg, color1, color2);
```

#### 添加深色模式变量
```css
@media (prefers-color-scheme: dark) {
  :root {
    --new-color: #HEXCODE;
  }
}
```

### 性能优化建议

1. **图片优化**
   - 使用 WebP 格式
   - 添加懒加载：`loading="lazy"`
   - 压缩图片大小

2. **代码分割**
   ```jsx
   const LazyComponent = lazy(() => import('./Component'))
   ```

3. **CSS 优化**
   - 避免过深的选择器嵌套
   - 使用 CSS 变量减少重复
   - 合并相似的样式规则

### 可访问性指南

1. **语义化 HTML**
   ```jsx
   <header>, <nav>, <main>, <article>, <section>, <footer>
   ```

2. **Alt 文本**
   ```jsx
   <img src="cat.jpg" alt="可爱的橘猫" />
   ```

3. **键盘导航**
   - 确保所有交互元素可通过 Tab 访问
   - 添加 focus 样式

4. **颜色对比度**
   - 文字与背景对比度 ≥ 4.5:1
   - 使用工具检查：WebAIM Contrast Checker

---

## 📦 常用代码片段

### 橘猫卡片
```jsx
<div className="cat-card">
  <h3>🐾 标题</h3>
  <p>内容描述</p>
</div>
```

### 橘猫按钮
```jsx
<button className="cat-button">
  🐱 点击我
</button>
```

### 加载状态
```jsx
{loading && <div className="loading">🐱 加载中...</div>}
```

### 错误提示
```jsx
{error && <div className="error">😿 {error}</div>}
```

---

## 🎯 设计检查清单

在发布新功能前，请确认：

- [ ] 使用了橘猫主题配色
- [ ] 添加了适当的圆角和阴影
- [ ] 实现了悬停动画效果
- [ ] 添加了橘猫相关的表情符号
- [ ] 在移动端测试过布局
- [ ] 检查了深色模式显示
- [ ] 代码添加了注释
- [ ] 样式使用了 CSS 变量
- [ ] 保持了整体风格一致性

---

## 📚 参考资源

### 设计灵感
- [Dribbble - Cat Theme](https://dribbble.com/tags/cat)
- [Behance - Cute Design](https://www.behance.net/search/projects?search=cute%20design)

### 配色工具
- [Coolors](https://coolors.co/) - 配色生成器
- [Adobe Color](https://color.adobe.com/) - 配色方案

### 图标资源
- [Emojipedia](https://emojipedia.org/) - Emoji 查询
- [Unicode Emoji](https://unicode.org/emoji/charts/full-emoji-list.html)

### CSS 工具
- [CSS Gradient](https://cssgradient.io/) - 渐变生成器
- [Box Shadow Generator](https://cssgenerator.org/box-shadow-css-generator.html)

---

## 🐾 结语

这份设计规范是橘猫小窝的基础，随着项目发展会持续更新。

**记住核心理念**：温暖、可爱、治愈 🧡

保持代码整洁，保持设计一致，让每个访客都能感受到橘猫的温暖！

---

**最后更新**：2025-01-27  
**版本**：v1.0  
**维护者**：Doro 🐕💕
