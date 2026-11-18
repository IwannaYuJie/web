import { Children, isValidElement, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { restoreFocus, trapFocusOnTab } from '../utils/focusTrap'
import { extractMarkdownToc, scanMarkdownHeadings } from '../utils/markdownUtils'
import './MarkdownRenderer.css'

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false)
  const copyTimerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current)
      }
    }
  }, [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current)
      }
      copyTimerRef.current = window.setTimeout(() => {
        copyTimerRef.current = null
        setCopied(false)
      }, 1500)
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
  const stageRef = useRef(null)
  const closeBtnRef = useRef(null)

  useEffect(() => {
    if (!image) {
      return undefined
    }
    const previousFocus = typeof document !== 'undefined' ? document.activeElement : null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeBtnRef.current?.focus({ preventScroll: true })

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'Tab') {
        trapFocusOnTab(e, stageRef.current)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKeyDown)
      restoreFocus(previousFocus)
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
      <div ref={stageRef} className="md-lightbox-stage" onClick={(e) => { if (e.target === e.currentTarget) { onClose() } }}>
        <button
          ref={closeBtnRef}
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
  const handleCloseLightbox = useCallback(() => setLightboxImage(null), [])

  // 按源码行号给标题分配锚点，与 extractMarkdownToc 的扫描顺序一致（跳过围栏代码块）。
  // 不能在渲染时累加计数：StrictMode 会重复渲染，计数就会错位。
  const idByLine = useMemo(() => {
    const map = new Map()
    const headings = scanMarkdownHeadings(content)
    headings.forEach((heading, index) => {
      map.set(heading.line, toc[index]?.id || heading.id)
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
            const rawHref = href || ''
            const isExternalProtocol = /^(https?:|mailto:|tel:|\/\/)/i.test(rawHref)
            const isMpaOrAsset = /^\/(yujie(\/|$|\?)|images\/|creative-blogs\/|api\/)/i.test(rawHref)
            if (rawHref.startsWith('/') && !isExternalProtocol && !isMpaOrAsset) {
              return <Link to={rawHref}>{children}</Link>
            }
            const openInNewTab = /^https?:/i.test(rawHref) || rawHref.startsWith('//')
            return (
              <a href={href} target={openInNewTab ? '_blank' : undefined} rel={openInNewTab ? 'noopener noreferrer' : undefined}>
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

      <ImageLightbox image={lightboxImage} onClose={handleCloseLightbox} />
    </div>
  )
}

export default MarkdownRenderer
