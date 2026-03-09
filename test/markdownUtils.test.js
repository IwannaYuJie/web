import { describe, expect, it } from 'vitest'
import { extractMarkdownToc, slugifyHeading } from '../src/utils/markdownUtils'

describe('markdownUtils', () => {
  it('slugifyHeading should normalize heading text', () => {
    expect(slugifyHeading(' Hello, 世界! 2026 ')).toBe('hello-世界-2026')
  })

  it('extractMarkdownToc should generate stable ids for duplicate headings', () => {
    const toc = extractMarkdownToc([
      '# title',
      '## 简介',
      '### 细节',
      '## 简介',
    ].join('\n'))

    expect(toc).toEqual([
      { level: 2, text: '简介', id: '简介' },
      { level: 3, text: '细节', id: '细节' },
      { level: 2, text: '简介', id: '简介-1' },
    ])
  })
})
