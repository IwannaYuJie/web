import { Suspense, lazy } from 'react'

const MarkdownRenderer = lazy(() => import('../MarkdownRenderer'))

function ArticleEditor({
  categories,
  editingArticle,
  formData,
  handleInputChange,
  tagInput,
  setTagInput,
  handleAddTag,
  handleRemoveTag,
  showPreview,
  setShowPreview,
  handleSubmit,
  handleCancel,
  submitting,
}) {
  return (
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
              placeholder="用一两句话大概介绍一下写了啥..."
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
                placeholder="比如：15"
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
                placeholder="写个标签，回车或者点右边添加"
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
                placeholder="在这里用 Markdown 语法写正文..."
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
              {submitting ? '⏳ 正在提交...' : (editingArticle ? '💾 保存修改' : '✅ 马上发布')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ArticleEditor
