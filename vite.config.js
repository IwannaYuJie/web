import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// 读取环境变量（开发环境使用）
// 注意：仅用于本地开发代理，生产环境使用 Cloudflare 环境变量
const ARK_API_KEY_DEV = process.env.ARK_API_KEY || 'YOUR_ARK_API_KEY_HERE'
const QINIU_AI_API_KEY_DEV = process.env.QINIU_AI_API_KEY || 'YOUR_QINIU_AI_API_KEY_HERE'

// 模拟文章数据（用于本地开发）
// 注意：所有测试示例文章已清空，可通过文章管理页面添加新文章
let mockArticles = []

// Vite 配置文件
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // 自定义插件：模拟文章 API
    {
      name: 'mock-articles-api',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url || ''
          
          // 处理文章 API 请求
          if (url.startsWith('/api/articles')) {
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
            
            // 处理 OPTIONS 预检请求
            if (req.method === 'OPTIONS') {
              res.statusCode = 204
              res.end()
              return
            }

            // 简单的权限验证 (仅针对写操作)
            if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
               const adminKey = req.headers['x-admin-key']
               // 本地开发默认密码: 123456
               
               // 特殊处理：验证 Key 的请求
               if (url === '/api/articles/auth-check') {
                 if (adminKey === '123456') {
                   res.statusCode = 200
                   res.end(JSON.stringify({ status: 'ok', message: '验证通过' }))
                 } else {
                   res.statusCode = 401
                   res.end(JSON.stringify({ error: '密码错误' }))
                 }
                 return
               }

               if (adminKey !== '123456') {
                 res.statusCode = 401
                 res.end(JSON.stringify({ error: '未授权的操作：密码错误' }))
                 return
               }
            }
            
            // GET /api/articles - 获取所有文章
            if (req.method === 'GET' && url === '/api/articles') {
              res.statusCode = 200
              res.end(JSON.stringify(mockArticles))
              return
            }
            
            // GET /api/articles/:id - 获取单篇文章
            const getMatch = url.match(/^\/api\/articles\/(\d+)$/)
            if (req.method === 'GET' && getMatch) {
              const id = parseInt(getMatch[1])
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
            
            // POST /api/articles - 创建文章
            if (req.method === 'POST' && url === '/api/articles') {
              let body = ''
              req.on('data', chunk => { body += chunk })
              req.on('end', () => {
                try {
                  const newArticle = JSON.parse(body)
                  const maxId = mockArticles.length > 0 ? Math.max(...mockArticles.map(a => a.id)) : 0
                  newArticle.id = maxId + 1
                  mockArticles.push(newArticle)
                  res.statusCode = 201
                  res.end(JSON.stringify(newArticle))
                } catch (error) {
                  res.statusCode = 400
                  res.end(JSON.stringify({ error: '无效的请求数据' }))
                }
              })
              return
            }
            
            // PUT /api/articles/:id - 更新文章
            const putMatch = url.match(/^\/api\/articles\/(\d+)$/)
            if (req.method === 'PUT' && putMatch) {
              const id = parseInt(putMatch[1])
              let body = ''
              req.on('data', chunk => { body += chunk })
              req.on('end', () => {
                try {
                  const updateData = JSON.parse(body)
                  const index = mockArticles.findIndex(a => a.id === id)
                  if (index !== -1) {
                    mockArticles[index] = { ...mockArticles[index], ...updateData, id }
                    res.statusCode = 200
                    res.end(JSON.stringify(mockArticles[index]))
                  } else {
                    res.statusCode = 404
                    res.end(JSON.stringify({ error: '文章不存在' }))
                  }
                } catch (error) {
                  res.statusCode = 400
                  res.end(JSON.stringify({ error: '无效的请求数据' }))
                }
              })
              return
            }
            
            // DELETE /api/articles/:id - 删除文章
            const deleteMatch = url.match(/^\/api\/articles\/(\d+)$/)
            if (req.method === 'DELETE' && deleteMatch) {
              const id = parseInt(deleteMatch[1])
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
            
            // 不支持的方法
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
})
