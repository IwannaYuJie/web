import { ArticleError } from './errors.js'

export function isArticleApiPath(pathname) {
  return /^\/api\/articles(?:\/[^/]+)?\/?$/.test(pathname)
}

// Node 与 Pages 都先转换成此结构，保持查询参数及方法覆盖的兼容行为。
export function parseArticleRequestMeta({ url, method = 'GET', methodOverride }) {
  const parsedUrl = new URL(url, 'http://localhost')
  if (method === 'POST' && methodOverride) {
    const override = String(methodOverride).toUpperCase()
    if (!['PUT', 'DELETE'].includes(override)) {
      throw new ArticleError('不支持的请求方法覆盖')
    }
    method = override
  }
  const pathId = isArticleApiPath(parsedUrl.pathname)
    ? parsedUrl.pathname.split('/').filter(Boolean)[2]
    : null
  return {
    url: parsedUrl,
    method,
    articleId: parsedUrl.searchParams.get('id') || pathId || null,
  }
}
