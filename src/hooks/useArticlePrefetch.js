import { useCallback, useEffect, useRef } from 'react'
import { prefetchArticleById } from '../services/articles'
import { prefetchRoute } from '../utils/routePrefetch'

export function useArticlePrefetch(delayMs = 80) {
  const timerRef = useRef(null)

  const cancelPrefetch = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => cancelPrefetch, [cancelPrefetch])

  const schedulePrefetch = useCallback((articleId) => {
    cancelPrefetch()
    if (!articleId) {
      return
    }
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      prefetchRoute(`/article/${articleId}`)
      prefetchArticleById(articleId)
    }, delayMs)
  }, [cancelPrefetch, delayMs])

  const prefetchRouteChunkOnly = useCallback((articleId) => {
    if (!articleId) {
      return
    }
    prefetchRoute(`/article/${articleId}`)
  }, [])

  return {
    schedulePrefetch,
    cancelPrefetch,
    prefetchRouteChunkOnly,
  }
}
