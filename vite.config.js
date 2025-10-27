import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite 配置文件
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 构建配置
  build: {
    outDir: 'dist', // 输出目录，适配 Cloudflare Pages
  },
})
