import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useArticlesData } from '../hooks'
import { filterArticles, getArticleCategories } from '../utils/articleFilters'
import { getCategorySummaries, getTagCloud } from '../utils/blogInsights'

function Tags() {
  const { articles, loading, error, fetchArticles } = useArticlesData()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedCategory, setSelectedCategory] = useState('全部')

  const selectedTag = searchParams.get('tag') || ''
  const tags = useMemo(() => getTagCloud(articles), [articles])
  const categories = useMemo(() => getArticleCategories(articles), [articles])
  const categorySummaries = useMemo(() => getCategorySummaries(articles), [articles])

  const filteredArticles = useMemo(() => {
    return filterArticles(articles, {
      selectedCategory,
      selectedTags: selectedTag ? [selectedTag] : [],
    })
  }, [articles, selectedCategory, selectedTag])

  const selectTag = (tag) => {
    if (tag === selectedTag) {
      setSearchParams({})
      return
    }

    setSearchParams({ tag })
  }

  return (
    <div className="container pb-12 space-y-8">
      <section className="glass rounded-2xl p-6 md:p-8">
        <div className="text-sm font-bold text-primary mb-3">Tags</div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-text-color mb-4">标签与主题</h1>
        <p className="text-text-secondary leading-relaxed max-w-3xl">
          这里按关键词重新组织文章。技术栈、问题类型、模型名称和实践场景都会沉到标签里，方便以后串联阅读。
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-xl font-extrabold text-text-color mb-4">标签云</h2>
            {loading ? (
              <div className="text-text-secondary">正在读取标签...</div>
            ) : error ? (
              <div>
                <p className="text-red-500 mb-4">{error}</p>
                <button onClick={fetchArticles} className="btn btn-primary">重试</button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {tags.map(item => (
                  <button
                    key={item.tag}
                    onClick={() => selectTag(item.tag)}
                    className={`rounded-full border px-4 py-2 font-bold transition-all ${
                      selectedTag === item.tag
                        ? 'border-primary bg-primary text-white'
                        : 'border-border-color bg-white/70 text-text-secondary hover:text-primary'
                    }`}
                    style={{ fontSize: `${Math.min(1.25, 0.9 + item.count * 0.08)}rem` }}
                  >
                    #{item.tag}
                    <span className="ml-2 text-xs opacity-80">{item.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <h2 className="text-xl font-extrabold text-text-color">
                {selectedTag ? `#${selectedTag}` : selectedCategory === '全部' ? '全部文章' : selectedCategory}
              </h2>
              {(selectedTag || selectedCategory !== '全部') && (
                <button
                  onClick={() => {
                    setSelectedCategory('全部')
                    setSearchParams({})
                  }}
                  className="text-sm font-bold text-primary hover:text-primary-hover"
                >
                  清除筛选
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full px-3 py-1.5 text-sm font-bold transition-all ${
                    selectedCategory === category
                      ? 'bg-primary text-white'
                      : 'bg-white/70 text-text-secondary hover:text-primary'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredArticles.map(article => (
                <Link key={article.id} to={`/article/${article.id}`} className="card card-hover block">
                  <div className="flex flex-wrap gap-2 text-xs text-text-light mb-2">
                    <span>{article.date}</span>
                    <span>{article.category}</span>
                    <span>{article.readTime} 分钟</span>
                  </div>
                  <h3 className="font-extrabold text-lg text-text-color">{article.title}</h3>
                  <p className="text-sm text-text-secondary mt-2 line-clamp-2">{article.description}</p>
                </Link>
              ))}
              {!loading && filteredArticles.length === 0 && (
                <div className="rounded-xl bg-white/70 p-6 text-center text-text-secondary">
                  这个筛选下暂时没有文章。
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-extrabold text-text-color mb-4">分类地图</h2>
            <div className="space-y-3">
              {categorySummaries.map(item => (
                <button
                  key={item.category}
                  onClick={() => setSelectedCategory(item.category)}
                  className="w-full rounded-xl bg-white/70 p-3 text-left hover:bg-card-hover transition-colors"
                >
                  <div className="flex justify-between font-bold text-text-color">
                    <span>{item.category}</span>
                    <span className="text-primary">{item.count}</span>
                  </div>
                  <div className="mt-1 text-xs text-text-light">{item.readMinutes} 分钟阅读量</div>
                </button>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-extrabold text-text-color mb-3">阅读建议</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              先从分类选方向，再用标签缩小问题。遇到长文可以回到文章详情页的目录和相关阅读继续追。
            </p>
            <Link to="/archive" className="btn btn-primary mt-5 w-full">
              打开归档
            </Link>
          </div>
        </aside>
      </section>
    </div>
  )
}

export default Tags
