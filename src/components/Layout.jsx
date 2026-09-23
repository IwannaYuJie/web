import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import Atmosphere from './xian/Atmosphere'
import './Layout.css'

export default function Layout({ children }) {
  const location = useLocation()
  const [scrollProgress, setScrollProgress] = useState(0)
  const mainRef = useRef(null)

  // 切换页面时回到顶部
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

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

  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const total = document.documentElement.scrollHeight - window.innerHeight
      setScrollProgress(total > 0 ? (window.scrollY / total) * 100 : 0)
    }
    const onScroll = () => {
      if (!raf) { raf = requestAnimationFrame(update) }
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) { cancelAnimationFrame(raf) }
    }
  }, [location.pathname])

  return (
    <div className="app-layout">
      <Atmosphere />
      <div className="scroll-progress" style={{ transform: `scaleX(${scrollProgress / 100})` }} aria-hidden="true" />
      <Navbar />
      <main key={location.pathname} ref={mainRef} className="main-content page-enter">
        {children}
      </main>
      <Footer />
    </div>
  )
}
