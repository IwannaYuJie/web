import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

/**
 * 文章详情页组件
 * 根据 URL 参数从 API 获取并显示对应文章内容
 */
function ArticleDetail() {
  // 获取 URL 参数中的文章 ID
  const { id } = useParams()

  // 状态管理
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 从 API 获取文章数据
  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch('/api/articles')
        
        if (!response.ok) {
          throw new Error('获取文章失败')
        }
        
        const articles = await response.json()
        // 根据 ID 找到对应文章（ID 需要转换为数字进行比较）
        const foundArticle = articles.find(a => a.id === parseInt(id))
        
        if (!foundArticle) {
          throw new Error('文章不存在')
        }
        
        setArticle(foundArticle)
      } catch (err) {
        console.error('获取文章详情失败:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchArticle()
  }, [id]) // 当 ID 改变时重新获取

  // 加载中状态
  if (loading) {
    return (
      <div className="container">
        <div className="loading-message">
          <h2>🐱 加载中...</h2>
          <p>正在获取文章内容，请稍候～</p>
        </div>
      </div>
    )
  }

  // 错误状态
  if (error || !article) {
    return (
      <div className="container">
        <div className="not-found">
          <h1>😢 {error || '文章不存在'}</h1>
          <p>抱歉,找不到您要查看的文章。</p>
          <Link to="/" className="back-button">返回首页</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      {/* 返回按钮 */}
      <Link to="/" className="back-link">← 返回首页</Link>
      
      {/* 文章内容 */}
      <article className="article-detail">
        <header className="article-header">
          <h1>{article.title}</h1>
          <div className="article-meta">
            <span>👤 {article.author || '橘猫'}</span>
            <span>📅 {article.date}</span>
            <span>🏷️ {article.category}</span>
            {article.readTime && <span>⏱️ {article.readTime} 分钟</span>}
          </div>
        </header>
        
        <div className="article-content">
          {/* 显示文章描述 */}
          {article.description && (
            <div className="article-description">
              <p><strong>📝 摘要：</strong>{article.description}</p>
            </div>
          )}
          
          {/* 显示文章正文内容 */}
          {article.content ? (
            // 如果有正文内容，按段落分割并渲染
            article.content.split('\n').map((paragraph, index) => {
              // 处理代码块
              if (paragraph.trim().startsWith('```')) {
                return null // 简化处理,实际项目可使用 markdown 解析器
              }
              // 处理标题
              if (paragraph.trim().startsWith('##')) {
                return <h2 key={index}>{paragraph.replace(/##/g, '').trim()}</h2>
              }
              // 处理普通段落
              if (paragraph.trim()) {
                return <p key={index}>{paragraph.trim()}</p>
              }
              return null
            })
          ) : (
            // 如果没有正文，显示提示信息
            <div className="no-content">
              <p>📄 该文章暂无详细内容，敬请期待更新～</p>
            </div>
          )}
        </div>
      </article>
    </div>
  )
}

export default ArticleDetail
