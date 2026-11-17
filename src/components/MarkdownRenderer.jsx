import { Children, isValidElement, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { extractMarkdownToc } from '../utils/markdownUtils'
import './MarkdownRenderer.css'

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <figure className="md-code">
      <figcaption>
        <span className="md-code-lang">{language || 'code'}</span>
        <button type="button" onClick={copy}>{copied ? '已誊抄' : '誊抄'}</button>
      </figcaption>
      <pre><code>{code}</code></pre>
    </figure>
  )
}

function ImageLightbox({ image, onClose }) {
  useEffect(() => {
    if (!image) {
      return undefined
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [image, onClose])

  if (!image || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div
      className="md-lightbox-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={image.alt ? `配图大图：${image.alt}` : '配图大图预览'}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="md-lightbox-stage" onClick={(e) => { if (e.target === e.currentTarget) { onClose() } }}>
        <button
          type="button"
          className="md-lightbox-close"
          onClick={onClose}
          aria-label="关闭大图预览"
        >
          收起 ×
        </button>
        <img src={image.src} alt={image.alt || ''} className="md-lightbox-img" />
        <div className="md-lightbox-foot">
          {image.alt && <p className="md-lightbox-caption elegant">{image.alt}</p>}
          <span className="md-lightbox-hint">点击空白处或按 ESC 键关闭</span>
        </div>
      </div>
    </div>,
    document.body
  )
}

/**
 * Markdown 渲染组件
 * 使用 GitHub Flavored Markdown，并直接忽略原生 HTML 节点。
 */
function MarkdownRenderer({ content, className = '', toc: providedToc }) {
  const toc = useMemo(() => providedToc || extractMarkdownToc(content), [content, providedToc])
  const [lightboxImage, setLightboxImage] = useState(null)

  // 按源码行号给标题分配锚点，与 extractMarkdownToc 的扫描顺序一致。
  // 不能在渲染时累加计数：StrictMode 会重复渲染，计数就会错位。
  const idByLine = useMemo(() => {
    const map = new Map()
    let index = 0
    String(content || '').split('\n').forEach((line, i) => {
      const trimmed = line.trim()
      if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
        if (toc[index]) { map.set(i + 1, toc[index].id) }
        index += 1
      }
    })
    return map
  }, [content, toc])
  const headingId = (node) => idByLine.get(node?.position?.start?.line)

  if (!content) {
    return (
      <div className="state">
        <div className="state-mark">空</div>
        <p>此卷尚无正文，静待落笔。</p>
      </div>
    )
  }

  return (
    <div className={`md ${className}`}>
      <ReactMarkdown
        skipHtml
        remarkPlugins={[remarkGfm]}
        components={{
          h1({ children }) {
            return <h1>{children}</h1>
          },
          h2({ node, children }) {
            return <h2 id={headingId(node)}>{children}</h2>
          },
          h3({ node, children }) {
            return <h3 id={headingId(node)}>{children}</h3>
          },
          a({ href, children }) {
            const external = /^https?:/i.test(href || '')
            return (
              <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>
                {children}
              </a>
            )
          },
          img({ src, alt }) {
            // 图片会被包在 <p> 里，使用 button + span 保持合法语义并支持键盘/点击灯箱预览
            return (
              <span className="md-figure">
                <button
                  type="button"
                  className="md-img-btn"
                  onClick={() => src && setLightboxImage({ src, alt: alt || '' })}
                  aria-label={alt ? `点击放大查看配图：${alt}` : '点击放大查看配图'}
                >
                  <img src={src} alt={alt || ''} loading="lazy" />
                </button>
                {alt && <span className="md-caption">{alt}</span>}
              </span>
            )
          },
          table({ children }) {
            return <div className="md-table"><table>{children}</table></div>
          },
          // 代码块由 pre 接管；code 只处理行内代码
          pre({ children }) {
            const child = Children.toArray(children).find(isValidElement)
            const codeClass = child?.props?.className || ''
            const language = codeClass.replace(/^language-/, '')
            const code = String(child?.props?.children ?? '').replace(/\n$/, '')
            return <CodeBlock language={language} code={code} />
          },
          code({ children }) {
            return <code className="md-inline">{children}</code>
          },
        }}
      >
        {content}
      </ReactMarkdown>

      <ImageLightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />
    </div>
  )
}

export default MarkdownRenderer
