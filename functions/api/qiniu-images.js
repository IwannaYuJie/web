/**
 * Cloudflare Pages Functions - 七牛文生图 API 代理
 * 将前端请求安全地转发到 https://api.qnaigc.com/v1/images/generations
 */

// 固定接收邮箱
const NOTIFY_EMAIL = 'meicuowoniubi@gmail.com'

export async function onRequest(context) {
  const { request, env, waitUntil } = context

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

  const prompt = finalPayload.prompt

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

    // 调试：检查环境变量
    console.log('[DEBUG] RESEND_API_KEY 是否存在:', !!env.RESEND_API_KEY)
    console.log('[DEBUG] 上游响应状态:', upstreamResponse.ok)
    console.log('[DEBUG] body.data 是否存在:', !!body?.data)
    console.log('[DEBUG] body.data 是数组:', Array.isArray(body?.data))
    console.log('[DEBUG] body.data 长度:', body?.data?.length)

    // 同步发送邮件并获取结果（调试用）
    let emailResult = null
    if (upstreamResponse.ok && body?.data && Array.isArray(body.data) && body.data.length > 0) {
      console.log('[DEBUG] 准备发送成功邮件...')
      emailResult = await sendSuccessEmail(env, {
        images: body.data,
        prompt,
        source: 'qiniu-text'
      })
    } else {
      const errorMsg = body?.error || body?.message || body?.raw || '未知错误'
      console.log('[DEBUG] 准备发送失败邮件, 错误:', errorMsg)
      emailResult = await sendFailureEmail(env, {
        error: errorMsg,
        prompt,
        source: 'qiniu-text'
      })
    }

    // 在响应中加入调试信息（包含邮件发送结果）
    const responseBody = {
      ...body,
      _debug: {
        hasResendKey: !!env.RESEND_API_KEY,
        emailTarget: NOTIFY_EMAIL,
        emailResult: emailResult
      }
    }

    return new Response(JSON.stringify(responseBody), {
      status: upstreamResponse.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('七牛文生图代理异常:', error)
    
    // 发送失败邮件
    waitUntil(sendFailureEmail(env, {
      error: error.message,
      prompt,
      source: 'qiniu-text'
    }))
    
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

/**
 * 发送图片生成成功通知邮件
 */
async function sendSuccessEmail(env, { images, prompt, source }) {
  console.log('[EMAIL] 开始发送成功邮件, source:', source)
  const resendApiKey = env.RESEND_API_KEY
  console.log('[EMAIL] RESEND_API_KEY 存在:', !!resendApiKey)
  
  if (!resendApiKey) {
    console.error('[EMAIL] 未配置 RESEND_API_KEY，跳过邮件发送')
    return { success: false, error: '未配置 RESEND_API_KEY' }
  }

  try {
    const imageCount = images.length
    const sourceLabel = getSourceLabel(source)
    const timeStr = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
    
    const imagesHtml = images.map((img, index) => {
      const imgSrc = img.url || img.b64_json || img.base64 || img.content || img
      const isBase64 = typeof imgSrc === 'string' && (imgSrc.startsWith('data:') || !imgSrc.startsWith('http'))
      
      if (isBase64) {
        const base64Src = imgSrc.startsWith('data:') ? imgSrc : `data:image/png;base64,${imgSrc}`
        return `<div style="margin-bottom: 20px; text-align: center;"><p style="color: #666; margin-bottom: 8px;">图片 ${index + 1}</p><img src="${base64Src}" alt="生成图片 ${index + 1}" style="max-width: 100%; height: auto; border-radius: 8px;" /></div>`
      } else {
        return `<div style="margin-bottom: 20px; text-align: center;"><p style="color: #666; margin-bottom: 8px;">图片 ${index + 1}</p><a href="${imgSrc}" target="_blank"><img src="${imgSrc}" alt="生成图片 ${index + 1}" style="max-width: 100%; height: auto; border-radius: 8px;" /></a><p style="margin-top: 8px;"><a href="${imgSrc}" target="_blank" style="color: #f97316;">点击查看原图</a></p></div>`
      }
    }).join('')

    const emailHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family: sans-serif; background: #fff9f5; padding: 20px;"><div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden;"><div style="background: linear-gradient(135deg, #22c55e, #4ade80); padding: 24px; text-align: center;"><h1 style="color: white; margin: 0;">✅ AI 图片生成成功</h1></div><div style="padding: 24px;"><div style="background: #f0fdf4; border-radius: 8px; padding: 16px; margin-bottom: 20px;"><p style="margin: 0 0 8px; color: #166534;"><strong>📍 来源:</strong> ${sourceLabel}</p><p style="margin: 0 0 8px; color: #166534;"><strong>🕐 时间:</strong> ${timeStr}</p><p style="margin: 0 0 8px; color: #166534;"><strong>📝 数量:</strong> ${imageCount} 张</p>${prompt ? `<p style="margin: 0; color: #166534;"><strong>💬 Prompt:</strong> ${escapeHtml(prompt.substring(0, 500))}</p>` : ''}</div><div style="border-top: 1px solid #bbf7d0; padding-top: 20px;">${imagesHtml}</div></div><div style="background: #f0fdf4; padding: 16px; text-align: center;"><p style="color: #166534; margin: 0; font-size: 14px;">🐱 橘猫工作室</p></div></div></body></html>`

    console.log('[EMAIL] 准备调用 Resend API...')
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendApiKey}` },
      body: JSON.stringify({
        from: 'Seedream AI <onboarding@resend.dev>',
        to: [NOTIFY_EMAIL],
        subject: `✅ 图片生成成功 - ${sourceLabel} (${imageCount}张)`,
        html: emailHtml
      })
    })
    const result = await res.json()
    console.log('[EMAIL] Resend API 响应状态:', res.status)
    console.log('[EMAIL] Resend API 响应内容:', JSON.stringify(result))
    return { success: res.ok, result }
  } catch (e) {
    console.error('[EMAIL] 邮件发送异常:', e.message)
    return { success: false, error: e.message }
  }
}

/**
 * 发送图片生成失败通知邮件
 */
async function sendFailureEmail(env, { error, prompt, source }) {
  const resendApiKey = env.RESEND_API_KEY
  if (!resendApiKey) {
    console.error('未配置 RESEND_API_KEY，跳过邮件发送')
    return
  }

  try {
    const sourceLabel = getSourceLabel(source)
    const timeStr = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })

    const emailHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family: sans-serif; background: #fff9f5; padding: 20px;"><div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden;"><div style="background: linear-gradient(135deg, #ef4444, #f87171); padding: 24px; text-align: center;"><h1 style="color: white; margin: 0;">❌ AI 图片生成失败</h1></div><div style="padding: 24px;"><div style="background: #fef2f2; border-radius: 8px; padding: 16px; margin-bottom: 20px;"><p style="margin: 0 0 8px; color: #991b1b;"><strong>📍 来源:</strong> ${sourceLabel}</p><p style="margin: 0 0 8px; color: #991b1b;"><strong>🕐 时间:</strong> ${timeStr}</p>${prompt ? `<p style="margin: 0; color: #991b1b;"><strong>💬 Prompt:</strong> ${escapeHtml(prompt.substring(0, 500))}</p>` : ''}</div><div style="background: #fee2e2; border-radius: 8px; padding: 16px; border-left: 4px solid #ef4444;"><p style="margin: 0; color: #991b1b;"><strong>❗ 错误:</strong></p><p style="margin: 8px 0 0; color: #b91c1c; font-family: monospace;">${escapeHtml(String(error))}</p></div></div><div style="background: #fef2f2; padding: 16px; text-align: center;"><p style="color: #991b1b; margin: 0; font-size: 14px;">🐱 橘猫工作室</p></div></div></body></html>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendApiKey}` },
      body: JSON.stringify({
        from: 'Seedream AI <onboarding@resend.dev>',
        to: [NOTIFY_EMAIL],
        subject: `❌ 图片生成失败 - ${sourceLabel}`,
        html: emailHtml
      })
    })
    const result = await res.json()
    console.log('失败邮件发送结果:', result)
  } catch (e) {
    console.error('邮件发送异常:', e)
  }
}

function getSourceLabel(source) {
  const labels = { 'fal-text': 'Fal.ai 文生图', 'fal-edit': 'Fal.ai 图生图', 'qiniu-text': '七牛 文生图', 'qiniu-edit': '七牛 图生图' }
  return labels[source] || source || '未知来源'
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m])
}
