import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

/**
 * 文章管理页面
 * 提供文章的新增、编辑、删除功能
 */
function ArticleManager() {
  // 状态管理
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingArticle, setEditingArticle] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Java核心',
    readTime: '',
    date: new Date().toISOString().split('T')[0],
    content: ''
  })
  const [submitting, setSubmitting] = useState(false)

  // 文章分类选项
  const categories = [
    'Java核心', 'Spring框架', '微服务', '数据库', 'JVM', 
    '中间件', '云原生', '架构设计', '搜索引擎', '持久层'
  ]

  // 页面加载时获取文章列表
  useEffect(() => {
    fetchArticles()
  }, [])

  /**
   * 获取文章列表
   */
  const fetchArticles = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/articles')
      
      if (!response.ok) {
        throw new Error('获取文章列表失败')
      }
      
      const data = await response.json()
      setArticles(data)
    } catch (err) {
      console.error('获取文章失败:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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
    setFormData({
      title: '',
      description: '',
      category: 'Java核心',
      readTime: '',
      date: new Date().toISOString().split('T')[0],
      content: ''
    })
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
      content: article.content || ''
    })
    setShowForm(true)
  }

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
      // 使用查询参数而不是路径参数，避免被Cloudflare拦截
      const url = editingArticle 
        ? `/api/articles?id=${editingArticle.id}` 
        : '/api/articles'
      
      const response = await fetch(url, {
        method: editingArticle ? 'POST' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(editingArticle && { 'X-HTTP-Method-Override': 'PUT' })
        },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          // 如果响应不是JSON，使用状态码信息
        }
        throw new Error(errorMessage)
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
      // 使用查询参数而不是路径参数，避免被Cloudflare拦截
      const response = await fetch(`/api/articles?id=${article.id}`, {
        method: 'POST',
        headers: {
          'X-HTTP-Method-Override': 'DELETE'
        }
      })
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          // 如果响应不是JSON，使用状态码信息
        }
        throw new Error(errorMessage)
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

  return (
    <div className="container pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <header className="mb-8 flex justify-between items-end animate-fade-in">
        <div>
          <h1 className="text-3xl font-extrabold text-gradient mb-2">📝 文章管理</h1>
          <p className="text-text-secondary">管理你的Java技术文章库</p>
        </div>
        <div className="flex gap-3">
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

              <div className="space-y-2">
                <label className="text-sm font-bold text-text-secondary flex justify-between">
                  <span>文章正文</span>
                  <span className="text-xs font-normal text-text-light">支持 Markdown</span>
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="输入文章的详细内容... 使用 ## 标题, - 列表等 Markdown 语法"
                  rows="12"
                  className="w-full p-4 rounded-xl border border-border-color bg-white/50 focus:bg-white focus:border-primary outline-none transition-all font-mono text-sm leading-relaxed"
                />
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
          {articles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-primary/5 border-b border-border-color text-text-secondary text-sm uppercase tracking-wider">
                    <th className="p-4 font-bold w-16">ID</th>
                    <th className="p-4 font-bold">文章标题</th>
                    <th className="p-4 font-bold">分类</th>
                    <th className="p-4 font-bold w-32">发布日期</th>
                    <th className="p-4 font-bold w-32 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color/50">
                  {articles.map((article) => (
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
                      </td>
                      <td className="p-4 text-sm text-text-secondary whitespace-nowrap">
                        {article.date}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
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
              <p className="text-text-secondary mb-4">暂无文章，开始创作你的第一篇博客吧！</p>
              <button onClick={handleAddNew} className="btn btn-primary">
                ✨ 创建文章
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ArticleManager
