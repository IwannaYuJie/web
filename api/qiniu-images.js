/**
 * Vercel/Netlify Serverless 函数 - 七牛文生图 API 代理
 * 用于在其他平台实现与 Cloudflare Functions 一致的行为
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.QINIU_AI_API_KEY || process.env.QINIU_API_KEY_2
  if (!apiKey) {
    return res.status(500).json({
      error: '服务器配置错误',
      message: '未配置 QINIU_AI_API_KEY / QINIU_API_KEY_2 环境变量'
    })
  }

  let payload
  try {
    payload = req.body || {}
  } catch (error) {
    return res.status(400).json({ error: '请求体需为合法 JSON', message: error.message })
  }

  const finalPayload = {
    model: payload?.model?.trim() || 'gemini-3.0-pro-image-preview',
    ...payload
  }

  if (!finalPayload.prompt) {
    return res.status(400).json({ error: 'prompt 不能为空' })
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
    const errorMsg = body?.error?.message || body?.message || body?.error

    return res.status(upstreamResponse.status).json(
      upstreamResponse.ok
        ? body
        : { error: errorMsg || '七牛文生图调用失败', message: errorMsg || '七牛文生图调用失败', type: body?.error?.type || body?.type }
    )
  } catch (error) {
    console.error('七牛文生图代理异常:', error)
    return res.status(500).json({ error: '服务器内部错误', message: error.message })
  }
}

function safeParseJson(text) {
  try {
    return JSON.parse(text)
  } catch (error) {
    return { raw: text, parseError: error.message }
  }
}
