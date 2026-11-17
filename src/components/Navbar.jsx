import { useState, useEffect, memo, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { prefetchRoute } from '../utils/routePrefetch'
import { applyColorMode, persistColorMode, resolveInitialColorMode } from '../utils/themeMode'
import GlobalSearch from './GlobalSearch'
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

function ColorModeIcon({ mode }) {
  if (mode === 'dark') {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [colorMode, setColorMode] = useState(() => resolveInitialColorMode())
  const location = useLocation()

  useEffect(() => {
    applyColorMode(colorMode)
  }, [colorMode])

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
    if (isSearchOpen) {
      return undefined
    }
    document.body.style.overflow = isMenuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isMenuOpen, isSearchOpen])

  useEffect(() => {
    const handleShortcut = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsMenuOpen(false)
        setIsSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  const handleToggleColorMode = useCallback(() => {
    setColorMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      return persistColorMode(next)
    })
  }, [])

  const handleOpenSearch = useCallback(() => {
    setIsMenuOpen(false)
    setIsSearchOpen(true)
  }, [])

  const handlePrefetch = useCallback((path) => {
    prefetchRoute(path)
  }, [])

  const modeLabel = colorMode === 'dark' ? '月夜' : '晨雾'
  const nextModeTitle = colorMode === 'dark' ? '切换至晨雾日间模式' : '切换至月夜夜间模式'

  return (
    <>
      <header className={`xnav ${isScrolled ? 'scrolled' : ''}`}>
        <div className="xnav-inner">
          <Link
            to="/"
            className="xnav-logo"
            aria-label="橘猫小窝 · 返回山门"
            onMouseEnter={() => handlePrefetch('/')}
            onTouchStart={() => handlePrefetch('/')}
          >
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
                  onMouseEnter={() => handlePrefetch(link.path)}
                  onFocus={() => handlePrefetch(link.path)}
                  onTouchStart={() => handlePrefetch(link.path)}
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
              onMouseEnter={() => handlePrefetch('/admin/articles')}
              onFocus={() => handlePrefetch('/admin/articles')}
              onTouchStart={() => handlePrefetch('/admin/articles')}
            >
              执笔
            </Link>
          </nav>

          <div className="xnav-actions">
            <button
              type="button"
              className="xnav-tool-btn xnav-search-btn"
              onClick={handleOpenSearch}
              aria-label="打开全站快捷寻踪 (Ctrl/Cmd + K)"
              title="全站寻踪 (Ctrl/Cmd + K)"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
              <span className="xnav-tool-label">寻踪</span>
              <kbd className="xnav-kbd">⌘K</kbd>
            </button>

            <button
              type="button"
              className={`xnav-tool-btn xnav-mode-btn ${colorMode === 'dark' ? 'is-night' : 'is-day'}`}
              onClick={handleToggleColorMode}
              aria-label={nextModeTitle}
              aria-pressed={colorMode === 'dark'}
              title={nextModeTitle}
            >
              <ColorModeIcon mode={colorMode} />
              <span className="xnav-tool-label">{modeLabel}</span>
            </button>

            <button
              type="button"
              className={`xnav-menu-btn ${isMenuOpen ? 'open' : ''}`}
              onClick={() => setIsMenuOpen(o => !o)}
              aria-label={isMenuOpen ? '收起菜单' : '展开菜单'}
              aria-expanded={isMenuOpen}
            >
              <span /><span /><span />
            </button>
          </div>
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
              onTouchStart={() => handlePrefetch(link.path)}
              onFocus={() => handlePrefetch(link.path)}
            >
              <span className="brush">{link.label}</span>
              <small>{link.plain}</small>
            </Link>
          ))}
        </nav>
        <div className="xnav-sheet-tools">
          <button
            type="button"
            className="btn ghost"
            tabIndex={isMenuOpen ? 0 : -1}
            onClick={handleOpenSearch}
          >
            全站寻踪
          </button>
          <button
            type="button"
            className="btn ghost"
            tabIndex={isMenuOpen ? 0 : -1}
            onClick={handleToggleColorMode}
          >
            {colorMode === 'dark' ? '切至晨雾' : '切至月夜'}
          </button>
        </div>
      </div>

      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}

export default memo(Navbar)
