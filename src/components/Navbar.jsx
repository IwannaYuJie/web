import { useState, useEffect, memo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Seal } from './xian/Ornaments'
import './Navbar.css'

// label 是仙侠雅称，plain 是白话，路径保持不变
export const NAV_LINKS = [
  { path: '/', label: '山门', plain: '首页' },
  { path: '/archive', label: '藏经阁', plain: '归档' },
  { path: '/tags', label: '万象', plain: '标签' },
  { path: '/creative', label: '百工坊', plain: '创意' },
  { path: '/games', label: '游仙境', plain: '游戏' },
  { path: '/toolbox', label: '法宝阁', plain: '工具箱' },
  { path: '/about', label: '洞府', plain: '关于' },
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
    const handleScroll = () => setIsScrolled(window.scrollY > 16)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isMenuOpen])

  return (
    <>
      <header className={`xnav ${isScrolled ? 'scrolled' : ''}`}>
        <div className="xnav-inner">
          <Link to="/" className="xnav-logo" aria-label="橘猫小窝 · 返回山门">
            <Seal text="橘猫" size={34} />
            <span className="xnav-name">
              <span className="brush">橘猫小窝</span>
              <small>云深不知处</small>
            </span>
          </Link>

          <nav className="xnav-links" aria-label="主导航">
            {NAV_LINKS.map(link => {
              const active = isActiveLink(location.pathname, link.path)
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={active ? 'on' : ''}
                  aria-current={active ? 'page' : undefined}
                  title={link.plain}
                >
                  <span className="zh">{link.label}</span>
                  <span className="plain">{link.plain}</span>
                </Link>
              )
            })}
            <Link
              to="/admin/articles"
              className={`xnav-admin ${isActiveLink(location.pathname, '/admin') ? 'on' : ''}`}
              title="文章管理"
            >
              执笔
            </Link>
          </nav>

          <button
            className={`xnav-menu-btn ${isMenuOpen ? 'open' : ''}`}
            onClick={() => setIsMenuOpen(o => !o)}
            aria-label={isMenuOpen ? '收起菜单' : '展开菜单'}
            aria-expanded={isMenuOpen}
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      <div className={`xnav-sheet ${isMenuOpen ? 'open' : ''}`} aria-hidden={!isMenuOpen}>
        <nav className="xnav-sheet-links">
          {[...NAV_LINKS, { path: '/admin/articles', label: '执笔', plain: '管理' }].map((link, i) => (
            <Link
              key={link.path}
              to={link.path}
              tabIndex={isMenuOpen ? 0 : -1}
              className={isActiveLink(location.pathname, link.path) ? 'on' : ''}
              style={{ '--i': i }}
            >
              <span className="brush">{link.label}</span>
              <small>{link.plain}</small>
            </Link>
          ))}
        </nav>
      </div>
    </>
  )
}

export default memo(Navbar)
