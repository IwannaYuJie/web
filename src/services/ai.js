import { extractErrorMessage, requestJson } from './http'

export async function requestAiChat(payload) {
  return requestJson('/api/ai-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }, 'AI 对话请求失败')
}

export async function requestAiChatStream(payload) {
  const response = await fetch('/api/ai-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new Error(extractErrorMessage(payload, `API请求失败: ${response.status}`))
  }

  return response
}
