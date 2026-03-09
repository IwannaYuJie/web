import { describe, expect, it } from 'vitest'
import {
  nextArticleId,
  normalizeArticleInput,
  parseArticleRequest,
  sortArticlesByDate,
  validateRequiredArticleFields,
} from '../functions/_shared/articles'

describe('articles shared helpers', () => {
  it('parseArticleRequest should support method override and query id', () => {
    const request = new Request('https://example.com/api/articles?id=12', {
      method: 'POST',
      headers: { 'X-HTTP-Method-Override': 'PUT' },
    })

    expect(parseArticleRequest(request)).toMatchObject({
      method: 'PUT',
      articleId: '12',
    })
  })

  it('normalizeArticleInput should sanitize fields', () => {
    expect(normalizeArticleInput({
      title: ' hello ',
      description: ' desc ',
      category: ' Java ',
      readTime: 10,
      tags: [' a ', '', 'b'],
      author: ' ',
    }, '2026-03-09')).toEqual({
      title: 'hello',
      description: 'desc',
      date: '2026-03-09',
      category: 'Java',
      readTime: '10',
      content: '',
      tags: ['a', 'b'],
      author: '橘猫博主',
    })
  })

  it('validateRequiredArticleFields should find first missing field', () => {
    expect(validateRequiredArticleFields({
      title: 't',
      description: '',
      category: 'c',
      readTime: '5 min',
    })).toBe('description')
  })

  it('sortArticlesByDate and nextArticleId should work', () => {
    const articles = [
      { id: 5, date: '2026-01-01' },
      { id: 2, date: '2026-03-01' },
    ]

    expect(sortArticlesByDate(articles).map((item) => item.id)).toEqual([2, 5])
    expect(nextArticleId(articles)).toBe(6)
  })
})
