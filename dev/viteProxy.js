function withAuthHeader(apiKey, extraHeaders = {}) {
  return (proxy) => {
    proxy.on('proxyReq', (proxyReq) => {
      proxyReq.setHeader('Authorization', `Bearer ${apiKey}`)
      Object.entries(extraHeaders).forEach(([key, value]) => {
        proxyReq.setHeader(key, value)
      })
    })
  }
}

export function createProxyConfig({ arkApiKey, qiniuApiKey }) {
  return {
    '/api/generate-image': {
      target: 'https://ark.cn-beijing.volces.com/api/v3/images/generations',
      changeOrigin: true,
      secure: true,
      rewrite: (path) => path.replace(/^\/api\/generate-image/, ''),
      configure: withAuthHeader(arkApiKey),
    },
    '/api/ai-chat': {
      target: 'https://api.qnaigc.com/v1/chat/completions',
      changeOrigin: true,
      secure: true,
      rewrite: (path) => path.replace(/^\/api\/ai-chat/, ''),
      configure: withAuthHeader(qiniuApiKey),
    },
    '/api/qiniu-images': {
      target: 'https://api.qnaigc.com/v1/images/generations',
      changeOrigin: true,
      secure: true,
      rewrite: (path) => path.replace(/^\/api\/qiniu-images/, ''),
      configure: withAuthHeader(qiniuApiKey, { 'Content-Type': 'application/json' }),
    },
    '/api/qiniu-image-edits': {
      target: 'https://api.qnaigc.com/v1/images/edits',
      changeOrigin: true,
      secure: true,
      rewrite: (path) => path.replace(/^\/api\/qiniu-image-edits/, ''),
      configure: withAuthHeader(qiniuApiKey, { 'Content-Type': 'application/json' }),
    },
    '/api/coser-random': {
      target: 'https://api.qnaigc.com/v1/chat/completions',
      changeOrigin: true,
      secure: true,
      rewrite: (path) => path.replace(/^\/api\/coser-random/, ''),
      configure: withAuthHeader(qiniuApiKey, { 'Content-Type': 'application/json' }),
    },
    '/api/coser-optimize': {
      target: 'https://api.qnaigc.com/v1/chat/completions',
      changeOrigin: true,
      secure: true,
      rewrite: (path) => path.replace(/^\/api\/coser-optimize/, ''),
      configure: withAuthHeader(qiniuApiKey, { 'Content-Type': 'application/json' }),
    },
  }
}
