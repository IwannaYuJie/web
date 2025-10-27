/**
 * Cloudflare Pages Functions - 图片生成 API 代理
 * 用于解决 CORS 跨域问题
 * 
 * 文件路径：functions/api/generate-image.js
 * 访问路径：/api/generate-image
 */

export async function onRequest(context) {
  const { request } = context

  // 设置 CORS 头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  // 处理 OPTIONS 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  // 只允许 POST 请求
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  }

  try {
    // 获取请求体
    const requestBody = await request.json()

    // 火山引擎 API 配置
    const API_ENDPOINT = 'https://ark.cn-beijing.volces.com/api/v3/images/generations'
    const API_KEY = context.env.ARK_API_KEY || '85e498e4-2b40-4b94-85ca-60bd022ae24c'

    // 转发请求到火山引擎 API
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody)
    })

    // 获取响应数据
    const data = await response.json()

    // 返回结果
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('API 代理错误:', error)
    return new Response(JSON.stringify({ 
      error: '服务器错误', 
      message: error.message 
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  }
}
