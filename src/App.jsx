import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import ArticleDetail from './pages/ArticleDetail'
import './App.css'

/**
 * 主应用组件
 * 使用 React Router 实现页面路由
 */
function App() {
  return (
    <Router>
      <div className="app">
        {/* 导航栏 */}
        <nav className="navbar">
          <div className="container">
            <Link to="/" className="logo">
              📚 我的博客
            </Link>
            <div className="nav-links">
              <Link to="/">首页</Link>
            </div>
          </div>
        </nav>

        {/* 路由配置 */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/article/:id" element={<ArticleDetail />} />
          </Routes>
        </main>

        {/* 页脚 */}
        <footer className="footer">
          <p>© 2025 Vite + React Demo | 用 ❤️ 制作</p>
        </footer>
      </div>
    </Router>
  )
}

export default App
