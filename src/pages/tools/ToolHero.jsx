import { Link, useLocation } from 'react-router-dom'
import { Seal } from '../../components/xian/Ornaments'
import { TOOLS } from '../../data/tools'
import './ToolHero.css'

/** 单个法宝页的页头：面包屑 + 印章 + 雅称与白话名 */
function ToolHero({ tag, title, desc }) {
  const { pathname } = useLocation()
  const tool = TOOLS.find(t => t.path === pathname)

  return (
    <header className="xtoolhero">
      <nav className="xtoolhero-crumb elegant" aria-label="面包屑">
        <Link to="/toolbox">法宝阁</Link>
        <span aria-hidden="true">·</span>
        <span>{tool?.alias || title}</span>
      </nav>
      <div className="xtoolhero-main">
        <Seal text={tool?.glyph || title.slice(0, 1)} size={64} />
        <div>
          <h1>
            <span className="brush">{tool?.alias || title}</span>
            {tool && <small className="elegant">{title}</small>}
          </h1>
          <p>{desc}</p>
        </div>
        {tag && <span className="xtoolhero-tag elegant">{tag}</span>}
      </div>
    </header>
  )
}

export default ToolHero
