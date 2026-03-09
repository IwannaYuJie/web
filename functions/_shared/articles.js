export const ARTICLES_LIST_KEY = 'articles_list'

export const articleCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key, X-HTTP-Method-Override',
  'Content-Type': 'application/json; charset=utf-8',
}

export function handleArticleOptions() {
  return new Response(null, {
    status: 204,
    headers: articleCorsHeaders,
  })
}

export function jsonResponse(data, status = 200, headers = articleCorsHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers,
  })
}

export function errorResponse(message, status = 400, headers = articleCorsHeaders) {
  return jsonResponse({ error: message }, status, headers)
}

export function parseArticleRequest(request) {
  const url = new URL(request.url)
  let method = request.method
  const pathParts = url.pathname.split('/').filter(Boolean)
  const articleId = url.searchParams.get('id') || pathParts[2] || null

  const methodOverride = request.headers.get('X-HTTP-Method-Override')
  if (method === 'POST' && methodOverride) {
    method = methodOverride.toUpperCase()
  }

  return { url, method, articleId }
}

export async function readArticles(env) {
  const articles = await env.ARTICLES_KV.get(ARTICLES_LIST_KEY, { type: 'json' })
  return Array.isArray(articles) ? articles : []
}

export async function writeArticles(env, articles) {
  await env.ARTICLES_KV.put(ARTICLES_LIST_KEY, JSON.stringify(articles))
}

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
  const missingField = requiredFields.find((field) => !articleData[field])
  return missingField || null
}

export function nextArticleId(articles) {
  if (!articles.length) {
    return 1
  }

  return Math.max(...articles.map((article) => Number(article.id) || 0)) + 1
}

export function requireAdminKey(request, env) {
  const adminKey = env.ADMIN_KEY
  const requestKey = request.headers.get('X-Admin-Key')

  if (!adminKey) {
    return { ok: false, response: errorResponse('服务器未配置 ADMIN_KEY，无法执行写操作', 500) }
  }

  if (requestKey !== adminKey) {
    return { ok: false, response: errorResponse('未授权的操作：密码错误', 401) }
  }

  return { ok: true }
}
