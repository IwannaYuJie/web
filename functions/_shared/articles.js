import { parseArticleRequestMeta } from '../../shared/articles/request.js'

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
  return parseArticleRequestMeta({
    url: request.url,
    method: request.method,
    methodOverride: request.headers.get('X-HTTP-Method-Override'),
  })
}

export async function readArticles(env) {
  const articles = await env.ARTICLES_KV.get(ARTICLES_LIST_KEY, { type: 'json' })
  return Array.isArray(articles) ? articles : []
}

export async function writeArticles(env, articles) {
  await env.ARTICLES_KV.put(ARTICLES_LIST_KEY, JSON.stringify(articles))
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
