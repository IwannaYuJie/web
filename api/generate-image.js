/**
 * Serverless 函数 - 图片生成 API 代理
 * 用于解决生产环境的 CORS 跨域问题
 * 
 * 部署平台：Vercel / Netlify / Cloudflare Pages
 */

export default async function handler(req, res) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // 火山引擎 API 配置
    const API_ENDPOINT = 'https://ark.cn-beijing.volces.com/api/v3/images/generations'
    const API_KEY = process.env.ARK_API_KEY || '85e498e4-2b40-4b94-85ca-60bd022ae24c'

    // 转发请求到火山引擎 API
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(req.body)
    })

    // 获取响应数据
    const data = await response.json()

    // 返回结果
    if (response.ok) {
      return res.status(200).json(data)
    } else {
      return res.status(response.status).json(data)
    }

  } catch (error) {
    console.error('API 代理错误:', error)
    return res.status(500).json({ 
      error: '服务器错误', 
      message: error.message 
    })
  }
}
