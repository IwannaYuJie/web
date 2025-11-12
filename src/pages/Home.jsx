import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

/**
 * 首页组件
 * 展示文章列表和随机名言功能
 */
function Home() {
  // 状态管理：文章数据
  const [articles, setArticles] = useState([])
  const [articlesLoading, setArticlesLoading] = useState(true)
  const [articlesError, setArticlesError] = useState(null)
  
  // 状态管理：随机名言
  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [catMood, setCatMood] = useState('😺') // 橘猫心情
  const [visitorCount, setVisitorCount] = useState(12345) // 访问计数
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedCategory, setSelectedCategory] = useState('全部')

  // 橘猫心情数组
  const catMoods = ['😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾']
  
  // 文章分类
  const categories = ['全部', 'Java核心', 'Spring框架', '微服务', '数据库', 'JVM', '中间件', '云原生', '架构设计', '搜索引擎', '持久层']

  // 编程智慧语录
  const catQuotes = [
    { text: '代码如诗，简洁优雅才是最高境界', author: 'Martin Fowler' },
    { text: '过早的优化是万恶之源', author: 'Donald Knuth' },
    { text: '任何傻瓜都能写出计算机能理解的代码，但只有好的程序员才能写出人类能理解的代码', author: 'Kent Beck' },
    { text: '简单是可靠的先决条件', author: 'Edsger W. Dijkstra' },
    { text: '完成比完美更重要', author: 'Facebook工程师文化' }
  ]

  // 获取文章列表
  useEffect(() => {
    fetchArticles()
  }, [])

  /**
   * 从 API 获取文章列表
   */
  const fetchArticles = async () => {
    setArticlesLoading(true)
    setArticlesError(null)
    
    try {
      const response = await fetch('/api/articles')
      
      if (!response.ok) {
        throw new Error('获取文章列表失败')
      }
      
      const data = await response.json()
      setArticles(data)
    } catch (err) {
      console.error('获取文章失败:', err)
      setArticlesError(err.message)
    } finally {
      setArticlesLoading(false)
    }
  }

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // 随机改变橘猫心情
  useEffect(() => {
    const moodTimer = setInterval(() => {
      setCatMood(catMoods[Math.floor(Math.random() * catMoods.length)])
    }, 3000)
    return () => clearInterval(moodTimer)
  }, [])

  // 模拟访问计数增长
  useEffect(() => {
    const countTimer = setInterval(() => {
      setVisitorCount(prev => prev + Math.floor(Math.random() * 3))
    }, 5000)
    return () => clearInterval(countTimer)
  }, [])

  /**
   * 获取随机名言
   * 调用 quotable.io API 或使用橘猫语录
   */
  const fetchRandomQuote = async () => {
    setLoading(true)
    setError(null)
    
    // 50% 概率使用橘猫语录
    if (Math.random() > 0.5) {
      setTimeout(() => {
        const catQuote = catQuotes[Math.floor(Math.random() * catQuotes.length)]
        setQuote({ content: catQuote.text, author: catQuote.author })
        setLoading(false)
      }, 500)
      return
    }
    
    try {
      const response = await fetch('https://api.quotable.io/random')
      if (!response.ok) {
        throw new Error('获取名言失败')
      }
      const data = await response.json()
      setQuote(data)
    } catch (err) {
      // 失败时使用橘猫语录
      const catQuote = catQuotes[Math.floor(Math.random() * catQuotes.length)]
      setQuote({ content: catQuote.text, author: catQuote.author })
    } finally {
      setLoading(false)
    }
  }

  // 根据分类筛选文章
  const filteredArticles = selectedCategory === '全部' 
    ? articles 
    : articles.filter(article => article.category === selectedCategory)

  // 获取问候语
  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 6) return '🌙 夜深了，记得早点休息哦~'
    if (hour < 9) return '🌅 早安！新的一天开始啦~'
    if (hour < 12) return '☀️ 上午好！元气满满地工作吧~'
    if (hour < 14) return '🍴 中午好！记得吃午饭哦~'
    if (hour < 18) return '🌤️ 下午好！继续加油鸭~'
    if (hour < 22) return '🌆 晚上好！今天辛苦啦~'
    return '🌃 夜深了，早点休息吧~'
  }

  return (
    <div className="container">
      {/* 页面标题 - 橘猫主题 */}
      <header className="page-header home-header">
        <div className="cat-mood-indicator">
          <span className="cat-mood">{catMood}</span>
          <span className="mood-text">橘猫心情</span>
        </div>
        <h1>🐱 橘猫的小窝 🧡</h1>
        <p className="greeting">{getGreeting()}</p>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-icon">👥</span>
            <span className="stat-value">{visitorCount.toLocaleString()}</span>
            <span className="stat-label">访客</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">📝</span>
            <span className="stat-value">{articles.length}</span>
            <span className="stat-label">文章</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">🕰️</span>
            <span className="stat-value">{currentTime.toLocaleTimeString('zh-CN')}</span>
            <span className="stat-label">当前时间</span>
          </div>
        </div>
      </header>

      {/* 快速导航区 */}
      <section className="quick-nav-section">
        <div className="quick-nav-grid">
          <a href="#articles" className="quick-nav-card">
            <span className="nav-icon">☕</span>
            <h3>Java核心</h3>
            <p>JDK新特性、JVM原理</p>
          </a>
          <a href="#articles" className="quick-nav-card">
            <span className="nav-icon">🌱</span>
            <h3>Spring生态</h3>
            <p>Spring Boot、Cloud、Security</p>
          </a>
          <a href="#articles" className="quick-nav-card">
            <span className="nav-icon">🚀</span>
            <h3>微服务架构</h3>
            <p>分布式系统设计</p>
          </a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="quick-nav-card">
            <span className="nav-icon">💻</span>
            <h3>开源项目</h3>
            <p>GitHub代码仓库</p>
          </a>
        </div>
      </section>

      {/* 随机名言区域 - 橘猫的智慧 */}
      <section className="quote-section" id="quote">
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
      <section className="articles-section" id="articles">
        <div className="section-header">
          <h2>☕ Java技术文章精选</h2>
          <div className="category-tabs">
            {categories.map(category => (
              <button
                key={category}
                className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        
        {/* 加载状态 */}
        {articlesLoading && (
          <div className="loading-message">
            🐱 正在加载文章列表...
          </div>
        )}
        
        {/* 错误提示 */}
        {articlesError && (
          <div className="error-message">
            ❌ {articlesError}
            <button onClick={fetchArticles} className="retry-button">
              🔄 重试
            </button>
          </div>
        )}
        
        {/* 文章列表 */}
        {!articlesLoading && !articlesError && (
          <div className="articles-grid">
            {filteredArticles.length > 0 ? (
              filteredArticles.map(article => (
                <Link 
                  to={`/article/${article.id}`} 
                  key={article.id}
                  className="article-card enhanced"
                >
                  <div className="article-category">{article.category}</div>
                  <h3>{article.title}</h3>
                  <p className="article-description">{article.description}</p>
                  <div className="article-meta">
                    <span className="article-date">📅 {article.date}</span>
                    <span className="article-read-time">🕒 {article.readTime}</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="empty-message">
                📝 暂无文章，快去添加一篇吧！
              </div>
            )}
          </div>
        )}
      </section>

      {/* Java学习路线 */}
      <section className="cat-tips-section">
        <h2>🎓 Java学习路线推荐</h2>
        <div className="tips-carousel">
          <div className="tip-card active">
            <span className="tip-icon">📚</span>
            <h3>基础阶段</h3>
            <p>Java基础语法、面向对象、集合框架、IO流、多线程</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">🔥</span>
            <h3>进阶阶段</h3>
            <p>JVM原理、并发编程、设计模式、Spring全家桶</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">🏆</span>
            <h3>高级阶段</h3>
            <p>分布式系统、微服务架构、性能调优、源码分析</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
