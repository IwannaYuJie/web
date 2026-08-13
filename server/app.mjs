import { timingSafeEqual } from 'node:crypto'
import { createServer } from 'node:http'
import {
  nextArticleId,
  normalizeArticleInput,
  sortArticlesByDate,
  validateRequiredArticleFields
} from '../functions/_shared/articles.js'
import { ArticleStore } from './articleStore.mjs'

const JSON_HEADERS = {
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff'
}

class RequestError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.status = status
  }
}

function sendJson(response, data, status = 200, extraHeaders = {}) {
  response.writeHead(status, { ...JSON_HEADERS, ...extraHeaders })
  response.end(JSON.stringify(data))
}

function parseRequest(request) {
  const url = new URL(request.url || '/', 'http://127.0.0.1')
  const pathParts = url.pathname.split('/').filter(Boolean)
  const queryId = url.searchParams.get('id')
  const pathId =
    pathParts.length === 3 && pathParts[0] === 'api' && pathParts[1] === 'articles'
      ? pathParts[2]
      : null
  let method = request.method || 'GET'

  const methodOverride = request.headers['x-http-method-override']
  if (method === 'POST' && methodOverride) {
    const normalizedOverride = String(methodOverride).toUpperCase()
    if (!['PUT', 'DELETE'].includes(normalizedOverride)) {
      throw new RequestError('不支持的请求方法覆盖')
    }
    method = normalizedOverride
  }

  return {
    articleId: queryId || pathId,
    method,
    url
  }
}

function secureKeyEquals(actual, expected) {
  if (!actual || !expected) {
    return false
  }

  const actualBuffer = Buffer.from(String(actual))
  const expectedBuffer = Buffer.from(String(expected))
  if (actualBuffer.length !== expectedBuffer.length) {
    return false
  }

  return timingSafeEqual(actualBuffer, expectedBuffer)
}

function requireAdminKey(request, adminKey) {
  if (!adminKey) {
    throw new RequestError('服务器未配置 ADMIN_KEY，无法执行写操作', 500)
  }

  if (!secureKeyEquals(request.headers['x-admin-key'], adminKey)) {
    throw new RequestError('未授权的操作：密码错误', 401)
  }
}

async function readJsonBody(request, maxBytes = 2 * 1024 * 1024) {
  const chunks = []
  let totalBytes = 0

  for await (const chunk of request) {
    totalBytes += chunk.length
    if (totalBytes > maxBytes) {
      throw new RequestError('请求体过大', 413)
    }
    chunks.push(chunk)
  }

  if (chunks.length === 0) {
    return {}
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new RequestError('无效的 JSON 请求体')
  }
}

function normalizeNewArticle(articleData, articles) {
  const now = new Date().toISOString().split('T')[0]
  const normalizedData = normalizeArticleInput(articleData, now)
  const missingField = validateRequiredArticleFields(normalizedData)

  if (missingField) {
    throw new RequestError(`缺少必填字段: ${missingField}`)
  }

  return {
    id: nextArticleId(articles),
    ...normalizedData,
    createdAt: now,
    updatedAt: now
  }
}

async function handleArticlesRequest({ request, response, store, adminKey, method, articleId }) {
  if (method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key, X-HTTP-Method-Override',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Cache-Control': 'no-store',
      Vary: 'Origin'
    })
    response.end()
    return
  }

  if (articleId === 'auth-check' && method === 'POST') {
    requireAdminKey(request, adminKey)
    sendJson(response, { status: 'ok', message: '验证通过' })
    return
  }

  if (method === 'GET') {
    const articles = await store.read()
    if (!articleId) {
      sendJson(response, sortArticlesByDate(articles))
      return
    }

    const article = articles.find((item) => item.id === Number.parseInt(articleId, 10))
    if (!article) {
      throw new RequestError('文章不存在', 404)
    }

    sendJson(response, article)
    return
  }

  requireAdminKey(request, adminKey)

  if (method === 'POST') {
    if (articleId) {
      throw new RequestError('POST 请求不应包含文章 ID，请使用 PUT 更新文章')
    }

    const articleData = await readJsonBody(request)
    const createdArticle = await store.update((articles) => {
      const article = normalizeNewArticle(articleData, articles)
      articles.push(article)
      return { articles, result: article }
    })
    sendJson(response, createdArticle, 201)
    return
  }

  if (method === 'PUT') {
    if (!articleId) {
      throw new RequestError('缺少文章 ID')
    }

    const articleData = await readJsonBody(request)
    const updatedArticle = await store.update((articles) => {
      const numericId = Number.parseInt(articleId, 10)
      const articleIndex = articles.findIndex((item) => item.id === numericId)
      if (articleIndex === -1) {
        throw new RequestError('文章不存在', 404)
      }

      const existingArticle = articles[articleIndex]
      const now = new Date().toISOString().split('T')[0]
      const normalizedData = normalizeArticleInput(
        { ...existingArticle, ...articleData },
        existingArticle.date || now
      )
      const missingField = validateRequiredArticleFields(normalizedData)
      if (missingField) {
        throw new RequestError(`缺少必填字段: ${missingField}`)
      }

      const article = {
        ...normalizedData,
        id: numericId,
        createdAt: existingArticle.createdAt || now,
        updatedAt: now
      }
      articles[articleIndex] = article
      return { articles, result: article }
    })
    sendJson(response, updatedArticle)
    return
  }

  if (method === 'DELETE') {
    if (!articleId) {
      throw new RequestError('缺少文章 ID')
    }

    const deletedArticle = await store.update((articles) => {
      const numericId = Number.parseInt(articleId, 10)
      const articleIndex = articles.findIndex((item) => item.id === numericId)
      if (articleIndex === -1) {
        throw new RequestError('文章不存在', 404)
      }

      const [article] = articles.splice(articleIndex, 1)
      return { articles, result: article }
    })
    sendJson(response, { message: '文章删除成功', deletedArticle })
    return
  }

  throw new RequestError('不支持的请求方法', 405)
}

export async function createArticleApiServer({ dataFile, adminKey }) {
  const store = new ArticleStore(dataFile)
  await store.init()

  return createServer(async (request, response) => {
    try {
      const parsedRequest = parseRequest(request)

      if (parsedRequest.url.pathname === '/healthz' && parsedRequest.method === 'GET') {
        const articles = await store.read()
        sendJson(response, {
          ok: true,
          service: 'orange-cat-blog-api',
          articleCount: articles.length
        })
        return
      }

      if (
        parsedRequest.url.pathname !== '/api/articles' &&
        !parsedRequest.url.pathname.startsWith('/api/articles/')
      ) {
        throw new RequestError('接口不存在', 404)
      }

      await handleArticlesRequest({
        request,
        response,
        store,
        adminKey,
        ...parsedRequest
      })
    } catch (error) {
      const status = error instanceof RequestError ? error.status : 500
      const message = error instanceof RequestError ? error.message : '服务器内部错误'
      if (status >= 500) {
        console.error('[orange-cat-api]', error)
      }
      sendJson(response, { error: message }, status)
    }
  })
}
