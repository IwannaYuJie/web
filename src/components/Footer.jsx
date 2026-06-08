import { useState, useEffect, memo } from 'react'
import { Link } from 'react-router-dom'
import { blogProfile } from '../data/blogProfile'
import './Footer.css'

const FOOT_LINKS = [
  { path: '/', label: '首页' },
  { path: '/archive', label: '归档' },
  { path: '/tags', label: '标签' },
  { path: '/about', label: '关于' },
  { path: '/toolbox', label: '工具箱' },
  { path: '/games', label: '游戏' },
]

function Footer() {
  const [visitors, setVisitors] = useState(12480)

  useEffect(() => {
    const id = setInterval(() => {
      setVisitors(v => v + (Math.random() < 0.5 ? 1 : 0))
    }, 4000)
    return () => clearInterval(id)
  }, [])

  return (
    <footer className="foot">
      <div className="foot-inner">
        <div>
          <div className="foot-brand">
            <span className="mk"><img src={blogProfile.avatar} alt="" /></span>
            橘猫小窝
          </div>
          <p className="foot-intro">{blogProfile.intro}</p>
          <div className="foot-stickers">
            <a href={blogProfile.github} target="_blank" rel="noreferrer">🐱 GitHub</a>
            <a href={`mailto:${blogProfile.email}`}>✉️ Email</a>
          </div>
        </div>

        <div>
          <div className="panel-h" style={{ color: 'var(--sun)' }}>导航</div>
          <div className="foot-links">
            {FOOT_LINKS.map(l => (
              <Link key={l.path} to={l.path}>{l.label}</Link>
            ))}
          </div>
        </div>

        <div>
          <div className="panel-h" style={{ color: 'var(--sun)' }}>小窝状态</div>
          <div className="foot-visits">{visitors.toLocaleString()}</div>
          <div className="foot-visits-label">累计访客</div>
          <p className="foot-copy">© {new Date().getFullYear()} 橘猫小窝 · 慢更但还在更 🐾</p>
        </div>
      </div>
    </footer>
  )
}

export default memo(Footer)
