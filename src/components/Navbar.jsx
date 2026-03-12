import { useState, useEffect, memo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Navbar.css'

// 导航链接配置 - 提取到组件外部
const NAV_LINKS = [
  { path: '/', label: '🏠 首页' },
  { path: '/games', label: '🎮 游戏中心' },
  { path: '/toolbox', label: '🧰 工具箱' },
  { path: '/admin/articles', label: '📝 文章管理' },
]

function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()

  // 监听滚动
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 路由变化时关闭菜单
  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container nav-container">
        <Link to="/" className="nav-logo">
          <img src="/images/cat-avatar.png" alt="Logo" />
          <span>橘猫小窝</span>
        </Link>

        {/* 桌面端菜单 */}
        <div className="nav-links">
          {NAV_LINKS.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* 移动端菜单按钮 */}
        <button
          className="mobile-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="切换菜单"
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>

        {/* 移动端下拉菜单 */}
        {isMenuOpen && (
          <div className="mobile-menu">
            {NAV_LINKS.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}

export default memo(Navbar)
