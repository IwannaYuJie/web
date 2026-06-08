import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useArticlesData } from '../hooks'
import { filterArticles, getArticleCategories, sortArticles } from '../utils/articleFilters'
import { getArchiveGroups, getBlogStats, getTagCloud } from '../utils/blogInsights'

const KCLASS_MAP = { 'Java核心': 'k1', 'JVM': 'k2', 'Spring框架': 'k3' }
const KS = ['k1', 'k2', 'k3', 'k4']
function kClassFor(category, i) {
  return KCLASS_MAP[category] || KS[i % 4]
}

function PageHead({ emoji, title, sub }) {
  return (
    <div style={{ padding: '34px 0 24px' }}>
      <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 900, fontSize: 'clamp(40px,7vw,72px)', lineHeight: 1, letterSpacing: '-.02em' }}>
        {emoji} {title}
      </h1>
      {sub && <p style={{ fontSize: 16, color: 'var(--ink-soft)', marginTop: 12, fontWeight: 500 }}>{sub}</p>}
    </div>
  )
}

function StatPanel({ value, label }) {
  return (
    <div className="panel" style={{ textAlign: 'center', padding: '18px 8px' }}>
      <div style={{ fontFamily: 'var(--disp)', fontSize: 34, fontWeight: 700, color: 'var(--accent)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600 }}>{label}</div>
    </div>
  )
}

function Archive() {
  const { articles, loading, error, fetchArticles } = useArticlesData()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [selectedTag, setSelectedTag] = useState('')
  const [sortOrder, setSortOrder] = useState('desc')

  const categories = useMemo(() => getArticleCategories(articles), [articles])
  const tags = useMemo(() => getTagCloud(articles), [articles])
  const stats = useMemo(() => getBlogStats(articles), [articles])

  const filteredArticles = useMemo(() => {
    const filtered = filterArticles(articles, {
      searchQuery,
      selectedCategory,
      selectedTags: selectedTag ? [selectedTag] : [],
      includeContent: true,
    })
    return sortArticles(filtered, 'date', sortOrder)
  }, [articles, searchQuery, selectedCategory, selectedTag, sortOrder])

  const archiveGroups = useMemo(() => getArchiveGroups(filteredArticles), [filteredArticles])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('全部')
    setSelectedTag('')
    setSortOrder('desc')
  }

  const hasFilters = searchQuery || selectedCategory !== '全部' || selectedTag

  return (
    <div className="wrap" style={{ maxWidth: 900, paddingBottom: 48 }}>
      <PageHead emoji="🗂️" title="文章归档" sub="按年份翻一翻" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        <StatPanel value={stats.articleCount} label="篇文章" />
        <StatPanel value={stats.categoryCount} label="个分类" />
        <StatPanel value={stats.tagCount} label="个标签" />
        <StatPanel value={stats.totalReadMinutes} label="分钟读完" />
      </div>

      <div className="panel" style={{ padding: 18, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜标题、正文、描述或标签…"
              style={{ paddingLeft: 38 }}
            />
          </div>
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            style={{ width: 'auto', minWidth: 140 }}
          >
            <option value="desc">最新优先</option>
            <option value="asc">最早优先</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 14 }}>
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              style={{
                fontSize: 13,
                fontWeight: 700,
                padding: '6px 13px',
                borderRadius: 999,
                border: '2px solid var(--ink)',
                background: selectedCategory === c ? 'var(--ink)' : 'transparent',
                color: selectedCategory === c ? 'var(--paper)' : 'var(--ink)',
                cursor: 'pointer',
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {hasFilters && (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingTop: 12, marginTop: 12, borderTop: '2px solid var(--line)', fontSize: 13, color: 'var(--ink-soft)' }}>
            <span>当前筛选到 <b style={{ color: 'var(--accent)' }}>{filteredArticles.length}</b> 篇文章{selectedTag && <> · 标签 #{selectedTag}</>}</span>
            <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer' }}>
              清除筛选 ↻
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="panel" style={{ textAlign: 'center', padding: 48 }}>
          <div className="animate-bounce" style={{ fontSize: 40 }}>🐱</div>
          <p style={{ marginTop: 12, color: 'var(--ink-soft)' }}>归档加载中…</p>
        </div>
      ) : error ? (
        <div className="panel" style={{ textAlign: 'center', padding: 48, background: 'var(--k2-bg)' }}>
          <p style={{ marginBottom: 16, color: 'var(--ink-soft)' }}>{error}</p>
          <button onClick={fetchArticles} className="btn">重试</button>
        </div>
      ) : archiveGroups.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 40 }}>🍃</div>
          <p style={{ marginTop: 12, color: 'var(--ink-soft)' }}>这个条件下没找到东西。</p>
          {hasFilters && <button onClick={clearFilters} className="btn ghost" style={{ marginTop: 16 }}>清除筛选</button>}
        </div>
      ) : (
        archiveGroups.map((group, gi) => (
          <section key={group.year} style={{ marginBottom: 32 }}>
            <div className="section-h">
              <h2>
                {group.year}
                <span style={{ fontFamily: 'var(--disp)', fontSize: 15, fontWeight: 600, color: 'var(--ink-soft)' }}>
                  · {group.items.length} 篇
                </span>
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {group.items.map((a, i) => (
                <Link
                  key={a.id}
                  to={`/article/${a.id}`}
                  className={`ec ${kClassFor(a.category, gi * 7 + i)}`}
                  style={{ display: 'grid', gridTemplateColumns: 'auto auto 1fr auto', gap: 16, alignItems: 'center', padding: '18px 22px' }}
                >
                  <span style={{ fontFamily: 'var(--disp)', fontSize: 13, fontWeight: 700, opacity: 0.55 }}>
                    {a.date ? a.date.slice(5) : ''}
                  </span>
                  <span className="cat cat-chip" style={{ border: 'none', padding: 0 }}>{a.category}</span>
                  <h3 style={{ fontSize: 19, margin: 0 }}>{a.title}</h3>
                  <span className="arrow">→</span>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}

      {tags.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <div className="section-h"><h2># 热门标签</h2></div>
          <div className="panel" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {tags.slice(0, 24).map(item => (
              <button
                key={item.tag}
                onClick={() => setSelectedTag(item.tag === selectedTag ? '' : item.tag)}
                className="sticker"
                style={
                  selectedTag === item.tag
                    ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }
                    : { fontSize: 12.5, padding: '6px 12px' }
                }
              >
                #{item.tag} <b style={{ color: selectedTag === item.tag ? 'var(--sun)' : 'var(--accent)' }}>{item.count}</b>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default Archive
