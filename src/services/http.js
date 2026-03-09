function isObject(value) {
  return value !== null && typeof value === 'object'
}

export function extractErrorMessage(payload, fallbackMessage = '请求失败') {
  if (!payload) {
    return fallbackMessage
  }

  if (typeof payload === 'string') {
    return payload
  }

  if (isObject(payload.error)) {
    return payload.error.message || payload.error.type || fallbackMessage
  }

  return payload.error || payload.message || payload.raw || fallbackMessage
}

export async function parseJsonBody(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function requestJson(url, options = {}, fallbackMessage = '请求失败') {
  const response = await fetch(url, options)
  const data = await parseJsonBody(response)

  if (!response.ok) {
    throw new Error(extractErrorMessage(data, fallbackMessage))
  }

  return data
}
