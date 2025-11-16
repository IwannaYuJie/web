import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import ArticleDetail from './pages/ArticleDetail'
import ImageGenerator from './pages/ImageGenerator'
import AIChat from './pages/AIChat'
import ArticleManager from './pages/ArticleManager'
import GameHub from './pages/GameHub'
import SeedreamStudio from './pages/SeedreamStudio'
import './App.css'

/**
 * 主应用组件
 * 使用 React Router 实现页面路由
 */
function AppContent() {
  const location = useLocation()
  const isGameHub = location.pathname === '/secret-games'
  const isSeedreamStudio = location.pathname === '/secret-seedream'
  const hideNavAndFooter = isGameHub || isSeedreamStudio

  return (
    <div className="app">
      {/* 导航栏 - 橘猫主题 (游戏中心和 Seedream 页面不显示) */}
      {!hideNavAndFooter && (
        <nav className="navbar">
          <div className="container">
            <Link to="/" className="logo">
              🐱 橘猫小窝
            </Link>
            <div className="nav-links">
              <Link to="/">🏠 首页</Link>
              <Link to="/image-generator">🎨 AI画板</Link>
              <Link to="/ai-chat">🤖 AI对话</Link>
              <Link to="/admin/articles">📝 文章管理</Link>
            </div>
          </div>
        </nav>
      )}

      {/* 路由配置 */}
      <main className={hideNavAndFooter ? "main-content-fullscreen" : "main-content"}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/article/:id" element={<ArticleDetail />} />
          <Route path="/image-generator" element={<ImageGenerator />} />
          <Route path="/ai-chat" element={<AIChat />} />
          <Route path="/admin/articles" element={<ArticleManager />} />
          {/* 隐藏的游戏中心页面 - 不在导航栏显示 */}
          <Route path="/secret-games" element={<GameHub />} />
          {/* 隐藏的 Seedream AI 实验室 - 仅手动访问 */}
          <Route path="/secret-seedream" element={<SeedreamStudio />} />
        </Routes>
      </main>

      {/* 页脚 - 橘猫爪印 (游戏中心和 Seedream 页面不显示) */}
      {!hideNavAndFooter && (
        <footer className="footer">
          <p>© 2025 橘猫小窝 🐾 | 用 🧡 和 ☕ 制作</p>
        </footer>
      )}
    </div>
  )
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppContent />
    </Router>
  )
}

export default App
