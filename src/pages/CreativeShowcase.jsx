import { useState, useMemo, useEffect, useCallback } from 'react'
import { CREATIVE_BLOGS, CATEGORIES } from '../data/creativeBlogsData'
import './CreativeShowcase.css'

function CreativeShowcase() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [previewItem, setPreviewItem] = useState(null)
  const [viewportMode, setViewportMode] = useState('desktop') // 'desktop' | 'tablet' | 'mobile'
  const [toastMessage, setToastMessage] = useState('')
  const [iframeKey, setIframeKey] = useState(0)

  // 复制提示自动淡出
  const showToast = useCallback((msg) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage('')
    }, 2200)
  }, [])

  // 复制 HEX 颜色
  const copyColorHex = useCallback((hex, name, e) => {
    e.stopPropagation()
    if (navigator.clipboard) {
      navigator.clipboard.writeText(hex).then(() => {
        showToast(`已复制色彩【${name}】：${hex}`)
      }).catch(() => {
        showToast(`色彩值：${hex}`)
      })
    } else {
      showToast(`色彩值：${hex}`)
    }
  }, [showToast])

  // 过滤博客列表
  const filteredBlogs = useMemo(() => {
    return CREATIVE_BLOGS.filter(item => {
      const matchCat = activeCategory === 'all' || item.category === activeCategory
      const query = searchQuery.trim().toLowerCase()
      if (!query) {
        return matchCat
      }

      const matchText = 
        item.title.toLowerCase().includes(query) ||
        item.subtitle.toLowerCase().includes(query) ||
        item.desc.toLowerCase().includes(query) ||
        item.tags.some(t => t.toLowerCase().includes(query)) ||
        item.features.some(f => f.toLowerCase().includes(query)) ||
        item.num.includes(query)

      return matchCat && matchText
    })
  }, [activeCategory, searchQuery])

  // 随机漫游
  const handleRandomRoam = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * CREATIVE_BLOGS.length)
    const randomBlog = CREATIVE_BLOGS[randomIndex]
    setPreviewItem(randomBlog)
    setIframeKey(k => k + 1)
    showToast(`🎲 开启漫游：${randomBlog.num} ${randomBlog.title}`)
  }, [showToast])

  // 键盘快捷键监听 (ESC 退出预览，左右键切页)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!previewItem) {
        return
      }

      if (e.key === 'Escape') {
        setPreviewItem(null)
      } else if (e.key === 'ArrowLeft') {
        const currentIndex = CREATIVE_BLOGS.findIndex(b => b.id === previewItem.id)
        if (currentIndex > 0) {
          setPreviewItem(CREATIVE_BLOGS[currentIndex - 1])
          setIframeKey(k => k + 1)
        }
      } else if (e.key === 'ArrowRight') {
        const currentIndex = CREATIVE_BLOGS.findIndex(b => b.id === previewItem.id)
        if (currentIndex < CREATIVE_BLOGS.length - 1) {
          setPreviewItem(CREATIVE_BLOGS[currentIndex + 1])
          setIframeKey(k => k + 1)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [previewItem])

  // 切换上一款/下一款
  const navigatePreview = (direction) => {
    if (!previewItem) {
      return
    }
    const currentIndex = CREATIVE_BLOGS.findIndex(b => b.id === previewItem.id)
    let nextIndex = currentIndex + direction
    if (nextIndex < 0) {
      nextIndex = CREATIVE_BLOGS.length - 1
    }
    if (nextIndex >= CREATIVE_BLOGS.length) {
      nextIndex = 0
    }
    setPreviewItem(CREATIVE_BLOGS[nextIndex])
    setIframeKey(k => k + 1)
  }

  return (
    <div className="wrap creative-page">
      {/* 顶部 Hero 区域 */}
      <header className="creative-hero">
        <div className="creative-badge">
          <span>✨</span>
          <span>23 DISTINCT TYPOGRAPHY & INTERACTION PARADIGMS</span>
        </div>
        <h1 className="creative-title">
          创意工坊 · 23 款独立排版风格矩阵
        </h1>
        <p className="creative-desc">
          探索 23 款完全不同排版范式与交互逻辑的博客设计。涵盖瑞士极简、复古报刊、赛博终端、Win95 视窗、日式禅意、新粗野主义、双向链接数字花园、中世纪羊皮纸手抄本、80s 蒸汽波、8-Bit 像素地牢、拟态毛玻璃与达芬奇发明手稿。
        </p>

        {/* 统计指标与随机漫游 */}
        <div className="creative-stats-bar">
          <div className="creative-stat-item">
            <span>📚 全景矩阵：</span>
            <strong>23 款排版流派</strong>
          </div>
          <div className="creative-stat-item">
            <span>🏷️ 涵盖维度：</span>
            <strong>4 大核心分类</strong>
          </div>
          <div className="creative-stat-item">
            <span>⚡ 交互体验：</span>
            <strong>100% 独立可玩</strong>
          </div>
          <button className="btn-random-roam" onClick={handleRandomRoam} title="随机探索一款排版风格">
            <span>🎲</span>
            <span>随机漫游一个</span>
          </button>
        </div>
      </header>

      {/* 控制栏：分类胶囊、搜索框、视图切换 */}
      <section className="creative-control-bar">
        <div className="category-tabs">
          {CATEGORIES.map(cat => {
            const count = cat.key === 'all' 
              ? CREATIVE_BLOGS.length 
              : CREATIVE_BLOGS.filter(b => b.category === cat.key).length

            return (
              <button
                key={cat.key}
                className={`category-tab-btn ${activeCategory === cat.key ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.key)}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span style={{ opacity: 0.75, fontSize: 11 }}>({count})</span>
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', maxWidth: 440, justifyContent: 'flex-end' }}>
          <div className="creative-search-box">
            <span style={{ fontSize: 14 }}>🔍</span>
            <input
              type="text"
              placeholder="搜索风格名称、特性、标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', fontSize: 12 }}
              >
                ✕
              </button>
            )}
          </div>

          <div className="view-mode-toggle">
            <button
              className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="网格视图"
            >
              ⊞ 网格
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="列表视图"
            >
              ☰ 列表
            </button>
          </div>
        </div>
      </section>

      {/* 博客卡片矩阵 */}
      {filteredBlogs.length === 0 ? (
        <div className="creative-empty-state">
          <div style={{ fontSize: 42, marginBottom: 12 }}>🔍</div>
          <h3>未找到匹配的创意排版风格</h3>
          <p style={{ color: 'var(--text-secondary)' }}>尝试清除搜索关键词或切换不同分类标签</p>
          <button 
            className="btn-random-roam" 
            style={{ marginTop: 16 }}
            onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
          >
            重置所有筛选
          </button>
        </div>
      ) : (
        <main className={`creative-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
          {filteredBlogs.map(blog => (
            <article key={blog.id} className="creative-card">
              {/* 列表模式或网格式封面 */}
              <div 
                className="card-thumb-wrapper"
                onClick={() => {
                  setPreviewItem(blog)
                  setIframeKey(k => k + 1)
                }}
                title="点击快速内嵌预览"
              >
                <img 
                  src={blog.thumbnail} 
                  alt={blog.title} 
                  className="card-thumb-img" 
                  loading="lazy"
                />
                <div className="card-thumb-overlay">
                  <span>⚡ 快速内嵌预览</span>
                </div>
              </div>

              {/* 中间信息区 */}
              <div>
                <div className="card-header-bar">
                  <span className="card-num-badge">STYLE {blog.num}</span>
                  <span className="card-cat-chip">{blog.categoryLabel}</span>
                </div>

                <h2 className="card-main-title">
                  <span>{blog.icon}</span>
                  <span>{blog.title}</span>
                </h2>

                <div className="card-subtitle">{blog.subtitle}</div>
                <p className="card-description">{blog.desc}</p>

                {/* 调色板 */}
                <div className="card-palette-row">
                  <span className="palette-title">配色调色盘：</span>
                  <div className="palette-dots-list">
                    {blog.colors.map(col => (
                      <span
                        key={col.hex}
                        className="palette-color-dot"
                        style={{ backgroundColor: col.hex }}
                        title={`点击复制【${col.name}】${col.hex}`}
                        onClick={(e) => copyColorHex(col.hex, col.name, e)}
                      />
                    ))}
                  </div>
                </div>

                {/* 特性亮点 */}
                <div className="card-features-box">
                  {blog.features.map((feat, idx) => (
                    <div key={idx}>
                      <span className="feature-bullet">•</span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* 标签 */}
                <div className="card-tags-list">
                  {blog.tags.map(tag => (
                    <span key={tag} className="card-tag-pill">#{tag}</span>
                  ))}
                </div>
              </div>

              {/* 底部操作栏 */}
              <div className="card-actions-row">
                <button
                  className="btn-card-preview"
                  onClick={() => {
                    setPreviewItem(blog)
                    setIframeKey(k => k + 1)
                  }}
                >
                  <span>⚡</span>
                  <span>快速预览</span>
                </button>
                <a
                  href={blog.htmlFile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-card-fullscreen"
                >
                  <span>全屏体验</span>
                  <span>➔</span>
                </a>
              </div>
            </article>
          ))}
        </main>
      )}

      {/* 沉浸式内嵌快速预览 Modal */}
      {previewItem && (
        <div 
          className="creative-modal-backdrop"
          onClick={() => setPreviewItem(null)}
        >
          <div 
            className="creative-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 模态框顶部控制条 */}
            <div className="modal-top-bar">
              <div className="modal-title-group">
                <span className="modal-style-tag">STYLE {previewItem.num}</span>
                <span className="modal-style-title">{previewItem.icon} {previewItem.title}</span>
                <span style={{ fontSize: 13, color: '#9ca3af', marginLeft: 8 }}>({previewItem.categoryLabel})</span>
              </div>

              <div className="modal-actions-group">
                {/* 上一个 / 下一个 */}
                <button 
                  className="modal-icon-btn" 
                  onClick={() => navigatePreview(-1)}
                  title="上一款风格 (键盘 ← 键)"
                >
                  ⏮️ 上一款
                </button>
                <button 
                  className="modal-icon-btn" 
                  onClick={() => navigatePreview(1)}
                  title="下一款风格 (键盘 → 键)"
                >
                  ⏭️ 下一款
                </button>

                {/* 视口模拟器 */}
                <div className="viewport-switch">
                  <button
                    className={`viewport-btn ${viewportMode === 'desktop' ? 'active' : ''}`}
                    onClick={() => setViewportMode('desktop')}
                    title="桌面宽屏模式"
                  >
                    🖥️ 宽屏
                  </button>
                  <button
                    className={`viewport-btn ${viewportMode === 'tablet' ? 'active' : ''}`}
                    onClick={() => setViewportMode('tablet')}
                    title="平板模式"
                  >
                    💻 平板
                  </button>
                  <button
                    className={`viewport-btn ${viewportMode === 'mobile' ? 'active' : ''}`}
                    onClick={() => setViewportMode('mobile')}
                    title="手机竖屏模式"
                  >
                    📱 手机
                  </button>
                </div>

                {/* 刷新 */}
                <button
                  className="modal-icon-btn"
                  onClick={() => setIframeKey(k => k + 1)}
                  title="重新加载预览"
                >
                  🔄 刷新
                </button>

                {/* 新窗口打开 */}
                <a
                  href={previewItem.htmlFile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modal-icon-btn"
                  title="在新窗口中独立全屏打开"
                >
                  🔗 全屏打开
                </a>

                {/* 关闭 */}
                <button
                  className="modal-close-btn"
                  onClick={() => setPreviewItem(null)}
                  title="关闭预览 (ESC)"
                >
                  ✕ 关闭 (ESC)
                </button>
              </div>
            </div>

            {/* iframe 视口框架 */}
            <div className={`modal-iframe-frame viewport-${viewportMode}`}>
              <iframe
                key={iframeKey}
                src={previewItem.htmlFile}
                title={previewItem.title}
              />
            </div>
          </div>
        </div>
      )}

      {/* 轻提示 Toast */}
      {toastMessage && (
        <div className="copy-toast">
          <span>🎨</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}

export default CreativeShowcase
