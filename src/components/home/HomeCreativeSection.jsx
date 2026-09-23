import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CREATIVE_BLOGS, CATEGORIES } from '../../data/creativeBlogsData'
import CraftCard from '../creative/CraftCard'
import CreativePreviewModal from '../creative/CreativePreviewModal'
import { useCreativePreview } from '../creative/useCreativePreview'
import './HomeCreativeSection.css'

function getRandomSample(items, count = 3) {
  if (items.length <= count) {
    return [...items]
  }
  return [...items].sort(() => 0.5 - Math.random()).slice(0, count)
}

/** 首页的百工坊：随机展示三款排版风格，可就地预览 */
function HomeCreativeSection() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [seed, setSeed] = useState(0)
  const { previewItem, setPreviewItem, closePreview, navigatePreview, openRandom, copyColor, toast } = useCreativePreview()

  const categoryBlogs = useMemo(() => (
    activeCategory === 'all' ? CREATIVE_BLOGS : CREATIVE_BLOGS.filter(b => b.category === activeCategory)
  ), [activeCategory])

  // seed 变化时重新抽取
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const displayed = useMemo(() => getRandomSample(categoryBlogs, 3), [categoryBlogs, seed])

  return (
    <section className="wrap xcraft" aria-label="百工坊 · 排版风格">
      <div className="section-h">
        <h2>百工坊 <small>{CREATIVE_BLOGS.length} 款排版流派</small></h2>
        <div className="xcraft-actions">
          <button type="button" className="link-arrow" onClick={() => setSeed(s => s + 1)}>换一批 <span className="arr">↻</span></button>
          <button type="button" className="link-arrow" onClick={openRandom}>随缘一游 <span className="arr">✦</span></button>
          <Link to="/creative" className="btn sm ghost">尽览百工 <span className="arr">→</span></Link>
        </div>
      </div>

      <p className="xcraft-intro">
        瑞士极简、水墨国风、Y2K 千禧、GameBoy、黑客帝国数字雨、包豪斯、侦探档案……每一款都是能直接试玩的独立页面。
      </p>

      <div className="tabs xcraft-tabs" role="tablist">
        {CATEGORIES.map(cat => {
          const count = cat.key === 'all' ? CREATIVE_BLOGS.length : CREATIVE_BLOGS.filter(b => b.category === cat.key).length
          return (
            <button
              key={cat.key}
              type="button"
              role="tab"
              aria-selected={activeCategory === cat.key}
              className={`tab ${activeCategory === cat.key ? 'on' : ''}`}
              onClick={() => { setActiveCategory(cat.key); setSeed(s => s + 1) }}
            >
              {cat.label}<span className="count">{count}</span>
            </button>
          )
        })}
      </div>

      <div className="craft-grid" key={`${activeCategory}-${seed}`}>
        {displayed.map((blog, i) => (
          <CraftCard
            key={blog.id}
            blog={blog}
            onPreview={setPreviewItem}
            onCopyColor={copyColor}
            style={{ animationDelay: `${i * 90}ms` }}
          />
        ))}
      </div>

      {previewItem && (
        <CreativePreviewModal item={previewItem} onClose={closePreview} onNavigate={navigatePreview} />
      )}
      {toast && <div className="xtoast" role="status">{toast}</div>}
    </section>
  )
}

export default HomeCreativeSection
