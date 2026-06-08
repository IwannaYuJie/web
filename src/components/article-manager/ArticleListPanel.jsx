import { Link } from 'react-router-dom'

function ArticleListPanel({
  loading,
  error,
  fetchArticles,
  filteredArticles,
  searchQuery,
  setSearchQuery,
  handleEdit,
  handleDelete,
  handleAddNew,
  totalArticles,
}) {
  return (
    <>
      <div className="relative max-w-md">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light pointer-events-none">
          🔍
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜一搜标题、描述或分类..."
          className="w-full pl-11 pr-10 py-3 rounded-xl border border-border-color bg-white/70 focus:bg-white focus:border-primary focus:shadow-md outline-none transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text-color transition-colors p-1"
            title="清空搜索"
          >
            ✕
          </button>
        )}
      </div>
      {searchQuery && (
        <p className="text-sm text-text-secondary mt-2">
          找到 <span className="font-bold text-primary">{filteredArticles.length}</span> 篇相关文章
        </p>
      )}

      {loading && (
        <div className="glass p-12 rounded-2xl text-center animate-pulse">
          <div className="text-4xl mb-4">🐱</div>
          <p className="text-text-secondary">文章加载中...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-2xl text-center text-red-600 mb-8">
          <p>❌ {error}</p>
          <button onClick={fetchArticles} className="text-sm underline mt-2 hover:text-red-800">重试</button>
        </div>
      )}

      {!loading && !error && (
        <div className="glass rounded-2xl overflow-hidden shadow-sm animate-slide-up">
          {filteredArticles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-primary/5 border-b border-border-color text-text-secondary text-sm uppercase tracking-wider">
                    <th className="p-4 font-bold w-16">ID</th>
                    <th className="p-4 font-bold">文章标题</th>
                    <th className="p-4 font-bold">分类 / 标签</th>
                    <th className="p-4 font-bold w-32">发布日期</th>
                    <th className="p-4 font-bold w-40 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color/50">
                  {filteredArticles.map((article) => (
                    <tr key={article.id} className="hover:bg-white/40 transition-colors group">
                      <td className="p-4 text-text-light font-mono text-sm">#{article.id}</td>
                      <td className="p-4">
                        <div className="font-bold text-text-color mb-1">{article.title}</div>
                        <div className="text-xs text-text-light truncate max-w-md">{article.description}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-lg text-xs bg-white border border-border-color text-text-secondary whitespace-nowrap">
                          {article.category}
                        </span>
                        {article.tags && article.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {article.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="text-xs text-primary">#{tag}</span>
                            ))}
                            {article.tags.length > 3 && (
                              <span className="text-xs text-text-light">+{article.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-sm text-text-secondary whitespace-nowrap">
                        {article.date}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          <Link
                            to={`/article/${article.id}`}
                            target="_blank"
                            className="p-2 hover:bg-blue-100 text-blue-500 rounded-lg transition-colors"
                            title="预览"
                          >
                            👁️
                          </Link>
                          <button
                            onClick={() => handleEdit(article)}
                            className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                            title="编辑"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(article)}
                            className="p-2 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                            title="删除"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="text-4xl mb-4 grayscale opacity-50">📝</div>
              {searchQuery ? (
                <>
                  <p className="text-text-secondary mb-4">没有找到匹配的文章</p>
                  <button onClick={() => setSearchQuery('')} className="btn btn-secondary">
                    🔄 清除搜索
                  </button>
                </>
              ) : (
                <>
                  <p className="text-text-secondary mb-4">还没写文章呢，赶紧来一篇！</p>
                  <button onClick={handleAddNew} className="btn btn-primary">
                    ✨ 创建文章
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {!loading && !error && totalArticles > 0 && (
        <div className="mt-6 text-center text-sm text-text-secondary">
          共 <span className="font-bold text-primary">{totalArticles}</span> 篇文章
          {searchQuery && ` · 当前显示 ${filteredArticles.length} 篇`}
        </div>
      )}
    </>
  )
}

export default ArticleListPanel
