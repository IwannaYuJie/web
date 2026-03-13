import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ArticleEditor from '../components/article-manager/ArticleEditor'
import ArticleListPanel from '../components/article-manager/ArticleListPanel'
import { clearStoredAdminKey, createArticle, deleteArticle, getStoredAdminKey, saveAdminKey, updateArticle, verifyAdminKey } from '../services/articles'
import { useArticlesData } from '../hooks'

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

      </header>

      {/* Form Modal/Section */}
      {showForm && (
        <ArticleEditor
          categories={categories}
          editingArticle={editingArticle}
          formData={formData}
          handleInputChange={handleInputChange}
          tagInput={tagInput}
          setTagInput={setTagInput}
          handleAddTag={handleAddTag}
          handleRemoveTag={handleRemoveTag}
          showPreview={showPreview}
          setShowPreview={setShowPreview}
          handleSubmit={handleSubmit}
          handleCancel={handleCancel}
          submitting={submitting}
        />
      )}
      <ArticleListPanel
        loading={loading}
        error={error}
        fetchArticles={fetchArticles}
        filteredArticles={filteredArticles}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        handleAddNew={handleAddNew}
        totalArticles={articles.length}
      />
    </div>
  )
}

export default ArticleManager
