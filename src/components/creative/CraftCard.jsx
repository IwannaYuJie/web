import { toHanNumeral } from '../../utils/xianText'
import './creative.css'

/** 一款创意风格的卡片；detailed 时展示全部特性与标签 */
function CraftCard({ blog, onPreview, onCopyColor, detailed = false, style }) {
  const numLabel = toHanNumeral(Number(blog.num))

  return (
    <article className={`craft-card ${detailed ? 'detailed' : ''}`} style={style}>
      <button type="button" className="craft-thumb" onClick={() => onPreview(blog)} aria-label={`预览 ${blog.title}`}>
        <img src={blog.thumbnail} alt="" loading="lazy" />
        <span className="craft-thumb-veil"><span className="elegant">入画一观</span></span>
        <span className="craft-num brush">第{numLabel}式</span>
      </button>

      <div className="craft-body">
        <span className="craft-cat elegant">{blog.categoryLabel}</span>
        <h3 className="craft-title">{blog.title}</h3>
        <div className="craft-sub">{blog.subtitle}</div>
        <p className="craft-desc">{blog.desc}</p>

        <div className="craft-palette">
          {blog.colors.map(col => (
            <button
              type="button"
              key={col.hex}
              style={{ backgroundColor: col.hex }}
              title={`复制「${col.name}」${col.hex}`}
              aria-label={`复制颜色 ${col.name} ${col.hex}`}
              onClick={(e) => onCopyColor(col, e)}
            />
          ))}
        </div>

        {detailed ? (
          <>
            <ul className="craft-features">
              {blog.features.map(f => <li key={f}>{f}</li>)}
            </ul>
            <div className="craft-tags">
              {blog.tags.map(tag => <span key={tag}>{tag}</span>)}
            </div>
          </>
        ) : (
          <ul className="craft-features"><li>{blog.features[0]}</li></ul>
        )}
      </div>

      <div className="craft-actions">
        <button type="button" className="link-arrow" onClick={() => onPreview(blog)}>即刻试玩 <span className="arr">→</span></button>
        <a href={blog.htmlFile} target="_blank" rel="noopener noreferrer" className="craft-full">全屏 ↗</a>
      </div>
    </article>
  )
}

export default CraftCard
