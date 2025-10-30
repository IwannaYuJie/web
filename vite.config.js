import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite 配置文件
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
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
            // 添加 API Key
            proxyReq.setHeader('Authorization', 'Bearer d5409697-4157-4ea2-9265-782d9d59a810')
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
            // 添加 API Key
            proxyReq.setHeader('Authorization', 'Bearer sk-563757c462e7f3415126806b3808ff4b6d00b0091263a38a552a34bdd4a91f8a')
          })
        }
      }
    }
  },
  
  // 构建配置
  build: {
    outDir: 'dist', // 输出目录，适配 Cloudflare Pages
  },
})
