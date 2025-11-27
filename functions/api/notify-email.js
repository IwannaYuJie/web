/**
 * Cloudflare Pages Functions - 通用邮件通知 API
 * 供前端调用，用于 Fal.ai 等前端直接生成的场景
 */

// 固定接收邮箱
const NOTIFY_EMAIL = 'penghaoxiang2019@gmail.com'

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

    return new Response(JSON.stringify({ success: true, message: '邮件已发送' }), {
      status: 200,
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

/**
 * 发送图片生成成功通知邮件
 */
async function sendSuccessEmail(env, { images, prompt, source }) {
  const resendApiKey = env.RESEND_API_KEY
  if (!resendApiKey) {
    console.error('未配置 RESEND_API_KEY，跳过邮件发送')
    return
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
    console.log('邮件发送结果:', result)
  } catch (e) {
    console.error('邮件发送异常:', e)
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
