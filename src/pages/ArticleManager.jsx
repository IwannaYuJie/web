import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ArticleEditor from '../components/article-manager/ArticleEditor'
import ArticleListPanel from '../components/article-manager/ArticleListPanel'
import NewsDraftPanel from '../components/article-manager/NewsDraftPanel'
import { clearStoredAdminKey, createArticle, deleteArticle, getStoredAdminKey, saveAdminKey, updateArticle, verifyAdminKey } from '../services/articles'
import PageHeader from '../components/xian/PageHeader'
import { useArticlesData } from '../hooks'
import './ArticleManager.css'

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
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') === 'news' ? 'news' : 'articles'
  const [newsHasChanges, setNewsHasChanges] = useState(false)
  const changeTab = (tab) => {
    if (activeTab === tab) {
      return
    }
    if (newsHasChanges && !window.confirm('资讯草稿还有未保存的修改，确认离开？')) {
      return
    }
    const nextParams = new URLSearchParams(searchParams)
    if (tab === 'news') {
      nextParams.set('tab', 'news')
    } else {
      nextParams.delete('tab')
    }
    setSearchParams(nextParams)
  }
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
          alert(`服务器错误：${errorMsg}\n\n提示：文章服务可能尚未配置管理密钥，请检查服务配置后重试。`)
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

  const handleLogout = useCallback(() => {
    setAdminKey('')
    setIsAuthenticated(false)
    clearStoredAdminKey()
  }, [])

  // 文章分类选项
  const categories = [...new Set([
    'Java核心', 'Spring框架', '微服务', '数据库', 'JVM',
    '中间件', '云原生', '架构设计', '搜索引擎', '持久层', 'AI 资讯',
    ...articles.map(article => article.category),
    formData.category,
  ].filter(Boolean))]

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
      alert('标题、描述、阅读时间还没填完')
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
      <div className="xadmin-gate">
        <PageHeader title="执笔" plain="文章管理" seal="掌门" compact />
        <div className="wrap xadmin-login">
          <form onSubmit={handleLogin} className="scroll-card">
            <div className="panel-h">叩门</div>
            <p>输入管理员密钥，即可管理文章、审阅资讯草稿。</p>
            <input type="password" name="key" placeholder="管理员密钥…" autoFocus aria-label="管理员密钥" />
            <button type="submit" className="btn" style={{ width: '100%' }}>
              入内 <span className="arr">→</span>
            </button>
            <Link to="/" className="link-arrow xadmin-home">← 回山门</Link>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="wrap xadmin">
      <header className="xadmin-head">
        <div>
          <div className="kicker"><span className="rule" />内容管理</div>
          <h1 className="brush">执笔</h1>
          <p className="elegant">藏卷 {articles.length} 篇 · 已入内</p>
        </div>
        <div className="xadmin-actions">
          {activeTab === 'articles' && <>
            <button type="button" onClick={handleAddNew} className="btn" disabled={showForm}>
              ＋ 新撰一篇
            </button>
            <button type="button" onClick={fetchArticles} className="btn ghost" disabled={loading}>
              刷新
            </button>
          </>}
          <button type="button" onClick={handleLogout} className="btn ghost" title="退出登录">
            离去
          </button>
        </div>
      </header>

      <nav className="tabs xadmin-tabs" role="tablist" aria-label="内容管理">
        <button type="button" role="tab" aria-selected={activeTab === 'articles'} className={`tab ${activeTab === 'articles' ? 'on' : ''}`} onClick={() => changeTab('articles')}>已发布文章</button>
        <button type="button" role="tab" aria-selected={activeTab === 'news'} className={`tab ${activeTab === 'news' ? 'on' : ''}`} onClick={() => changeTab('news')}>资讯草稿</button>
      </nav>

      {activeTab === 'news' ? (
        <NewsDraftPanel adminKey={adminKey} onUnauthorized={handleLogout} onPublished={fetchArticles} onDirtyChange={setNewsHasChanges} />
      ) : <>
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
      </>}
    </div>
  )
}

export default ArticleManager
