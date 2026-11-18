import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  getArticlesCacheGen,
  getCachedArticleById,
  getCachedArticlesList,
  getLikedArticleIds,
  isArticleStale,
  isArticlesListStale,
  loadArticleById,
  loadArticlesList,
  setLikedArticleIds,
  subscribeArticlesCache,
} from '../services/articles'
import { filterArticles, getArticleCategories, getArticleTags, paginateArticles, sortArticles } from '../utils/articleFilters'

/**
 * 文章列表数据 Hook（带内存 SWR 缓存与后台静默刷新）
 */
export function useArticlesData() {
  const [articles, setArticles] = useState(() => getCachedArticlesList() || [])
  const [loading, setLoading] = useState(() => !getCachedArticlesList())
  const [error, setError] = useState(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const fetchArticles = useCallback(async ({ silent = false, force = true } = {}) => {
    const hasCached = Boolean(getCachedArticlesList())
    if (!silent && !hasCached) {
      setLoading(true)
    }
    if (!silent) {
      setError(null)
    }

    const reqGen = getArticlesCacheGen()
    try {
      const data = await loadArticlesList({ force })
      if (mountedRef.current) {
        if (reqGen === getArticlesCacheGen()) {
          setArticles(data)
          setError(null)
        } else {
          const fresher = getCachedArticlesList()
          if (fresher) {
            setArticles(fresher)
            setError(null)
          }
        }
      }
      return data
    } catch (err) {
      console.error('获取文章失败:', err)
      if (mountedRef.current && !hasCached && reqGen === getArticlesCacheGen()) {
        setError(err.message)
      }
      return null
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const cached = getCachedArticlesList()
    if (cached) {
      setArticles(cached)
      setLoading(false)
      if (isArticlesListStale()) {
        fetchArticles({ silent: true, force: true })
      }
    } else {
      fetchArticles({ silent: false, force: false })
    }

    const unsubscribe = subscribeArticlesCache((event) => {
      if (!mountedRef.current) {
        return
      }
      if (event?.type === 'list' && Array.isArray(event.data)) {
        setArticles(event.data)
        setLoading(false)
        setError(null)
      }
    })

    return unsubscribe
  }, [fetchArticles])

  return {
    articles,
    loading,
    error,
    fetchArticles,
  }
}

/**
 * 文章列表管理 Hook
 * 提供文章的获取、搜索、分页、标签过滤等功能
 */
export function useArticles(options = {}) {
  const { pageSize = 10 } = options
  const {
    articles,
    loading,
    error,
    fetchArticles,
  } = useArticlesData()

  // 过滤和搜索状态
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [selectedTags, setSelectedTags] = useState([])
  const [sortBy, setSortBy] = useState('date') // date, readTime, title
  const [sortOrder, setSortOrder] = useState('desc') // asc, desc

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)

  // 提取所有分类
  const categories = useMemo(() => {
    return getArticleCategories(articles)
  }, [articles])

  // 提取所有标签
  const allTags = useMemo(() => {
    return getArticleTags(articles)
  }, [articles])

  // 过滤和排序后的文章
  const filteredArticles = useMemo(() => {
    const filtered = filterArticles(articles, {
      searchQuery,
      selectedCategory,
      selectedTags,
      includeContent: true,
    })
    return sortArticles(filtered, sortBy, sortOrder)
  }, [articles, searchQuery, selectedCategory, selectedTags, sortBy, sortOrder])

  // 分页后的文章
  const paginatedArticles = useMemo(() => {
    return paginateArticles(filteredArticles, currentPage, pageSize)
  }, [filteredArticles, currentPage, pageSize])

  // 总页数
  const totalPages = useMemo(() => {
    return Math.ceil(filteredArticles.length / pageSize)
  }, [filteredArticles.length, pageSize])

  // 重置分页
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, selectedTags])

  // 切换标签选择
  const toggleTag = useCallback((tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }, [])

  // 清除所有过滤
  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setSelectedCategory('全部')
    setSelectedTags([])
    setCurrentPage(1)
  }, [])

  return {
    // 数据
    articles: paginatedArticles,
    allArticles: articles,
    filteredArticles,
    loading,
    error,

    // 分类和标签
    categories,
    allTags,
    selectedCategory,
    setSelectedCategory,
    selectedTags,
    toggleTag,

    // 搜索
    searchQuery,
    setSearchQuery,

    // 排序
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,

    // 分页
    currentPage,
    setCurrentPage,
    totalPages,
    pageSize,
    totalCount: filteredArticles.length,

    // 操作
    fetchArticles,
    clearFilters,
  }
}

/**
 * 单篇文章管理 Hook（带内存 SWR 缓存）
 * 提供文章详情获取、点赞等功能
 */
export function useArticle(id) {
  const [article, setArticle] = useState(() => getCachedArticleById(id))
  const [loading, setLoading] = useState(() => !getCachedArticleById(id))
  const [error, setError] = useState(null)
  const [liked, setLiked] = useState(false)

  // 从 localStorage 读取点赞状态
  useEffect(() => {
    const likedArticles = getLikedArticleIds()
    setLiked(likedArticles.includes(parseInt(id, 10)))
  }, [id])

  // 获取文章详情（命中缓存立即展示，过期则后台静默刷新）
  useEffect(() => {
    if (!id) {
      return undefined
    }

    let active = true
    const cached = getCachedArticleById(id)

    if (cached) {
      setArticle(cached)
      setLoading(false)
      setError(null)
    } else {
      setArticle(null)
      setLoading(true)
      setError(null)
    }

    if (!cached || isArticleStale(id)) {
      const reqGen = getArticlesCacheGen()
      loadArticleById(id, { force: Boolean(cached) })
        .then((data) => {
          if (!active || reqGen !== getArticlesCacheGen()) {
            return
          }
          setArticle(data)
          setError(null)
          setLoading(false)
        })
        .catch((err) => {
          if (!active || reqGen !== getArticlesCacheGen()) {
            return
          }
          console.error('获取文章详情失败:', err)
          if (!cached) {
            setError(err.message)
            setLoading(false)
          }
        })
    }

    const unsubscribe = subscribeArticlesCache((event) => {
      if (!active) {
        return
      }
      if (event?.type === 'detail' && event.id === String(id)) {
        setArticle(event.data)
        setLoading(false)
        setError(null)
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [id])

  // 点赞文章
  const toggleLike = useCallback(() => {
    const likedArticles = getLikedArticleIds()
    const articleId = parseInt(id, 10)

    if (liked) {
      const newLiked = likedArticles.filter(a => a !== articleId)
      setLikedArticleIds(newLiked)
    } else if (!likedArticles.includes(articleId)) {
      setLikedArticleIds([...likedArticles, articleId])
    }

    setLiked(!liked)
  }, [id, liked])

  return {
    article,
    loading,
    error,
    liked,
    toggleLike,
  }
}

export default useArticles
