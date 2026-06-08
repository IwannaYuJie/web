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
      <div className="wrap" style={{ maxWidth: 460, paddingTop: 36, paddingBottom: 48 }}>
        <div style={{ padding: '34px 0 24px' }}>
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 900, fontSize: 'clamp(40px,7vw,72px)', lineHeight: 1, letterSpacing: '-.02em' }}>
            ✍️ 文章管理
          </h1>
        </div>
        <div className="panel" style={{ background: 'var(--k3-bg)', padding: 30 }}>
          <div className="panel-h">🔑 后台登录</div>
          <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginBottom: 18, lineHeight: 1.6 }}>
            输完密钥才能改文章。数据存在 Cloudflare KV。
          </p>
          <form onSubmit={handleLogin}>
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>🔐</span>
              <input
                type="password"
                name="key"
                placeholder="管理员密钥…"
                autoFocus
                style={{ paddingLeft: 38 }}
              />
            </div>
            <button type="submit" className="btn" style={{ width: '100%', justifyContent: 'center' }}>
              进去 →
            </button>
          </form>
          <div style={{ marginTop: 20, fontSize: 13, textAlign: 'center' }}>
            <Link to="/" style={{ color: 'var(--ink-soft)', fontWeight: 600 }}>← 返回首页</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="wrap" style={{ maxWidth: 1100, paddingBottom: 48 }}>
      <header style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
          <div style={{ padding: '24px 0 0' }}>
            <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 900, fontSize: 'clamp(34px,5vw,56px)', lineHeight: 1, letterSpacing: '-.02em' }}>
              ✍️ 文章管理
            </h1>
            <p style={{ fontSize: 14.5, color: 'var(--ink-soft)', marginTop: 8, fontWeight: 500 }}>
              共 {articles.length} 篇 · 已登录
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={handleAddNew} className="btn" disabled={showForm}>
              ＋ 新增文章
            </button>
            <button onClick={fetchArticles} className="btn ghost" disabled={loading}>
              🔄 刷新
            </button>
            <button onClick={handleLogout} className="btn ghost" title="退出登录">
              🔒 退出
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
