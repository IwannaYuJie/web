import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import React from 'react'
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
 * 支持导航栏滚动效果
 */
function AppContent() {
  const location = useLocation()
  const isGameHub = location.pathname === '/secret-games'
  const isSeedreamStudio = location.pathname === '/secret-seedream'
  const hideNavAndFooter = isGameHub || isSeedreamStudio
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false) // 移动端菜单状态

  // 监听滚动事件，给导航栏添加动态效果
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 切换移动端菜单
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  // 关闭移动端菜单（点击链接后）
  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <div className="app">
      {/* 导航栏 - 橘猫主题 (游戏中心和 Seedream 页面不显示) */}
      {!hideNavAndFooter && (
        <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
          <div className="container">
            <Link to="/" className="logo" onClick={closeMobileMenu}>
              <img src="/images/cat-avatar.png" alt="橘猫" className="logo-avatar" /> 橘猫小窝
            </Link>
            
            {/* 汉堡菜单按钮 - 移动端显示 */}
            <button 
              className={`mobile-menu-toggle ${mobileMenuOpen ? 'open' : ''}`}
              onClick={toggleMobileMenu}
              aria-label="菜单"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
            
            <div className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
              <Link to="/" onClick={closeMobileMenu}>🏠 首页</Link>
              <Link to="/image-generator" onClick={closeMobileMenu}>🎨 AI画板</Link>
              <Link to="/ai-chat" onClick={closeMobileMenu}>🤖 AI对话</Link>
              <Link to="/admin/articles" onClick={closeMobileMenu}>📝 文章管理</Link>
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
