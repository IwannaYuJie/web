import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearArticlesMemoryCache,
  createArticle,
  deleteArticle,
  getCachedArticleById,
  getCachedArticlesList,
  loadArticleById,
  loadArticlesList,
  updateArticle,
} from '../src/services/articles'
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
})
