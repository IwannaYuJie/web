import { seededArticles } from '../shared/content/articlesSeed.js'

function parseRequestMeta(req) {
  const parsedUrl = new URL(req.url || '/', 'http://localhost')
  const pathname = parsedUrl.pathname
  const queryId = parsedUrl.searchParams.get('id')
  const pathMatch = pathname.match(/^\/api\/articles\/(\d+)$/)

  return {
    pathname,
    articleId: queryId || pathMatch?.[1] || null,
    isAuthCheck: queryId === 'auth-check' || pathname === '/api/articles/auth-check',
  }
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      if (!body) {
        resolve({})
        return
      }

      try {
        resolve(JSON.parse(body))
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

function setJsonCors(res, methods, headers) {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', methods)
  res.setHeader('Access-Control-Allow-Headers', headers)
}

export function createMockApiPlugin(devAdminKey) {
  let mockArticles = seededArticles.map((article) => ({ ...article }))

  return {
    name: 'mock-articles-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || ''
        const { pathname, articleId, isAuthCheck } = parseRequestMeta(req)
        let method = req.method || 'GET'
        const methodOverride = req.headers['x-http-method-override']

        if (method === 'POST' && methodOverride) {
          method = String(methodOverride).toUpperCase()
        }

        if (pathname.startsWith('/api/articles')) {
          setJsonCors(res, 'GET, POST, PUT, DELETE, OPTIONS', 'Content-Type, X-Admin-Key, X-HTTP-Method-Override')

          if (method === 'OPTIONS') {
            res.statusCode = 204
            res.end()
            return
          }

          if (isAuthCheck && method === 'POST') {
            res.statusCode = devAdminKey && req.headers['x-admin-key'] === devAdminKey ? 200 : 401
            res.end(JSON.stringify(res.statusCode === 200
              ? { status: 'ok', message: '验证通过' }
              : { error: '密码错误' }))
            return
          }

          if (['POST', 'PUT', 'DELETE'].includes(method)) {
            const adminKey = req.headers['x-admin-key']
            if (!devAdminKey || adminKey !== devAdminKey) {
              res.statusCode = 401
              res.end(JSON.stringify({ error: '未授权的操作：密码错误' }))
              return
            }
          }

          if (method === 'GET' && pathname === '/api/articles' && !articleId) {
            res.statusCode = 200
            res.end(JSON.stringify(mockArticles))
            return
          }

          if (method === 'GET' && articleId) {
            const article = mockArticles.find((item) => item.id === Number.parseInt(articleId, 10))
            res.statusCode = article ? 200 : 404
            res.end(JSON.stringify(article || { error: '文章不存在' }))
            return
          }

          if (method === 'POST' && pathname === '/api/articles' && !articleId) {
            readRequestBody(req)
              .then((newArticle) => {
                const maxId = mockArticles.length > 0 ? Math.max(...mockArticles.map((item) => item.id)) : 0
                const article = { ...newArticle, id: maxId + 1 }
                mockArticles.push(article)
                res.statusCode = 201
                res.end(JSON.stringify(article))
              })
              .catch(() => {
                res.statusCode = 400
                res.end(JSON.stringify({ error: '无效的请求数据' }))
              })
            return
          }

          if (method === 'PUT' && articleId) {
            readRequestBody(req)
              .then((updateData) => {
                const id = Number.parseInt(articleId, 10)
                const index = mockArticles.findIndex((item) => item.id === id)
                if (index === -1) {
                  res.statusCode = 404
                  res.end(JSON.stringify({ error: '文章不存在' }))
                  return
                }
                mockArticles[index] = { ...mockArticles[index], ...updateData, id }
                res.statusCode = 200
                res.end(JSON.stringify(mockArticles[index]))
              })
              .catch(() => {
                res.statusCode = 400
                res.end(JSON.stringify({ error: '无效的请求数据' }))
              })
            return
          }

          if (method === 'DELETE' && articleId) {
            const id = Number.parseInt(articleId, 10)
            const index = mockArticles.findIndex((item) => item.id === id)
            if (index === -1) {
              res.statusCode = 404
              res.end(JSON.stringify({ error: '文章不存在' }))
              return
            }
            const deletedArticle = mockArticles.splice(index, 1)[0]
            res.statusCode = 200
            res.end(JSON.stringify({ message: '文章删除成功', deletedArticle }))
            return
          }

          res.statusCode = 405
          res.end(JSON.stringify({ error: '不支持的请求方法' }))
          return
        }

        if (url === '/api/notify-email' && req.method === 'POST') {
          setJsonCors(res, 'POST, OPTIONS', 'Content-Type')
          readRequestBody(req)
            .then((payload) => {
              console.log('[Mock] 📧 邮件通知请求:', {
                success: payload.success,
                source: payload.source,
                prompt: payload.prompt?.substring(0, 50) + '...',
                imageCount: payload.images?.length || 0,
                error: payload.error,
              })
              res.statusCode = 200
              res.end(JSON.stringify({
                success: true,
                message: '[Mock] 本地开发模式，邮件未实际发送',
              }))
            })
            .catch(() => {
              res.statusCode = 400
              res.end(JSON.stringify({ error: '无效的请求数据' }))
            })
          return
        }

        if (url === '/api/notify-email' && req.method === 'OPTIONS') {
          setJsonCors(res, 'POST, OPTIONS', 'Content-Type')
          res.statusCode = 204
          res.end()
          return
        }

        next()
      })
    },
  }
}
