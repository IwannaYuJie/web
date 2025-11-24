/**
 * Cloudflare Pages Functions - 七牛文生图 API 代理
 * 将前端请求安全地转发到 https://api.qnaigc.com/v1/images/generations
 */
export async function onRequest(context) {
  const { request, env } = context

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const apiKey = env.QINIU_AI_API_KEY
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: '服务器配置错误',
        message: '未配置 QINIU_AI_API_KEY 环境变量，请在 Cloudflare Dashboard 中添加'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  let payload
  try {
    payload = await request.json()
  } catch (error) {
    return new Response(JSON.stringify({ error: '请求体需为合法 JSON', message: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const finalPayload = {
    model: payload?.model?.trim() || 'gemini-3.0-pro-image-preview',
    ...payload
  }

  if (!finalPayload.prompt) {
    return new Response(JSON.stringify({ error: 'prompt 不能为空' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    const upstreamResponse = await fetch('https://api.qnaigc.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(finalPayload)
    })

    const text = await upstreamResponse.text()
    const body = safeParseJson(text)

    return new Response(JSON.stringify(body), {
      status: upstreamResponse.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('七牛文生图代理异常:', error)
    return new Response(
      JSON.stringify({ error: '服务器内部错误', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

/**
 * 尝试解析 JSON，失败时返回原始文本方便定位问题。
 */
function safeParseJson(text) {
  try {
    return JSON.parse(text)
  } catch (error) {
    return { raw: text, parseError: error.message }
  }
}
