import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { clearStoredAdminKey, createArticle, deleteArticle, getStoredAdminKey, saveAdminKey, updateArticle, verifyAdminKey } from '../services/articles'
import { useArticlesData } from '../hooks'

const MarkdownRenderer = lazy(() => import('../components/MarkdownRenderer'))

function createInitialFormData() {
  return {
    title: '',
    description: '',
    category: 'Java核心',
    readTime: '',
    date: new Date().toISOString().split('T')[0],
    content: '',
    tags: [],
    author: '橘猫博主',
  }
}

/**
 * 文章管理页面
 * 提供文章的新增、编辑、删除功能
 */
function ArticleManager() {
  const {
    articles,
    loading,
    error,
    fetchArticles,
  } = useArticlesData()
  const [showForm, setShowForm] = useState(false)
  const [editingArticle, setEditingArticle] = useState(null)
  const [formData, setFormData] = useState(createInitialFormData)
  const [submitting, setSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // 权限状态
  const [adminKey, setAdminKey] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // 检查本地存储的密钥
  useEffect(() => {
    const savedKey = getStoredAdminKey()
    if (savedKey) {
      setAdminKey(savedKey)
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    const inputKey = e.target.elements.key.value

    if (!inputKey) {
      return
    }

    try {
      // 验证密码是否正确
      // Cloudflare Pages 只会将 /api/articles 精准路由到当前函数，因此通过查询参数传递 auth-check 标志
      const response = await verifyAdminKey(inputKey)

      if (response.ok) {
        setAdminKey(inputKey)
        setIsAuthenticated(true)
        saveAdminKey(inputKey)
      } else {
        // 解析错误信息
        let errorMsg = '验证失败'
        try {
          errorMsg = response.data?.error || response.data?.message || errorMsg
        } catch (e) {
          errorMsg = `HTTP ${response.status}`
        }

        if (response.status === 500) {
          alert(`服务器错误：${errorMsg}\n\n提示：如果是线上环境，请确保已在 Cloudflare 设置 ADMIN_KEY 环境变量，并【重新部署】了项目。`)
        } else if (response.status === 401) {
          alert('密码错误，请重试！')
        } else {
          alert(`验证失败：${errorMsg}`)
        }

        e.target.elements.key.value = ''
        e.target.elements.key.focus()
      }
    } catch (err) {
      console.error('验证失败:', err)
      alert('验证服务暂时不可用，请稍后重试')
    }
  }

  const handleLogout = () => {
    setAdminKey('')
    setIsAuthenticated(false)
    clearStoredAdminKey()
  }

  // 文章分类选项
  const categories = [
    'Java核心', 'Spring框架', '微服务', '数据库', 'JVM',
    '中间件', '云原生', '架构设计', '搜索引擎', '持久层'
  ]

  /**
   * 处理表单输入变化
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  /**
   * 打开新增文章表单
   */
  const handleAddNew = () => {
    setEditingArticle(null)
    setFormData(createInitialFormData())
    setTagInput('')
    setShowPreview(false)
    setShowForm(true)
  }

  /**
   * 打开编辑文章表单
   */
  const handleEdit = (article) => {
    setEditingArticle(article)
    setFormData({
      title: article.title,
      description: article.description,
      category: article.category,
      readTime: article.readTime,
      date: article.date,
      content: article.content || '',
      tags: article.tags || [],
      author: article.author || '橘猫博主'
    })
    setTagInput('')
    setShowPreview(false)
    setShowForm(true)
  }

  /**
   * 添加标签
   */
  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }))
    }
    setTagInput('')
  }

  /**
   * 删除标签
   */
  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove)
    }))
  }

  /**
   * 过滤文章列表
   */
  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) {
      return articles
    }

    const query = searchQuery.toLowerCase()
    return articles.filter(article => (
      article.title?.toLowerCase().includes(query) ||
      article.description?.toLowerCase().includes(query) ||
      article.category?.toLowerCase().includes(query)
    ))
  }, [articles, searchQuery])

  /**
   * 提交表单（新增或编辑）
   */
  const handleSubmit = async (e) => {
    e.preventDefault()

    // 表单验证
    if (!formData.title.trim() || !formData.description.trim() || !formData.readTime.trim()) {
      alert('请填写所有必填字段！')
      return
    }

    setSubmitting(true)

    try {
      try {
        if (editingArticle) {
          await updateArticle(editingArticle.id, formData, adminKey)
        } else {
          await createArticle(formData, adminKey)
        }
      } catch (err) {
        if (err.message.includes('未授权') || err.message.includes('密码错误')) {
          handleLogout()
          throw new Error('密码错误或已过期，请重新登录')
        }
        throw err
      }

      // 成功后刷新列表并关闭表单
      await fetchArticles()
      setShowForm(false)
      alert(editingArticle ? '文章更新成功！' : '文章创建成功！')
    } catch (err) {
      console.error('提交失败:', err)
      alert(`操作失败: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  /**
   * 删除文章
   */
  const handleDelete = async (article) => {
    if (!confirm(`确定要删除文章《${article.title}》吗？`)) {
      return
    }

    try {
      try {
        await deleteArticle(article.id, adminKey)
      } catch (err) {
        if (err.message.includes('未授权') || err.message.includes('密码错误')) {
          handleLogout()
          throw new Error('密码错误或已过期，请重新登录')
        }
        throw err
      }

      // 成功后刷新列表
      await fetchArticles()
      alert('文章删除成功！')
    } catch (err) {
      console.error('删除失败:', err)
      alert(`删除失败: ${err.message}`)
    }
  }

  /**
   * 取消编辑
   */
  const handleCancel = () => {
    setShowForm(false)
    setEditingArticle(null)
  }

  if (!isAuthenticated) {
    return (
      <div className="container pb-12 max-w-md mx-auto pt-20">
        <div className="glass p-8 rounded-2xl shadow-xl text-center animate-fade-in">
          <div className="text-5xl mb-6">🔒</div>
          <h1 className="text-2xl font-bold mb-2 text-text-color">管理员验证</h1>
          <p className="text-text-secondary mb-6">请输入管理员密码以管理文章</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              name="key"
              placeholder="输入密码..."
              className="w-full p-3 rounded-xl border border-border-color bg-white/50 focus:bg-white focus:border-primary outline-none transition-all text-center"
              autoFocus
            />
            <button type="submit" className="btn btn-primary w-full">
              验证身份
            </button>
          </form>
          <div className="mt-6 text-xs text-text-light">
            <Link to="/" className="hover:text-primary">← 返回首页</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <header className="mb-8 animate-fade-in">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gradient mb-2">📝 文章管理</h1>
            <p className="text-text-secondary">管理你的Java技术文章库</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleLogout}
              className="btn btn-ghost text-text-light hover:text-red-500"
              title="退出登录"
            >
              🔒 退出
            </button>
            <button
              onClick={fetchArticles}
              className="btn btn-secondary"
              disabled={loading}
            >
              🔄 刷新
            </button>
            <button
              onClick={handleAddNew}
              className="btn btn-primary"
              disabled={showForm}
            >
              ➕ 新增文章
            </button>
          </div>
        </div>

        {/* 搜索框 */}
        <div className="relative max-w-md">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light pointer-events-none">
            🔍
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索文章标题、描述或分类..."
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
      </header>

      {/* Form Modal/Section */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-white/40 animate-slide-up">
            <div className="p-6 border-b border-white/20 sticky top-0 bg-white/80 backdrop-blur-md z-10 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                {editingArticle ? '✏️ 编辑文章' : '➕ 新增文章'}
              </h2>
              <button onClick={handleCancel} className="text-text-light hover:text-primary text-xl">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-secondary">文章标题 *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="例如：☕ Spring Boot 3.0 新特性"
                    className="w-full p-3 rounded-xl border border-border-color bg-white/50 focus:bg-white focus:border-primary outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-secondary">分类 *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded-xl border border-border-color bg-white/50 focus:bg-white focus:border-primary outline-none transition-all"
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-text-secondary">文章描述 *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="简要描述文章内容..."
                  rows="3"
                  className="w-full p-3 rounded-xl border border-border-color bg-white/50 focus:bg-white focus:border-primary outline-none transition-all resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-secondary">阅读时长 (分钟) *</label>
                  <input
                    type="text"
                    name="readTime"
                    value={formData.readTime}
                    onChange={handleInputChange}
                    placeholder="例如：15"
                    className="w-full p-3 rounded-xl border border-border-color bg-white/50 focus:bg-white focus:border-primary outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-secondary">发布日期</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded-xl border border-border-color bg-white/50 focus:bg-white focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              {/* 作者字段 */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-secondary">作者</label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  placeholder="作者名称"
                  className="w-full p-3 rounded-xl border border-border-color bg-white/50 focus:bg-white focus:border-primary outline-none transition-all"
                />
              </div>

              {/* 标签字段 */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-secondary">文章标签</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                    placeholder="输入标签后按回车添加"
                    className="flex-1 p-3 rounded-xl border border-border-color bg-white/50 focus:bg-white focus:border-primary outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="btn btn-secondary px-4"
                  >
                    添加
                  </button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-red-500 ml-1"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-text-secondary flex justify-between">
                  <span>文章正文</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      className="text-xs font-normal text-primary hover:underline"
                    >
                      {showPreview ? '📝 编辑' : '👁️ 预览'}
                    </button>
                    <span className="text-xs font-normal text-text-light">支持 Markdown</span>
                  </div>
                </label>
                {showPreview ? (
                  <div className="w-full p-4 rounded-xl border border-border-color bg-white min-h-[300px] max-h-[500px] overflow-y-auto">
                    <Suspense fallback={<div className="text-center py-12 text-text-light">Markdown 预览加载中...</div>}>
                      <MarkdownRenderer content={formData.content} />
                    </Suspense>
                  </div>
                ) : (
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="输入文章的详细内容... 使用 ## 标题, - 列表等 Markdown 语法"
                    rows="12"
                    className="w-full p-4 rounded-xl border border-border-color bg-white/50 focus:bg-white focus:border-primary outline-none transition-all font-mono text-sm leading-relaxed"
                  />
                )}
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-border-color">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-ghost"
                  disabled={submitting}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn btn-primary px-8"
                  disabled={submitting}
                >
                  {submitting ? '⏳ 提交中...' : (editingArticle ? '💾 保存修改' : '✅ 立即发布')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="glass p-12 rounded-2xl text-center animate-pulse">
          <div className="text-4xl mb-4">🐱</div>
          <p className="text-text-secondary">正在加载文章数据...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-2xl text-center text-red-600 mb-8">
          <p>❌ {error}</p>
          <button onClick={fetchArticles} className="text-sm underline mt-2 hover:text-red-800">重试</button>
        </div>
      )}

      {/* Articles Table */}
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
                  <p className="text-text-secondary mb-4">暂无文章，开始创作你的第一篇博客吧！</p>
                  <button onClick={handleAddNew} className="btn btn-primary">
                    ✨ 创建文章
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* 统计信息 */}
      {!loading && !error && articles.length > 0 && (
        <div className="mt-6 text-center text-sm text-text-secondary">
          共 <span className="font-bold text-primary">{articles.length}</span> 篇文章
          {searchQuery && ` · 当前显示 ${filteredArticles.length} 篇`}
        </div>
      )}
    </div>
  )
}

export default ArticleManager
