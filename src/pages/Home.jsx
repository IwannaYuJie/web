import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Pagination from '../components/Pagination'
import { CAT_QUOTES, HOME_PAGE_SIZE } from '../constants/home'
import { useArticlesData, useBackToTop } from '../hooks'
import { filterArticles, getArticleCategories, paginateArticles, sortArticles } from '../utils/articleFilters'
import { getBlogStats, getFeaturedArticles, getTagCloud } from '../utils/blogInsights'

const KCLASS_MAP = { 'Java核心': 'k1', 'JVM': 'k2', 'Spring框架': 'k3' }
const KS = ['k1', 'k2', 'k3', 'k4']
function kClassFor(category, i) {
  return KCLASS_MAP[category] || KS[i % 4]
}

function pad2(n) { return String(n).padStart(2, '0') }

function greetingNow() {
  const h = new Date().getHours()
  if (h < 9) {return '🌅 早安'}
  if (h < 12) {return '☀️ 上午好'}
  if (h < 18) {return '🌤️ 下午好'}
  return '🌆 晚上好'
}

function Hero({ stats, cover }) {
  const [greet, setGreet] = useState(greetingNow)
  useEffect(() => {
    const id = setInterval(() => setGreet(greetingNow()), 30000)
    return () => clearInterval(id)
  }, [])

  const items = [
    [pad2(stats.articleCount), '篇文章'],
    [pad2(stats.categoryCount), '个分类'],
    [pad2(stats.tagCount), '个标签'],
    [pad2(Math.min(stats.totalReadMinutes, 99)), '分钟读完'],
  ]

  return (
    <section style={{ padding: '48px 0 30px' }}>
      <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(380px,.92fr)', gap: 32, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: 'var(--disp)', fontSize: 13, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--berry)' }}>
            {greet} · 来记一笔
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 900, fontSize: 'clamp(52px, 8.5vw, 112px)', lineHeight: 0.9, letterSpacing: '-.02em', margin: '12px 0 4px' }}>
            <span style={{ color: 'var(--o)' }}>橘猫</span>
            <span style={{ color: 'var(--berry)' }}>小窝</span>
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--ink-soft)', maxWidth: 460, margin: '8px 0 0', fontWeight: 500 }}>
            一个慢更的博客。后端、AI、自己折腾的小项目都丢在这里，
            <b style={{ color: 'var(--ink)' }}>主要写给半年后的自己看</b>
            。
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
            <span className="sticker" style={{ transform: 'rotate(-2deg)' }}>慢更</span>
            <span className="sticker" style={{ transform: 'rotate(2deg)', background: 'var(--sun)' }}>凭印象写</span>
            <span className="sticker" style={{ transform: 'rotate(-1deg)', background: 'var(--mint)', color: '#fff', borderColor: 'var(--mint)' }}>偶尔废话</span>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 22, flexWrap: 'wrap' }}>
            {cover ? (
              <Link to={`/article/${cover.id}`} className="btn">📚 看最新一篇</Link>
            ) : (
              <Link to="/archive" className="btn">📚 看最新一篇</Link>
            )}
            <Link to="/archive" className="btn ghost">🗂️ 翻翻归档</Link>
          </div>
          <div style={{ display: 'flex', gap: 0, marginTop: 'auto', paddingTop: 28, borderTop: '2px solid var(--line)', flexWrap: 'wrap' }}>
            {items.map(([n, l], i) => (
              <div key={l} style={{ paddingRight: 26, marginRight: 26, borderRight: i < items.length - 1 ? '2px solid var(--line)' : 'none' }}>
                <div style={{ fontFamily: 'var(--disp)', fontSize: 30, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>{n}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600, marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {cover && (
          <Link to={`/article/${cover.id}`} className="ec k1 hideSm" style={{ padding: 32, display: 'flex', flexDirection: 'column', minHeight: 340, textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="cat-chip" style={{ color: 'var(--k1-fg)' }}>最新 · {cover.category}</span>
              <span style={{ fontFamily: 'var(--disp)', fontSize: 12, fontWeight: 700, opacity: 0.55 }}>{cover.date}</span>
            </div>
            <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 900, fontSize: 'clamp(26px,2.4vw,34px)', lineHeight: 1.25, margin: '18px 0 14px', color: 'var(--ink)' }}>
              {cover.title}
            </h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: 'var(--ink-soft)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {cover.description}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 22 }}>
              <span style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 600 }}>⏱️ {cover.readTime} 分钟阅读</span>
              <span className="arrow" style={{ fontSize: 17 }}>阅读全文 →</span>
            </div>
            <div className="paw" style={{ fontSize: 44 }}>🐾</div>
          </Link>
        )}
      </div>
    </section>
  )
}

function FeaturedRow({ featured }) {
  if (featured.length < 2) {return null}
  const top = featured[1]
  const side = featured.slice(2, 4)

  return (
    <section style={{ marginBottom: 44 }}>
      <div className="section-h"><h2>🔥 几篇可以先看的</h2></div>
      <div className="feat-grid" style={{ display: 'grid', gridTemplateColumns: side.length > 0 ? '1.3fr 1fr' : '1fr', gap: 16 }}>
        <Link to={`/article/${top.id}`} className="ec k2" style={{ padding: 30, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 260 }}>
          <div>
            <span className="cat-chip" style={{ color: 'var(--k2-fg)' }}>{top.category}</span>
            <h3 style={{ fontSize: 30, lineHeight: 1.25, margin: '16px 0 12px' }}>{top.title}</h3>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: 'var(--ink-soft)' }}>{top.description}</p>
          </div>
          <div className="arrow" style={{ fontSize: 16 }}>阅读全文 →</div>
          <div className="paw">🐾</div>
        </Link>
        {side.length > 0 && (
          <div style={{ display: 'grid', gridTemplateRows: side.length === 2 ? '1fr 1fr' : '1fr', gap: 16 }}>
            {side.map((a, i) => (
              <Link to={`/article/${a.id}`} key={a.id} className={`ec ${kClassFor(a.category, i + 2)}`} style={{ padding: 22 }}>
                <span className="cat cat-chip" style={{ border: 'none', padding: 0 }}>{a.category}</span>
                <h3 style={{ fontSize: 19, margin: '6px 0' }}>{a.title}</h3>
                <div className="arrow">阅读 →</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function QuotePanel() {
  const [quote, setQuote] = useState(CAT_QUOTES[3])
  const [isSpinning, setIsSpinning] = useState(false)

  const handleNewQuote = () => {
    setIsSpinning(true)
    setQuote(CAT_QUOTES[Math.floor(Math.random() * CAT_QUOTES.length)])
    // Clear rotation state after animation duration
    setTimeout(() => setIsSpinning(false), 600)
  }

  return (
    <div className="panel dark">
      <div className="panel-h" style={{ color: 'var(--sun)' }}>🐾 顺手抄一句</div>
      <blockquote style={{ fontFamily: 'var(--serif)', fontSize: 17, lineHeight: 1.6, fontWeight: 700 }}>
        “{quote.text}”
      </blockquote>
      <div style={{ textAlign: 'right', fontSize: 12.5, opacity: 0.8, marginTop: 8 }}>— {quote.author}</div>
      <button
        className="btn sun"
        style={{ width: '100%', marginTop: 16 }}
        onClick={handleNewQuote}
      >
        <span style={{
          display: 'inline-block',
          transform: isSpinning ? 'rotate(360deg)' : 'rotate(0deg)',
          transition: isSpinning ? 'transform 0.6s cubic-bezier(0.19, 1, 0.22, 1)' : 'none'
        }}>
          🎲
        </span>
        &nbsp;换一句
      </button>
    </div>
  )
}

function HomeSidebar({ cat, setCat, query, setQuery, categories, tags, articleCount }) {
  const navigate = useNavigate()
  return (
    <aside style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 84, alignSelf: 'start' }}>
      <div className="panel" style={{ padding: 16 }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>🔍</span>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜文章 / 标签…"
            style={{ paddingLeft: 38 }}
          />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 12 }}>
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              style={{
                fontSize: 13,
                fontWeight: 700,
                padding: '6px 13px',
                borderRadius: 999,
                border: '2px solid var(--ink)',
                background: cat === c ? 'var(--ink)' : 'transparent',
                color: cat === c ? 'var(--paper)' : 'var(--ink)',
                cursor: 'pointer',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <QuotePanel />

      {tags.length > 0 && (
        <div className="panel">
          <div className="panel-h"># 热门标签</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {tags.map(item => (
              <Link
                key={item.tag}
                to={`/tags?tag=${encodeURIComponent(item.tag)}`}
                className="sticker"
                style={{ fontSize: 12.5, padding: '6px 12px' }}
              >
                #{item.tag} <b style={{ color: 'var(--accent)' }}>{item.count}</b>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="panel" style={{ background: 'var(--k4-bg)' }}>
        <div className="panel-h" style={{ color: 'var(--mint)' }}>🐱 最近在干嘛</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
          <div style={{ background: 'var(--paper)', border: '2px solid var(--ink)', borderRadius: 12, padding: 10 }}>
            主线<div style={{ fontWeight: 800, fontSize: 16 }}>Java 25</div>
          </div>
          <div style={{ background: 'var(--paper)', border: '2px solid var(--ink)', borderRadius: 12, padding: 10 }}>
            副线<div style={{ fontWeight: 800, fontSize: 16 }}>AI 工具</div>
          </div>
          <div style={{ background: 'var(--paper)', border: '2px solid var(--ink)', borderRadius: 12, padding: 10, gridColumn: 'span 2' }}>
            🎯 已经攒了 {articleCount} 篇，下一篇还在拖
          </div>
        </div>
        <button
          onClick={() => navigate('/about')}
          className="btn ghost"
          style={{ width: '100%', marginTop: 14, justifyContent: 'center' }}
        >
          👋 关于我
        </button>
      </div>
    </aside>
  )
}

function Home() {
  const { articles, loading: articlesLoading, error: articlesError, fetchArticles } = useArticlesData()
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const showBackToTop = useBackToTop(400)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const categories = useMemo(() => getArticleCategories(articles), [articles])
  const stats = useMemo(() => getBlogStats(articles), [articles])
  const featuredArticles = useMemo(() => getFeaturedArticles(articles, 4), [articles])
  const tagCloud = useMemo(() => getTagCloud(articles).slice(0, 12), [articles])

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

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <div className="wrap" style={{ paddingBottom: 48 }}>
      <Hero stats={stats} cover={featuredArticles[0]} />
      <FeaturedRow featured={featuredArticles} />

      <div className="home-main" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28 }}>
        <div id="articles">
          <div className="section-h">
            <h2>📚 全部文章</h2>
            <Link to="/archive" className="more">看归档 →</Link>
          </div>

          {articlesLoading ? (
            <div className="panel" style={{ textAlign: 'center', padding: 48 }}>
              <div className="animate-bounce" style={{ fontSize: 40 }}>🐱</div>
              <p style={{ marginTop: 12, color: 'var(--ink-soft)' }}>文章加载中…</p>
            </div>
          ) : articlesError ? (
            <div className="panel" style={{ textAlign: 'center', padding: 48, background: 'var(--k2-bg)' }}>
              <div style={{ fontSize: 40 }}>😿</div>
              <p style={{ marginTop: 12, color: 'var(--ink-soft)' }}>{articlesError}</p>
              <button onClick={fetchArticles} className="btn" style={{ marginTop: 16 }}>🔄 重试</button>
            </div>
          ) : paginatedArticles.length > 0 ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {paginatedArticles.map((a, i) => (
                  <Link
                    to={`/article/${a.id}`}
                    key={a.id}
                    className={`ec ${kClassFor(a.category, (currentPage - 1) * HOME_PAGE_SIZE + i)}`}
                    style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 18, alignItems: 'center', padding: '20px 24px' }}
                  >
                    <div className="idx" style={{ fontSize: 26 }}>{pad2((currentPage - 1) * HOME_PAGE_SIZE + i + 1)}</div>
                    <div style={{ minWidth: 0 }}>
                      <span className="cat cat-chip" style={{ border: 'none', padding: 0 }}>
                        {a.category} · {a.date}
                      </span>
                      <h3 style={{ fontSize: 21, margin: '4px 0 0' }}>{a.title}</h3>
                    </div>
                    <div className="arrow hideSm">→</div>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="panel" style={{ marginTop: 18, padding: 16 }}>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalCount={filteredArticles.length}
                    onPageChange={(page) => {
                      setCurrentPage(page)
                      document.getElementById('articles')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="panel" style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ fontSize: 40 }}>🍃</div>
              <p style={{ marginTop: 12, color: 'var(--ink-soft)' }}>
                {searchQuery ? `没找到包含 "${searchQuery}" 的文章` : '这个分类下还没东西，换一个看看'}
              </p>
              {(searchQuery || selectedCategory !== '全部') && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('全部')
                  }}
                  className="btn ghost"
                  style={{ marginTop: 16 }}
                >
                  🔄 清除筛选
                </button>
              )}
            </div>
          )}
        </div>

        <HomeSidebar
          cat={selectedCategory}
          setCat={setSelectedCategory}
          query={searchQuery}
          setQuery={setSearchQuery}
          categories={categories}
          tags={tagCloud}
          articleCount={articles.length}
        />
      </div>

      <button
        className="btn"
        onClick={scrollToTop}
        aria-label="返回顶部"
        style={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          zIndex: 40,
          width: 52,
          height: 52,
          padding: 0,
          borderRadius: 14,
          opacity: showBackToTop ? 1 : 0,
          pointerEvents: showBackToTop ? 'auto' : 'none',
          transform: showBackToTop ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.3s, transform 0.3s',
        }}
      >
        ⬆
      </button>
    </div>
  )
}

export default Home
