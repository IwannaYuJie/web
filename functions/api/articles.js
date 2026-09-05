import { ArticleError } from '../../shared/articles/errors.js'
import { isArticleApiPath } from '../../shared/articles/request.js'
import { createArticleService } from '../../shared/articles/service.js'
import { createKvArticleStore } from '../_shared/articleStore.js'
import { errorResponse, handleArticleOptions, jsonResponse, parseArticleRequest, requireAdminKey } from '../_shared/articles.js'

async function readJsonBody(request) {
  try {
    return await request.json()
  } catch {
    throw new ArticleError('无效的 JSON 请求体')
  }
}

// Pages 只负责 Web 请求与 KV 适配，文章规则与 VPS、本地开发共用。
export async function onRequest({ request, env }) {
  try {
    const { url, method, articleId } = parseArticleRequest(request)
    if (!isArticleApiPath(url.pathname)) {
      throw new ArticleError('接口不存在', 404)
    }
    if (method === 'OPTIONS') {
      return handleArticleOptions()
    }
    if (!env.ARTICLES_KV) {
      return errorResponse('KV 命名空间未配置，请在 Cloudflare Pages 设置中绑定 ARTICLES_KV', 500)
    }
    const service = createArticleService(createKvArticleStore(env))
    if (method === 'GET') {
      return jsonResponse(articleId ? await service.get(articleId) : await service.list())
    }
    if (!['POST', 'PUT', 'DELETE'].includes(method)) {
      throw new ArticleError('不支持的请求方法', 405)
    }
    const auth = requireAdminKey(request, env)
    if (!auth.ok) {
      return auth.response
    }
    if (articleId === 'auth-check' && method === 'POST') {
      return jsonResponse({ status: 'ok', message: '验证通过' })
    }
    if (method === 'POST') {
      if (articleId) {
        throw new ArticleError('POST 请求不应包含文章 ID，请使用 PUT 更新文章')
      }
      return jsonResponse(await service.create(await readJsonBody(request)), 201)
    }
    if (!articleId) {
      throw new ArticleError('缺少文章 ID')
    }
    if (method === 'PUT') {
      return jsonResponse(await service.update(articleId, await readJsonBody(request)))
    }
    return jsonResponse(await service.remove(articleId))
  } catch (error) {
    if (error instanceof ArticleError) {
      return errorResponse(error.message, error.status)
    }
    console.error('文章请求处理失败:', error)
    return errorResponse('服务器内部错误', 500)
  }
}
