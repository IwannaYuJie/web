/**
 * Markdown 相关工具
 */

/**
 * 生成稳定的标题锚点 ID
 * @param {string} text
 * @returns {string}
 */
export function slugifyHeading(text = '') {
  const normalized = String(text)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return normalized || 'section'
}

/**
 * 从 Markdown 文本中提取 h2/h3 目录
 * @param {string} content
 * @returns {Array<{level:number,text:string,id:string}>}
 */
export function extractMarkdownToc(content = '') {
  if (!content) {
    return []
  }

  const headingCount = new Map()

  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('## ') || line.startsWith('### '))
    .map((line) => {
      const level = line.startsWith('### ') ? 3 : 2
      const text = line.replace(/^###?\s*/, '').trim()
      const baseId = slugifyHeading(text)
      const currentCount = headingCount.get(baseId) || 0
      headingCount.set(baseId, currentCount + 1)

      return {
        level,
        text,
        id: currentCount === 0 ? baseId : `${baseId}-${currentCount}`,
      }
    })
}

/**
 * 统计 Markdown 正文字数（CJK 字符 + 英文/数字词）并估算阅读分钟数
 * @param {string} content
 * @param {string|number} [fallbackReadTime]
 * @returns {{ wordCount: number, cjkCount: number, latinWordCount: number, readMinutes: number }}
 */
export function getArticleReadingStats(content = '', fallbackReadTime) {
  const cleaned = String(content || '')
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/```[^\n]*\n?|```/g, ' '))
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_>#~|-]/g, ' ')

  const cjkMatches = cleaned.match(/[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]/g)
  const cjkCount = cjkMatches ? cjkMatches.length : 0

  const withoutCjk = cleaned.replace(/[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]/g, ' ')
  const latinMatches = withoutCjk.match(/[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*/g)
  const latinWordCount = latinMatches ? latinMatches.length : 0

  const wordCount = cjkCount + latinWordCount
  const computedMinutes = wordCount > 0 ? Math.max(1, Math.ceil(cjkCount / 350 + latinWordCount / 200)) : 1
  const parsedFallback = Number.parseInt(String(fallbackReadTime || ''), 10)
  const readMinutes = Number.isFinite(parsedFallback) && parsedFallback > 0 ? parsedFallback : computedMinutes

  return {
    wordCount,
    cjkCount,
    latinWordCount,
    readMinutes,
  }
}
