import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// 读取环境变量（开发环境使用）
// 注意：仅用于本地开发代理，生产环境使用 Cloudflare 环境变量
const ARK_API_KEY_DEV = process.env.ARK_API_KEY || 'YOUR_ARK_API_KEY_HERE'
const QINIU_AI_API_KEY_DEV = process.env.QINIU_AI_API_KEY || 'YOUR_QINIU_AI_API_KEY_HERE'

// 模拟文章数据（用于本地开发）
// 注意：所有测试示例文章已清空，可通过文章管理页面添加新文章
let mockArticles = []


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
    req.on('data', chunk => { body += chunk })
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

// Vite 配置文件
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const devAdminKey = env.DEV_ADMIN_KEY || process.env.DEV_ADMIN_KEY || ''

  return {
  plugins: [
    react(),
    // 自定义插件：模拟文章 API
    {
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

          // 处理文章 API 请求
          if (pathname.startsWith('/api/articles')) {
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key, X-HTTP-Method-Override')

            if (method === 'OPTIONS') {
              res.statusCode = 204
              res.end()
              return
            }

            if (isAuthCheck && method === 'POST') {
              if (devAdminKey && req.headers['x-admin-key'] === devAdminKey) {
                res.statusCode = 200
                res.end(JSON.stringify({ status: 'ok', message: '验证通过' }))
              } else {
                res.statusCode = 401
                res.end(JSON.stringify({ error: '密码错误' }))
              }
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
              const id = parseInt(articleId, 10)
              const article = mockArticles.find(a => a.id === id)
              if (article) {
                res.statusCode = 200
                res.end(JSON.stringify(article))
              } else {
                res.statusCode = 404
                res.end(JSON.stringify({ error: '文章不存在' }))
              }
              return
            }

            if (method === 'POST' && pathname === '/api/articles' && !articleId) {
              readRequestBody(req)
                .then((newArticle) => {
                  const maxId = mockArticles.length > 0 ? Math.max(...mockArticles.map(a => a.id)) : 0
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
              const id = parseInt(articleId, 10)
              readRequestBody(req)
                .then((updateData) => {
                  const index = mockArticles.findIndex(a => a.id === id)
                  if (index !== -1) {
                    mockArticles[index] = { ...mockArticles[index], ...updateData, id }
                    res.statusCode = 200
                    res.end(JSON.stringify(mockArticles[index]))
                  } else {
                    res.statusCode = 404
                    res.end(JSON.stringify({ error: '文章不存在' }))
                  }
                })
                .catch(() => {
                  res.statusCode = 400
                  res.end(JSON.stringify({ error: '无效的请求数据' }))
                })
              return
            }

            if (method === 'DELETE' && articleId) {
              const id = parseInt(articleId, 10)
              const index = mockArticles.findIndex(a => a.id === id)
              if (index !== -1) {
                const deletedArticle = mockArticles.splice(index, 1)[0]
                res.statusCode = 200
                res.end(JSON.stringify({ message: '文章删除成功', deletedArticle }))
              } else {
                res.statusCode = 404
                res.end(JSON.stringify({ error: '文章不存在' }))
              }
              return
            }

            res.statusCode = 405
            res.end(JSON.stringify({ error: '不支持的请求方法' }))
            return
          }

          // 处理邮件通知 API（本地 Mock - 仅打印日志）
          if (url === '/api/notify-email' && req.method === 'POST') {
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
            
            let body = ''
            req.on('data', chunk => { body += chunk })
            req.on('end', () => {
              try {
                const payload = JSON.parse(body)
                console.log('[Mock] 📧 邮件通知请求:', {
                  success: payload.success,
                  source: payload.source,
                  prompt: payload.prompt?.substring(0, 50) + '...',
                  imageCount: payload.images?.length || 0,
                  error: payload.error
                })
                res.statusCode = 200
                res.end(JSON.stringify({ 
                  success: true, 
                  message: '[Mock] 本地开发模式，邮件未实际发送' 
                }))
              } catch (error) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: '无效的请求数据' }))
              }
            })
            return
          }
          
          // 处理 OPTIONS 预检请求
          if (url === '/api/notify-email' && req.method === 'OPTIONS') {
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
            res.statusCode = 204
            res.end()
            return
          }
          
          next()
        })
      }
    }
  ],
  
  // 开发服务器配置
  server: {
    // 配置代理解决 CORS 跨域问题
    proxy: {
      // 图片生成 API 代理
      '/api/generate-image': {
        target: 'https://ark.cn-beijing.volces.com/api/v3/images/generations',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/generate-image/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // 添加 API Key（从环境变量读取）
            proxyReq.setHeader('Authorization', `Bearer ${ARK_API_KEY_DEV}`)
          })
        }
      },
      // AI对话 API 代理
      '/api/ai-chat': {
        target: 'https://api.qnaigc.com/v1/chat/completions',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/ai-chat/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // 添加 API Key（从环境变量读取）
            proxyReq.setHeader('Authorization', `Bearer ${QINIU_AI_API_KEY_DEV}`)
          })
        }
      },
      // 七牛文生图 API 代理
      '/api/qiniu-images': {
        target: 'https://api.qnaigc.com/v1/images/generations',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/qiniu-images/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Authorization', `Bearer ${QINIU_AI_API_KEY_DEV}`)
            proxyReq.setHeader('Content-Type', 'application/json')
          })
        }
      },
      // 七牛图生图 API 代理
      '/api/qiniu-image-edits': {
        target: 'https://api.qnaigc.com/v1/images/edits',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/qiniu-image-edits/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Authorization', `Bearer ${QINIU_AI_API_KEY_DEV}`)
            proxyReq.setHeader('Content-Type', 'application/json')
          })
        }
      },
      // 随机 Coser 提示词生成 API 代理
      '/api/coser-random': {
        target: 'https://api.qnaigc.com/v1/chat/completions',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/coser-random/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('Authorization', `Bearer ${QINIU_AI_API_KEY_DEV}`)
            proxyReq.setHeader('Content-Type', 'application/json')
          })
        }
      },
      // 提示词优化 API 代理
      '/api/coser-optimize': {
        target: 'https://api.qnaigc.com/v1/chat/completions',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/coser-optimize/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Authorization', `Bearer ${QINIU_AI_API_KEY_DEV}`)
            proxyReq.setHeader('Content-Type', 'application/json')
          })
        }
      }
    }
  },
  
  // 构建配置
  build: {
    outDir: 'dist', // 输出目录，适配 Cloudflare Pages
    sourcemap: false, // 🔒 禁用 Source Map，防止源代码泄露
    minify: 'esbuild', // 使用 esbuild（Vite 内置，速度更快）
    // esbuild 配置
    esbuildOptions: {
      drop: ['console', 'debugger'], // 移除 console.log 和 debugger
      legalComments: 'none', // 移除所有注释
    },
  },
  }
})
