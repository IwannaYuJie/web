import { useMemo } from 'react'

/**
 * Markdown 渲染组件
 * 支持常用的 Markdown 语法解析和美观渲染
 */
function MarkdownRenderer({ content, className = '' }) {
  const renderedContent = useMemo(() => {
    if (!content) return null

    // 预处理代码块，防止内部内容被其他规则处理
    const codeBlocks = []
    let processedContent = content.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const index = codeBlocks.length
      codeBlocks.push({ lang, code: code.trim() })
      return `__CODE_BLOCK_${index}__`
    })

    // 预处理行内代码
    const inlineCodes = []
    processedContent = processedContent.replace(/`([^`]+)`/g, (match, code) => {
      const index = inlineCodes.length
      inlineCodes.push(code)
      return `__INLINE_CODE_${index}__`
    })

    // 按行处理
    const lines = processedContent.split('\n')
    const elements = []
    let listItems = []
    let listType = null
    let blockquoteLines = []

    const flushList = () => {
      if (listItems.length > 0) {
        const ListTag = listType === 'ul' ? 'ul' : 'ol'
        elements.push(
          <ListTag
            key={`list-${elements.length}`}
            className={`${listType === 'ul' ? 'list-disc' : 'list-decimal'} ml-6 my-4 space-y-2 text-text-color`}
          >
            {listItems.map((item, i) => (
              <li key={i} className="leading-relaxed">{parseInline(item)}</li>
            ))}
          </ListTag>
        )
        listItems = []
        listType = null
      }
    }

    const flushBlockquote = () => {
      if (blockquoteLines.length > 0) {
        elements.push(
          <blockquote
            key={`quote-${elements.length}`}
            className="border-l-4 border-primary bg-primary/5 px-6 py-4 my-6 rounded-r-xl italic text-text-secondary"
          >
            {blockquoteLines.map((line, i) => (
              <p key={i} className="leading-relaxed">{parseInline(line)}</p>
            ))}
          </blockquote>
        )
        blockquoteLines = []
      }
    }

    // 解析行内元素
    const parseInline = (text) => {
      if (!text) return text

      // 还原行内代码
      text = text.replace(/__INLINE_CODE_(\d+)__/g, (match, index) => {
        return `<code class="bg-gray-100 text-primary px-2 py-1 rounded text-sm font-mono">${inlineCodes[parseInt(index)]}</code>`
      })

      // 粗体 **text**
      text = text.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-text-color">$1</strong>')

      // 斜体 *text*
      text = text.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>')

      // 删除线 ~~text~~
      text = text.replace(/~~([^~]+)~~/g, '<del class="line-through text-text-light">$1</del>')

      // 链接 [text](url)
      text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>')

      // 图片 ![alt](url)
      text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-xl max-w-full my-4 shadow-md" />')

      return <span dangerouslySetInnerHTML={{ __html: text }} />
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()

      // 代码块占位符
      const codeBlockMatch = trimmed.match(/__CODE_BLOCK_(\d+)__/)
      if (codeBlockMatch) {
        flushList()
        flushBlockquote()
        const block = codeBlocks[parseInt(codeBlockMatch[1])]
        elements.push(
          <div key={`code-${elements.length}`} className="my-6 rounded-xl overflow-hidden shadow-md">
            {block.lang && (
              <div className="bg-gray-800 text-gray-300 px-4 py-2 text-sm font-mono flex items-center justify-between">
                <span>{block.lang}</span>
                <button
                  className="text-xs hover:text-white transition-colors"
                  onClick={() => navigator.clipboard.writeText(block.code)}
                >
                  📋 复制
                </button>
              </div>
            )}
            <pre className="bg-gray-900 text-gray-100 p-4 overflow-x-auto">
              <code className="text-sm font-mono leading-relaxed whitespace-pre">{block.code}</code>
            </pre>
          </div>
        )
        continue
      }

      // 标题 ###
      if (trimmed.startsWith('###')) {
        flushList()
        flushBlockquote()
        elements.push(
          <h3 key={`h3-${elements.length}`} className="text-xl font-bold mt-8 mb-4 text-text-color flex items-center gap-2">
            <span className="w-1.5 h-6 bg-secondary rounded-full"></span>
            {parseInline(trimmed.replace(/^###\s*/, ''))}
          </h3>
        )
        continue
      }

      if (trimmed.startsWith('##')) {
        flushList()
        flushBlockquote()
        elements.push(
          <h2 key={`h2-${elements.length}`} className="text-2xl font-bold mt-10 mb-5 text-primary flex items-center gap-3">
            <span className="w-2 h-8 bg-primary rounded-full"></span>
            {parseInline(trimmed.replace(/^##\s*/, ''))}
          </h2>
        )
        continue
      }

      if (trimmed.startsWith('#')) {
        flushList()
        flushBlockquote()
        elements.push(
          <h1 key={`h1-${elements.length}`} className="text-3xl font-extrabold mt-12 mb-6 text-gradient">
            {parseInline(trimmed.replace(/^#\s*/, ''))}
          </h1>
        )
        continue
      }

      // 分隔线
      if (/^[-*_]{3,}$/.test(trimmed)) {
        flushList()
        flushBlockquote()
        elements.push(
          <hr key={`hr-${elements.length}`} className="my-8 border-0 h-px bg-gradient-to-r from-transparent via-border-color to-transparent" />
        )
        continue
      }

      // 无序列表
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        flushBlockquote()
        if (listType !== 'ul') {
          flushList()
          listType = 'ul'
        }
        listItems.push(trimmed.substring(2))
        continue
      }

      // 有序列表
      const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)/)
      if (orderedMatch) {
        flushBlockquote()
        if (listType !== 'ol') {
          flushList()
          listType = 'ol'
        }
        listItems.push(orderedMatch[2])
        continue
      }

      // 引用块
      if (trimmed.startsWith('>')) {
        flushList()
        blockquoteLines.push(trimmed.replace(/^>\s*/, ''))
        continue
      }

      // 任务列表
      const taskMatch = trimmed.match(/^[-*]\s*\[([ xX])\]\s*(.*)/)
      if (taskMatch) {
        flushList()
        flushBlockquote()
        const checked = taskMatch[1].toLowerCase() === 'x'
        elements.push(
          <div key={`task-${elements.length}`} className="flex items-center gap-3 my-2">
            <span className={`w-5 h-5 rounded border-2 flex items-center justify-center ${checked ? 'bg-primary border-primary text-white' : 'border-gray-300'}`}>
              {checked && '✓'}
            </span>
            <span className={checked ? 'line-through text-text-light' : ''}>
              {parseInline(taskMatch[2])}
            </span>
          </div>
        )
        continue
      }

      // 空行
      if (!trimmed) {
        flushList()
        flushBlockquote()
        continue
      }

      // 普通段落
      flushList()
      flushBlockquote()
      elements.push(
        <p key={`p-${elements.length}`} className="my-4 leading-relaxed text-text-color text-justify">
          {parseInline(trimmed)}
        </p>
      )
    }

    // 清理剩余的列表和引用
    flushList()
    flushBlockquote()

    return elements
  }, [content])

  if (!content) {
    return (
      <div className="text-center py-12 text-text-light">
        <div className="text-4xl mb-4">📝</div>
        <p>该文章暂无详细内容，敬请期待更新～</p>
      </div>
    )
  }

  return (
    <div className={`markdown-content ${className}`}>
      {renderedContent}
    </div>
  )
}

export default MarkdownRenderer
