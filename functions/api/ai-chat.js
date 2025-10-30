/**
 * Cloudflare Pages Functions - AI对话 API 代理
 * 用于保护 API Key 和解决 CORS 跨域问题
 * 
 * 文件路径：functions/api/ai-chat.js
 * 访问路径：/api/ai-chat
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

    // 七牛云 AI API 配置
    const API_ENDPOINT = 'https://api.qnaigc.com/v1/chat/completions'
    const API_KEY = context.env.QINIU_AI_API_KEY || 'sk-563757c462e7f3415126806b3808ff4b6d00b0091263a38a552a34bdd4a91f8a'

    // 转发请求到七牛云 AI API
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody)
    })

    // 如果是流式响应，直接转发流
    if (requestBody.stream) {
      return new Response(response.body, {
        status: response.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      })
    }

    // 非流式响应，解析 JSON
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
    console.error('AI对话 API 代理错误:', error)
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
