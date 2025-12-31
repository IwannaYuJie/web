import { useState, useEffect, useMemo, useCallback } from 'react'

/**
 * 文章列表管理 Hook
 * 提供文章的获取、搜索、分页、标签过滤等功能
 */
export function useArticles(options = {}) {
  const { pageSize = 10 } = options

  // 基础状态
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 过滤和搜索状态
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [selectedTags, setSelectedTags] = useState([])
  const [sortBy, setSortBy] = useState('date') // date, readTime, title
  const [sortOrder, setSortOrder] = useState('desc') // asc, desc

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)

  // 获取文章列表
  const fetchArticles = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/articles')
      if (!response.ok) {
        throw new Error('获取文章列表失败')
      }
      const data = await response.json()
      setArticles(data)
    } catch (err) {
      console.error('获取文章失败:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // 初始加载
  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  // 提取所有分类
  const categories = useMemo(() => {
    const cats = new Set(articles.map(a => a.category).filter(Boolean))
    return ['全部', ...Array.from(cats).sort()]
  }, [articles])

  // 提取所有标签
  const allTags = useMemo(() => {
    const tags = new Set()
    articles.forEach(a => {
      if (a.tags && Array.isArray(a.tags)) {
        a.tags.forEach(t => tags.add(t))
      }
    })
    return Array.from(tags).sort()
  }, [articles])

  // 过滤和排序后的文章
  const filteredArticles = useMemo(() => {
    let result = [...articles]

    // 搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(article =>
        article.title?.toLowerCase().includes(query) ||
        article.description?.toLowerCase().includes(query) ||
        article.content?.toLowerCase().includes(query) ||
        article.category?.toLowerCase().includes(query) ||
        (article.tags && article.tags.some(t => t.toLowerCase().includes(query)))
      )
    }

    // 分类过滤
    if (selectedCategory !== '全部') {
      result = result.filter(a => a.category === selectedCategory)
    }

    // 标签过滤
    if (selectedTags.length > 0) {
      result = result.filter(a =>
        a.tags && selectedTags.every(t => a.tags.includes(t))
      )
    }

    // 排序
    result.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'date':
          comparison = new Date(b.date) - new Date(a.date)
          break
        case 'readTime':
          comparison = parseInt(b.readTime || 0) - parseInt(a.readTime || 0)
          break
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '')
          break
        default:
          comparison = new Date(b.date) - new Date(a.date)
      }

      return sortOrder === 'asc' ? -comparison : comparison
    })

    return result
  }, [articles, searchQuery, selectedCategory, selectedTags, sortBy, sortOrder])

  // 分页后的文章
  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredArticles.slice(start, start + pageSize)
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
 * 单篇文章管理 Hook
 * 提供文章详情获取、点赞等功能
 */
export function useArticle(id) {
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [liked, setLiked] = useState(false)

  // 从 localStorage 读取点赞状态
  useEffect(() => {
    const likedArticles = JSON.parse(localStorage.getItem('likedArticles') || '[]')
    setLiked(likedArticles.includes(parseInt(id)))
  }, [id])

  // 获取文章详情
  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return

      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/articles?id=${id}`)
        if (!response.ok) {
          throw new Error('获取文章失败')
        }
        const data = await response.json()
        setArticle(data)
      } catch (err) {
        console.error('获取文章详情失败:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchArticle()
  }, [id])

  // 点赞文章
  const toggleLike = useCallback(() => {
    const likedArticles = JSON.parse(localStorage.getItem('likedArticles') || '[]')
    const articleId = parseInt(id)

    if (liked) {
      const newLiked = likedArticles.filter(a => a !== articleId)
      localStorage.setItem('likedArticles', JSON.stringify(newLiked))
    } else {
      likedArticles.push(articleId)
      localStorage.setItem('likedArticles', JSON.stringify(likedArticles))
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
