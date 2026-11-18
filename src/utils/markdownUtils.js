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

function parseFenceOpen(trimmedLine) {
  const match = trimmedLine.match(/^(`{3,}|~{3,})(.*)$/)
  if (!match) {
    return null
  }
  const [, marker, info] = match
  const char = marker[0]
  if (char === '`' && info.includes('`')) {
    return null
  }
  return { char, length: marker.length }
}

function isFenceClose(trimmedLine, activeFence) {
  const match = trimmedLine.match(/^(`{3,}|~{3,})\s*$/)
  if (!match) {
    return false
  }
  const marker = match[1]
  return marker[0] === activeFence.char && marker.length >= activeFence.length
}

/**
 * 扫描 Markdown 文本中的 h2/h3 标题及行号（自动跳过 ``` 与 ~~~ 围栏代码块）
 * @param {string} content
 * @returns {Array<{line:number,level:number,text:string,id:string}>}
 */
export function scanMarkdownHeadings(content = '') {
  if (!content) {
    return []
  }

  const headingCount = new Map()
  const headings = []
  const lines = String(content).split(/\r?\n/)
  let activeFence = null

  for (let i = 0; i < lines.length; i += 1) {
    const rawLine = lines[i]
    const trimmed = rawLine.trim()

    if (activeFence) {
      if (isFenceClose(trimmed, activeFence)) {
        activeFence = null
      }
      continue
    }

    const fence = parseFenceOpen(trimmed)
    if (fence) {
      activeFence = fence
      continue
    }

    if (rawLine.startsWith('\t') || /^ {4}/.test(rawLine)) {
      continue
    }

    if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
      const level = trimmed.startsWith('### ') ? 3 : 2
      const text = trimmed.replace(/^###?\s*/, '').trim()
      const baseId = slugifyHeading(text)
      const currentCount = headingCount.get(baseId) || 0
      headingCount.set(baseId, currentCount + 1)

      headings.push({
        line: i + 1,
        level,
        text,
        id: currentCount === 0 ? baseId : `${baseId}-${currentCount}`,
      })
    }
  }

  return headings
}

/**
 * 从 Markdown 文本中提取 h2/h3 目录
 * @param {string} content
 * @returns {Array<{level:number,text:string,id:string}>}
 */
export function extractMarkdownToc(content = '') {
  return scanMarkdownHeadings(content).map(({ level, text, id }) => ({
    level,
    text,
    id,
  }))
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
