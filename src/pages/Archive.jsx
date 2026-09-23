import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/xian/PageHeader'
import { useArticlesData } from '../hooks'
import { filterArticles, getArticleCategories, sortArticles } from '../utils/articleFilters'
import { getArchiveGroups, getBlogStats, getTagCloud } from '../utils/blogInsights'
import { categoryTone, toHanMonth, toHanNumeral, toHanYear } from '../utils/xianText'
import './Archive.css'

function hanMonthDay(date = '') {
  const [, m, d] = String(date).split('-').map(Number)
  return m && d ? `${toHanMonth(m)}${toHanNumeral(d)}` : ''
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

  // getArchiveGroups 总是新的在前；"由古及今"时把年份也倒过来
  const archiveGroups = useMemo(() => {
    const groups = getArchiveGroups(filteredArticles)
    if (sortOrder === 'asc') {
      return groups.reverse().map(g => ({ ...g, items: [...g.items].reverse() }))
    }
    return groups
  }, [filteredArticles, sortOrder])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('全部')
    setSelectedTag('')
    setSortOrder('desc')
  }

  const hasFilters = searchQuery || selectedCategory !== '全部' || selectedTag

  return (
    <div className="xarchive">
      <PageHeader title="藏经阁" plain="文章归档" seal="藏经" sub="按年份翻检旧卷，每一篇都在这里。">
        <dl className="ph-stats">
          <div><dt>藏卷</dt><dd><span className="latin">{stats.articleCount}</span>篇</dd></div>
          <div><dt>门类</dt><dd><span className="latin">{stats.categoryCount}</span>门</dd></div>
          <div><dt>签引</dt><dd><span className="latin">{stats.tagCount}</span>枚</dd></div>
          <div><dt>通读</dt><dd><span className="latin">{stats.totalReadMinutes}</span>分钟</dd></div>
        </dl>
      </PageHeader>

      <div className="wrap xarchive-body">
        <div className="xarchive-filter">
          <label className="field-line">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜篇名、正文、签引…"
              aria-label="搜索文章"
            />
          </label>
          <div className="xarchive-filter-row">
            <div className="tabs" role="tablist" aria-label="门类">
              {categories.map(c => (
                <button
                  key={c}
                  type="button"
                  role="tab"
                  aria-selected={selectedCategory === c}
                  className={`tab ${selectedCategory === c ? 'on' : ''}`}
                  onClick={() => setSelectedCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="link-arrow"
              onClick={() => setSortOrder(o => (o === 'desc' ? 'asc' : 'desc'))}
            >
              {sortOrder === 'desc' ? '由今溯古' : '由古及今'} <span className="arr">⇅</span>
            </button>
          </div>
          {hasFilters && (
            <div className="xarchive-hint">
              <span>
                检得 <b className="latin">{filteredArticles.length}</b> 篇
                {selectedTag && <> · 签引「{selectedTag}」</>}
              </span>
              <button type="button" className="link-arrow" onClick={clearFilters}>拂去筛选 <span className="arr">↻</span></button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="state"><div className="loading-bar" />正在翻检藏卷…</div>
        ) : error ? (
          <div className="state">
            <div className="state-mark">迷</div>
            <p>{error}</p>
            <button type="button" onClick={fetchArticles} className="btn" style={{ marginTop: 20 }}>再试一次</button>
          </div>
        ) : archiveGroups.length === 0 ? (
          <div className="state">
            <div className="state-mark">空</div>
            <p>此处未见所寻之卷</p>
            {hasFilters && <button type="button" onClick={clearFilters} className="btn ghost" style={{ marginTop: 20 }}>拂去筛选</button>}
          </div>
        ) : (
          <div className="xtimeline">
            {archiveGroups.map(group => (
              <section key={group.year} className="xyear reveal">
                <header className="xyear-head">
                  <h2 className="brush">{toHanYear(group.year)}</h2>
                  <span className="elegant">凡 {toHanNumeral(group.items.length)} 篇</span>
                </header>
                <ol className="xyear-list">
                  {group.items.map(a => (
                    <li key={a.id}>
                      <Link to={`/article/${a.id}`} className="xentry">
                        <span className="xentry-date elegant">{hanMonthDay(a.date)}</span>
                        <div className="xentry-body">
                          <h3>{a.title}</h3>
                          <div className="xentry-meta">
                            <span className="cat-label" style={{ '--tone': categoryTone(a.category) }}>
                              <span className="tone-dot" />{a.category}
                            </span>
                            <span className="elegant">约 {a.readTime} 分钟</span>
                          </div>
                        </div>
                        <span className="xentry-arr" aria-hidden="true">→</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        )}

        {tags.length > 0 && (
          <section className="xarchive-tags">
            <div className="section-h"><h2>签引 <small>点选以筛</small></h2></div>
            <div className="xarchive-tag-list">
              {tags.slice(0, 30).map(item => (
                <button
                  key={item.tag}
                  type="button"
                  onClick={() => setSelectedTag(item.tag === selectedTag ? '' : item.tag)}
                  className={`chip ${selectedTag === item.tag ? 'on' : ''}`}
                  aria-pressed={selectedTag === item.tag}
                >
                  {item.tag}<span className="count">{item.count}</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default Archive
