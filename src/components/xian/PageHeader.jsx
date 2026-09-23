import { Birds, Cloud, Mountains, Seal } from './Ornaments'
import './xian.css'

/**
 * 内页页头：毛笔大标题 + 白话副标 + 远山云雾。
 * title 用雅称（如"藏经阁"），plain 用白话（如"文章归档"）。
 */
function PageHeader({ title, plain, sub, seal, children, compact = false }) {
  return (
    <header className={`xian-pagehead ${compact ? 'compact' : ''}`}>
      <Mountains className="ph-mountains" />
      <Birds className="ph-birds" />
      <div className="wrap ph-inner">
        <div className="kicker rise" style={{ '--i': 0 }}>
          <span className="rule" />
          {plain}
          <span className="rule r" />
        </div>
        <h1 className="ph-title brush ink-in">
          {title}
          {seal && <Seal text={seal} size={40} className="ph-seal" />}
        </h1>
        <Cloud className="ph-cloud rise" size={84} />
        {sub && <p className="ph-sub rise" style={{ '--i': 2 }}>{sub}</p>}
        {children && <div className="ph-extra rise" style={{ '--i': 3 }}>{children}</div>}
      </div>
    </header>
  )
}

export default PageHeader
