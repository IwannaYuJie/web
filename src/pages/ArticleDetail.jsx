import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

/**
 * 文章详情页组件
 * 根据 URL 参数从 API 获取并显示对应文章内容
 */
function ArticleDetail() {
  const { id } = useParams()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/articles')
        if (!response.ok) throw new Error('获取文章失败')
        const articles = await response.json()
        const foundArticle = articles.find(a => a.id === parseInt(id))
        if (!foundArticle) throw new Error('文章不存在')
        setArticle(foundArticle)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchArticle()
  }, [id])

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
    <div className="container pb-12 max-w-4xl mx-auto">
      {/* Navigation */}
      <div className="mb-8 animate-fade-in">
        <Link to="/" className="btn btn-ghost pl-0 hover:pl-2 transition-all">
          ← 返回文章列表
        </Link>
      </div>

      {/* Article Header */}
      <header className="mb-12 animate-slide-up">
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">
            {article.category}
          </span>
          <span className="text-text-light text-sm">
            ⏱️ {article.readTime} 分钟阅读
          </span>
        </div>
        
        <h1 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight text-gradient">
          {article.title}
        </h1>

        <div className="flex items-center gap-4 pb-8 border-b border-border-color">
           <img src="/images/cat-avatar.png" alt="Author" className="w-12 h-12 rounded-full border-2 border-primary" />
           <div>
             <div className="font-bold text-text-color">{article.author || '橘猫博主'}</div>
             <div className="text-sm text-text-secondary">发布于 {article.date}</div>
           </div>
        </div>
      </header>
      
      {/* Article Content */}
      <article className="glass p-8 md:p-12 rounded-3xl animate-slide-up shadow-sm" style={{ animationDelay: '0.1s' }}>
        {article.description && (
          <div className="bg-secondary/10 p-6 rounded-xl mb-8 border-l-4 border-primary">
            <p className="text-lg italic text-text-secondary font-medium">
              {article.description}
            </p>
          </div>
        )}
        
        <div className="space-y-6 leading-relaxed text-lg text-text-color">
          {article.content ? (
            article.content.split('\n').map((paragraph, index) => {
              const trimmed = paragraph.trim()
              
              // Code Block (Simplified)
              if (trimmed.startsWith('```')) {
                return null 
              }
              
              // Heading 2
              if (trimmed.startsWith('##')) {
                return (
                  <h2 key={index} className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center gap-2">
                    <span className="w-2 h-8 bg-primary rounded-full inline-block"></span>
                    {trimmed.replace(/##/g, '').trim()}
                  </h2>
                )
              }
              
              // Bullet points
              if (trimmed.startsWith('- ')) {
                return (
                  <li key={index} className="ml-4 list-disc marker:text-primary pl-2">
                    {trimmed.substring(2)}
                  </li>
                )
              }

              // Numbered list
              if (/^\d+\./.test(trimmed)) {
                 return (
                   <div key={index} className="ml-4 pl-2 font-medium text-text-secondary">
                     {trimmed}
                   </div>
                 )
              }

              // Normal paragraph
              if (trimmed) {
                return <p key={index} className="text-justify">{trimmed}</p>
              }
              return <br key={index} />
            })
          ) : (
            <div className="text-center py-12 text-text-light">
              <div className="text-4xl mb-4">📝</div>
              <p>该文章暂无详细内容，敬请期待更新～</p>
            </div>
          )}
        </div>
      </article>

      {/* Footer Actions */}
      <div className="mt-12 flex justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
         <button className="btn btn-secondary rounded-full px-8" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            ⬆️ 回到顶部
         </button>
         <button className="btn btn-primary rounded-full px-8">
            🧡 点赞文章
         </button>
      </div>
    </div>
  )
}

export default ArticleDetail
