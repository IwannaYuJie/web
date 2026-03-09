import { useEffect } from 'react'

export function useGoogleCSE() {
  useEffect(() => {
    const initGCSE = () => {
      if (window.google?.search?.cse?.element) {
        try {
          window.google.search.cse.element.go()
        } catch (error) {
          console.warn('GCSE init error:', error)
        }
      }
    }

    const gcseTimer = window.setTimeout(initGCSE, 100)
    const gcseInterval = window.setInterval(initGCSE, 1000)
    const gcseStopTimer = window.setTimeout(() => window.clearInterval(gcseInterval), 5000)

    return () => {
      window.clearInterval(gcseInterval)
      window.clearTimeout(gcseStopTimer)
      window.clearTimeout(gcseTimer)
    }
  }, [])
}
