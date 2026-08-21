# 🎨 主题设计系统归档备份 (Archived Theme Systems)

本目录完整保存了“橘猫小窝”设计的全部 **8 套艺术级主题设计系统** 及相关的切换组件与状态逻辑。

---

## 📁 目录结构

```
src/archived-themes/
├── styles/                          # 7 套扩展主题样式表
│   ├── sketch-theme.css             # ✏️ 涂鸦手账（白底蓝网格 + 站酷快乐体 + 彩色便签）
│   ├── cyberpunk-theme.css          # 🌆 赛博终端（黑曜石暗夜 + 霓虹粉青 + 45°斜切角HUD）
│   ├── pixel-theme.css              # 👾 街机掌机（GameBoy灰绿液晶 + 0px纯阶梯直角）
│   ├── y2k-theme.css                # ⚡ 酸性千禧（高饱和电光黄 + 纯黑野兽派撞色）
│   ├── matrix-theme.css             # 🟢 黑客帝国（纯黑底 + 荧光绿终端CLI）
│   ├── bubble-theme.css             # 🫧 多巴胺果冻（马卡龙渐变粉紫 + 36px大圆角）
│   └── blueprint-theme.css          # 📐 工业蓝图（CAD制图深蓝底 + 白色工程标尺）
├── components/                      # 主题选择器组件
│   ├── ThemeSelector.jsx            # 下拉卡片浮层与移动端网格
│   └── ThemeSelector.css            # 主题选择器样式
├── context/                         # 主题全局状态管理
│   └── ThemeContext.jsx             # 8 套主题元数据与 localStorage 持久化
└── README.md                        # 本说明文件
```

---

## 🚀 如何重新启用 / 一键恢复多主题系统

如果您日后需要重新开启多主题功能，只需按以下步骤操作：

### 1. 恢复文件
将 `src/archived-themes/` 下的文件复制回源码目录：
```bash
cp -r src/archived-themes/styles/* src/styles/
cp src/archived-themes/components/* src/components/
cp src/archived-themes/context/* src/context/
```

### 2. 在 `src/index.css` 顶部引入各样式表
```css
@import './styles/sketch-theme.css';
@import './styles/cyberpunk-theme.css';
@import './styles/pixel-theme.css';
@import './styles/y2k-theme.css';
@import './styles/matrix-theme.css';
@import './styles/bubble-theme.css';
@import './styles/blueprint-theme.css';
```

### 3. 在 `src/App.jsx` 中包裹 `ThemeProvider`
```jsx
import { ThemeProvider } from './context/ThemeContext'

// 在根组件外包裹:
<ThemeProvider>
  <RouterProvider router={router} />
</ThemeProvider>
```

### 4. 在 `src/components/Navbar.jsx` 中挂载 `ThemeSelector`
```jsx
import ThemeSelector from './ThemeSelector'

// 桌面端挂载:
<div className="bnav-theme-wrap hide-mobile">
  <ThemeSelector />
</div>

// 移动端挂载:
<ThemeSelector isMobile={true} />
```
