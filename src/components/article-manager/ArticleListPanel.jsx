import { Link } from 'react-router-dom'
import { categoryTone } from '../../utils/xianText'

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
      <div className="xadmin-search">
        <label className="field-line">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜篇名、描述或门类…"
            aria-label="搜索文章"
          />
        </label>
        <span className="elegant">
          {searchQuery ? `检得 ${filteredArticles.length} 篇 / 共 ${totalArticles} 篇` : `共 ${totalArticles} 篇`}
        </span>
      </div>

      {loading && <div className="state"><div className="loading-bar" />正在翻检藏卷…</div>}

      {error && (
        <div className="state">
          <div className="state-mark">迷</div>
          <p>{error}</p>
          <button type="button" onClick={fetchArticles} className="btn" style={{ marginTop: 20 }}>再试一次</button>
        </div>
      )}

      {!loading && !error && (
        filteredArticles.length > 0 ? (
          <div className="xadmin-table-wrap">
            <table className="xadmin-table">
              <thead>
                <tr>
                  <th className="id">序</th>
                  <th>篇名</th>
                  <th>门类 / 签引</th>
                  <th className="date">日期</th>
                  <th className="ops">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredArticles.map((article) => (
                  <tr key={article.id}>
                    <td className="id latin">{article.id}</td>
                    <td>
                      <div className="title">{article.title}</div>
                      <div className="desc">{article.description}</div>
                    </td>
                    <td>
                      <span className="cat-label" style={{ '--tone': categoryTone(article.category) }}>
                        <span className="tone-dot" />{article.category}
                      </span>
                      {article.tags?.length > 0 && (
                        <div className="tags">
                          {article.tags.slice(0, 3).join(' · ')}
                          {article.tags.length > 3 && ` +${article.tags.length - 3}`}
                        </div>
                      )}
                    </td>
                    <td className="date latin">{article.date}</td>
                    <td className="ops">
                      <Link to={`/article/${article.id}`} target="_blank">观</Link>
                      <button type="button" onClick={() => handleEdit(article)}>修</button>
                      <button type="button" className="danger" onClick={() => handleDelete(article)}>删</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="state">
            <div className="state-mark">空</div>
            {searchQuery ? (
              <>
                <p>未见相符的文章</p>
                <button type="button" onClick={() => setSearchQuery('')} className="btn ghost" style={{ marginTop: 20 }}>拂去搜索</button>
              </>
            ) : (
              <>
                <p>藏经阁尚空，落下第一笔吧。</p>
                <button type="button" onClick={handleAddNew} className="btn" style={{ marginTop: 20 }}>新撰一篇</button>
              </>
            )}
          </div>
        )
      )}
    </>
  )
}

export default ArticleListPanel
