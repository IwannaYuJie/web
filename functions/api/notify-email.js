/**
 * Cloudflare Pages Functions - 通用邮件通知 API
 * 供前端调用，用于 Fal.ai 等前端直接生成的场景
 */
import { sendSuccessEmail, sendFailureEmail } from './send-email.js'

export async function onRequest(context) {
  const { request, env } = context

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
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

  let payload
  try {
    payload = await request.json()
  } catch (error) {
    return new Response(JSON.stringify({ error: '请求体需为合法 JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const { success, images, error, prompt, source } = payload

  try {
    let result
    if (success && images && Array.isArray(images) && images.length > 0) {
      result = await sendSuccessEmail(env, { images, prompt, source })
    } else {
      result = await sendFailureEmail(env, { error: error || '未知错误', prompt, source })
    }

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (emailError) {
    console.error('邮件通知 API 异常:', emailError)
    return new Response(
      JSON.stringify({ error: '邮件发送失败', message: emailError.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}
