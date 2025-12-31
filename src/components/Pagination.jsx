/**
 * 分页组件
 * 提供简洁美观的分页导航
 */
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showInfo = true,
  totalCount = 0,
  className = ''
}) {
  if (totalPages <= 1) return null

  // 生成页码数组
  const getPageNumbers = () => {
    const pages = []
    const showPages = 5 // 显示的页码数量

    let start = Math.max(1, currentPage - Math.floor(showPages / 2))
    let end = Math.min(totalPages, start + showPages - 1)

    // 调整 start 如果 end 到达上限
    if (end - start + 1 < showPages) {
      start = Math.max(1, end - showPages + 1)
    }

    // 添加第一页
    if (start > 1) {
      pages.push(1)
      if (start > 2) pages.push('...')
    }

    // 添加中间页码
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    // 添加最后一页
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...')
      pages.push(totalPages)
    }

    return pages
  }

  const pages = getPageNumbers()

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {showInfo && (
        <div className="text-sm text-text-secondary">
          共 <span className="font-bold text-primary">{totalCount}</span> 篇文章，
          第 <span className="font-bold text-primary">{currentPage}</span> / {totalPages} 页
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* 上一页 */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white hover:bg-primary hover:text-white border border-border-color'
          }`}
        >
          ← 上一页
        </button>

        {/* 页码 */}
        <div className="flex items-center gap-1">
          {pages.map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-2 text-text-light">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                  currentPage === page
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white hover:bg-primary/10 border border-border-color'
                }`}
              >
                {page}
              </button>
            )
          ))}
        </div>

        {/* 下一页 */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            currentPage === totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white hover:bg-primary hover:text-white border border-border-color'
          }`}
        >
          下一页 →
        </button>
      </div>
    </div>
  )
}

export default Pagination
