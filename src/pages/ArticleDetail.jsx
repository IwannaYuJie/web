import { Suspense, lazy, useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Mountains, Seal } from '../components/xian/Ornaments'
import { useArticle, useArticlesData } from '../hooks/useArticles'
import { getRelatedArticles, getSortedArticles } from '../utils/blogInsights'
import { extractMarkdownToc } from '../utils/markdownUtils'
import { categoryTone, toHanMonth, toHanNumeral, toHanYear } from '../utils/xianText'
import './ArticleDetail.css'

const MarkdownRenderer = lazy(() => import('../components/MarkdownRenderer'))

function formatHanDate(date = '') {
  const [y, m, d] = String(date).split('-').map(Number)
  if (!y || !m || !d) { return date }
  return `${toHanYear(y)}年${toHanMonth(m)}${toHanNumeral(d)}日`
}

/** 目录高亮：最后一个已滚过视口上沿（导航下方）的标题 */
function useActiveHeading(ids) {
  const [activeId, setActiveId] = useState('')
  useEffect(() => {
    if (ids.length === 0) { return undefined }
    let raf = 0
    const update = () => {
      raf = 0
      let current = ''
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top < 140) { current = id } else if (el) { break }
      }
      setActiveId(current)
    }
    const onScroll = () => {
      if (!raf) { raf = window.requestAnimationFrame(update) }
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) { window.cancelAnimationFrame(raf) }
    }
  }, [ids])
  return activeId
}

function ArticleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { article, loading, error, liked, toggleLike } = useArticle(id)
  const { articles: allArticles } = useArticlesData()
  const [copyStatus, setCopyStatus] = useState('')

  const toc = useMemo(() => (article ? extractMarkdownToc(article.content) : []), [article])
  const tocIds = useMemo(() => toc.map(item => item.id), [toc])
  const activeId = useActiveHeading(tocIds)
  const relatedArticles = useMemo(() => getRelatedArticles(article, allArticles, 2), [article, allArticles])

  const articleNavigation = useMemo(() => {
    if (!article) { return { newer: null, older: null } }
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
      setCopyStatus('已誊抄链接')
    } catch {
      setCopyStatus('誊抄未成')
    }
    window.setTimeout(() => setCopyStatus(''), 1600)
  }

  if (loading) {
    return (
      <div className="wrap" style={{ paddingTop: 120 }}>
        <div className="state"><div className="loading-bar" />展卷中，稍候片刻…</div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="wrap" style={{ paddingTop: 100 }}>
        <div className="state">
          <div className="state-mark">失</div>
          <h1 className="serif" style={{ fontSize: 24, color: 'var(--ink)', margin: '4px 0 10px' }}>{error || '此卷已不知所踪'}</h1>
          <p>或许被收进了别处，或许从未写成。</p>
          <Link to="/" className="btn" style={{ marginTop: 24 }}>回山门</Link>
        </div>
      </div>
    )
  }

  const author = article.author || '橘猫博主'

  return (
    <article className="xart">
      <header className="xart-head">
        <Mountains className="xart-mountains" />
        <div className="wrap xart-head-inner">
          <button type="button" onClick={() => navigate(-1)} className="xart-back link-arrow">← 返回</button>
          <span className="cat-label rise" style={{ '--tone': categoryTone(article.category), '--i': 0 }}>
            <span className="tone-dot" />{article.category}
          </span>
          <h1 className="xart-title rise" style={{ '--i': 1 }}>{article.title}</h1>
          {article.description && <p className="xart-dek rise" style={{ '--i': 2 }}>{article.description}</p>}
          <div className="xart-meta rise" style={{ '--i': 3 }}>
            <span>{author}</span>
            <i aria-hidden="true" />
            <time dateTime={article.date}>{formatHanDate(article.date)}</time>
            <i aria-hidden="true" />
            <span>约 {article.readTime} 分钟</span>
            {article.updatedAt && article.updatedAt !== article.date && (
              <>
                <i aria-hidden="true" />
                <span>修订于 {String(article.updatedAt).slice(0, 10)}</span>
              </>
            )}
          </div>
        </div>
      </header>

      <div className={`wrap xart-grid ${toc.length > 0 ? 'has-toc' : ''}`}>
        <div className="xart-paper scroll-card">
          <div className="fret-band xart-fret top" aria-hidden="true" />
          <Suspense fallback={<div className="state"><div className="loading-bar" />墨迹未干…</div>}>
            <MarkdownRenderer content={article.content} toc={toc} />
          </Suspense>

          {/* 落款 */}
          <div className="xart-colophon">
            <div className="elegant">
              {author}<br />
              书于{formatHanDate(article.date)}
            </div>
            <Seal text="橘猫小窝" size={52} />
          </div>

          {article.tags?.length > 0 && (
            <div className="xart-tags">
              <span className="panel-h" style={{ margin: 0 }}>签引</span>
              {article.tags.map(t => (
                <Link key={t} to={`/tags?tag=${encodeURIComponent(t)}`} className="chip">{t}</Link>
              ))}
            </div>
          )}

          <div className="xart-actions">
            <button type="button" className={`btn ${liked ? 'accent' : 'ghost'}`} onClick={toggleLike} aria-pressed={liked}>
              {liked ? '已赞一声' : '赞一声'}
            </button>
            <button type="button" className="btn ghost" onClick={copyCurrentUrl}>
              {copyStatus || '传阅此文'}
            </button>
          </div>
          <div className="fret-band xart-fret bottom" aria-hidden="true" />
        </div>

        {toc.length > 0 && (
          <aside className="xart-toc" aria-label="目录">
            <div className="xart-toc-title brush">目录</div>
            <ol>
              {toc.map(item => (
                <li key={item.id} className={`lv${item.level} ${activeId === item.id ? 'on' : ''}`}>
                  <a href={`#${item.id}`}>{item.text}</a>
                </li>
              ))}
            </ol>
          </aside>
        )}
      </div>

      <div className="wrap xart-after">
        <nav className="xart-pager reveal" aria-label="上下篇">
          {articleNavigation.newer ? (
            <Link to={`/article/${articleNavigation.newer.id}`} className="xart-pager-item">
              <span className="elegant">← 后一篇</span>
              <strong>{articleNavigation.newer.title}</strong>
            </Link>
          ) : <span className="xart-pager-item empty"><span className="elegant">已是最新一篇</span></span>}
          {articleNavigation.older ? (
            <Link to={`/article/${articleNavigation.older.id}`} className="xart-pager-item right">
              <span className="elegant">前一篇 →</span>
              <strong>{articleNavigation.older.title}</strong>
            </Link>
          ) : <span className="xart-pager-item right empty"><span className="elegant">已是最早一篇</span></span>}
        </nav>

        {relatedArticles.length > 0 && (
          <section className="xart-related reveal">
            <div className="section-h"><h2>同道之文 <small>相关阅读</small></h2></div>
            <div className="xart-related-grid">
              {relatedArticles.map(a => (
                <Link key={a.id} to={`/article/${a.id}`} className="xart-related-card scroll-card">
                  <span className="cat-label" style={{ '--tone': categoryTone(a.category) }}>
                    <span className="tone-dot" />{a.category}
                  </span>
                  <h3>{a.title}</h3>
                  <p>{a.description}</p>
                  <span className="link-arrow">展卷 <span className="arr">→</span></span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  )
}

export default ArticleDetail
