import { memo } from 'react'
import { Link } from 'react-router-dom'
import { blogProfile } from '../data/blogProfile'
import { NAV_LINKS } from './Navbar'
import { Cloud, Mountains, Seal } from './xian/Ornaments'
import './Footer.css'

const SITE_START = new Date('2025-05-25T00:00:00')

function Footer() {
  const days = Math.max(0, Math.floor((Date.now() - SITE_START.getTime()) / 86400000))

  return (
    <footer className="xfoot">
      <Mountains className="xfoot-mountains" pavilion />

      <div className="xfoot-inner">
        {/* 对联：右为上联，左为下联 */}
        <p className="couplet right brush" aria-label="上联">闲敲代码消长夜</p>

        <div className="xfoot-center">
          <Cloud size={96} />
          <div className="xfoot-title">
            <span className="brush">橘猫小窝</span>
            <Seal text="橘猫小窝" size={46} />
          </div>
          <p className="xfoot-intro">{blogProfile.intro}</p>

          <nav className="xfoot-links" aria-label="页脚导航">
            {NAV_LINKS.map(l => (
              <Link key={l.path} to={l.path}>{l.label}</Link>
            ))}
          </nav>

          <div className="xfoot-contact">
            <a href={blogProfile.github} target="_blank" rel="noreferrer">GitHub</a>
            <span aria-hidden="true">·</span>
            <a href={`mailto:${blogProfile.email}`}>飞鸽传书</a>
          </div>

          <p className="xfoot-meta">
            乙巳年五月结庐于此，已历 <b>{days}</b> 日
            <span aria-hidden="true"> · </span>
            © {new Date().getFullYear()} 橘猫小窝
          </p>
        </div>

        <p className="couplet left brush" aria-label="下联">慢写文章寄旧年</p>
      </div>
    </footer>
  )
}

export default memo(Footer)
