function parseArticleDate(article) {
  const timestamp = Date.parse(article?.date || '')
  return Number.isNaN(timestamp) ? 0 : timestamp
}

export function getSortedArticles(articles) {
  return [...articles].sort((a, b) => parseArticleDate(b) - parseArticleDate(a))
}

export function getBlogStats(articles) {
  const categories = new Set()
  const tags = new Set()
  let totalReadMinutes = 0

  articles.forEach(article => {
    if (article.category) {
      categories.add(article.category)
    }

    if (Array.isArray(article.tags)) {
      article.tags.forEach(tag => tags.add(tag))
    }

    totalReadMinutes += Number.parseInt(article.readTime || 0, 10) || 0
  })

  const latestArticle = getSortedArticles(articles)[0]

  return {
    articleCount: articles.length,
    categoryCount: categories.size,
    tagCount: tags.size,
    totalReadMinutes,
    latestDate: latestArticle?.date || '',
  }
}

export function getFeaturedArticles(articles, limit = 3) {
  return getSortedArticles(articles).slice(0, limit)
}

export function getArchiveGroups(articles) {
  const groups = new Map()

  getSortedArticles(articles).forEach(article => {
    const year = article.date ? String(article.date).slice(0, 4) : '未归档'
    const group = groups.get(year) || []
    group.push(article)
    groups.set(year, group)
  })

  return Array.from(groups.entries()).map(([year, items]) => ({
    year,
    items,
  }))
}

export function getTagCloud(articles) {
  const counts = new Map()

  articles.forEach(article => {
    if (!Array.isArray(article.tags)) {
      return
    }

    article.tags.forEach(tag => {
      counts.set(tag, (counts.get(tag) || 0) + 1)
    })
  })

  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
}

export function getCategorySummaries(articles) {
  const summaries = new Map()

  articles.forEach(article => {
    if (!article.category) {
      return
    }

    const current = summaries.get(article.category) || {
      category: article.category,
      count: 0,
      readMinutes: 0,
      latestDate: '',
    }

    current.count += 1
    current.readMinutes += Number.parseInt(article.readTime || 0, 10) || 0

    if (!current.latestDate || parseArticleDate(article) > Date.parse(current.latestDate)) {
      current.latestDate = article.date
    }

    summaries.set(article.category, current)
  })

  return Array.from(summaries.values()).sort((a, b) => b.count - a.count || a.category.localeCompare(b.category))
}

export function getRelatedArticles(article, articles, limit = 3) {
  if (!article) {
    return []
  }

  const sourceTags = new Set(article.tags || [])

  return articles
    .filter(item => String(item.id) !== String(article.id))
    .map(item => {
      const tagScore = Array.isArray(item.tags)
        ? item.tags.filter(tag => sourceTags.has(tag)).length
        : 0
      const categoryScore = item.category === article.category ? 2 : 0

      return {
        article: item,
        score: tagScore + categoryScore,
      }
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || parseArticleDate(b.article) - parseArticleDate(a.article))
    .slice(0, limit)
    .map(item => item.article)
}
