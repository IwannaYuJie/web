export function safeParseJson(text) {
  try {
    return JSON.parse(text)
  } catch (error) {
    return { raw: text, parseError: error.message }
  }
}

export function resolveQiniuKeys(keyChoice, primaryKey, secondaryKey) {
  const normalizedChoice = String(keyChoice || 'auto').toLowerCase()
  return {
    keyChoice: normalizedChoice,
    primaryKey,
    secondaryKey,
    activeKey:
      normalizedChoice === 'secondary'
        ? secondaryKey
        : normalizedChoice === 'primary'
          ? primaryKey
          : (primaryKey || secondaryKey),
  }
}

export async function callQiniuApi(endpoint, payload, apiKey, fetchImpl = fetch) {
  const response = await fetchImpl(endpoint, {
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

export function shapeQiniuErrorBody(body, fallbackMessage) {
  const errorMsg = body?.error?.message || body?.message || body?.error || body?.raw || fallbackMessage
  return {
    error: errorMsg,
    message: errorMsg,
    type: body?.error?.type || body?.type,
  }
}
