import { useState, useEffect, memo } from 'react'
import './Footer.css'

function Footer() {
  const [visitorCount, setVisitorCount] = useState(12345)
  const [currentTime, setCurrentTime] = useState(new Date())

  // 模拟访客增长
  useEffect(() => {
    const interval = setInterval(() => {
      setVisitorCount(prev => prev + Math.floor(Math.random() * 2))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-stats">
          <div className="stat-item">
            <span>👥</span>
            <span>访客: {visitorCount.toLocaleString()}</span>
          </div>
          <div className="stat-item">
            <span>🕒</span>
            <span>{currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        <div className="footer-links">
          <a href="https://github.com/IwannaYuJie" target="_blank" rel="noreferrer" className="footer-link">
            GitHub
          </a>
          <a href="/about" className="footer-link">
            关于我
          </a>
        </div>

        <p className="footer-copyright">
          © {new Date().getFullYear()} 橘猫小窝 🐾 | 用 🧡 和 ☕ 制作
        </p>
      </div>
    </footer>
  )
}

export default memo(Footer)
