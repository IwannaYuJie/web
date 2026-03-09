/**
 * Vercel/Netlify Serverless 函数 - 七牛文生图 API 代理
 * 用于在其他平台实现与 Cloudflare Functions 一致的行为
 */
import { callQiniuApi, resolveQiniuKeys, shapeQiniuErrorBody } from '../shared/server/qiniuProxy.js'

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

  const { keyChoice, primaryKey, secondaryKey } = resolveQiniuKeys(
    req.headers['x-qiniu-key'],
    process.env.QINIU_AI_API_KEY,
    process.env.QINIU_API_KEY_2 || process.env.QINIU_AI_API_KEY_2,
  )

  if (!primaryKey && !secondaryKey) {
    return res.status(500).json({
      error: '服务器配置错误',
      message: '未配置 QINIU_AI_API_KEY / QINIU_API_KEY_2 环境变量',
    })
  }

  const payload = req.body || {}
  const finalPayload = {
    model: payload?.model?.trim() || 'gemini-3.0-pro-image-preview',
    ...payload,
  }

  if (!finalPayload.prompt) {
    return res.status(400).json({ error: 'prompt 不能为空' })
  }

  try {
    const primaryResult = keyChoice === 'secondary'
      ? { ok: false, shouldRetry: true }
      : await callQiniuApi('https://api.qnaigc.com/v1/images/generations', finalPayload, primaryKey)

    const result = secondaryKey && ((!primaryResult.ok && primaryResult.shouldRetry) || keyChoice === 'secondary')
      ? await callQiniuApi('https://api.qnaigc.com/v1/images/generations', finalPayload, secondaryKey)
      : primaryResult

    return res.status(result.response.status).json(
      result.response.ok ? result.body : shapeQiniuErrorBody(result.body, '七牛文生图调用失败'),
    )
  } catch (error) {
    console.error('七牛文生图代理异常:', error)
    return res.status(500).json({ error: '服务器内部错误', message: error.message })
  }
}
