export function getArticleCategories(articles) {
  if (!articles.length) {
    return ['全部']
  }

  const categories = new Set(articles.map(article => article.category).filter(Boolean))
  return ['全部', ...Array.from(categories).sort()]
}

export function getArticleTags(articles) {
  const tags = new Set()
  articles.forEach(article => {
    if (Array.isArray(article.tags)) {
      article.tags.forEach(tag => tags.add(tag))
    }
  })
  return Array.from(tags).sort()
}

export function filterArticles(articles, {
  searchQuery = '',
  selectedCategory = '全部',
  selectedTags = [],
  includeContent = false,
} = {}) {
  let result = articles

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim()
    result = result.filter(article =>
      article.title?.toLowerCase().includes(query) ||
      article.description?.toLowerCase().includes(query) ||
      (includeContent && article.content?.toLowerCase().includes(query)) ||
      article.category?.toLowerCase().includes(query) ||
      (Array.isArray(article.tags) && article.tags.some(tag => tag.toLowerCase().includes(query)))
    )
  }

  if (selectedCategory !== '全部') {
    result = result.filter(article => article.category === selectedCategory)
  }

  if (selectedTags.length > 0) {
    result = result.filter(article =>
      Array.isArray(article.tags) && selectedTags.every(tag => article.tags.includes(tag))
    )
  }

  return result
}

export function sortArticles(articles, sortBy = 'date', sortOrder = 'desc') {
  const result = [...articles]

  result.sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case 'date':
        comparison = new Date(b.date) - new Date(a.date)
        break
      case 'readTime':
        comparison = Number.parseInt(b.readTime || 0, 10) - Number.parseInt(a.readTime || 0, 10)
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
}

export function paginateArticles(articles, currentPage, pageSize) {
  const start = (currentPage - 1) * pageSize
  return articles.slice(start, start + pageSize)
}
