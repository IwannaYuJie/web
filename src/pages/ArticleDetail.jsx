import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import MarkdownRenderer from '../components/MarkdownRenderer'
import { useArticle } from '../hooks/useArticles'

/**
 * 文章详情页组件
 * 根据 URL 参数从 API 获取并显示对应文章内容
 */
function ArticleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { article, loading, error, liked, toggleLike } = useArticle(id)

  // 阅读进度
  const [readProgress, setReadProgress] = useState(0)
  const [showToc, setShowToc] = useState(false)

  // 计算阅读进度
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight - windowHeight
      const scrollTop = window.scrollY
      const progress = documentHeight > 0 ? Math.min((scrollTop / documentHeight) * 100, 100) : 0
      setReadProgress(progress)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 提取文章目录
  const extractToc = (content) => {
    if (!content) return []
    const headings = []
    const lines = content.split('\n')

    lines.forEach((line, index) => {
      const trimmed = line.trim()
      if (trimmed.startsWith('## ')) {
        headings.push({
          level: 2,
          text: trimmed.replace(/^##\s*/, ''),
          id: `heading-${index}`
        })
      } else if (trimmed.startsWith('### ')) {
        headings.push({
          level: 3,
          text: trimmed.replace(/^###\s*/, ''),
          id: `heading-${index}`
        })
      }
    })

    return headings
  }

  const toc = article ? extractToc(article.content) : []

  if (loading) {
    return (
      <div className="container flex-center min-h-[60vh]">
        <div className="text-center animate-bounce">
          <div className="text-6xl mb-4">🐱</div>
          <h2 className="text-xl font-bold text-primary">正在潜心阅读中...</h2>
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="container flex-center min-h-[60vh]">
        <div className="glass p-12 rounded-3xl text-center max-w-lg border border-red-100">
          <div className="text-6xl mb-4">😿</div>
          <h1 className="text-2xl font-bold text-red-500 mb-4">{error || '文章不存在'}</h1>
          <p className="text-text-secondary mb-8">这篇文章可能已经被橘猫藏起来了...</p>
          <Link to="/" className="btn btn-primary">
            🏠 返回首页
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* 阅读进度条 */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-50">
        <div
          className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-150"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      <div className="container pb-12 max-w-5xl mx-auto">
        {/* Navigation */}
        <div className="mb-8 flex items-center justify-between animate-fade-in">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost pl-0 hover:pl-2 transition-all"
          >
            ← 返回
          </button>

          <div className="flex items-center gap-2">
            {toc.length > 0 && (
              <button
                onClick={() => setShowToc(!showToc)}
                className="btn btn-ghost text-sm"
              >
                📑 目录
              </button>
            )}
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                alert('链接已复制到剪贴板！')
              }}
              className="btn btn-ghost text-sm"
            >
              🔗 分享
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* 侧边目录 */}
          {showToc && toc.length > 0 && (
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24 glass p-4 rounded-2xl max-h-[70vh] overflow-y-auto">
                <h4 className="font-bold text-sm mb-3 text-text-secondary">📑 文章目录</h4>
                <nav className="space-y-2">
                  {toc.map((item, index) => (
                    <a
                      key={index}
                      href={`#${item.id}`}
                      className={`block text-sm transition-colors hover:text-primary ${
                        item.level === 3 ? 'pl-4 text-text-light' : 'font-medium'
                      }`}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}

          {/* 主内容区 */}
          <div className="flex-1 min-w-0">
            {/* Article Header */}
            <header className="mb-12 animate-slide-up">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">
                  {article.category}
                </span>
                <span className="text-text-light text-sm">
                  ⏱️ {article.readTime} 分钟阅读
                </span>
                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 ml-2">
                    {article.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-secondary/20 text-text-secondary text-xs rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <h1 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight text-gradient">
                {article.title}
              </h1>

              <div className="flex items-center gap-4 pb-8 border-b border-border-color">
                <img
                  src="/images/cat-avatar.png"
                  alt="Author"
                  className="w-12 h-12 rounded-full border-2 border-primary object-cover"
                />
                <div className="flex-1">
                  <div className="font-bold text-text-color">{article.author || '橘猫博主'}</div>
                  <div className="text-sm text-text-secondary">
                    发布于 {article.date}
                    {article.updatedAt && article.updatedAt !== article.date && (
                      <span className="ml-2 text-text-light">· 更新于 {article.updatedAt}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={toggleLike}
                    className={`flex items-center gap-1 px-4 py-2 rounded-full transition-all ${
                      liked
                        ? 'bg-red-50 text-red-500 border border-red-200'
                        : 'bg-gray-50 text-text-secondary border border-gray-200 hover:border-red-200 hover:text-red-400'
                    }`}
                  >
                    {liked ? '❤️' : '🤍'}
                    <span className="text-sm">{liked ? '已赞' : '点赞'}</span>
                  </button>
                </div>
              </div>
            </header>

            {/* Article Content */}
            <article className="glass p-8 md:p-12 rounded-3xl animate-slide-up shadow-sm" style={{ animationDelay: '0.1s' }}>
              {article.description && (
                <div className="bg-secondary/10 p-6 rounded-xl mb-8 border-l-4 border-primary">
                  <p className="text-lg italic text-text-secondary font-medium">
                    💡 {article.description}
                  </p>
                </div>
              )}

              <div className="prose prose-lg max-w-none">
                <MarkdownRenderer content={article.content} />
              </div>
            </article>

            {/* 文章底部信息 */}
            <div className="mt-8 glass p-6 rounded-2xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src="/images/cat-avatar.png"
                    alt="Author"
                    className="w-16 h-16 rounded-full border-2 border-primary object-cover"
                  />
                  <div>
                    <div className="font-bold text-lg text-text-color">{article.author || '橘猫博主'}</div>
                    <p className="text-sm text-text-secondary">感谢阅读，如果觉得有帮助，请点赞支持～</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={toggleLike}
                    className={`btn ${liked ? 'bg-red-50 text-red-500 border-red-200' : 'btn-primary'} rounded-full px-6`}
                  >
                    {liked ? '❤️ 已点赞' : '🧡 点赞文章'}
                  </button>
                  <button
                    className="btn btn-secondary rounded-full px-6"
                    onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
                  >
                    ⬆️ 回到顶部
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-8 flex justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <Link to="/" className="btn btn-ghost">
                ← 返回文章列表
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ArticleDetail
