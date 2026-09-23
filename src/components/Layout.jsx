import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import Atmosphere from './xian/Atmosphere'
import './Layout.css'

export default function Layout({ children }) {
  const location = useLocation()
  const [scrollProgress, setScrollProgress] = useState(0)

  // 切换页面时回到顶部
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
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
      <main key={location.pathname} className="main-content page-enter">
        {children}
      </main>
      <Footer />
    </div>
  )
}
