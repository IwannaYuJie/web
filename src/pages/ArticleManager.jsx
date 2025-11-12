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
    date: new Date().toISOString().split('T')[0]
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
      date: new Date().toISOString().split('T')[0]
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
      date: article.date
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
      const url = editingArticle 
        ? `/api/articles/${editingArticle.id}` 
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
      const response = await fetch(`/api/articles/${article.id}`, {
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
    <div className="container">
      {/* 页面标题 */}
      <header className="page-header">
        <Link to="/" className="back-link">← 返回首页</Link>
        <h1>📝 文章管理</h1>
        <p>管理你的Java技术文章</p>
      </header>

      {/* 操作按钮 */}
      <div className="manager-actions">
        <button 
          onClick={handleAddNew} 
          className="btn-primary"
          disabled={showForm}
        >
          ➕ 新增文章
        </button>
        <button 
          onClick={fetchArticles} 
          className="btn-secondary"
          disabled={loading}
        >
          🔄 刷新列表
        </button>
      </div>

      {/* 新增/编辑表单 */}
      {showForm && (
        <div className="article-form-container">
          <h2>{editingArticle ? '✏️ 编辑文章' : '➕ 新增文章'}</h2>
          <form onSubmit={handleSubmit} className="article-form">
            <div className="form-group">
              <label htmlFor="title">文章标题 *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="例如：☕ Spring Boot 3.0 新特性深度解析"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">文章描述 *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="简要描述文章内容..."
                rows="3"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">文章分类 *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="readTime">阅读时长 *</label>
                <input
                  type="text"
                  id="readTime"
                  name="readTime"
                  value={formData.readTime}
                  onChange={handleInputChange}
                  placeholder="例如：15 分钟"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="date">发布日期</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn-primary"
                disabled={submitting}
              >
                {submitting ? '提交中...' : (editingArticle ? '💾 保存修改' : '✅ 创建文章')}
              </button>
              <button 
                type="button" 
                onClick={handleCancel}
                className="btn-secondary"
                disabled={submitting}
              >
                ❌ 取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="loading-message">
          🐱 正在加载文章列表...
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="error-message">
          ❌ {error}
          <button onClick={fetchArticles} className="retry-button">
            🔄 重试
          </button>
        </div>
      )}

      {/* 文章列表 */}
      {!loading && !error && (
        <div className="articles-table-container">
          <h2>📚 文章列表 ({articles.length})</h2>
          {articles.length > 0 ? (
            <table className="articles-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>标题</th>
                  <th>分类</th>
                  <th>阅读时长</th>
                  <th>发布日期</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {articles.map(article => (
                  <tr key={article.id}>
                    <td>{article.id}</td>
                    <td className="article-title-cell">{article.title}</td>
                    <td>
                      <span className="category-badge">{article.category}</span>
                    </td>
                    <td>{article.readTime}</td>
                    <td>{article.date}</td>
                    <td className="actions-cell">
                      <button 
                        onClick={() => handleEdit(article)}
                        className="btn-edit"
                        title="编辑"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDelete(article)}
                        className="btn-delete"
                        title="删除"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-message">
              📝 暂无文章，点击"新增文章"按钮创建第一篇文章吧！
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ArticleManager
