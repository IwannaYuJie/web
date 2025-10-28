import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

/**
 * 首页组件
 * 展示文章列表和随机名言功能
 */
function Home() {
  // Java技术文章数据
  const articles = [
    {
      id: 1,
      title: '☕ Spring Boot 3.0 新特性深度解析',
      description: '探索Spring Boot最新版本的革命性改进，包括GraalVM原生镜像支持、观测性增强等核心特性',
      date: '2025-01-27',
      category: 'Spring框架',
      readTime: '15 分钟'
    },
    {
      id: 2,
      title: '🔥 Java 21虚拟线程实战指南',
      description: '深入理解Project Loom带来的虚拟线程，如何在高并发场景下提升应用性能',
      date: '2025-01-25',
      category: 'Java核心',
      readTime: '20 分钟'
    },
    {
      id: 3,
      title: '🚀 微服务架构：Spring Cloud Gateway网关设计',
      description: '构建高性能API网关，实现统一认证、限流、熔断等企业级功能',
      date: '2025-01-23',
      category: '微服务',
      readTime: '18 分钟'
    },
    {
      id: 4,
      title: '💾 MySQL索引优化实战技巧',
      description: '从B+树原理到实际案例，全面掌握MySQL索引优化策略，提升查询性能10倍',
      date: '2025-01-20',
      category: '数据库',
      readTime: '25 分钟'
    },
    {
      id: 5,
      title: '🛡️ Spring Security 6.0 JWT认证完整实现',
      description: '构建安全的RESTful API，实现基于JWT的无状态认证授权机制',
      date: '2025-01-18',
      category: 'Spring框架',
      readTime: '22 分钟'
    },
    {
      id: 6,
      title: '📊 JVM调优实战：从理论到实践',
      description: '深入JVM内存模型，掌握GC调优技巧，解决生产环境性能问题',
      date: '2025-01-15',
      category: 'JVM',
      readTime: '30 分钟'
    },
    {
      id: 7,
      title: '🔄 Redis分布式锁的正确实现方式',
      description: '避免常见陷阱，使用Redisson实现高可用的分布式锁解决方案',
      date: '2025-01-12',
      category: '中间件',
      readTime: '16 分钟'
    },
    {
      id: 8,
      title: '📦 Docker容器化Spring Boot应用最佳实践',
      description: '从Dockerfile编写到K8s部署，打造云原生Java应用',
      date: '2025-01-10',
      category: '云原生',
      readTime: '20 分钟'
    },
    {
      id: 9,
      title: '⚡ RabbitMQ消息队列高级特性详解',
      description: '死信队列、延迟队列、消息确认机制等企业级应用场景实战',
      date: '2025-01-08',
      category: '中间件',
      readTime: '24 分钟'
    },
    {
      id: 10,
      title: '🏗️ DDD领域驱动设计在Java项目中的落地',
      description: '从战略设计到战术设计，构建高内聚低耦合的业务系统',
      date: '2025-01-05',
      category: '架构设计',
      readTime: '35 分钟'
    },
    {
      id: 11,
      title: '🔍 Elasticsearch全文搜索引擎实战',
      description: '构建高性能搜索系统，实现分词、高亮、聚合分析等功能',
      date: '2025-01-03',
      category: '搜索引擎',
      readTime: '28 分钟'
    },
    {
      id: 12,
      title: '🎯 MyBatis-Plus高级用法与性能优化',
      description: '动态SQL、分页插件、乐观锁等特性深度应用，提升开发效率',
      date: '2025-01-01',
      category: '持久层',
      readTime: '18 分钟'
    }
  ]

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
        <div className="articles-grid">
          {filteredArticles.map(article => (
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
          ))}
        </div>
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
