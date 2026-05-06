import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Pagination from '../components/Pagination'
import HomeHero from '../components/home/HomeHero'
import HomeQuoteCard from '../components/home/HomeQuoteCard'
import HomeStatsCard from '../components/home/HomeStatsCard'
import { HOME_PAGE_SIZE, WEB_TEMPLATES } from '../constants/home'
import { useArticlesData, useBackToTop, useGoogleCSE } from '../hooks'
import { filterArticles, getArticleCategories, paginateArticles } from '../utils/articleFilters'

/**
 * 首页组件
 * 展示文章列表和随机名言功能
 */
function Home() {
  const {
    articles,
    loading: articlesLoading,
    error: articlesError,
    fetchArticles,
  } = useArticlesData()

  const [selectedCategory, setSelectedCategory] = useState('全部')
  const showBackToTop = useBackToTop(400)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useGoogleCSE()

  // 动态生成文章分类 - 只显示有文章的分类
  const categories = useMemo(() => {
    return getArticleCategories(articles)
  }, [articles])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filteredArticles = useMemo(() => {
    return filterArticles(articles, { searchQuery, selectedCategory })
  }, [articles, searchQuery, selectedCategory])

  // 分页后的文章
  const paginatedArticles = useMemo(() => {
    return paginateArticles(filteredArticles, currentPage, HOME_PAGE_SIZE)
  }, [filteredArticles, currentPage])

  const totalPages = Math.ceil(filteredArticles.length / HOME_PAGE_SIZE)

  // 重置分页
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory])

  return (
    <div className="container pb-12">
      <HomeHero />

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
              {WEB_TEMPLATES.map(template => (
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
           <HomeQuoteCard />

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

           <HomeStatsCard articleCount={articles.length} />
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
