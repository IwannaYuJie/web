import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { GAMES } from '../data/games'
import { TOOLS } from '../data/tools'
import { useArticlesData } from '../hooks/useArticles'
import { prefetchArticleById, prefetchArticlesList } from '../services/articles'
import { getSortedArticles } from '../utils/blogInsights'
import { prefetchRoute } from '../utils/routePrefetch'
import { categoryTone } from '../utils/xianText'
import { Seal } from './xian/Ornaments'
import './GlobalSearch.css'

function buildSnippet(article, q) {
  if (!q) {
    return article.description || ''
  }
  const content = String(article.content || '')
  const lowerContent = content.toLowerCase()
  const idx = lowerContent.indexOf(q)
  if (idx >= 0) {
    const start = Math.max(0, idx - 22)
    const end = Math.min(content.length, idx + q.length + 54)
    const raw = content.slice(start, end).replace(/\s+/g, ' ').trim()
    return `${start > 0 ? '…' : ''}${raw}${end < content.length ? '…' : ''}`
  }
  return article.description || ''
}

export default function GlobalSearch({ isOpen, onClose }) {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const { articles, loading } = useArticlesData()

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }
    prefetchArticlesList()
    setQuery('')
    setActiveIndex(0)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus()
    }, 10)

    return () => {
      window.clearTimeout(focusTimer)
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen])

  const normalizedQuery = query.trim().toLowerCase()

  const { articleResults, toolResults, gameResults, flatItems } = useMemo(() => {
    const sortedArticles = getSortedArticles(articles)

    const matchedArticles = normalizedQuery
      ? sortedArticles
          .filter((a) => {
            const tagsText = Array.isArray(a.tags) ? a.tags.join(' ') : ''
            const haystack = `${a.title || ''} ${a.description || ''} ${a.category || ''} ${tagsText} ${a.content || ''}`.toLowerCase()
            return haystack.includes(normalizedQuery)
          })
          .slice(0, 6)
      : sortedArticles.slice(0, 4)

    const matchedTools = normalizedQuery
      ? TOOLS.filter((t) => {
          const haystack = `${t.title} ${t.alias} ${t.description} ${t.tag} ${t.id}`.toLowerCase()
          return haystack.includes(normalizedQuery)
        }).slice(0, 5)
      : TOOLS.slice(0, 4)

    const matchedGames = normalizedQuery
      ? GAMES.filter((g) => {
          const haystack = `${g.name} ${g.description} ${g.glyph} ${g.best} ${g.id}`.toLowerCase()
          return haystack.includes(normalizedQuery)
        }).slice(0, 5)
      : GAMES.slice(0, 4)

    const flat = [
      ...matchedArticles.map((a) => ({
        key: `article-${a.id}`,
        kind: 'article',
        path: `/article/${a.id}`,
        articleId: a.id,
        title: a.title,
        subtitle: buildSnippet(a, normalizedQuery),
        badge: a.category,
        tone: categoryTone(a.category),
        meta: `约 ${a.readTime || 1} 分钟`,
      })),
      ...matchedTools.map((t) => ({
        key: `tool-${t.id}`,
        kind: 'tool',
        path: t.path,
        title: `${t.alias} · ${t.title}`,
        subtitle: t.description,
        badge: t.tag,
        glyph: t.glyph,
        meta: '法宝阁',
      })),
      ...matchedGames.map((g) => ({
        key: `game-${g.id}`,
        kind: 'game',
        path: g.path,
        title: g.name,
        subtitle: g.description,
        badge: g.best,
        glyph: g.glyph,
        meta: '游仙境',
      })),
    ]

    return {
      articleResults: flat.filter((item) => item.kind === 'article'),
      toolResults: flat.filter((item) => item.kind === 'tool'),
      gameResults: flat.filter((item) => item.kind === 'game'),
      flatItems: flat,
    }
  }, [articles, normalizedQuery])

  useEffect(() => {
    setActiveIndex(0)
  }, [normalizedQuery])

  const selectItem = (item) => {
    if (!item) {
      return
    }
    onClose()
    navigate(item.path)
  }

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'ArrowDown' && flatItems.length > 0) {
        e.preventDefault()
        setActiveIndex((prev) => (prev + 1) % flatItems.length)
      } else if (e.key === 'ArrowUp' && flatItems.length > 0) {
        e.preventDefault()
        setActiveIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length)
      } else if (e.key === 'Enter' && flatItems[activeIndex]) {
        e.preventDefault()
        selectItem(flatItems[activeIndex])
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  if (!isOpen || typeof document === 'undefined') {
    return null
  }

  let runningIdx = -1
  const renderGroup = (heading, sub, items) => {
    if (items.length === 0) {
      return null
    }
    return (
      <section className="xgsearch-group">
        <header className="xgsearch-group-h">
          <span className="elegant">{heading}</span>
          <small>{sub}</small>
        </header>
        <ul>
          {items.map((item) => {
            runningIdx += 1
            const idx = runningIdx
            const active = idx === activeIndex
            return (
              <li key={item.key}>
                <button
                  type="button"
                  className={`xgsearch-item ${active ? 'on' : ''}`}
                  onMouseEnter={() => {
                    setActiveIndex(idx)
                    if (item.kind === 'article' && item.articleId) {
                      prefetchArticleById(item.articleId)
                      prefetchRoute(item.path)
                    } else {
                      prefetchRoute(item.path)
                    }
                  }}
                  onClick={() => selectItem(item)}
                >
                  <span
                    className="xgsearch-mark"
                    style={item.tone ? { '--tone': item.tone } : undefined}
                    aria-hidden="true"
                  >
                    {item.glyph ? (
                      <span className="brush">{item.glyph}</span>
                    ) : (
                      <span className="xgsearch-dot" />
                    )}
                  </span>
                  <span className="xgsearch-item-body">
                    <span className="xgsearch-item-top">
                      <strong>{item.title}</strong>
                      {item.badge && <span className="xgsearch-badge">{item.badge}</span>}
                    </span>
                    {item.subtitle && <span className="xgsearch-item-desc">{item.subtitle}</span>}
                  </span>
                  <span className="xgsearch-item-meta elegant">
                    {item.meta} <span aria-hidden="true">→</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    )
  }

  return createPortal(
    <div
      className="xgsearch-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="全站快捷寻踪"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="xgsearch-modal scroll-card">
        <div className="fret-band xgsearch-fret" aria-hidden="true" />
        <div className="xgsearch-head">
          <Seal text="寻" size={32} />
          <label className="xgsearch-input-wrap field-line">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="寻经问道 · 搜文章、法宝器物、游仙境小游戏…"
              aria-label="全站搜索"
            />
          </label>
          <button type="button" className="xgsearch-close" onClick={onClose} aria-label="关闭寻踪面板">
            ESC
          </button>
        </div>

        <div className="xgsearch-body">
          {flatItems.length === 0 ? (
            <div className="xgsearch-empty">
              <div className="state-mark brush">空</div>
              <p>{loading ? '正在翻检藏卷…' : `云深雾重，未见与「${query}」相合之卷`}</p>
            </div>
          ) : (
            <>
              {renderGroup('藏经文章', normalizedQuery ? '相合卷轴' : '近作推荐', articleResults)}
              {renderGroup('法宝器物', '法宝阁工具', toolResults)}
              {renderGroup('仙境游艺', '游仙境小游戏', gameResults)}
            </>
          )}
        </div>

        <footer className="xgsearch-foot">
          <span className="elegant">
            {normalizedQuery ? `共寻得 ${flatItems.length} 处去处` : '键入关键字即时寻踪'}
          </span>
          <span className="xgsearch-keys hideSm">
            <kbd>↑↓</kbd> 择卷
            <kbd>↵</kbd> 直达
            <kbd>ESC</kbd> 收卷
          </span>
        </footer>
      </div>
    </div>,
    document.body
  )
}
