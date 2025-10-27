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
      '/api': {
        target: 'https://ark.cn-beijing.volces.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  },
  
  // 构建配置
  build: {
    outDir: 'dist', // 输出目录，适配 Cloudflare Pages
  },
})
