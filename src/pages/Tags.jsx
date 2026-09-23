import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageHeader from '../components/xian/PageHeader'
import { useArticlesData } from '../hooks'
import { filterArticles, getArticleCategories } from '../utils/articleFilters'
import { getSortedArticles, getTagCloud } from '../utils/blogInsights'
import { categoryTone, toHanMonth, toHanNumeral } from '../utils/xianText'
import './Tags.css'

function hanMonthDay(date = '') {
  const [, m, d] = String(date).split('-').map(Number)
  return m && d ? `${toHanMonth(m)}${toHanNumeral(d)}` : ''
}

function Tags() {
  const { articles, loading, error, fetchArticles } = useArticlesData()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedCategory, setSelectedCategory] = useState('全部')

  const selectedTag = searchParams.get('tag') || ''
  const tags = useMemo(() => getTagCloud(articles), [articles])
  const categories = useMemo(() => getArticleCategories(articles).filter(c => c !== '全部'), [articles])
  const maxCount = tags[0]?.count || 1

  // 门派：每个分类的篇数、总阅读时长与最新一篇
  const sects = useMemo(() => categories.map(c => {
    const items = getSortedArticles(articles.filter(a => a.category === c))
    return {
      name: c,
      count: items.length,
      minutes: items.reduce((sum, a) => sum + (Number.parseInt(a.readTime, 10) || 0), 0),
      latest: items[0],
    }
  }), [articles, categories])

  const filteredArticles = useMemo(() => {
    return getSortedArticles(filterArticles(articles, {
      selectedCategory,
      selectedTags: selectedTag ? [selectedTag] : [],
    }))
  }, [articles, selectedCategory, selectedTag])

  const selectTag = (tag) => {
    setSearchParams(tag === selectedTag ? {} : { tag })
  }

  const clear = () => {
    setSelectedCategory('全部')
    setSearchParams({})
  }

  const hasSelection = selectedTag || selectedCategory !== '全部'

  return (
    <div className="xtags">
      <PageHeader title="万象" plain="标签与门类" seal="万象" sub="字越大，写得越多。点一枚签引，便能寻到相关的文章。" />

      <div className="wrap xtags-body">
        {loading ? (
          <div className="state"><div className="loading-bar" />正在观星…</div>
        ) : error ? (
          <div className="state">
            <div className="state-mark">迷</div>
            <p>{error}</p>
            <button type="button" onClick={fetchArticles} className="btn" style={{ marginTop: 20 }}>再试一次</button>
          </div>
        ) : (
          <>
            {/* 签引星图 */}
            <div className="xcloud" role="list" aria-label="全部签引">
              {tags.map((item, i) => {
                const weight = Math.sqrt(item.count / maxCount)
                const active = selectedTag === item.tag
                return (
                  <button
                    key={item.tag}
                    type="button"
                    role="listitem"
                    aria-pressed={active}
                    onClick={() => selectTag(item.tag)}
                    className={`xcloud-tag ${active ? 'on' : ''}`}
                    style={{
                      '--w': weight,
                      '--delay': `${(i % 7) * -1.3}s`,
                      fontSize: `${15 + weight * 22}px`,
                    }}
                  >
                    {item.tag}
                    <sup className="latin">{item.count}</sup>
                  </button>
                )
              })}
            </div>

            {hasSelection && (
              <section className="xtags-result">
                <div className="section-h">
                  <h2>
                    {selectedTag ? `「${selectedTag}」` : selectedCategory}
                    <small>凡 {toHanNumeral(filteredArticles.length)} 篇</small>
                  </h2>
                  <button type="button" className="more link-arrow" onClick={clear}>拂去筛选 <span className="arr">↻</span></button>
                </div>
                {filteredArticles.length === 0 ? (
                  <div className="state"><div className="state-mark">空</div><p>此签之下尚无文章</p></div>
                ) : (
                  <ol className="xyear-list">
                    {filteredArticles.map((a, i) => (
                      <li key={a.id} className="rise" style={{ '--i': Math.min(i, 8) }}>
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
                )}
              </section>
            )}

            {sects.length > 0 && (
              <section className="xsects">
                <div className="section-h"><h2>门类 <small>按分类看</small></h2></div>
                <div className="xsects-grid">
                  {sects.map((s, i) => (
                    <button
                      key={s.name}
                      type="button"
                      className={`xsect scroll-card ${selectedCategory === s.name ? 'on' : ''}`}
                      style={{ '--tone': categoryTone(s.name) }}
                      onClick={() => { setSearchParams({}); setSelectedCategory(selectedCategory === s.name ? '全部' : s.name) }}
                      aria-pressed={selectedCategory === s.name}
                    >
                      <span className="xsect-num brush">{toHanNumeral(i + 1, { formal: true })}</span>
                      <span className="xsect-name">{s.name}</span>
                      <span className="xsect-stat elegant">
                        {toHanNumeral(s.count)} 篇 · 共 {s.minutes} 分钟
                      </span>
                      {s.latest && <span className="xsect-latest">新作：{s.latest.title}</span>}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Tags
