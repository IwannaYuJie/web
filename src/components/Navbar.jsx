import { useState, useEffect, memo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { blogProfile } from '../data/blogProfile'
import ThemeSelector from './ThemeSelector'
import './Navbar.css'

const NAV_LINKS = [
  { path: '/', label: '首页' },
  { path: '/archive', label: '归档' },
  { path: '/tags', label: '标签' },
  { path: '/about', label: '关于' },
  { path: '/toolbox', label: '工具箱' },
  { path: '/games', label: '游戏' },
  { path: '/admin/articles', label: '管理' },
]

function isActiveLink(pathname, path) {
  if (path === '/') {
    return pathname === '/' || pathname.startsWith('/article/')
  }
  return pathname === path || pathname.startsWith(`${path}/`)
}

function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

  return (
    <div className={`bnav ${isScrolled ? 'scrolled' : ''}`}>
      <div className="bnav-inner">
        <Link to="/" className="bnav-logo" aria-label="返回首页">
          <span className="bnav-mk">
            <img src={blogProfile.avatar} alt="" />
          </span>
          橘猫小窝
        </Link>

        <div className="bnav-actions">
          <nav className="bnav-links">
            {NAV_LINKS.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={isActiveLink(location.pathname, link.path) ? 'on' : ''}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="bnav-theme-wrap hide-mobile">
            <ThemeSelector />
          </div>

          <button
            className="bnav-menu-btn"
            onClick={() => setIsMenuOpen(o => !o)}
            aria-label="切换菜单"
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="bnav-mobile">
          <div className="bnav-mobile-theme">
            <ThemeSelector isMobile={true} />
          </div>
          <div className="bnav-mobile-links">
            {NAV_LINKS.map(link => {
              const active = isActiveLink(location.pathname, link.path)
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className="sticker"
                  style={active ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' } : undefined}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(Navbar)
