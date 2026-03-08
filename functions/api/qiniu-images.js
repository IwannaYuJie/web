/**
 * Cloudflare Pages Functions - 七牛文生图 API 代理
 * 将前端请求安全地转发到 https://api.qnaigc.com/v1/images/generations
 */

import { sendFailureEmail, sendSuccessEmail } from '../_shared/email.js'

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

  const primaryKey = env.QINIU_AI_API_KEY
  const secondaryKey = env.QINIU_API_KEY_2 || env.QINIU_AI_API_KEY_2
  const keyChoice = request.headers.get('x-qiniu-key')?.toLowerCase() || 'auto'

  if (!primaryKey && !secondaryKey) {
    return new Response(
      JSON.stringify({
        error: '服务器配置错误',
        message: '未配置 QINIU_AI_API_KEY 或 QINIU_API_KEY_2 环境变量，请在 Cloudflare Dashboard 中添加',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
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

    if (keyChoice === 'primary') {
      return handleUpstreamResult({
        upstreamResponse: primaryResult.response,
        body: primaryResult.body,
        prompt,
        env,
        waitUntil,
        source: 'qiniu-text',
      })
    }

    if (secondaryKey && ((!primaryResult.ok && primaryResult.shouldRetry) || keyChoice === 'secondary')) {
      console.warn('使用备用 key 调用七牛文生图')
      const secondaryResult = await callQiniuApi('https://api.qnaigc.com/v1/images/generations', finalPayload, secondaryKey)
      return handleUpstreamResult({
        upstreamResponse: secondaryResult.response,
        body: secondaryResult.body,
        prompt,
        env,
        waitUntil,
        source: 'qiniu-text',
      })
    }

    return handleUpstreamResult({
      upstreamResponse: primaryResult.response,
      body: primaryResult.body,
      prompt,
      env,
      waitUntil,
      source: 'qiniu-text',
    })
  } catch (error) {
    console.error('七牛文生图代理异常:', error)
    waitUntil(sendFailureEmail(env, { error: error.message, prompt, source: 'qiniu-text' }))

    return new Response(
      JSON.stringify({ error: '服务器内部错误', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function callQiniuApi(endpoint, payload, apiKey) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  })

  const text = await response.text()
  const body = safeParseJson(text)
  const errorType = body?.error?.type || body?.type
  const shouldRetry = !response.ok && errorType === 'access_denied_error'

  return { response, body, ok: response.ok, shouldRetry }
}

function handleUpstreamResult({ upstreamResponse, body, prompt, env, waitUntil, source }) {
  let responseBody = body

  if (upstreamResponse.ok && body?.data && Array.isArray(body.data) && body.data.length > 0) {
    waitUntil(sendSuccessEmail(env, { images: body.data, prompt, source }))
  } else {
    const errorMsg = body?.error?.message || body?.message || body?.error || body?.raw || '未知错误'
    waitUntil(sendFailureEmail(env, { error: errorMsg, prompt, source }))
    responseBody = { error: errorMsg, message: errorMsg, type: body?.error?.type || body?.type }
  }

  return new Response(JSON.stringify(responseBody), {
    status: upstreamResponse.status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function safeParseJson(text) {
  try {
    return JSON.parse(text)
  } catch (error) {
    return { raw: text, parseError: error.message }
  }
}
