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
