import { toHanNumeral } from '../utils/xianText'
import './Pagination.css'

function getPageNumbers(currentPage, totalPages, showPages = 5) {
  const pages = []
  let start = Math.max(1, currentPage - Math.floor(showPages / 2))
  const end = Math.min(totalPages, start + showPages - 1)
  if (end - start + 1 < showPages) {
    start = Math.max(1, end - showPages + 1)
  }
  if (start > 1) {
    pages.push(1)
    if (start > 2) { pages.push('...') }
  }
  for (let i = start; i <= end; i++) { pages.push(i) }
  if (end < totalPages) {
    if (end < totalPages - 1) { pages.push('...') }
    pages.push(totalPages)
  }
  return pages
}

/** 分页：卷次式页码 */
function Pagination({ currentPage, totalPages, onPageChange, showInfo = true, totalCount = 0, className = '' }) {
  if (totalPages <= 1) {
    return null
  }

  const pages = getPageNumbers(currentPage, totalPages)

  return (
    <nav className={`xpager ${className}`} aria-label="分页">
      {showInfo && (
        <div className="xpager-info">
          共 <b className="latin">{totalCount}</b> 篇 · 第{toHanNumeral(currentPage)}卷，凡{toHanNumeral(totalPages)}卷
        </div>
      )}
      <div className="xpager-nav">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="xpager-step"
        >
          ← 前卷
        </button>
        {pages.map((page, index) => (
          page === '...' ? (
            <span key={`gap-${index}`} className="xpager-gap">⋯</span>
          ) : (
            <button
              type="button"
              key={page}
              onClick={() => onPageChange(page)}
              className={`xpager-num ${currentPage === page ? 'on' : ''}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {toHanNumeral(page)}
            </button>
          )
        ))}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="xpager-step"
        >
          后卷 →
        </button>
      </div>
    </nav>
  )
}

export default Pagination
