import fetch from 'node-fetch'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders)
    res.end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.QINIU_AI_API_KEY || process.env.QINIU_API_KEY_2
  if (!apiKey) {
    res.status(500).json({ error: '服务器配置错误', message: '未配置 QINIU_AI_API_KEY 环境变量' })
    return
  }

  let payload
  try {
    payload = req.body && Object.keys(req.body).length ? req.body : JSON.parse(req.body)
  } catch (error) {
    res.status(400).json({ error: '请求体需为合法 JSON', message: error.message })
    return
  }

  const finalPayload = {
    model: payload?.model?.trim() || 'gemini-3.0-pro-image-preview',
    ...payload
  }

  if (!finalPayload.prompt) {
    res.status(400).json({ error: 'prompt 不能为空' })
    return
  }

  if (!finalPayload.image) {
    res.status(400).json({ error: 'image 参数不能为空' })
    return
  }

  try {
    const upstreamResponse = await fetch('https://api.qnaigc.com/v1/images/edits', {
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

    const shapedBody = upstreamResponse.ok
      ? body
      : { error: errorMsg || '七牛图生图调用失败', message: errorMsg || '七牛图生图调用失败', type: body?.error?.type || body?.type }

    res.writeHead(upstreamResponse.status, { ...corsHeaders, 'Content-Type': 'application/json' })
    res.end(JSON.stringify(shapedBody))
  } catch (error) {
    console.error('七牛图生图代理异常:', error)
    res.status(500).json({ error: '服务器内部错误', message: error.message })
  }
}

function safeParseJson(text) {
  try {
    return JSON.parse(text)
  } catch (error) {
    return { raw: text, parseError: error.message }
  }
}
