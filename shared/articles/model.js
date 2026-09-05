export function sortArticlesByDate(articles) {
  return [...articles].sort((a, b) => new Date(b.date) - new Date(a.date))
}

export function normalizeArticleInput(articleData = {}, fallbackDate = new Date().toISOString().split('T')[0]) {
  return {
    title: String(articleData.title || '').trim(),
    description: String(articleData.description || '').trim(),
    date: articleData.date || fallbackDate,
    category: String(articleData.category || '').trim(),
    readTime: String(articleData.readTime || '').trim(),
    content: articleData.content || '',
    tags: Array.isArray(articleData.tags)
      ? articleData.tags.map((tag) => String(tag).trim()).filter(Boolean)
      : [],
    author: String(articleData.author || '橘猫博主').trim() || '橘猫博主',
  }
}

export function validateRequiredArticleFields(articleData) {
  const requiredFields = ['title', 'description', 'category', 'readTime']
  return requiredFields.find((field) => !articleData[field]) || null
}

export function nextArticleId(articles) {
  if (!articles.length) {
    return 1
  }
  return Math.max(...articles.map((article) => Number(article.id) || 0)) + 1
}
