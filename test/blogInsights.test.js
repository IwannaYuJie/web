import { describe, expect, it } from 'vitest'
import {
  getArchiveGroups,
  getBlogStats,
  getRelatedArticles,
  getTagCloud,
} from '../src/utils/blogInsights'

const articles = [
  {
    id: 1,
    title: 'A',
    date: '2026-01-02',
    category: 'Java',
    readTime: '5',
    tags: ['JVM', 'LTS'],
  },
  {
    id: 2,
    title: 'B',
    date: '2026-03-02',
    category: 'AI',
    readTime: '8',
    tags: ['AI'],
  },
  {
    id: 3,
    title: 'C',
    date: '2025-12-01',
    category: 'Java',
    readTime: '7',
    tags: ['JVM'],
  },
]

describe('blogInsights', () => {
  it('getBlogStats should count blog inventory', () => {
    expect(getBlogStats(articles)).toEqual({
      articleCount: 3,
      categoryCount: 2,
      tagCount: 3,
      totalReadMinutes: 20,
      latestDate: '2026-03-02',
    })
  })

  it('getArchiveGroups should group sorted articles by year', () => {
    expect(getArchiveGroups(articles).map(group => ({
      year: group.year,
      ids: group.items.map(item => item.id),
    }))).toEqual([
      { year: '2026', ids: [2, 1] },
      { year: '2025', ids: [3] },
    ])
  })

  it('getTagCloud should rank tags by usage', () => {
    expect(getTagCloud(articles).slice(0, 2)).toEqual([
      { tag: 'JVM', count: 2 },
      { tag: 'AI', count: 1 },
    ])
  })

  it('getRelatedArticles should score category and tag overlap', () => {
    expect(getRelatedArticles(articles[0], articles).map(article => article.id)).toEqual([3])
  })
})
