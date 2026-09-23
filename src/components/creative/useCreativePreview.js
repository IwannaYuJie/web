import { useCallback, useRef, useState } from 'react'
import { CREATIVE_BLOGS } from '../../data/creativeBlogsData'

/** 预览弹窗状态、循环切换、复制色值与轻提示，首页与百工坊共用 */
export function useCreativePreview() {
  const [previewItem, setPreviewItem] = useState(null)
  const [toast, setToast] = useState('')
  const toastTimer = useRef(0)

  const showToast = useCallback((msg) => {
    window.clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = window.setTimeout(() => setToast(''), 2200)
  }, [])

  const closePreview = useCallback(() => setPreviewItem(null), [])

  const navigatePreview = useCallback((direction) => {
    setPreviewItem(current => {
      if (!current) { return current }
      const index = CREATIVE_BLOGS.findIndex(b => b.id === current.id)
      const next = (index + direction + CREATIVE_BLOGS.length) % CREATIVE_BLOGS.length
      return CREATIVE_BLOGS[next]
    })
  }, [])

  const openRandom = useCallback(() => {
    const blog = CREATIVE_BLOGS[Math.floor(Math.random() * CREATIVE_BLOGS.length)]
    setPreviewItem(blog)
    showToast(`随缘一游：第 ${blog.num} 式 · ${blog.title}`)
  }, [showToast])

  const copyColor = useCallback((col, e) => {
    e.stopPropagation()
    const done = () => showToast(`已取色「${col.name}」${col.hex}`)
    if (navigator.clipboard) {
      navigator.clipboard.writeText(col.hex).then(done).catch(() => showToast(`色值：${col.hex}`))
    } else {
      showToast(`色值：${col.hex}`)
    }
  }, [showToast])

  return { previewItem, setPreviewItem, closePreview, navigatePreview, openRandom, copyColor, toast, showToast }
}
