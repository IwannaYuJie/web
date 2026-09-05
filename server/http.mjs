import { timingSafeEqual } from 'node:crypto'
import { ArticleError } from '../shared/articles/errors.js'

const JSON_HEADERS = {
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
}

export function sendJson(response, data, status = 200) {
  response.writeHead(status, JSON_HEADERS)
  response.end(JSON.stringify(data))
}

export function requireAdminKey(request, adminKey) {
  if (!adminKey) {
    throw new ArticleError('服务器未配置 ADMIN_KEY，无法执行写操作', 500)
  }
  const actual = Buffer.from(String(request.headers['x-admin-key'] || ''))
  const expected = Buffer.from(String(adminKey))
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new ArticleError('未授权的操作：密码错误', 401)
  }
}

export async function readJsonBody(request, maxBytes = 2 * 1024 * 1024) {
  const chunks = []
  let totalBytes = 0
  for await (const chunk of request) {
    totalBytes += chunk.length
    if (totalBytes > maxBytes) {
      throw new ArticleError('请求体过大', 413)
    }
    chunks.push(chunk)
  }
  if (chunks.length === 0) {
    return {}
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new ArticleError('无效的 JSON 请求体')
  }
}
