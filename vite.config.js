import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// 读取环境变量（开发环境使用）
// 注意：仅用于本地开发代理，生产环境使用 Cloudflare 环境变量
const ARK_API_KEY_DEV = process.env.ARK_API_KEY || 'YOUR_ARK_API_KEY_HERE'
const QINIU_AI_API_KEY_DEV = process.env.QINIU_AI_API_KEY || 'YOUR_QINIU_AI_API_KEY_HERE'

// 模拟文章数据（用于本地开发）
let mockArticles = [
  {
    id: 1,
    title: '☕ Spring Boot 3.0 新特性深度解析',
    description: '详细介绍 Spring Boot 3.0 的核心新特性，包括 GraalVM 原生镜像支持、Java 17 基线等重要更新',
    date: '2024-01-15',
    category: 'Spring框架',
    readTime: '15 分钟'
  },
  {
    id: 2,
    title: '🚀 微服务架构设计最佳实践',
    description: '从零开始构建微服务架构，涵盖服务拆分、API网关、服务发现、配置中心等核心组件',
    date: '2024-01-10',
    category: '微服务',
    readTime: '20 分钟'
  }
]

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
      }
    }
  },
  
  // 构建配置
  build: {
    outDir: 'dist', // 输出目录，适配 Cloudflare Pages
    sourcemap: false, // 🔒 禁用 Source Map，防止源代码泄露
    minify: 'terser', // 使用 terser 进行更深度的混淆
    terserOptions: {
      compress: {
        drop_console: true, // 移除 console.log
        drop_debugger: true, // 移除 debugger
      },
      format: {
        comments: false, // 移除所有注释
      },
    },
  },
})
