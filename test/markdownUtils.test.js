import { describe, expect, it } from 'vitest'
import { extractMarkdownToc, getArticleReadingStats, scanMarkdownHeadings, slugifyHeading } from '../src/utils/markdownUtils'

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

  it('getArticleReadingStats should count CJK and Latin words and compute readMinutes', () => {
    const stats = getArticleReadingStats('## 标题\n\n这是一段测试正文，包含 Java 21 和 Spring Boot。\n\n![配图说明](https://example.com/a.png)')
    expect(stats.cjkCount).toBeGreaterThan(10)
    expect(stats.latinWordCount).toBe(4) // Java, 21, Spring, Boot
    expect(stats.wordCount).toBe(stats.cjkCount + stats.latinWordCount)
    expect(stats.readMinutes).toBe(1)

    const withFallback = getArticleReadingStats('短文', '8')
    expect(withFallback.readMinutes).toBe(8)
  })

  it('extractMarkdownToc and scanMarkdownHeadings should skip ## lines inside ``` and ~~~ fenced code blocks', () => {
    const md = [
      '## 真实标题一',
      '',
      '```bash',
      '## 代码块内注释',
      '### 代码块内三级注释',
      '```',
      '',
      '~~~markdown',
      '```sh',
      '## 嵌套围栏内的伪标题',
      '```',
      '## 波浪线代码块内的伪标题',
      '~~~',
      '',
      '````md',
      '```',
      '## 四反引号围栏内的伪标题',
      '```',
      '````',
      '',
      '    ## 缩进代码块内的伪标题',
      '',
      '### 真实标题二',
    ].join('\n')

    expect(extractMarkdownToc(md)).toEqual([
      { level: 2, text: '真实标题一', id: '真实标题一' },
      { level: 3, text: '真实标题二', id: '真实标题二' },
    ])
    expect(scanMarkdownHeadings(md)).toEqual([
      { line: 1, level: 2, text: '真实标题一', id: '真实标题一' },
      { line: 23, level: 3, text: '真实标题二', id: '真实标题二' },
    ])
  })
})
