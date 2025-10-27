import { useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * 首页组件
 * 展示文章列表和随机名言功能
 */
function Home() {
  // 示例文章数据
  const articles = [
    {
      id: 1,
      title: '如何使用 Vite 构建现代化前端项目',
      description: '探索 Vite 的强大功能和最佳实践',
      date: '2025-01-15'
    },
    {
      id: 2,
      title: 'React Hooks 完全指南',
      description: '深入理解 useState、useEffect 等常用 Hooks',
      date: '2025-01-10'
    },
    {
      id: 3,
      title: 'JavaScript 异步编程详解',
      description: '从回调函数到 Promise 再到 async/await',
      date: '2025-01-05'
    },
    {
      id: 4,
      title: 'CSS Grid 布局实战',
      description: '用 Grid 打造响应式网页布局',
      date: '2024-12-28'
    }
  ]

  // 状态管理：随机名言
  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * 获取随机名言
   * 调用 quotable.io API
   */
  const fetchRandomQuote = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('https://api.quotable.io/random')
      if (!response.ok) {
        throw new Error('获取名言失败')
      }
      const data = await response.json()
      setQuote(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      {/* 页面标题 - 橘猫主题 */}
      <header className="page-header">
        <h1>🐱 橘猫的小窝 🧡</h1>
        <p>一只爱分享技术的懒猫 · 记录成长的每一天</p>
      </header>

      {/* 随机名言区域 - 橘猫的智慧 */}
      <section className="quote-section">
        <h2>🐾 橘猫的每日智慧</h2>
        <button 
          onClick={fetchRandomQuote} 
          disabled={loading}
          className="quote-button"
        >
          {loading ? '🐱 思考中...' : '🎲 获取今日名言'}
        </button>
        
        {/* 显示名言 */}
        {quote && (
          <div className="quote-card">
            <p className="quote-text">"{quote.content}"</p>
            <p className="quote-author">— {quote.author}</p>
          </div>
        )}
        
        {/* 显示错误信息 */}
        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}
      </section>

      {/* 文章列表 - 橘猫的笔记本 */}
      <section className="articles-section">
        <h2>📚 橘猫的技术笔记</h2>
        <div className="articles-grid">
          {articles.map(article => (
            <Link 
              to={`/article/${article.id}`} 
              key={article.id}
              className="article-card"
            >
              <h3>🐾 {article.title}</h3>
              <p className="article-description">{article.description}</p>
              <p className="article-date">🗓️ {article.date}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Home
