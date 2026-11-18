import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import GlobalSearch from '../src/components/GlobalSearch'
import Layout from '../src/components/Layout'
import MarkdownRenderer from '../src/components/MarkdownRenderer'
import Navbar from '../src/components/Navbar'
import { useArticlePrefetch } from '../src/hooks/useArticlePrefetch'
import ArticleDetail from '../src/pages/ArticleDetail'
import { clearArticlesMemoryCache, loadArticlesList } from '../src/services/articles'
import { installDomShim } from './helpers/domShim'

describe('UI regressions (H-2, H-3, M-1, M-3, M-4, M-5)', () => {
  let dom
  let root
  let container
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    clearArticlesMemoryCache()
    dom = installDomShim()
    container = dom.document.createElement('div')
    dom.document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => {
      root.unmount()
    })
    dom.cleanup()
    globalThis.fetch = originalFetch
    clearArticlesMemoryCache()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('H-2: opening ArticleDetail from SWR cache keeps real article title instead of Layout generic title', async () => {
    const cachedArticle = {
      id: 42,
      title: '缓存秒开真实标题',
      description: '真实摘要',
      category: '技术',
      date: '2026-11-18',
      readTime: '3',
      content: '## 小节一\n\n正文内容',
    }
    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify([cachedArticle]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    // Seed SWR cache as if user hovered or visited home first
    await loadArticlesList()

    await act(async () => {
      root.render(
        <MemoryRouter
          initialEntries={['/article/42']}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <Layout>
            <Routes>
              <Route path="/article/:id" element={<ArticleDetail />} />
            </Routes>
          </Layout>
        </MemoryRouter>
      )
    })

    expect(dom.document.title).toBe('缓存秒开真实标题 | 橘猫小窝')
    expect(dom.document.title).not.toContain('展卷阅读')
  })

  it('H-3 & M-3: GlobalSearch ignores Enter during IME composition (isComposing / keyCode 229) and scrolls active item into view', async () => {
    const mockArticles = [
      { id: 1, title: '第一篇', description: '摘要一', category: '技术', date: '2026-01-02', readTime: '2', content: '正文' },
      { id: 2, title: '第二篇', description: '摘要二', category: '技术', date: '2026-01-01', readTime: '2', content: '正文' },
    ]
    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify(mockArticles), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    await loadArticlesList()

    const onClose = vi.fn()
    await act(async () => {
      root.render(
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <GlobalSearch isOpen onClose={onClose} />
        </MemoryRouter>
      )
    })

    const searchInput = dom.document.querySelector('input[data-global-search-input="true"]')
    expect(searchInput).toBeTruthy()

    // Spy scrollIntoView on rendered result buttons
    const resultButtons = dom.document.querySelectorAll('.xgsearch-item')
    expect(resultButtons.length).toBeGreaterThan(1)
    const scrollSpy = vi.fn()
    resultButtons[1].scrollIntoView = scrollSpy

    // IME composing Enter -> must NOT close or navigate
    await act(async () => {
      dom.window.dispatchEvent(new dom.KeyboardEvent('keydown', { key: 'Enter', isComposing: true, target: searchInput }))
      dom.window.dispatchEvent(new dom.KeyboardEvent('keydown', { key: 'Enter', keyCode: 229, target: searchInput }))
    })
    expect(onClose).not.toHaveBeenCalled()

    // ArrowDown moves selection to item[1] and calls scrollIntoView({ block: 'nearest' })
    await act(async () => {
      dom.window.dispatchEvent(new dom.KeyboardEvent('keydown', { key: 'ArrowDown', target: searchInput }))
    })
    expect(scrollSpy).toHaveBeenCalledWith({ block: 'nearest' })

    // Non-composing Enter triggers selection and closes modal
    await act(async () => {
      dom.window.dispatchEvent(new dom.KeyboardEvent('keydown', { key: 'Enter', isComposing: false, keyCode: 13, target: searchInput }))
    })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('M-1 & H-3: Navbar does not fetch /api/articles when search is closed, handles missing e.key, and ignores Ctrl+K in editors', async () => {
    let fetchCount = 0
    globalThis.fetch = vi.fn(async (url) => {
      if (url === '/api/articles') {
        fetchCount += 1
      }
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })

    await act(async () => {
      root.render(
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Navbar />
        </MemoryRouter>
      )
    })

    // Initial mount with search closed must NOT fetch articles
    expect(fetchCount).toBe(0)
    expect(dom.document.querySelector('.xgsearch-backdrop')).toBeNull()

    // Chrome autofill event without e.key must not throw
    await act(async () => {
      dom.window.dispatchEvent(new dom.KeyboardEvent('keydown', { ctrlKey: true }))
    })
    expect(dom.document.querySelector('.xgsearch-backdrop')).toBeNull()

    // Ctrl+K inside a regular textarea/input must not open search
    const editorTextarea = dom.document.createElement('textarea')
    dom.document.body.appendChild(editorTextarea)
    await act(async () => {
      dom.window.dispatchEvent(new dom.KeyboardEvent('keydown', { key: 'k', ctrlKey: true, target: editorTextarea }))
    })
    expect(dom.document.querySelector('.xgsearch-backdrop')).toBeNull()
    expect(fetchCount).toBe(0)

    // Clicking search button opens GlobalSearch and fetches articles once
    const searchBtn = dom.document.querySelector('.xnav-search-btn')
    expect(searchBtn).toBeTruthy()
    await act(async () => {
      searchBtn.click()
    })
    expect(dom.document.querySelector('.xgsearch-backdrop')).toBeTruthy()
    expect(fetchCount).toBe(1)
  })

  it('M-4 & Low: MarkdownRenderer skips fenced code block headings for anchor IDs and uses SPA links for internal routes', async () => {
    const md = [
      '## 正文标题',
      '',
      '```sh',
      '## 脚本注释',
      '```',
      '',
      '~~~text',
      '### 波浪注释',
      '~~~',
      '',
      '## 第二节',
      '',
      '[站内归档](/archive) 和 [外链](https://example.com)',
    ].join('\n')

    await act(async () => {
      root.render(
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <MarkdownRenderer content={md} />
        </MemoryRouter>
      )
    })

    const h2s = dom.document.querySelectorAll('h2')
    expect(h2s.map((el) => el.getAttribute('id'))).toEqual(['正文标题', '第二节'])

    const links = dom.document.querySelectorAll('a')
    expect(links[0].getAttribute('href')).toBe('/archive')
    expect(links[0].getAttribute('target')).toBeNull()
    expect(links[1].getAttribute('href')).toBe('https://example.com')
    expect(links[1].getAttribute('target')).toBe('_blank')
  })

  it('M-5: useArticlePrefetch skips article fetch on touchStart and debounces desktop hover prefetch by 80ms', async () => {
    vi.useFakeTimers()
    let detailFetchCount = 0
    globalThis.fetch = vi.fn(async (url) => {
      if (String(url).startsWith('/api/articles?id=')) {
        detailFetchCount += 1
      }
      return new Response(JSON.stringify({ id: 9, title: '篇九' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })

    let hookApi
    function Probe() {
      hookApi = useArticlePrefetch(80)
      return null
    }

    await act(async () => {
      root.render(<Probe />)
    })

    // Mobile touchStart only loads route chunk, zero article API fetch
    act(() => {
      hookApi.prefetchRouteChunkOnly(9)
    })
    expect(detailFetchCount).toBe(0)

    // Fast desktop sweep (< 80ms) cancelled on mouseLeave -> zero fetch
    act(() => {
      hookApi.schedulePrefetch(9)
      vi.advanceTimersByTime(50)
      hookApi.cancelPrefetch()
      vi.advanceTimersByTime(100)
    })
    expect(detailFetchCount).toBe(0)

    // Hover >= 80ms triggers prefetch
    await act(async () => {
      hookApi.schedulePrefetch(9)
      vi.advanceTimersByTime(85)
    })
    expect(detailFetchCount).toBe(1)
  })
})
