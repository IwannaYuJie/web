async function parseJsonResponse(response, fallbackMessage) {
  let data = null

  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(data?.error?.message || data?.error || data?.message || fallbackMessage)
  }

  return data
}

export async function requestAiChat(payload) {
  const response = await fetch('/api/ai-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return parseJsonResponse(response, `API请求失败: ${response.status}`)
}

export async function requestAiChatStream(payload) {
  const response = await fetch('/api/ai-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    let message = `API请求失败: ${response.status}`
    try {
      const data = await response.json()
      message = data?.error?.message || data?.error || data?.message || message
    } catch {
      // ignore
    }
    throw new Error(message)
  }

  return response
}
