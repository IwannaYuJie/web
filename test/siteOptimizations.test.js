import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearArticlesMemoryCache,
  createArticle,
  deleteArticle,
  getCachedArticleById,
  getCachedArticlesList,
  invalidateArticlesCache,
  loadArticleById,
  loadArticlesList,
  subscribeArticlesCache,
  updateArticle,
} from '../src/services/articles'
import { subscribeSystemColorMode } from '../src/utils/themeMode'
import { resolveRouteMeta } from '../src/utils/documentMeta'

describe('site optimizations', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    clearArticlesMemoryCache()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    clearArticlesMemoryCache()
    vi.restoreAllMocks()
  })

  it('resolveRouteMeta should return distinct metadata for routes, tools, games, and 404', () => {
    expect(resolveRouteMeta('/').title).toContain('橘猫小窝')
    expect(resolveRouteMeta('/archive').title).toContain('藏经阁')
    expect(resolveRouteMeta('/tags', '?tag=Java').title).toContain('Java')
    expect(resolveRouteMeta('/toolbox/json-formatter').title).toContain('理脉镜')
    expect(resolveRouteMeta('/games/super-cat').title).toContain('超级橘猫')
    expect(resolveRouteMeta('/unknown-path-404').title).toContain('404')
  })

  it('articles SWR cache should cache list/details and invalidate on mutations', async () => {
    let listCalls = 0
    let detailCalls = 0
    const mockArticles = [
      { id: 1, title: '第一篇', description: '摘要', category: '技术', readTime: '3', date: '2026-01-01', content: '正文一' },
      { id: 2, title: '第二篇', description: '摘要', category: '随笔', readTime: '5', date: '2026-01-02', content: '正文二' },
    ]

    globalThis.fetch = vi.fn(async (url, init) => {
      const method = (init?.headers?.['X-HTTP-Method-Override'] || init?.method || 'GET').toUpperCase()
      if (url === '/api/articles' && method === 'GET') {
        listCalls += 1
        return new Response(JSON.stringify(mockArticles), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      if (url === '/api/articles?id=1' && method === 'GET') {
        detailCalls += 1
        return new Response(JSON.stringify(mockArticles[0]), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      if (method === 'POST') {
        mockArticles.push({ id: 3, title: '新文章', description: '新', category: '技术', readTime: '2', date: '2026-01-03', content: '新正文' })
        return new Response(JSON.stringify(mockArticles[2]), { status: 201, headers: { 'Content-Type': 'application/json' } })
      }
      if (method === 'PUT') {
        mockArticles[0] = { ...mockArticles[0], title: '已更新' }
        return new Response(JSON.stringify(mockArticles[0]), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      if (method === 'DELETE') {
        return new Response(JSON.stringify({ message: 'deleted' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      return new Response('{}', { status: 404 })
    })

    // First load populates list and seeds detail cache
    const list1 = await loadArticlesList()
    expect(list1).toHaveLength(2)
    expect(listCalls).toBe(1)
    expect(getCachedArticlesList()).toHaveLength(2)
    expect(getCachedArticleById(1)?.title).toBe('第一篇')

    // Second load hits cache without extra network fetch
    const list2 = await loadArticlesList()
    expect(list2).toHaveLength(2)
    expect(listCalls).toBe(1)

    const art1 = await loadArticleById(1)
    expect(art1.title).toBe('第一篇')
    expect(detailCalls).toBe(0)

    // Create triggers invalidation + background refresh
    await createArticle({ title: '新文章', description: '新', category: '技术', readTime: '2', date: '2026-01-03', content: '新正文' }, 'k')
    await new Promise((r) => setTimeout(r, 10))
    expect(listCalls).toBeGreaterThanOrEqual(2)
    expect(getCachedArticlesList()).toHaveLength(3)

    // Update triggers invalidation + refresh
    await updateArticle(1, { title: '已更新' }, 'k')
    await new Promise((r) => setTimeout(r, 10))
    expect(getCachedArticleById(1)?.title).toBe('已更新')

    // Delete invalidates target detail & refreshes list
    await deleteArticle(2, 'k')
    await new Promise((r) => setTimeout(r, 10))
    expect(listCalls).toBeGreaterThanOrEqual(4)
  })

  it('H-1: slow in-flight list/detail requests from before invalidateArticlesCache must not overwrite newer cache', async () => {
    let resolveSlowList
    let resolveSlowDetail
    let listReqCount = 0
    let detailReqCount = 0
    const receivedEvents = []
    const unsubscribe = subscribeArticlesCache((evt) => receivedEvents.push(evt))

    globalThis.fetch = vi.fn((url) => {
      if (url === '/api/articles') {
        listReqCount += 1
        if (listReqCount === 1) {
          return new Promise((resolve) => {
            resolveSlowList = () =>
              resolve(new Response(JSON.stringify([{ id: 1, title: 'OLD_LIST', content: 'old' }]), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              }))
          })
        }
        return Promise.resolve(
          new Response(JSON.stringify([{ id: 1, title: 'NEW_LIST', content: 'new' }]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      }

      if (url === '/api/articles?id=2') {
        detailReqCount += 1
        if (detailReqCount === 1) {
          return new Promise((resolve) => {
            resolveSlowDetail = () =>
              resolve(new Response(JSON.stringify({ id: 2, title: 'OLD_DETAIL', content: 'old' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              }))
          })
        }
        return Promise.resolve(
          new Response(JSON.stringify({ id: 2, title: 'NEW_DETAIL', content: 'new' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      }

      return Promise.resolve(new Response('{}', { status: 404 }))
    })

    // 1. Start slow list & slow detail requests in generation 0
    const slowListPromise = loadArticlesList()
    const slowDetailPromise = loadArticleById(2)

    // 2. Cache gets invalidated (e.g. after edit/create/delete) -> bumps cacheGen
    invalidateArticlesCache()

    // 3. Fresh list & detail requests complete with NEW data
    const freshList = await loadArticlesList()
    expect(freshList[0].title).toBe('NEW_LIST')
    const freshDetail = await loadArticleById(2, { force: true })
    expect(freshDetail.title).toBe('NEW_DETAIL')

    // 4. Slow old requests finally resolve -> must NOT clobber cache or notify subscribers with OLD data
    resolveSlowList()
    resolveSlowDetail()
    await Promise.all([slowListPromise, slowDetailPromise])

    expect(getCachedArticlesList()[0].title).toBe('NEW_LIST')
    expect(getCachedArticleById(2)?.title).toBe('NEW_DETAIL')
    expect(receivedEvents.some((e) => e.type === 'list' && e.data?.[0]?.title === 'OLD_LIST')).toBe(false)
    expect(receivedEvents.some((e) => e.type === 'detail' && e.data?.title === 'OLD_DETAIL')).toBe(false)

    unsubscribe()
  })

  it('Low: article endpoints should encode special ids with encodeURIComponent', async () => {
    const requestedUrls = []
    globalThis.fetch = vi.fn(async (url) => {
      requestedUrls.push(url)
      return new Response(JSON.stringify({ id: 'a/b?c=1', title: 'encoded' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })

    await loadArticleById('a/b?c=1')
    expect(requestedUrls[0]).toBe('/api/articles?id=a%2Fb%3Fc%3D1')
  })

  it('themeMode: subscribeSystemColorMode reacts to system changes only when user has no stored mode', () => {
    const listeners = new Set()
    const prevWindow = globalThis.window
    globalThis.window = {
      localStorage: {
        getItem: () => null,
      },
      matchMedia: () => ({
        matches: false,
        addEventListener: (_type, fn) => listeners.add(fn),
        removeEventListener: (_type, fn) => listeners.delete(fn),
      }),
    }

    const received = []
    const unsubscribe = subscribeSystemColorMode((mode) => received.push(mode))
    listeners.forEach((fn) => fn({ matches: true }))
    expect(received).toEqual(['dark'])

    // Once user stores a manual choice, system changes are ignored
    globalThis.window.localStorage.getItem = () => 'light'
    listeners.forEach((fn) => fn({ matches: false }))
    expect(received).toEqual(['dark'])

    unsubscribe()
    expect(listeners.size).toBe(0)
    globalThis.window = prevWindow
  })
})
