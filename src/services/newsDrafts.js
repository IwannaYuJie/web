import { extractErrorMessage, parseJsonBody } from './http'

async function newsRequest(path, adminKey, options = {}) {
  const response = await fetch(`/api/news-drafts${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': adminKey,
    },
    cache: 'no-store',
  })
  const data = await parseJsonBody(response)
  if (!response.ok) {
    const error = new Error(extractErrorMessage(data, '草稿操作失败，请稍后重试'))
    error.status = response.status
    throw error
  }
  if (!data) {
    throw new Error('草稿服务暂时不可用，请稍后刷新')
  }
  return data
}

export function fetchNewsDrafts(adminKey, signal) {
  return newsRequest('', adminKey, { signal })
}

export function collectNewsDrafts(adminKey) {
  return newsRequest('/collect', adminKey, { method: 'POST' })
}

export function updateNewsDraft(id, draft, adminKey) {
  return newsRequest(`/${encodeURIComponent(id)}`, adminKey, {
    method: 'PUT',
    body: JSON.stringify(draft),
  })
}

export function dismissNewsDraft(id, adminKey) {
  return newsRequest(`/${encodeURIComponent(id)}`, adminKey, { method: 'DELETE' })
}

export function publishNewsDraft(id, adminKey) {
  return newsRequest(`/${encodeURIComponent(id)}/publish`, adminKey, { method: 'POST' })
}
