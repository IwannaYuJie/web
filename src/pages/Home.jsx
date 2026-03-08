import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Pagination from '../components/Pagination'

// 橘猫心情数组 - 移到组件外部避免重复创建
const CAT_MOODS = ['😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾']
const PAGE_SIZE = 6

/**
 * 首页组件
 * 展示文章列表和随机名言功能
 */
function Home() {
  // 状态管理
  const [articles, setArticles] = useState([])
  const [articlesLoading, setArticlesLoading] = useState(true)
  const [articlesError, setArticlesError] = useState(null)

  const [quote, setQuote] = useState(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [visitorCount, setVisitorCount] = useState(12345)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [catMood, setCatMood] = useState(CAT_MOODS[0])

  // 动态生成文章分类 - 只显示有文章的分类
  const categories = useMemo(() => {
    if (!articles.length) {
      return ['全部']
    }
    const categorySet = new Set()
    articles.forEach(article => {
      if (article.category) {
        categorySet.add(article.category)
      }
    })
    return ['全部', ...Array.from(categorySet).sort()]
  }, [articles])

  // 动态生成文章标签 - 只显示有文章使用的标签
  const _availableTags = useMemo(() => {
    if (!articles.length) {
      return []
    }
    const tagSet = new Set()
    articles.forEach(article => {
      if (article.tags && Array.isArray(article.tags)) {
        article.tags.forEach(tag => tagSet.add(tag))
      }
    })
    return Array.from(tagSet).sort()
  }, [articles])

  // 编程智慧语录
  const catQuotes = [
    { text: '代码如诗，简洁优雅才是最高境界', author: 'Martin Fowler' },
    { text: '过早的优化是万恶之源', author: 'Donald Knuth' },
    { text: '任何傻瓜都能写出计算机能理解的代码，但只有好的程序员才能写出人类能理解的代码', author: 'Kent Beck' },
    { text: '简单是可靠的先决条件', author: 'Edsger W. Dijkstra' },
    { text: '完成比完美更重要', author: 'Facebook工程师文化' }
  ]

  // 网页模板数据
  const webTemplates = [
    { id: 1, title: '极简博客', desc: '专注于阅读体验的纯净博客模板', icon: '📝', link: '#' },
    { id: 2, title: '创意作品集', desc: '适合设计师的视觉系展示模板', icon: '🎨', link: '#' },
    { id: 3, title: '文档中心', desc: '清晰的文档与知识库管理模板', icon: '📚', link: '#' },
    { id: 4, title: '营销落地页', desc: '高转化率的产品推广落地页', icon: '🚀', link: '#' }
  ]

  // 初始化数据
  useEffect(() => {
    fetchArticles()
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    const moodTimer = setInterval(() => setCatMood(CAT_MOODS[Math.floor(Math.random() * CAT_MOODS.length)]), 3000)
    const countTimer = setInterval(() => setVisitorCount(prev => prev + Math.floor(Math.random() * 3)), 5000)

    const handleScroll = () => setShowBackToTop(window.scrollY > 400)
    window.addEventListener('scroll', handleScroll)

    // 修复 Google CSE 在 React 路由切换后不重新渲染的问题
    const initGCSE = () => {
      if (window.google && window.google.search && window.google.search.cse && window.google.search.cse.element) {
        try {
          window.google.search.cse.element.go();
        } catch (e) {
          console.warn('GCSE init error:', e);
        }
      }
    };
    // 延迟执行以确保 DOM 已挂载
    const gcseTimer = setTimeout(initGCSE, 100);
    // 轮询几次以确保脚本加载完成
    const gcseInterval = setInterval(initGCSE, 1000);
    const gcseStopTimer = setTimeout(() => clearInterval(gcseInterval), 5000);

    return () => {
      clearInterval(timer)
      clearInterval(moodTimer)
      clearInterval(countTimer)
      clearInterval(gcseInterval)
      clearTimeout(gcseStopTimer)
      clearTimeout(gcseTimer)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const fetchArticles = async () => {
    setArticlesLoading(true)
    try {
      const response = await fetch('/api/articles')
      if (!response.ok) {throw new Error('获取文章列表失败')}
      const data = await response.json()
      setArticles(data)
    } catch (err) {
      setArticlesError(err.message)
    } finally {
      setArticlesLoading(false)
    }
  }

  const fetchRandomQuote = async () => {
    setQuoteLoading(true)
    // 50% 概率使用橘猫语录
    if (Math.random() > 0.5) {
      setTimeout(() => {
        const catQuote = catQuotes[Math.floor(Math.random() * catQuotes.length)]
        setQuote({ content: catQuote.text, author: catQuote.author })
        setQuoteLoading(false)
      }, 500)
    } else {
      try {
        const response = await fetch('https://api.quotable.io/random')
        if (!response.ok) {throw new Error('Failed')}
        const data = await response.json()
        setQuote(data)
      } catch {
        const catQuote = catQuotes[Math.floor(Math.random() * catQuotes.length)]
        setQuote({ content: catQuote.text, author: catQuote.author })
      } finally {
        setQuoteLoading(false)
      }
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 6) {return '🌙 夜深了，记得早点休息哦~'}
    if (hour < 9) {return '🌅 早安！新的一天开始啦~'}
    if (hour < 12) {return '☀️ 上午好！元气满满地工作吧~'}
    if (hour < 14) {return '🍴 中午好！记得吃午饭哦~'}
    if (hour < 18) {return '🌤️ 下午好！继续加油鸭~'}
    if (hour < 22) {return '🌆 晚上好！今天辛苦啦~'}
    return '🌃 夜深了，早点休息吧~'
  }

  const filteredArticles = useMemo(() => {
    let result = articles

    // 搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(article =>
        article.title?.toLowerCase().includes(query) ||
        article.description?.toLowerCase().includes(query) ||
        article.category?.toLowerCase().includes(query) ||
        (article.tags && article.tags.some(t => t.toLowerCase().includes(query)))
      )
    }

    // 分类过滤
    if (selectedCategory !== '全部') {
      result = result.filter(a => a.category === selectedCategory)
    }

    return result
  }, [articles, searchQuery, selectedCategory])

  // 分页后的文章
  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredArticles.slice(start, start + PAGE_SIZE)
  }, [filteredArticles, currentPage])

  const totalPages = Math.ceil(filteredArticles.length / PAGE_SIZE)

  // 重置分页
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory])

  return (
    <div className="container pb-12">
      {/* Hero Section */}
      <section className="glass rounded-[32px] p-8 md:p-12 mb-12 flex flex-col md:flex-row items-center justify-between gap-8 animate-fade-in relative overflow-hidden">
        <div className="relative z-10 text-center md:text-left max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/50 px-4 py-1 rounded-full mb-4 text-primary font-bold text-sm backdrop-blur-sm">
            <span>{catMood}</span>
            <span>{getGreeting()}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-gradient leading-tight">
            橘猫的技术小窝
          </h1>
          <p className="text-lg text-text-secondary mb-8 leading-relaxed">
            这里是 Java 技术分享的温馨角落，记录学习，分享感悟。
            <br />让我们一起在代码的世界里，保持好奇，持续探索。
          </p>
          <div className="flex gap-4 justify-center md:justify-start">
            <a href="#articles" className="btn btn-primary">
              📚 开始阅读
            </a>
            <a href="https://github.com/IwannaYuJie" target="_blank" rel="noreferrer" className="btn btn-secondary">
              💻 GitHub
            </a>
          </div>
        </div>

        <div className="relative z-10 animate-bounce">
           <img src="/images/cat-avatar.png" alt="橘猫" className="w-48 h-48 md:w-64 md:h-64 rounded-full shadow-lg border-4 border-white/50 object-cover" />
        </div>

        {/* 装饰背景 */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
      </section>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Content (Articles) - 8/12 */}
        <div className="lg:col-span-8 space-y-8">

          {/* Web Templates Module */}
          <div className="glass p-6 rounded-2xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-primary">
              <span>🎨</span> 精选网页模板
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {webTemplates.map(template => (
                <a
                  key={template.id}
                  href={template.link}
                  className="group p-4 rounded-xl bg-white/50 hover:bg-white transition-all border border-transparent hover:border-primary/30 hover:shadow-md flex items-start gap-4"
                >
                  <div className="text-3xl bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    {template.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{template.title}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{template.desc}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Search and Filter */}
          <div id="articles" className="glass p-4 rounded-2xl sticky top-[80px] z-30 shadow-sm space-y-4">
            {/* 搜索框 */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light pointer-events-none">
                🔍
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索文章标题、描述或标签..."
                className="w-full pl-11 pr-10 py-2.5 rounded-xl border border-border-color bg-white/70 focus:bg-white focus:border-primary outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text-color transition-colors p-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* 分类标签 - 只有多个分类时才显示 */}
            {categories.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === category
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-transparent text-text-secondary hover:bg-primary/10 hover:text-primary'
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}

            {/* 搜索结果统计 */}
            {(searchQuery || selectedCategory !== '全部') && (
              <div className="text-sm text-text-secondary pt-2 border-t border-border-color/50">
                找到 <span className="font-bold text-primary">{filteredArticles.length}</span> 篇文章
                {searchQuery && <span className="ml-2">· 搜索: &quot;{searchQuery}&quot;</span>}
                {selectedCategory !== '全部' && <span className="ml-2">· 分类: {selectedCategory}</span>}
              </div>
            )}
          </div>

          {/* Articles List */}
          <div className="space-y-6">
            {articlesLoading ? (
              <div className="glass p-12 rounded-2xl text-center">
                <div className="text-4xl mb-4 animate-bounce">🐱</div>
                <p className="text-text-secondary">正在努力加载文章...</p>
              </div>
            ) : articlesError ? (
              <div className="glass p-12 rounded-2xl text-center border-red-200 border">
                <div className="text-4xl mb-4">😿</div>
                <p className="text-red-500 mb-4">{articlesError}</p>
                <button onClick={fetchArticles} className="btn btn-primary">🔄 重试</button>
              </div>
            ) : paginatedArticles.length > 0 ? (
              <>
                <div className="grid gap-6">
                  {paginatedArticles.map((article, idx) => (
                    <Link
                      to={`/article/${article.id}`}
                      key={article.id}
                      className="card card-hover group block animate-slide-up"
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="bg-secondary/20 text-primary px-3 py-1 rounded-full text-xs font-bold">
                              {article.category}
                            </span>
                            <span className="text-text-light text-xs">📅 {article.date}</span>
                            {article.tags && article.tags.length > 0 && (
                              <div className="flex gap-1">
                                {article.tags.slice(0, 2).map(tag => (
                                  <span key={tag} className="text-xs text-text-light">#{tag}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                            {article.title}
                          </h3>
                          <p className="text-text-secondary line-clamp-2 mb-4">
                            {article.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-text-light">
                            <span>⏱️ {article.readTime} 分钟阅读</span>
                            <span className="group-hover:translate-x-1 transition-transform inline-block text-primary">阅读全文 →</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* 分页 */}
                {totalPages > 1 && (
                  <div className="glass p-4 rounded-2xl">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalCount={filteredArticles.length}
                      onPageChange={(page) => {
                        setCurrentPage(page)
                        document.getElementById('articles')?.scrollIntoView({ behavior: 'smooth' })
                      }}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="glass p-12 rounded-2xl text-center">
                <div className="text-4xl mb-4">🍃</div>
                <p className="text-text-secondary mb-4">
                  {searchQuery ? `没有找到包含 "${searchQuery}" 的文章` : '该分类下暂无文章，去看看别的吧~'}
                </p>
                {(searchQuery || selectedCategory !== '全部') && (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setSelectedCategory('全部')
                    }}
                    className="btn btn-secondary"
                  >
                    🔄 清除筛选
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - 4/12 */}
        <aside className="lg:col-span-4 space-y-8">
           {/* Quote Card */}
           <div className="glass p-6 rounded-2xl relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-9xl text-primary/5 opacity-20 select-none">”</div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>🐾</span> 每日智慧
              </h2>
              <div className="mb-6 min-h-[100px] flex flex-col justify-center">
                {quote ? (
                  <blockquote className="italic text-text-secondary">
                    &ldquo;{quote.content}&rdquo;
                    <footer className="text-right mt-2 text-sm font-bold not-italic text-primary">— {quote.author}</footer>
                  </blockquote>
                ) : (
                  <div className="text-center text-text-light text-sm">点击下方按钮获取灵感...</div>
                )}
              </div>
              <button
                onClick={fetchRandomQuote}
                disabled={quoteLoading}
                className="w-full btn btn-secondary justify-center"
              >
                {quoteLoading ? '🤔 思考中...' : '🎲 获取灵感'}
              </button>
           </div>

           {/* Tools Card */}
           <div className="glass p-6 rounded-2xl">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>🧰</span> 实用工具箱
              </h2>
              <p className="text-sm text-text-secondary mb-4">
                这里有一些好用的小工具，比如精灵图转GIF等。
              </p>
              <Link to="/toolbox" className="w-full btn btn-primary justify-center text-center block">
                🚀 进入工具箱
              </Link>
           </div>

           {/* Search Card */}
           <div className="glass p-6 rounded-2xl">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>🔍</span> 搜索
              </h2>
              <div className="gcse-search-wrapper min-h-[60px] relative z-0">
                <div className="gcse-search"></div>
              </div>
              <p className="text-xs text-text-light mt-2 text-center">Powered by Google</p>
           </div>

           {/* Stats Card */}
           <div className="glass p-6 rounded-2xl">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                 <span>📊</span> 站点统计
              </h2>
              <div className="space-y-3">
                 <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                    <span className="text-text-secondary">👥 总访问量</span>
                    <span className="font-bold text-primary">{visitorCount.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                    <span className="text-text-secondary">📝 文章总数</span>
                    <span className="font-bold text-primary">{articles.length}</span>
                 </div>
              </div>
           </div>
        </aside>
      </div>

      {/* Back to Top */}
      <button
        className={`fixed bottom-8 right-8 z-40 p-4 rounded-full bg-primary text-white shadow-lg transition-all transform hover:scale-110 ${showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
        onClick={scrollToTop}
        aria-label="返回顶部"
      >
        ⬆️
      </button>
    </div>
  )
}

export default Home

