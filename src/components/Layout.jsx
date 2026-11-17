import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { resolveRouteMeta, setDocumentMeta } from '../utils/documentMeta'
import Navbar from './Navbar'
import Footer from './Footer'
import Atmosphere from './xian/Atmosphere'
import './Layout.css'

export default function Layout({ children }) {
  const location = useLocation()
  const mainRef = useRef(null)
  const progressRef = useRef(null)

  // 切换页面时回到顶部并更新基础标题与元信息
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    setDocumentMeta(resolveRouteMeta(location.pathname, location.search))
  }, [location.pathname, location.search])

  // 滚动入场：.reveal 区块与 .section-h 标题进入视口时加上 .in
  useEffect(() => {
    const main = mainRef.current
    if (!main || typeof IntersectionObserver === 'undefined') { return undefined }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in')
          io.unobserve(entry.target)
        }
      })
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 })
    // 页面内容多为异步加载，新节点出现时再扫一遍
    const scan = () => main.querySelectorAll('.reveal:not(.in), .section-h:not(.in)').forEach(el => io.observe(el))
    scan()
    const mo = new MutationObserver(scan)
    mo.observe(main, { childList: true, subtree: true })
    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [location.pathname])

  // 使用 requestAnimationFrame + ref 直接更新进度条 DOM，避免滚动触发 React 重渲染
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const el = progressRef.current
      if (!el) { return }
      const total = document.documentElement.scrollHeight - window.innerHeight
      const ratio = total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0
      el.style.transform = `scaleX(${ratio})`
    }
    const onScroll = () => {
      if (!raf) { raf = requestAnimationFrame(update) }
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) { cancelAnimationFrame(raf) }
    }
  }, [location.pathname])

  return (
    <div className="app-layout">
      <Atmosphere />
      <div
        ref={progressRef}
        className="scroll-progress"
        style={{ transform: 'scaleX(0)' }}
        aria-hidden="true"
      />
      <Navbar />
      <main key={location.pathname} ref={mainRef} className="main-content page-enter">
        {children}
      </main>
      <Footer />
    </div>
  )
}
