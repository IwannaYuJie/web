import { ArticleError } from '../shared/articles/errors.js'
import { isArticleApiPath, parseArticleRequestMeta } from '../shared/articles/request.js'
import { createArticleService } from '../shared/articles/service.js'
import { readJsonBody, requireAdminKey, sendJson } from './http.mjs'

export function createArticleApiHandler({ store, adminKey }) {
  const service = createArticleService(store)

  return async (request, response) => {
    try {
      const { url, method, articleId } = parseArticleRequestMeta({
        url: request.url || '/',
        method: request.method,
        methodOverride: request.headers['x-http-method-override'],
      })

      if (url.pathname === '/healthz' && method === 'GET') {
        const articles = await store.read()
        sendJson(response, { ok: true, service: 'orange-cat-blog-api', articleCount: articles.length })
        return
      }
      if (!isArticleApiPath(url.pathname)) {
        throw new ArticleError('接口不存在', 404)
      }
      if (method === 'OPTIONS') {
        response.writeHead(204, {
          'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key, X-HTTP-Method-Override',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Cache-Control': 'no-store',
          Vary: 'Origin',
        })
        response.end()
        return
      }
      if (method === 'GET') {
        sendJson(response, articleId ? await service.get(articleId) : await service.list())
        return
      }
      if (!['POST', 'PUT', 'DELETE'].includes(method)) {
        throw new ArticleError('不支持的请求方法', 405)
      }

      requireAdminKey(request, adminKey)
      if (articleId === 'auth-check' && method === 'POST') {
        sendJson(response, { status: 'ok', message: '验证通过' })
        return
      }
      if (method === 'POST') {
        if (articleId) {
          throw new ArticleError('POST 请求不应包含文章 ID，请使用 PUT 更新文章')
        }
        sendJson(response, await service.create(await readJsonBody(request)), 201)
        return
      }
      if (!articleId) {
        throw new ArticleError('缺少文章 ID')
      }
      if (method === 'PUT') {
        sendJson(response, await service.update(articleId, await readJsonBody(request)))
        return
      }
      sendJson(response, await service.remove(articleId))
    } catch (error) {
      const status = error instanceof ArticleError ? error.status : 500
      const message = error instanceof ArticleError ? error.message : '服务器内部错误'
      if (status >= 500) {
        console.error('[orange-cat-api]', error)
      }
      sendJson(response, { error: message }, status)
    }
  }
}
