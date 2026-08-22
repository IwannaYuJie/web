import { useState, useMemo, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { CREATIVE_BLOGS, CATEGORIES } from '../../data/creativeBlogsData'
import './HomeCreativeSection.css'

// 辅助函数：从数组中随机挑选 n 个不重复项
function getRandomSample(items, count = 3) {
  if (!items || items.length === 0) {
    return []
  }
  if (items.length <= count) {
    return [...items]
  }
  const shuffled = [...items].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

function HomeCreativeSection() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [randomSeed, setRandomSeed] = useState(0) // 用于触发换一批
  const [previewItem, setPreviewItem] = useState(null)
  const [viewportMode, setViewportMode] = useState('desktop') // 'desktop' | 'tablet' | 'mobile'
  const [toastMessage, setToastMessage] = useState('')
  const [iframeKey, setIframeKey] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 轻提示自动淡出
  const showToast = useCallback((msg) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage('')
    }, 2200)
  }, [])

  // 复制 HEX 颜色
  const copyColorHex = useCallback(
    (hex, name, e) => {
      e.stopPropagation()
      if (navigator.clipboard) {
        navigator.clipboard
          .writeText(hex)
          .then(() => {
            showToast(`已复制色彩【${name}】：${hex}`)
          })
          .catch(() => {
            showToast(`色彩值：${hex}`)
          })
      } else {
        showToast(`色彩值：${hex}`)
      }
    },
    [showToast],
  )

  // 当前分类下的所有博客列表
  const categoryBlogs = useMemo(() => {
    if (activeCategory === 'all') {
      return CREATIVE_BLOGS
    }
    return CREATIVE_BLOGS.filter(b => b.category === activeCategory)
  }, [activeCategory])

  // 首页精简展示：仅随机挑选 3 款展示，篇幅克制精巧
  const displayedBlogs = useMemo(() => {
    // 依赖 randomSeed 触发重新洗牌
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const _ = randomSeed
    return getRandomSample(categoryBlogs, 3)
  }, [categoryBlogs, randomSeed])

  // 换一批精选
  const handleShuffle = useCallback(() => {
    setIsRefreshing(true)
    setRandomSeed(s => s + 1)
    showToast('🎲 已换一批精选风格')
    setTimeout(() => setIsRefreshing(false), 400)
  }, [showToast])

  // 随机漫游直接打开预览
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
    <section className="home-creative-showcase-section" aria-label="创意工坊排版风格展厅">
      {/* 顶部标题与行动按钮 */}
      <div className="home-creative-header">
        <div className="home-creative-title-wrap">
          <div className="home-creative-badge">
            <span className="badge-spark">✨</span>
            <span>23 款独立排版流派 · 随机精选</span>
          </div>
          <h2 className="home-creative-title">
            <span>🎨 创意工坊 · </span>
            <span className="title-highlight">排版灵感矩阵</span>
          </h2>
          <p className="home-creative-subtitle">
            涵盖瑞士极简、复古报刊、赛博终端、Win95视窗、日式禅意、新粗野主义、达芬奇手稿等 23 款独立风格，支持免离开即刻试玩。
          </p>
        </div>

        <div className="home-creative-actions">
          <button
            type="button"
            className={`home-btn-shuffle ${isRefreshing ? 'spinning' : ''}`}
            onClick={handleShuffle}
            title="换一批随机精选风格"
          >
            <span className="btn-icon-spin">🎲</span>
            <span>换一批</span>
          </button>
          <button
            type="button"
            className="home-btn-roam"
            onClick={handleRandomRoam}
            title="随机挑一款风格进入交互试玩"
          >
            <span>⚡</span>
            <span>随机试玩</span>
          </button>
          <Link to="/creative" className="home-btn-all" title="查看创意工坊全部 23 款完整展厅">
            <span>全部 23 款</span>
            <span className="btn-arrow">➔</span>
          </Link>
        </div>
      </div>

      {/* 分类胶囊标签栏 */}
      <div className="home-creative-tabs-bar">
        <div className="home-creative-tabs">
          {CATEGORIES.map(cat => {
            const count =
              cat.key === 'all'
                ? CREATIVE_BLOGS.length
                : CREATIVE_BLOGS.filter(b => b.category === cat.key).length

            const isActive = activeCategory === cat.key
            return (
              <button
                key={cat.key}
                type="button"
                className={`home-tab-pill ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setActiveCategory(cat.key)
                  setRandomSeed(s => s + 1)
                }}
              >
                <span className="tab-icon">{cat.icon}</span>
                <span className="tab-label">{cat.label}</span>
                <span className="tab-count">({count})</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 风格卡片精简网格展区 (固定精选 3 张卡片，克制紧凑) */}
      <div className={`home-creative-cards-grid ${isRefreshing ? 'fade-out' : 'fade-in'}`}>
        {displayedBlogs.map(blog => (
          <article key={blog.id} className="home-creative-card">
            {/* 卡片顶部图片与快速预览遮罩 */}
            <div
              className="home-card-thumb-shell"
              onClick={() => {
                setPreviewItem(blog)
                setIframeKey(k => k + 1)
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setPreviewItem(blog)
                  setIframeKey(k => k + 1)
                }
              }}
              title="点击在当前页快速弹出交互预览"
            >
              <img
                src={blog.thumbnail}
                alt={blog.title}
                className="home-card-thumb-img"
                loading="lazy"
              />
              <div className="home-card-thumb-overlay">
                <span className="thumb-action-icon">⚡</span>
                <span>即刻在当前页试玩</span>
              </div>
              <div className="home-card-num-chip">STYLE {blog.num}</div>
            </div>

            {/* 卡片主体内容 */}
            <div className="home-card-content">
              <div className="home-card-meta-line">
                <span className="home-card-category-tag">{blog.categoryLabel}</span>
                <span className="home-card-icon-preview">{blog.icon}</span>
              </div>

              <h3 className="home-card-heading">
                {blog.title}
              </h3>

              <div className="home-card-subtitle">{blog.subtitle}</div>
              <p className="home-card-desc">{blog.desc}</p>

              {/* 配色调色板 */}
              <div className="home-card-palette">
                <span className="palette-label">配色：</span>
                <div className="palette-dots">
                  {blog.colors.map(col => (
                    <button
                      key={col.hex}
                      type="button"
                      className="palette-dot-btn"
                      style={{ backgroundColor: col.hex }}
                      title={`点击复制【${col.name}】${col.hex}`}
                      onClick={(e) => copyColorHex(col.hex, col.name, e)}
                      aria-label={`复制色彩 ${col.name} ${col.hex}`}
                    />
                  ))}
                </div>
              </div>

              {/* 特性亮点 (精选 1 条核心亮点) */}
              <div className="home-card-features">
                <div className="feature-item">
                  <span className="feature-dot">•</span>
                  <span>{blog.features[0]}</span>
                </div>
              </div>
            </div>

            {/* 底部按钮栏 */}
            <div className="home-card-footer-actions">
              <button
                type="button"
                className="btn-home-preview"
                onClick={() => {
                  setPreviewItem(blog)
                  setIframeKey(k => k + 1)
                }}
              >
                <span>⚡</span>
                <span>快速试玩</span>
              </button>
              <a
                href={blog.htmlFile}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-home-fullscreen"
              >
                <span>独立全屏</span>
                <span>➔</span>
              </a>
            </div>
          </article>
        ))}
      </div>

      {/* 沉浸式内嵌快速预览 Modal */}
      {previewItem && (
        <div
          className="creative-modal-backdrop"
          onClick={() => setPreviewItem(null)}
          role="dialog"
          aria-modal="true"
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
                <span className="modal-cat-sub">({previewItem.categoryLabel})</span>
              </div>

              <div className="modal-actions-group">
                {/* 上一个 / 下一个 */}
                <button
                  type="button"
                  className="modal-icon-btn"
                  onClick={() => navigatePreview(-1)}
                  title="上一款风格 (键盘 ← 键)"
                >
                  ⏮️ 上一款
                </button>
                <button
                  type="button"
                  className="modal-icon-btn"
                  onClick={() => navigatePreview(1)}
                  title="下一款风格 (键盘 → 键)"
                >
                  ⏭️ 下一款
                </button>

                {/* 视口模拟器 */}
                <div className="viewport-switch">
                  <button
                    type="button"
                    className={`viewport-btn ${viewportMode === 'desktop' ? 'active' : ''}`}
                    onClick={() => setViewportMode('desktop')}
                    title="桌面宽屏模式"
                  >
                    🖥️ 宽屏
                  </button>
                  <button
                    type="button"
                    className={`viewport-btn ${viewportMode === 'tablet' ? 'active' : ''}`}
                    onClick={() => setViewportMode('tablet')}
                    title="平板模式"
                  >
                    💻 平板
                  </button>
                  <button
                    type="button"
                    className={`viewport-btn ${viewportMode === 'mobile' ? 'active' : ''}`}
                    onClick={() => setViewportMode('mobile')}
                    title="手机竖屏模式"
                  >
                    📱 手机
                  </button>
                </div>

                {/* 刷新 */}
                <button
                  type="button"
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
                  type="button"
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
    </section>
  )
}

export default HomeCreativeSection
