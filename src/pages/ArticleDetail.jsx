import { Suspense, lazy, useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useArticle, useArticlesData } from '../hooks/useArticles'
import { getRelatedArticles, getSortedArticles } from '../utils/blogInsights'
import { extractMarkdownToc } from '../utils/markdownUtils'

const MarkdownRenderer = lazy(() => import('../components/MarkdownRenderer'))

const KCLASS_MAP = { 'Java核心': 'k1', 'JVM': 'k2', 'Spring框架': 'k3' }
const KS = ['k1', 'k2', 'k3', 'k4']
const KBG = { k1: 'var(--k1-bg)', k2: 'var(--k2-bg)', k3: 'var(--k3-bg)', k4: 'var(--k4-bg)' }

function kClassFor(category, i) {
  return KCLASS_MAP[category] || KS[i % 4]
}

function ArticleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { article, loading, error, liked, toggleLike } = useArticle(id)
  const { articles: allArticles } = useArticlesData()

  const [readProgress, setReadProgress] = useState(0)
  const [copyStatus, setCopyStatus] = useState('')

  useEffect(() => {
    let rafId = 0
    const updateProgress = () => {
      rafId = 0
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight - windowHeight
      const scrollTop = window.scrollY
      const progress = documentHeight > 0 ? Math.min((scrollTop / documentHeight) * 100, 100) : 0
      setReadProgress(progress)
    }
    const handleScroll = () => {
      if (!rafId) {rafId = window.requestAnimationFrame(updateProgress)}
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
      if (rafId) {window.cancelAnimationFrame(rafId)}
    }
  }, [])

  const toc = useMemo(() => (article ? extractMarkdownToc(article.content) : []), [article])
  const relatedArticles = useMemo(() => getRelatedArticles(article, allArticles, 2), [article, allArticles])

  const articleNavigation = useMemo(() => {
    if (!article) {return { newer: null, older: null }}
    const sorted = getSortedArticles(allArticles)
    const currentIndex = sorted.findIndex(item => String(item.id) === String(article.id))
    return {
      newer: currentIndex > 0 ? sorted[currentIndex - 1] : null,
      older: currentIndex >= 0 && currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null,
    }
  }, [article, allArticles])

  const copyCurrentUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopyStatus('已复制')
      window.setTimeout(() => setCopyStatus(''), 1600)
    } catch {
      setCopyStatus('复制失败')
      window.setTimeout(() => setCopyStatus(''), 1600)
    }
  }

  if (loading) {
    return (
      <div className="wrap flex-center" style={{ minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-bounce" style={{ fontSize: 60, marginBottom: 16 }}>🐱</div>
          <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 900, fontSize: 22, color: 'var(--accent)' }}>文章加载中…</h2>
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="wrap flex-center" style={{ minHeight: '60vh', padding: '40px 28px' }}>
        <div className="panel" style={{ textAlign: 'center', maxWidth: 480, padding: 36, background: 'var(--k2-bg)' }}>
          <div style={{ fontSize: 60 }}>😿</div>
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 900, fontSize: 26, color: 'var(--berry)', margin: '12px 0' }}>
            {error || '文章不存在'}
          </h1>
          <p style={{ color: 'var(--ink-soft)', marginBottom: 22 }}>这篇可能被我藏起来或删了。</p>
          <Link to="/" className="btn">🏠 返回首页</Link>
        </div>
      </div>
    )
  }

  const idx = allArticles.findIndex(a => String(a.id) === String(article.id))
  const kc = kClassFor(article.category, idx < 0 ? 0 : idx)

  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, height: 5, width: `${readProgress}%`, background: 'var(--accent)', zIndex: 200, transition: 'width 0.08s' }} />

      <div className="wrap" style={{ maxWidth: 1040, paddingTop: 24, paddingBottom: 48 }}>
        <button onClick={() => navigate(-1)} className="sticker" style={{ margin: '4px 0 20px' }}>
          ← 返回
        </button>

        <div className="art-grid" style={{ display: 'grid', gridTemplateColumns: toc.length > 0 ? '1fr 220px' : '1fr', gap: 32, alignItems: 'start' }}>
          <article>
            <div className="panel" style={{ padding: 36, background: KBG[kc] }}>
              <span className="cat-chip" style={{ color: 'var(--ink)' }}>{article.category}</span>
              <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 900, fontSize: 'clamp(30px,4.5vw,46px)', lineHeight: 1.2, letterSpacing: '-.01em', margin: '14px 0', color: 'var(--ink)' }}>
                {article.title}
              </h1>
              <div style={{ display: 'flex', gap: 14, fontSize: 13, color: 'var(--ink-soft)', fontWeight: 600, flexWrap: 'wrap' }}>
                <span>📅 {article.date}</span>
                <span>⏱️ {article.readTime} 分钟</span>
                <span>✍️ {article.author || '橘猫博主'}</span>
                {article.updatedAt && article.updatedAt !== article.date && (
                  <span style={{ opacity: 0.7 }}>· 更新于 {article.updatedAt}</span>
                )}
              </div>
            </div>

            <div style={{ padding: '30px 4px 0' }}>
              {article.description && (
                <p style={{ fontSize: 18, lineHeight: 1.8, color: 'var(--ink-soft)', fontWeight: 500, marginBottom: 24, paddingBottom: 24, borderBottom: '2px solid var(--line)' }}>
                  {article.description}
                </p>
              )}

              <div className="article-body">
                <Suspense fallback={<div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ink-soft)' }}>文章内容加载中…</div>}>
                  <MarkdownRenderer content={article.content} toc={toc} />
                </Suspense>
              </div>

              {article.tags && article.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 28 }}>
                  {article.tags.map(t => (
                    <Link key={t} to={`/tags?tag=${encodeURIComponent(t)}`} className="sticker" style={{ fontSize: 12.5, padding: '6px 12px' }}>
                      #{t}
                    </Link>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
                <button
                  className="btn"
                  onClick={toggleLike}
                  style={liked ? { background: 'var(--berry)' } : undefined}
                >
                  {liked ? '🧡 已点赞' : '🤍 点个赞'}
                </button>
                <button className="btn ghost" onClick={copyCurrentUrl}>
                  🔗 {copyStatus || '复制链接'}
                </button>
              </div>
            </div>
          </article>

          {toc.length > 0 && (
            <aside className="hideSm" style={{ position: 'sticky', top: 84 }}>
              <div className="panel" style={{ padding: 18, maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="panel-h">📑 目录</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {toc.map((item, i) => (
                    <a
                      key={i}
                      href={`#${item.id}`}
                      style={{
                        fontSize: 13,
                        color: item.level === 3 ? 'var(--ink-soft)' : 'var(--ink)',
                        borderLeft: '3px solid var(--line)',
                        paddingLeft: 10,
                        lineHeight: 1.4,
                        paddingTop: 2,
                        paddingBottom: 2,
                        fontWeight: item.level === 3 ? 500 : 700,
                        textDecoration: 'none',
                      }}
                    >
                      {item.text}
                    </a>
                  ))}
                </div>
              </div>
            </aside>
          )}
        </div>

        {relatedArticles.length > 0 && (
          <section style={{ marginTop: 44 }}>
            <div className="section-h"><h2>📚 相关阅读</h2></div>
            <div className="feat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {relatedArticles.map((a, i) => (
                <Link key={a.id} to={`/article/${a.id}`} className={`ec ${kClassFor(a.category, i)}`} style={{ padding: 22 }}>
                  <span className="cat cat-chip" style={{ border: 'none', padding: 0 }}>{a.category}</span>
                  <h3 style={{ fontSize: 20, margin: '8px 0' }}>{a.title}</h3>
                  <div className="arrow">阅读全文 →</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 32, flexWrap: 'wrap' }}>
          {articleNavigation.newer ? (
            <Link to={`/article/${articleNavigation.newer.id}`} className="btn ghost">← 上一篇</Link>
          ) : (
            <button className="btn ghost" disabled style={{ opacity: 0.45 }}>← 上一篇</button>
          )}
          {articleNavigation.older ? (
            <Link to={`/article/${articleNavigation.older.id}`} className="btn ghost">下一篇 →</Link>
          ) : (
            <button className="btn ghost" disabled style={{ opacity: 0.45 }}>下一篇 →</button>
          )}
        </div>
      </div>
    </>
  )
}

export default ArticleDetail
