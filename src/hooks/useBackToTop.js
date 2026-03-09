import { useEffect, useState } from 'react'

export function useBackToTop(threshold = 400) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > threshold)
    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [threshold])

  return visible
}
