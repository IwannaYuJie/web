import { useMemo, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import { extractMarkdownToc } from '../utils/markdownUtils'

/**
 * Markdown 渲染组件
 * 采用成熟解析器并进行 sanitize，避免 XSS 风险。
 */
function MarkdownRenderer({ content, className = '' }) {
  const toc = useMemo(() => extractMarkdownToc(content), [content])
  const headingIndexRef = useRef(0)
  headingIndexRef.current = 0

  const getNextHeadingId = () => {
    const current = toc[headingIndexRef.current]
    headingIndexRef.current += 1
    return current?.id
  }

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
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          h1({ children }) {
            return <h1 className="text-3xl font-extrabold mt-12 mb-6 text-gradient">{children}</h1>
          },
          h2({ children }) {
            const id = getNextHeadingId()
            return (
              <h2 id={id} className="text-2xl font-bold mt-10 mb-5 text-primary flex items-center gap-3 scroll-mt-24">
                <span className="w-2 h-8 bg-primary rounded-full" />
                <span>{children}</span>
              </h2>
            )
          },
          h3({ children }) {
            const id = getNextHeadingId()
            return (
              <h3 id={id} className="text-xl font-bold mt-8 mb-4 text-text-color flex items-center gap-2 scroll-mt-24">
                <span className="w-1.5 h-6 bg-secondary rounded-full" />
                <span>{children}</span>
              </h3>
            )
          },
          p({ children }) {
            return <p className="my-4 leading-relaxed text-text-color text-justify">{children}</p>
          },
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {children}
              </a>
            )
          },
          img({ src, alt }) {
            return <img src={src} alt={alt || ''} className="rounded-xl max-w-full my-4 shadow-md" />
          },
          ul({ children }) {
            return <ul className="list-disc ml-6 my-4 space-y-2 text-text-color">{children}</ul>
          },
          ol({ children }) {
            return <ol className="list-decimal ml-6 my-4 space-y-2 text-text-color">{children}</ol>
          },
          li({ children }) {
            return <li className="leading-relaxed">{children}</li>
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-primary bg-primary/5 px-6 py-4 my-6 rounded-r-xl italic text-text-secondary">
                {children}
              </blockquote>
            )
          },
          hr() {
            return <hr className="my-8 border-0 h-px bg-gradient-to-r from-transparent via-border-color to-transparent" />
          },
          code({ inline, className: codeClassName, children }) {
            const codeText = String(children).replace(/\n$/, '')
            const language = codeClassName?.replace('language-', '') || ''

            if (inline) {
              return <code className="bg-gray-100 text-primary px-2 py-1 rounded text-sm font-mono">{children}</code>
            }

            return (
              <div className="my-6 rounded-xl overflow-hidden shadow-md">
                {language && (
                  <div className="bg-gray-800 text-gray-300 px-4 py-2 text-sm font-mono flex items-center justify-between">
                    <span>{language}</span>
                    <button
                      type="button"
                      className="text-xs hover:text-white transition-colors"
                      onClick={() => navigator.clipboard.writeText(codeText)}
                    >
                      📋 复制
                    </button>
                  </div>
                )}
                <pre className="bg-gray-900 text-gray-100 p-4 overflow-x-auto">
                  <code className="text-sm font-mono leading-relaxed whitespace-pre">{codeText}</code>
                </pre>
              </div>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownRenderer
