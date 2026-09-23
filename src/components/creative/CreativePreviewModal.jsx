import { useEffect, useState } from 'react'
import { toHanNumeral } from '../../utils/xianText'
import './creative.css'

const VIEWPORTS = [
  ['desktop', '宽屏'],
  ['tablet', '平板'],
  ['mobile', '手机'],
]

/**
 * 创意风格的内嵌预览：iframe + 视口切换。
 * Esc 关闭，← / → 切换上一款、下一款。
 */
function CreativePreviewModal({ item, onClose, onNavigate }) {
  const [viewportMode, setViewportMode] = useState('desktop')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { onClose() }
      if (e.key === 'ArrowLeft') { onNavigate(-1) }
      if (e.key === 'ArrowRight') { onNavigate(1) }
    }
    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose, onNavigate])

  return (
    <div className="xmodal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={`预览：${item.title}`}>
      <div className="xmodal" onClick={(e) => e.stopPropagation()}>
        <div className="xmodal-bar">
          <div className="xmodal-title">
            <span className="xmodal-num brush">第{toHanNumeral(Number(item.num))}式</span>
            <span className="serif">{item.title}</span>
            <span className="xmodal-sub">{item.categoryLabel}</span>
          </div>

          <div className="xmodal-actions">
            <button type="button" onClick={() => onNavigate(-1)} title="上一款（←）">← 上一款</button>
            <button type="button" onClick={() => onNavigate(1)} title="下一款（→）">下一款 →</button>
            <div className="xmodal-seg" role="group" aria-label="预览尺寸">
              {VIEWPORTS.map(([key, label]) => (
                <button
                  type="button"
                  key={key}
                  className={viewportMode === key ? 'on' : ''}
                  onClick={() => setViewportMode(key)}
                >
                  {label}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setReloadKey(k => k + 1)}>重载</button>
            <a href={item.htmlFile} target="_blank" rel="noopener noreferrer">全屏 ↗</a>
            <button type="button" className="xmodal-close" onClick={onClose} aria-label="关闭预览（Esc）">✕</button>
          </div>
        </div>

        <div className={`xmodal-frame vp-${viewportMode}`}>
          <iframe key={`${item.id}-${reloadKey}`} src={item.htmlFile} title={item.title} />
        </div>
      </div>
    </div>
  )
}

export default CreativePreviewModal
