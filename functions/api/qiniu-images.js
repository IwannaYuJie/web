/**
 * Cloudflare Pages Functions - 七牛文生图 API 代理
 * 将前端请求安全地转发到 https://api.qnaigc.com/v1/images/generations
 */

import { sendFailureEmail, sendSuccessEmail } from '../_shared/email.js'
import { callQiniuApi, resolveQiniuKeys, shapeQiniuErrorBody } from '../../shared/server/qiniuProxy.js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function onRequest(context) {
  const { request, env, waitUntil } = context

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { keyChoice, primaryKey, secondaryKey } = resolveQiniuKeys(
    request.headers.get('x-qiniu-key'),
    env.QINIU_AI_API_KEY,
    env.QINIU_API_KEY_2 || env.QINIU_AI_API_KEY_2,
  )

  if (!primaryKey && !secondaryKey) {
    return new Response(
      JSON.stringify({
        error: '服务器配置错误',
        message: '未配置 QINIU_AI_API_KEY 或 QINIU_API_KEY_2 环境变量，请在 Cloudflare Dashboard 中添加',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  let payload
  try {
    payload = await request.json()
  } catch (error) {
    return new Response(JSON.stringify({ error: '请求体需为合法 JSON', message: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const finalPayload = {
    model: payload?.model?.trim() || 'gemini-3.0-pro-image-preview',
    ...payload,
  }

  if (!finalPayload.prompt) {
    return new Response(JSON.stringify({ error: 'prompt 不能为空' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const prompt = finalPayload.prompt

  try {
    const primaryResult = keyChoice === 'secondary'
      ? { ok: false, shouldRetry: true }
      : await callQiniuApi('https://api.qnaigc.com/v1/images/generations', finalPayload, primaryKey)

    const result = secondaryKey && ((!primaryResult.ok && primaryResult.shouldRetry) || keyChoice === 'secondary')
      ? await callQiniuApi('https://api.qnaigc.com/v1/images/generations', finalPayload, secondaryKey)
      : primaryResult

    let responseBody = result.body
    if (result.response.ok && result.body?.data?.length) {
      waitUntil(sendSuccessEmail(env, { images: result.body.data, prompt, source: 'qiniu-text' }))
    } else {
      responseBody = shapeQiniuErrorBody(result.body, '七牛文生图调用失败')
      waitUntil(sendFailureEmail(env, { error: responseBody.message, prompt, source: 'qiniu-text' }))
    }

    return new Response(JSON.stringify(responseBody), {
      status: result.response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('七牛文生图代理异常:', error)
    waitUntil(sendFailureEmail(env, { error: error.message, prompt, source: 'qiniu-text' }))
    return new Response(JSON.stringify({ error: '服务器内部错误', message: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}
