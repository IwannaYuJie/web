/**
 * Vercel/Netlify Serverless 函数 - 七牛图生图 API 代理
 * 用于在其他平台实现与 Cloudflare Functions 一致的行为
 */
import { callQiniuApi, resolveQiniuKeys, shapeQiniuErrorBody } from '../shared/server/qiniuProxy.js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

  const { keyChoice, primaryKey, secondaryKey } = resolveQiniuKeys(
    req.headers['x-qiniu-key'],
    process.env.QINIU_AI_API_KEY,
    process.env.QINIU_API_KEY_2 || process.env.QINIU_AI_API_KEY_2,
  )

  if (!primaryKey && !secondaryKey) {
    res.status(500).json({ error: '服务器配置错误', message: '未配置 QINIU_AI_API_KEY / QINIU_API_KEY_2 环境变量' })
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
    ...payload,
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
    const primaryResult = keyChoice === 'secondary'
      ? { ok: false, shouldRetry: true }
      : await callQiniuApi('https://api.qnaigc.com/v1/images/edits', finalPayload, primaryKey)

    const result = secondaryKey && ((!primaryResult.ok && primaryResult.shouldRetry) || keyChoice === 'secondary')
      ? await callQiniuApi('https://api.qnaigc.com/v1/images/edits', finalPayload, secondaryKey)
      : primaryResult

    res.writeHead(result.response.status, { ...corsHeaders, 'Content-Type': 'application/json' })
    res.end(JSON.stringify(result.response.ok ? result.body : shapeQiniuErrorBody(result.body, '七牛图生图调用失败')))
  } catch (error) {
    console.error('七牛图生图代理异常:', error)
    res.status(500).json({ error: '服务器内部错误', message: error.message })
  }
}
