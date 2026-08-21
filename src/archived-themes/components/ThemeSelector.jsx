import { memo, useState, useRef, useEffect } from 'react'
import { useTheme, THEMES } from '../context/ThemeContext'
import './ThemeSelector.css'

function ThemeSelector({ isMobile = false }) {
  const { theme, currentThemeConfig, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  // 点击外部关闭下拉菜单
  useEffect(() => {
    if (isMobile) {return}
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, isMobile])

  const handleSelectTheme = (themeId) => {
    setTheme(themeId)
    setIsOpen(false)
  }

  // 移动端模式直接渲染整套选择卡片列表
  if (isMobile) {
    return (
      <div className="theme-selector-mobile">
        <div className="theme-selector-mobile-title">
          <span>🎨 切换主题风格 ({THEMES.length}款)</span>
        </div>
        <div className="theme-selector-mobile-grid">
          {THEMES.map((t) => {
            const isSelected = theme === t.id
            return (
              <button
                key={t.id}
                type="button"
                className={`theme-mobile-item ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectTheme(t.id)}
              >
                <div className="theme-mobile-item-top">
                  <span className="theme-item-icon">{t.icon}</span>
                  <span className="theme-item-name">{t.name}</span>
                  {isSelected && <span className="theme-item-check">✓</span>}
                </div>
                <div className="theme-item-palette">
                  {t.colors.map((c, i) => (
                    <span
                      key={i}
                      className="palette-dot"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // 桌面端渲染胶囊触发按钮 + 下拉浮层
  return (
    <div className="theme-selector" ref={menuRef}>
      <button
        type="button"
        className={`theme-trigger-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="点击切换网页主题风格"
      >
        <span className="theme-trigger-icon">{currentThemeConfig.icon}</span>
        <span className="theme-trigger-name">{currentThemeConfig.name}</span>
        <span className="theme-trigger-arrow">{isOpen ? '▴' : '▾'}</span>
      </button>

      {isOpen && (
        <div className="theme-dropdown-menu" role="menu">
          <div className="theme-dropdown-header">
            <span>🎨 选择网页主题风格</span>
          </div>
          <div className="theme-dropdown-list">
            {THEMES.map((t) => {
              const isSelected = theme === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  role="menuitem"
                  className={`theme-dropdown-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectTheme(t.id)}
                >
                  <div className="theme-item-left">
                    <span className="theme-item-icon">{t.icon}</span>
                    <div className="theme-item-info">
                      <div className="theme-item-title-row">
                        <span className="theme-item-name">{t.name}</span>
                        {isSelected && <span className="theme-item-badge">当前使用</span>}
                      </div>
                      <span className="theme-item-desc">{t.desc}</span>
                    </div>
                  </div>

                  <div className="theme-item-palette">
                    {t.colors.map((c, i) => (
                      <span
                        key={i}
                        className="palette-dot"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(ThemeSelector)
