import { useEffect } from 'react'

const GOOGLE_CSE_ID = 'google-cse-script'
const GOOGLE_CSE_SRC = 'https://cse.google.com/cse.js?cx=018dca262a2d949c4'

let googleCsePromise = null

function loadGoogleCSE() {
  if (window.google?.search?.cse?.element) {
    return Promise.resolve()
  }

  if (googleCsePromise) {
    return googleCsePromise
  }

  googleCsePromise = new Promise((resolve, reject) => {
    let script = document.getElementById(GOOGLE_CSE_ID)

    const handleLoad = () => resolve()
    const handleError = () => {
      googleCsePromise = null
      reject(new Error('Google CSE script load failed'))
    }

    if (!script) {
      script = document.createElement('script')
      script.id = GOOGLE_CSE_ID
      script.async = true
      script.src = GOOGLE_CSE_SRC
      document.head.append(script)
    }

    script.addEventListener('load', handleLoad, { once: true })
    script.addEventListener('error', handleError, { once: true })
  })

  return googleCsePromise
}

export function useGoogleCSE() {
  useEffect(() => {
    let cancelled = false

    const initGCSE = async () => {
      try {
        await loadGoogleCSE()
        if (!cancelled && window.google?.search?.cse?.element) {
          window.google.search.cse.element.go()
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('GCSE init error:', error)
        }
      }
    }

    initGCSE()

    return () => {
      cancelled = true
    }
  }, [])
}
