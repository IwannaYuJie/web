import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useArticlesData } from '../hooks'
import { filterArticles, getArticleCategories } from '../utils/articleFilters'
import { getTagCloud } from '../utils/blogInsights'

const KS = ['k1', 'k2', 'k3', 'k4']

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

function Tags() {
  const { articles, loading, error, fetchArticles } = useArticlesData()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedCategory, setSelectedCategory] = useState('全部')

  const selectedTag = searchParams.get('tag') || ''
  const tags = useMemo(() => getTagCloud(articles), [articles])
  const categories = useMemo(() => getArticleCategories(articles), [articles])

  const filteredArticles = useMemo(() => {
    return filterArticles(articles, {
      selectedCategory,
      selectedTags: selectedTag ? [selectedTag] : [],
    })
  }, [articles, selectedCategory, selectedTag])

  const selectTag = (tag) => {
    if (tag === selectedTag) {
      setSearchParams({})
      return
    }
    setSearchParams({ tag })
  }

  return (
    <div className="wrap" style={{ maxWidth: 900, paddingBottom: 48 }}>
      <PageHead emoji="#" title="标签" sub="按出现次数排，越常写的越大一些" />

      {loading ? (
        <div className="panel" style={{ textAlign: 'center', padding: 48 }}>
          <div className="animate-bounce" style={{ fontSize: 40 }}>🐱</div>
          <p style={{ marginTop: 12, color: 'var(--ink-soft)' }}>标签加载中…</p>
        </div>
      ) : error ? (
        <div className="panel" style={{ textAlign: 'center', padding: 48, background: 'var(--k2-bg)' }}>
          <p style={{ marginBottom: 16, color: 'var(--ink-soft)' }}>{error}</p>
          <button onClick={fetchArticles} className="btn">重试</button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 32 }}>
            {tags.map((item, i) => {
              const active = selectedTag === item.tag
              const kc = KS[i % 4]
              return (
                <button
                  key={item.tag}
                  onClick={() => selectTag(item.tag)}
                  className={active ? 'ec' : `ec ${kc}`}
                  style={{
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: active ? 'var(--ink)' : undefined,
                    color: active ? 'var(--paper)' : undefined,
                  }}
                >
                  <span style={{ fontFamily: 'var(--serif)', fontWeight: 900, fontSize: 14 + item.count * 3 }}>
                    #{item.tag}
                  </span>
                  <span style={{ fontFamily: 'var(--disp)', fontWeight: 700, fontSize: 13, opacity: 0.6 }}>
                    {item.count}
                  </span>
                </button>
              )
            })}
          </div>

          {(selectedTag || selectedCategory !== '全部') && (
            <>
              <div className="section-h">
                <h2>
                  {selectedTag ? `#${selectedTag}` : selectedCategory}
                  <span style={{ fontFamily: 'var(--disp)', fontSize: 15, fontWeight: 600, color: 'var(--ink-soft)' }}>
                    · {filteredArticles.length} 篇
                  </span>
                </h2>
                <button
                  onClick={() => {
                    setSelectedCategory('全部')
                    setSearchParams({})
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', fontFamily: 'var(--disp)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
                >
                  清除筛选 ↻
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredArticles.map((a, i) => (
                  <Link
                    key={a.id}
                    to={`/article/${a.id}`}
                    className={`ec ${KS[i % 4]}`}
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
                {filteredArticles.length === 0 && (
                  <div className="panel" style={{ textAlign: 'center', padding: 36 }}>
                    <div style={{ fontSize: 40 }}>🍃</div>
                    <p style={{ marginTop: 12, color: 'var(--ink-soft)' }}>这个标签下还没文章。</p>
                  </div>
                )}
              </div>
            </>
          )}

          {!selectedTag && selectedCategory === '全部' && categories.length > 1 && (
            <>
              <div className="section-h"><h2>📁 按分类看</h2></div>
              <div className="panel" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {categories.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedCategory(c)}
                    className="sticker"
                    style={c === '全部' ? { background: 'var(--ink)', color: 'var(--paper)', borderColor: 'var(--ink)' } : undefined}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default Tags
