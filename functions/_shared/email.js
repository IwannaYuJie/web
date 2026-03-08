/**
 * Cloudflare Functions 共享邮件工具
 */

const NOTIFY_EMAIL = 'meicuowoniubi@gmail.com'

export async function sendSuccessEmail(env, { images, prompt, source }) {
  const resendApiKey = env.RESEND_API_KEY
  if (!resendApiKey) {
    console.error('未配置 RESEND_API_KEY，跳过邮件发送')
    return { success: false, error: '未配置 RESEND_API_KEY' }
  }

  try {
    const imageCount = images.length
    const sourceLabel = getSourceLabel(source)
    const timeStr = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })

    const imagesHtml = images.map((img, index) => buildImageHtml(img, index)).join('')
    const promptText = prompt ? `${escapeHtml(prompt.substring(0, 500))}${prompt.length > 500 ? '...' : ''}` : ''

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fff9f5; padding: 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.1);">
          <div style="background: linear-gradient(135deg, #22c55e 0%, #4ade80 100%); padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">✅ AI 图片生成成功</h1>
          </div>

          <div style="padding: 24px;">
            <div style="background: #f0fdf4; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
              <p style="margin: 0 0 8px 0; color: #166534;"><strong>📍 来源:</strong> ${sourceLabel}</p>
              <p style="margin: 0 0 8px 0; color: #166534;"><strong>🕐 时间:</strong> ${timeStr}</p>
              <p style="margin: 0 0 8px 0; color: #166534;"><strong>📝 数量:</strong> ${imageCount} 张</p>
              ${promptText ? `<p style="margin: 0; color: #166534;"><strong>💬 Prompt:</strong> ${promptText}</p>` : ''}
            </div>

            <div style="border-top: 1px solid #bbf7d0; padding-top: 20px;">
              ${imagesHtml}
            </div>
          </div>

          <div style="background: #f0fdf4; padding: 16px; text-align: center; border-top: 1px solid #bbf7d0;">
            <p style="color: #166534; margin: 0; font-size: 14px;">🐱 橘猫工作室 · Seedream AI 实验室</p>
          </div>
        </div>
      </body>
      </html>
    `

    return await sendEmailRequest(resendApiKey, {
      subject: `✅ 图片生成成功 - ${sourceLabel} (${imageCount}张)`,
      html: emailHtml,
    })
  } catch (error) {
    console.error('邮件发送异常:', error)
    return { success: false, error: error.message }
  }
}

export async function sendFailureEmail(env, { error, prompt, source }) {
  const resendApiKey = env.RESEND_API_KEY
  if (!resendApiKey) {
    console.error('未配置 RESEND_API_KEY，跳过邮件发送')
    return { success: false, error: '未配置 RESEND_API_KEY' }
  }

  try {
    const sourceLabel = getSourceLabel(source)
    const timeStr = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
    const promptText = prompt ? `${escapeHtml(prompt.substring(0, 500))}${prompt.length > 500 ? '...' : ''}` : ''

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fff9f5; padding: 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.1);">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #f87171 100%); padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">❌ AI 图片生成失败</h1>
          </div>

          <div style="padding: 24px;">
            <div style="background: #fef2f2; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
              <p style="margin: 0 0 8px 0; color: #991b1b;"><strong>📍 来源:</strong> ${sourceLabel}</p>
              <p style="margin: 0 0 8px 0; color: #991b1b;"><strong>🕐 时间:</strong> ${timeStr}</p>
              ${promptText ? `<p style="margin: 0 0 8px 0; color: #991b1b;"><strong>💬 Prompt:</strong> ${promptText}</p>` : ''}
            </div>

            <div style="background: #fee2e2; border-radius: 8px; padding: 16px; border-left: 4px solid #ef4444;">
              <p style="margin: 0; color: #991b1b;"><strong>❗ 错误信息:</strong></p>
              <p style="margin: 8px 0 0 0; color: #b91c1c; font-family: monospace; white-space: pre-wrap; word-break: break-all;">${escapeHtml(String(error))}</p>
            </div>
          </div>

          <div style="background: #fef2f2; padding: 16px; text-align: center; border-top: 1px solid #fecaca;">
            <p style="color: #991b1b; margin: 0; font-size: 14px;">🐱 橘猫工作室 · Seedream AI 实验室</p>
          </div>
        </div>
      </body>
      </html>
    `

    return await sendEmailRequest(resendApiKey, {
      subject: `❌ 图片生成失败 - ${sourceLabel}`,
      html: emailHtml,
    })
  } catch (emailError) {
    console.error('邮件发送异常:', emailError)
    return { success: false, error: emailError.message }
  }
}

export function getSourceLabel(source) {
  const labels = {
    'fal-text': 'Fal.ai 文生图',
    'fal-edit': 'Fal.ai 图生图',
    'qiniu-text': '七牛 文生图',
    'qiniu-edit': '七牛 图生图',
  }
  return labels[source] || source || '未知来源'
}

export function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (match) => map[match])
}

function buildImageHtml(img, index) {
  const imgSrc = img.url || img.b64_json || img.base64 || img.content || img
  const isBase64 = typeof imgSrc === 'string' && (imgSrc.startsWith('data:') || !imgSrc.startsWith('http'))

  if (isBase64) {
    const base64Src = imgSrc.startsWith('data:') ? imgSrc : `data:image/png;base64,${imgSrc}`
    return `
      <div style="margin-bottom: 20px; text-align: center;">
        <p style="color: #666; margin-bottom: 8px;">图片 ${index + 1}</p>
        <img src="${base64Src}" alt="生成图片 ${index + 1}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
      </div>
    `
  }

  return `
    <div style="margin-bottom: 20px; text-align: center;">
      <p style="color: #666; margin-bottom: 8px;">图片 ${index + 1}</p>
      <a href="${imgSrc}" target="_blank" style="color: #f97316; text-decoration: none;">
        <img src="${imgSrc}" alt="生成图片 ${index + 1}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
      </a>
      <p style="margin-top: 8px;"><a href="${imgSrc}" target="_blank" style="color: #f97316;">点击查看原图</a></p>
    </div>
  `
}

async function sendEmailRequest(resendApiKey, { subject, html }) {
  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: 'Seedream AI <onboarding@resend.dev>',
      to: [NOTIFY_EMAIL],
      subject,
      html,
    }),
  })

  const resendResult = await resendResponse.json()
  if (!resendResponse.ok) {
    console.error('Resend API 错误:', resendResult)
    return { success: false, error: resendResult?.message }
  }

  console.log('邮件发送成功:', resendResult.id)
  return { success: true, emailId: resendResult.id }
}
