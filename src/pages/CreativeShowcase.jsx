import { useMemo, useState } from 'react'
import { CREATIVE_BLOGS, CATEGORIES } from '../data/creativeBlogsData'
import CraftCard from '../components/creative/CraftCard'
import CreativePreviewModal from '../components/creative/CreativePreviewModal'
import { useCreativePreview } from '../components/creative/useCreativePreview'
import PageHeader from '../components/xian/PageHeader'
import './CreativeShowcase.css'

function matchesQuery(item, query) {
  if (!query) { return true }
  return (
    item.title.toLowerCase().includes(query) ||
    item.subtitle.toLowerCase().includes(query) ||
    item.desc.toLowerCase().includes(query) ||
    item.tags.some(t => t.toLowerCase().includes(query)) ||
    item.features.some(f => f.toLowerCase().includes(query)) ||
    item.num.includes(query)
  )
}

function CreativeShowcase() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const { previewItem, setPreviewItem, closePreview, navigatePreview, openRandom, copyColor, toast } = useCreativePreview()

  const filteredBlogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return CREATIVE_BLOGS.filter(item =>
      (activeCategory === 'all' || item.category === activeCategory) && matchesQuery(item, query))
  }, [activeCategory, searchQuery])

  const resetFilters = () => {
    setActiveCategory('all')
    setSearchQuery('')
  }

  return (
    <div className="xcreative">
      <PageHeader
        title="百工坊"
        plain="创意工坊"
        seal="百工"
        sub={`${CREATIVE_BLOGS.length} 款排版流派，${CATEGORIES.length - 1} 大门类，每一款都是能独立试玩的完整页面。`}
      >
        <button type="button" className="btn" onClick={openRandom}>随缘一游 <span className="arr">✦</span></button>
      </PageHeader>

      <div className="wrap">
        <div className="xcreative-bar">
          <div className="tabs" role="tablist">
            {CATEGORIES.map(cat => {
              const count = cat.key === 'all' ? CREATIVE_BLOGS.length : CREATIVE_BLOGS.filter(b => b.category === cat.key).length
              return (
                <button
                  key={cat.key}
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === cat.key}
                  className={`tab ${activeCategory === cat.key ? 'on' : ''}`}
                  onClick={() => setActiveCategory(cat.key)}
                >
                  {cat.label}<span className="count">{count}</span>
                </button>
              )
            })}
          </div>

          <div className="xcreative-tools">
            <label className="field-line">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                placeholder="寻风格、特性、标签…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="搜索排版风格"
              />
            </label>
            <div className="xcreative-view" role="group" aria-label="视图">
              <button type="button" className={viewMode === 'grid' ? 'on' : ''} onClick={() => setViewMode('grid')}>画廊</button>
              <button type="button" className={viewMode === 'list' ? 'on' : ''} onClick={() => setViewMode('list')}>长卷</button>
            </div>
          </div>
        </div>

        {filteredBlogs.length === 0 ? (
          <div className="state">
            <div className="state-mark">空</div>
            <p>遍寻百工，未见此式</p>
            <button type="button" className="btn ghost" style={{ marginTop: 20 }} onClick={resetFilters}>拂去尘埃，重新来过</button>
          </div>
        ) : (
          <div className={`craft-grid ${viewMode === 'list' ? 'list' : ''}`} key={`${activeCategory}-${viewMode}`}>
            {filteredBlogs.map((blog, idx) => (
              <CraftCard
                key={blog.id}
                blog={blog}
                detailed
                onPreview={setPreviewItem}
                onCopyColor={copyColor}
                style={{ animationDelay: `${Math.min(idx * 50, 600)}ms` }}
              />
            ))}
          </div>
        )}
      </div>

      {previewItem && (
        <CreativePreviewModal item={previewItem} onClose={closePreview} onNavigate={navigatePreview} />
      )}
      {toast && <div className="xtoast" role="status">{toast}</div>}
    </div>
  )
}

export default CreativeShowcase
