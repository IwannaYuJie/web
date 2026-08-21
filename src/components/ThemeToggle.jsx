import { memo } from 'react'
import { useTheme } from '../context/ThemeContext'
import './ThemeToggle.css'

function ThemeToggle({ compact = false, className = '' }) {
  const { theme, toggleTheme } = useTheme()
  const isSketch = theme === 'sketch'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle-btn ${isSketch ? 'is-sketch' : 'is-paper'} ${compact ? 'compact' : ''} ${className}`}
      title={isSketch ? '当前为「手绘草图风」，点击切换回「暖纸风」' : '当前为「暖纸风」，点击切换为「手绘草图风」'}
      aria-label={isSketch ? '切换为暖纸风格' : '切换为手绘风格'}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {isSketch ? '✏️' : '🎨'}
      </span>
      {!compact && (
        <span className="theme-toggle-label">
          {isSketch ? '手绘风' : '暖纸风'}
        </span>
      )}
      <span className="theme-toggle-badge" aria-hidden="true">
        {isSketch ? '草稿' : '经典'}
      </span>
    </button>
  )
}

export default memo(ThemeToggle)
