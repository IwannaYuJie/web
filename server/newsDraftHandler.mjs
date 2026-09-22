import { timingSafeEqual } from 'node:crypto'
import { ArticleError } from '../shared/articles/errors.js'
import { createNewsDraftService } from '../shared/news-drafts/service.js'
import { readJsonBody, requireAdminKey, sendJson } from './http.mjs'

export function isNewsDraftPath(pathname) {
  return pathname === '/api/news-drafts' || pathname.startsWith('/api/news-drafts/')
}

function requireCollectorToken(request, token) {
  if (!token) {
    throw new ArticleError('资讯采集尚未配置', 503)
  }
  const actual = Buffer.from(String(request.headers.authorization || ''))
  const expected = Buffer.from(`Bearer ${token}`)
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new ArticleError('采集身份验证失败', 401)
  }
}

function workerEndpoint(workerUrl) {
  try {
    const url = new URL(workerUrl)
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
      throw new Error('invalid')
    }
    url.pathname = `${url.pathname.replace(/\/$/, '')}/run`
    return url.href
  } catch {
    throw new ArticleError('资讯采集服务地址尚未正确配置', 503)
  }
}

export function createNewsDraftHandler({
  store,
  articleStore,
  adminKey,
  collectorToken = '',
  workerUrl = '',
  fetchImpl = globalThis.fetch,
  now,
  makeId
}) {
  const enabled = Boolean(collectorToken && workerUrl)
  const service = createNewsDraftService({ store, articleStore, enabled, now, makeId })
  return async (request, response) => {
    try {
      const url = new URL(request.url || '/', 'http://localhost')
      const segments = url.pathname.slice('/api/news-drafts'.length).split('/').filter(Boolean)
      const method = (request.method || 'GET').toUpperCase()
      if (segments[0] === 'collector') {
        requireCollectorToken(request, collectorToken)
        if (segments.length === 1 && method === 'GET') {
          sendJson(response, await service.collectorContext())
          return
        }
        if (segments.length !== 2 || method !== 'POST') {
          throw new ArticleError('采集接口不存在', 404)
        }
        const data = await readJsonBody(request, 256 * 1024)
        if (segments[1] === 'start') {
          sendJson(response, await service.start(data))
        } else if (segments[1] === 'ingest') {
          sendJson(response, await service.ingest(data))
        } else if (segments[1] === 'finish') {
          sendJson(response, await service.finish(data))
        } else {
          throw new ArticleError('采集接口不存在', 404)
        }
        return
      }

      // Draft contents and configuration are private even for GET/OPTIONS requests.
      requireAdminKey(request, adminKey)
      if (segments.length === 0 && method === 'GET') {
        sendJson(response, await service.list())
        return
      }
      if (segments.length === 1 && segments[0] === 'collect' && method === 'POST') {
        if (!enabled) {
          throw new ArticleError('资讯采集尚未配置，请先连接 Python Worker', 503)
        }
        let result
        const endpoint = workerEndpoint(workerUrl)
        const context = await service.collectorContext()
        if (context.runId) {
          throw new ArticleError('已有资讯采集任务正在运行', 409)
        }
        if (!context.remaining) {
          throw new ArticleError('今天已经生成 3 篇草稿，明天再来吧', 429)
        }
        try {
          result = await fetchImpl(endpoint, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${collectorToken}`,
              'Content-Type': 'application/json'
            },
            body: '{}',
            signal: AbortSignal.timeout(12000),
            redirect: 'error'
          })
        } catch {
          throw new ArticleError('采集服务暂时无法连接，请稍后刷新查看任务状态', 502)
        }
        if (!result.ok) {
          if (result.status === 409) {
            throw new ArticleError('已有资讯采集任务正在运行', 409)
          }
          if (result.status === 429) {
            throw new ArticleError('今天已经生成 3 篇草稿，明天再来吧', 429)
          }
          throw new ArticleError('采集服务启动失败，请稍后重试', 502)
        }
        sendJson(response, { status: 'accepted' }, 202)
        return
      }
      if (segments.length === 1 && method === 'PUT') {
        sendJson(response, await service.edit(segments[0], await readJsonBody(request, 256 * 1024)))
        return
      }
      if (segments.length === 1 && method === 'DELETE') {
        sendJson(response, await service.dismiss(segments[0]))
        return
      }
      if (segments.length === 2 && method === 'POST' && segments[1] === 'dismiss') {
        sendJson(response, await service.dismiss(segments[0]))
        return
      }
      if (segments.length === 2 && method === 'POST' && segments[1] === 'publish') {
        sendJson(response, await service.publish(segments[0]))
        return
      }
      throw new ArticleError('草稿接口不存在', 404)
    } catch (error) {
      // Never echo upstream bodies or log headers/config: those may contain a collector secret.
      const status = error instanceof ArticleError ? error.status : 500
      sendJson(
        response,
        { error: error instanceof ArticleError ? error.message : '草稿保存失败，请稍后重试' },
        status
      )
    }
  }
}
