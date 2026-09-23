import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Pagination from '../components/Pagination'
import HomeCreativeSection from '../components/home/HomeCreativeSection'
import { Birds, CloudDivider, Moon, Mountains, Seal } from '../components/xian/Ornaments'
import { CAT_QUOTES, HOME_PAGE_SIZE } from '../constants/home'
import { blogProfile, nowItems } from '../data/blogProfile'
import { useArticlesData, useBackToTop } from '../hooks'
import { filterArticles, getArticleCategories, paginateArticles, sortArticles } from '../utils/articleFilters'
import { getBlogStats, getFeaturedArticles, getTagCloud } from '../utils/blogInsights'
import { categoryTone, toHanMonth, toHanNumeral, toHanYear, toShichen } from '../utils/xianText'
import './Home.css'

function splitDate(date = '') {
  const [y, m, d] = String(date).split('-')
  return { y, m: Number(m), d: Number(d) }
}

function Hero({ stats }) {
  const [shichen, setShichen] = useState(() => toShichen(new Date().getHours()))
  useEffect(() => {
    const id = setInterval(() => setShichen(toShichen(new Date().getHours())), 60000)
    return () => clearInterval(id)
  }, [])

  const items = [
    ['藏文', stats.articleCount, '篇'],
    ['门类', stats.categoryCount, '门'],
    ['签引', stats.tagCount, '枚'],
    ['可读', stats.totalReadMinutes, '分钟'],
  ]

  return (
    <section className="xhero">
      <div className="xhero-sky" aria-hidden="true">
        <Moon className="xhero-moon" />
        <Birds className="xhero-birds" />
        <div className="xhero-cloudband b1" />
        <div className="xhero-cloudband b2" />
        <Mountains className="xhero-mountains" pavilion />
      </div>

      <div className="wrap xhero-grid">
        <div className="xhero-copy">
          <div className="kicker rise" style={{ '--i': 1 }}>
            <span className="rule" />
            {shichen} · 宜读书
          </div>
          <p className="xhero-verse elegant rise" style={{ '--i': 2 }}>
            一窗灯火敲长夜，<br />
            半卷代码记流年。
          </p>
          <p className="xhero-intro rise" style={{ '--i': 3 }}>{blogProfile.intro}</p>

          <div className="xhero-actions rise" style={{ '--i': 4 }}>
            <a href="#scrolls" className="btn">入山阅卷 <span className="arr">→</span></a>
            <Link to="/archive" className="btn ghost">藏经阁</Link>
          </div>

          <dl className="xhero-stats rise" style={{ '--i': 5 }}>
            {items.map(([label, n, unit]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd><span className="latin">{n}</span>{unit}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="xhero-title" aria-label="橘猫小窝">
          <h1 className="brush ink-in">橘猫小窝</h1>
          <Seal text="慢更" size={42} className="xhero-seal" />
        </div>
      </div>

      <div className="xhero-scrollhint" aria-hidden="true">
        <span />
      </div>
    </section>
  )
}

function LeadStory({ article }) {
  if (!article) { return null }
  const { y, m, d } = splitDate(article.date)
  return (
    <section className="xlead wrap">
      <div className="xlead-label">
        <span className="brush vertical">今日开卷</span>
        <span className="line" />
      </div>
      <Link to={`/article/${article.id}`} className="xlead-card scroll-card">
        <div className="xlead-date">
          <span className="brush day">{toHanNumeral(d) || d}</span>
          <span className="elegant month">{toHanMonth(m)}</span>
          <span className="elegant year">{toHanYear(y)}</span>
        </div>
        <div className="xlead-body">
          <span className="cat-label" style={{ '--tone': categoryTone(article.category) }}>
            <span className="tone-dot" />{article.category}
          </span>
          <h2>{article.title}</h2>
          <p>{article.description}</p>
          <div className="xlead-foot">
            <span className="elegant">约 {article.readTime} 分钟可读毕</span>
            <span className="link-arrow">展卷细读 <span className="arr">→</span></span>
          </div>
        </div>
        <span className="xlead-watermark brush" aria-hidden="true">卷</span>
      </Link>
    </section>
  )
}

function FeaturedScrolls({ featured }) {
  const items = featured.slice(1, 4)
  if (items.length === 0) { return null }
  return (
    <section className="wrap xfeat">
      <div className="section-h">
        <h2>镇阁之作 <small>几篇可以先看的</small></h2>
      </div>
      <div className="xfeat-grid">
        {items.map((a, i) => (
          <Link key={a.id} to={`/article/${a.id}`} className="hang-scroll rise" style={{ '--i': i }}>
            <span className="rod" aria-hidden="true" />
            <div className="hang-body">
              <span className="brush hang-num">{toHanNumeral(i + 1, { formal: true })}</span>
              <span className="cat-label" style={{ '--tone': categoryTone(a.category) }}>
                <span className="tone-dot" />{a.category}
              </span>
              <h3>{a.title}</h3>
              <p>{a.description}</p>
              <span className="hang-meta latin">{a.date}</span>
            </div>
            <span className="rod bottom" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  )
}

function QuoteScroll() {
  const [index, setIndex] = useState(3)
  const quote = CAT_QUOTES[index]
  const next = () => setIndex(i => (i + 1 + Math.floor(Math.random() * (CAT_QUOTES.length - 1))) % CAT_QUOTES.length)

  return (
    <div className="xquote scroll-card">
      <div className="panel-h">箴言</div>
      <blockquote key={index} className="xquote-text elegant ink-in">{quote.text}</blockquote>
      <div className="xquote-foot">
        <span className="elegant">—— {quote.author}</span>
        <button type="button" className="link-arrow" onClick={next}>另取一签 <span className="arr">↻</span></button>
      </div>
    </div>
  )
}

function Sidebar({ cat, setCat, query, setQuery, categories, tags, counts }) {
  return (
    <aside className="xside">
      <div className="xside-block">
        <div className="panel-h">寻踪</div>
        <label className="field-line">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜篇名、签引…"
            aria-label="搜索文章"
          />
        </label>
      </div>

      <div className="xside-block">
        <div className="panel-h">门类</div>
        <ul className="xside-cats">
          {categories.map(c => (
            <li key={c}>
              <button type="button" className={cat === c ? 'on' : ''} onClick={() => setCat(c)}>
                <span className="tone-dot" style={{ '--tone': c === '全部' ? 'var(--gold)' : categoryTone(c) }} />
                <span className="name">{c}</span>
                <span className="dots" aria-hidden="true" />
                <span className="latin">{counts[c] ?? 0}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <QuoteScroll />

      {tags.length > 0 && (
        <div className="xside-block">
          <div className="panel-h">签引</div>
          <div className="xside-tags">
            {tags.map(item => (
              <Link key={item.tag} to={`/tags?tag=${encodeURIComponent(item.tag)}`} className="chip">
                {item.tag}<span className="count">{item.count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <Link to="/about" className="xside-owner scroll-card">
        <img src={blogProfile.avatar} alt="" />
        <div>
          <div className="elegant name">{blogProfile.owner}</div>
          <p>{nowItems[0]?.value}</p>
          <span className="link-arrow">拜访洞府 <span className="arr">→</span></span>
        </div>
      </Link>
    </aside>
  )
}

function Home() {
  const { articles, loading, error, fetchArticles } = useArticlesData()
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const showBackToTop = useBackToTop(600)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const categories = useMemo(() => getArticleCategories(articles), [articles])
  const stats = useMemo(() => getBlogStats(articles), [articles])
  const featuredArticles = useMemo(() => getFeaturedArticles(articles, 4), [articles])
  const tagCloud = useMemo(() => getTagCloud(articles).slice(0, 14), [articles])
  const categoryCounts = useMemo(() => {
    const counts = { 全部: articles.length }
    articles.forEach(a => { counts[a.category] = (counts[a.category] || 0) + 1 })
    return counts
  }, [articles])

  const filteredArticles = useMemo(() => {
    return sortArticles(filterArticles(articles, { searchQuery, selectedCategory }), 'date', 'desc')
  }, [articles, searchQuery, selectedCategory])

  const paginatedArticles = useMemo(() => {
    return paginateArticles(filteredArticles, currentPage, HOME_PAGE_SIZE)
  }, [filteredArticles, currentPage])

  const totalPages = Math.ceil(filteredArticles.length / HOME_PAGE_SIZE)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory])

  return (
    <div className="xhome">
      <Hero stats={stats} />
      <LeadStory article={featuredArticles[0]} />
      <FeaturedScrolls featured={featuredArticles} />

      <div className="wrap"><CloudDivider /></div>
      <HomeCreativeSection />
      <div className="wrap"><CloudDivider /></div>

      <div className="wrap xindex" id="scrolls">
        <div className="xindex-main">
          <div className="section-h">
            <h2>诸篇 <small>全部文章</small></h2>
            <Link to="/archive" className="more">去藏经阁 →</Link>
          </div>

          {loading ? (
            <div className="state"><div className="loading-bar" />墨迹未干，稍候片刻…</div>
          ) : error ? (
            <div className="state">
              <div className="state-mark">迷</div>
              <p>{error}</p>
              <button onClick={fetchArticles} className="btn" style={{ marginTop: 20 }}>再试一次</button>
            </div>
          ) : paginatedArticles.length > 0 ? (
            <>
              <ol className="xlist">
                {paginatedArticles.map((a, i) => {
                  const n = (currentPage - 1) * HOME_PAGE_SIZE + i + 1
                  return (
                    <li key={a.id} className="rise" style={{ '--i': i }}>
                      <Link to={`/article/${a.id}`} className="xrow">
                        <span className="xrow-num brush">{toHanNumeral(n)}</span>
                        <div className="xrow-body">
                          <div className="xrow-meta">
                            <span className="cat-label" style={{ '--tone': categoryTone(a.category) }}>
                              <span className="tone-dot" />{a.category}
                            </span>
                            <span className="latin">{a.date}</span>
                          </div>
                          <h3>{a.title}</h3>
                          <p>{a.description}</p>
                        </div>
                        <span className="xrow-go" aria-hidden="true">
                          <span className="elegant">{a.readTime} 分</span>
                          <span className="arr">→</span>
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ol>

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalCount={filteredArticles.length}
                  onPageChange={(page) => {
                    setCurrentPage(page)
                    document.getElementById('scrolls')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                />
              )}
            </>
          ) : (
            <div className="state">
              <div className="state-mark">空</div>
              <p>{searchQuery ? `寻遍山中，未见「${searchQuery}」` : '此门类下尚无文章'}</p>
              {(searchQuery || selectedCategory !== '全部') && (
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory('全部') }}
                  className="btn ghost"
                  style={{ marginTop: 20 }}
                >
                  拂去尘埃，重新来过
                </button>
              )}
            </div>
          )}
        </div>

        <Sidebar
          cat={selectedCategory}
          setCat={setSelectedCategory}
          query={searchQuery}
          setQuery={setSearchQuery}
          categories={categories}
          tags={tagCloud}
          counts={categoryCounts}
        />
      </div>

      <button
        className={`xtop ${showBackToTop ? 'show' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="回到顶部"
      >
        <span className="brush">顶</span>
      </button>
    </div>
  )
}

export default Home
