import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import Ticker from './Ticker'
import './Layout.css'

export default function Layout({ children }) {
  const location = useLocation()
  const [animationClass, setAnimationClass] = useState('page-fade-in')
  const [particles, setParticles] = useState([])
  const [scrollProgress, setScrollProgress] = useState(0)

  // Page Route Transitions
  useEffect(() => {
    setAnimationClass('')
    const timer = requestAnimationFrame(() => {
      setAnimationClass('page-fade-in')
    })
    return () => cancelAnimationFrame(timer)
  }, [location.pathname])

  // Scroll Progress Bar
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100
        setScrollProgress(progress)
      } else {
        setScrollProgress(0)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [location.pathname])

  // Click Particles Effect
  const handleGlobalClick = (e) => {
    // Avoid spawning particles on input fields or button text if it interrupts typing, but global click is fine
    // Filter out input/textarea to make typing smooth
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
      return
    }

    const emojis = ['🐾', '🐱', '🐟', '🧶', '⭐', '✨', '🐾', '❤️', '🎈', '🎉']
    const emoji = emojis[Math.floor(Math.random() * emojis.length)]
    const id = Date.now() + Math.random()
    
    const newParticle = {
      id,
      x: e.clientX,
      y: e.clientY,
      emoji,
    }
    
    setParticles(prev => [...prev, newParticle])
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== id))
    }, 800)
  }

  return (
    <div className="app-layout app js" onClick={handleGlobalClick}>
      {/* Scroll Progress Indicator */}
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />

      <Ticker />
      <Navbar />
      <main className={`main-content ${animationClass}`}>
        {children}
      </main>
      <Footer />

      {/* Floating Click Particles */}
      {particles.map(p => (
        <span
          key={p.id}
          className="click-particle"
          style={{
            left: p.x,
            top: p.y,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  )
}
