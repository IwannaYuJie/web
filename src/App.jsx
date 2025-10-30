import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import ArticleDetail from './pages/ArticleDetail'
import ImageGenerator from './pages/ImageGenerator'
import AIChat from './pages/AIChat'
import './App.css'

/**
 * 主应用组件
 * 使用 React Router 实现页面路由
 */
function App() {
  return (
    <Router>
      <div className="app">
        {/* 导航栏 - 橘猫主题 */}
        <nav className="navbar">
          <div className="container">
            <Link to="/" className="logo">
              🐱 橘猫小窝
            </Link>
            <div className="nav-links">
              <Link to="/">🏠 首页</Link>
              <Link to="/image-generator">🎨 AI画板</Link>
              <Link to="/ai-chat">🤖 AI对话</Link>
            </div>
          </div>
        </nav>

        {/* 路由配置 */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/article/:id" element={<ArticleDetail />} />
            <Route path="/image-generator" element={<ImageGenerator />} />
            <Route path="/ai-chat" element={<AIChat />} />
          </Routes>
        </main>

        {/* 页脚 - 橘猫爪印 */}
        <footer className="footer">
          <p>© 2025 橘猫小窝 🐾 | 用 🧡 和 ☕ 制作</p>
        </footer>
      </div>
    </Router>
  )
}

export default App
