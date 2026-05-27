import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useArticlesData } from '../hooks'
import { filterArticles, getArticleCategories, sortArticles } from '../utils/articleFilters'
import { getArchiveGroups, getBlogStats, getCategorySummaries, getTagCloud } from '../utils/blogInsights'

function Archive() {
  const { articles, loading, error, fetchArticles } = useArticlesData()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [selectedTag, setSelectedTag] = useState('')
  const [sortOrder, setSortOrder] = useState('desc')

  const categories = useMemo(() => getArticleCategories(articles), [articles])
  const tags = useMemo(() => getTagCloud(articles), [articles])
  const stats = useMemo(() => getBlogStats(articles), [articles])
  const categorySummaries = useMemo(() => getCategorySummaries(articles), [articles])

  const filteredArticles = useMemo(() => {
    const filtered = filterArticles(articles, {
      searchQuery,
      selectedCategory,
      selectedTags: selectedTag ? [selectedTag] : [],
      includeContent: true,
    })

    return sortArticles(filtered, 'date', sortOrder)
  }, [articles, searchQuery, selectedCategory, selectedTag, sortOrder])

  const archiveGroups = useMemo(() => getArchiveGroups(filteredArticles), [filteredArticles])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('全部')
    setSelectedTag('')
    setSortOrder('desc')
  }

  return (
    <div className="container pb-12 space-y-8">
      <section className="glass rounded-2xl p-6 md:p-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px] items-end">
          <div>
            <div className="text-sm font-bold text-primary mb-3">Archive</div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-text-color mb-4">文章归档</h1>
            <p className="text-text-secondary leading-relaxed max-w-2xl">
              把所有文章按时间、分类和标签串起来。想找旧坑位、技术判断或某个主题的连续记录，从这里最快。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/70 p-4 border border-border-color">
              <div className="text-2xl font-extrabold text-primary">{stats.articleCount}</div>
              <div className="text-xs text-text-secondary">文章</div>
            </div>
            <div className="rounded-xl bg-white/70 p-4 border border-border-color">
              <div className="text-2xl font-extrabold text-primary">{stats.categoryCount}</div>
              <div className="text-xs text-text-secondary">分类</div>
            </div>
            <div className="rounded-xl bg-white/70 p-4 border border-border-color">
              <div className="text-2xl font-extrabold text-primary">{stats.tagCount}</div>
              <div className="text-xs text-text-secondary">标签</div>
            </div>
            <div className="rounded-xl bg-white/70 p-4 border border-border-color">
              <div className="text-2xl font-extrabold text-primary">{stats.totalReadMinutes}</div>
              <div className="text-xs text-text-secondary">分钟</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="glass rounded-2xl p-4 space-y-4 sticky top-[80px] z-30">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="搜索标题、正文、描述或标签..."
                className="w-full px-4 py-3 rounded-xl border border-border-color bg-white/80 outline-none focus:border-primary"
              />
              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                className="px-4 py-3 rounded-xl border border-border-color bg-white/80 text-text-color outline-none focus:border-primary"
              >
                <option value="desc">最新优先</option>
                <option value="asc">最早优先</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    selectedCategory === category
                      ? 'bg-primary text-white'
                      : 'bg-white/70 text-text-secondary hover:text-primary'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {(searchQuery || selectedCategory !== '全部' || selectedTag) && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border-color/60 text-sm text-text-secondary">
                <span>当前筛选到 {filteredArticles.length} 篇文章</span>
                <button onClick={clearFilters} className="font-bold text-primary hover:text-primary-hover">
                  清除筛选
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="glass rounded-2xl p-10 text-center text-text-secondary">正在整理归档...</div>
          ) : error ? (
            <div className="glass rounded-2xl p-10 text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <button onClick={fetchArticles} className="btn btn-primary">重试</button>
            </div>
          ) : archiveGroups.length > 0 ? (
            <div className="space-y-8">
              {archiveGroups.map(group => (
                <section key={group.year} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-extrabold text-text-color">{group.year}</h2>
                    <span className="text-sm text-text-secondary">{group.items.length} 篇</span>
                    <div className="h-px flex-1 bg-border-color/70" />
                  </div>
                  <div className="space-y-3">
                    {group.items.map(article => (
                      <Link key={article.id} to={`/article/${article.id}`} className="card card-hover block">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="flex flex-wrap gap-2 text-xs text-text-light mb-2">
                              <span>{article.date}</span>
                              <span>{article.category}</span>
                              <span>{article.readTime} 分钟</span>
                            </div>
                            <h3 className="text-lg font-extrabold text-text-color group-hover:text-primary">
                              {article.title}
                            </h3>
                            <p className="text-sm text-text-secondary mt-2 line-clamp-2">{article.description}</p>
                          </div>
                          <span className="text-primary font-bold shrink-0">阅读 →</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="glass rounded-2xl p-10 text-center">
              <p className="text-text-secondary mb-4">没有找到匹配的文章。</p>
              <button onClick={clearFilters} className="btn btn-secondary">清除筛选</button>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-extrabold text-text-color mb-4">热门标签</h2>
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 18).map(item => (
                <button
                  key={item.tag}
                  onClick={() => setSelectedTag(item.tag === selectedTag ? '' : item.tag)}
                  className={`rounded-full px-3 py-1.5 text-sm font-bold transition-all ${
                    selectedTag === item.tag
                      ? 'bg-primary text-white'
                      : 'bg-white/70 text-text-secondary hover:text-primary'
                  }`}
                >
                  #{item.tag} {item.count}
                </button>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-extrabold text-text-color mb-4">分类概览</h2>
            <div className="space-y-3">
              {categorySummaries.map(item => (
                <button
                  key={item.category}
                  onClick={() => setSelectedCategory(item.category)}
                  className="w-full rounded-xl bg-white/70 p-3 text-left hover:bg-card-hover transition-colors"
                >
                  <div className="flex justify-between gap-3 font-bold text-text-color">
                    <span>{item.category}</span>
                    <span className="text-primary">{item.count}</span>
                  </div>
                  <div className="text-xs text-text-light mt-1">
                    最近更新 {item.latestDate}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  )
}

export default Archive
