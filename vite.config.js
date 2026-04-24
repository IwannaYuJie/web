import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createMockApiPlugin } from './dev/viteMocks'
import { createProxyConfig } from './dev/viteProxy'

// Vite 配置文件
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // 仅用于本地开发代理，生产环境使用 Cloudflare/Vercel 环境变量。
  const arkApiKey = env.ARK_API_KEY || 'YOUR_ARK_API_KEY_HERE'
  const qiniuApiKey = env.QINIU_AI_API_KEY || 'YOUR_QINIU_AI_API_KEY_HERE'
  const devAdminKey = env.DEV_ADMIN_KEY || process.env.DEV_ADMIN_KEY || ''

  return {
    plugins: [
      react(),
      createMockApiPlugin(devAdminKey),
    ],

    // 开发服务器配置
    server: {
      // 配置代理解决 CORS 跨域问题
      proxy: createProxyConfig({
        arkApiKey,
        qiniuApiKey,
      }),
    },

    // 构建配置
    build: {
      outDir: 'dist', // 输出目录，适配 Cloudflare Pages
      sourcemap: false, // 🔒 禁用 Source Map，防止源代码泄露
      minify: 'esbuild', // 使用 esbuild（Vite 内置，速度更快）
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return undefined
            }

            if (id.includes('react-router')) {
              return 'vendor-router'
            }

            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('scheduler')) {
              return 'vendor-react'
            }

            if (id.includes('gif.js')) {
              return 'vendor-gif'
            }

            return undefined
          },
        },
      },
      // esbuild 配置
      esbuildOptions: {
        drop: ['console', 'debugger'], // 移除 console.log 和 debugger
        legalComments: 'none', // 移除所有注释
      },
    },
  }
})
