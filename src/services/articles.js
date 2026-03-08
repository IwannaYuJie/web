const ADMIN_KEY_STORAGE_KEY = 'adminKey'

function parseJsonSafely(value, fallback) {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

async function parseResponse(response, fallbackMessage) {
  let data = null

  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(data?.error || data?.message || fallbackMessage)
  }

  return data
}

export async function fetchArticlesList(signal) {
  const response = await fetch('/api/articles', { signal })
  return parseResponse(response, '获取文章列表失败')
}

export async function fetchArticleById(id, signal) {
  const response = await fetch(`/api/articles?id=${id}`, { signal })
  return parseResponse(response, '获取文章失败')
}

export async function verifyAdminKey(adminKey) {
  const response = await fetch('/api/articles?id=auth-check', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': adminKey,
    },
  })

  return {
    ok: response.ok,
    status: response.status,
    data: await parseJsonSafely(await response.text(), {}),
  }
}

export async function createArticle(articleData, adminKey) {
  const response = await fetch('/api/articles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': adminKey,
    },
    body: JSON.stringify(articleData),
  })

  return parseResponse(response, '创建文章失败')
}

export async function updateArticle(id, articleData, adminKey) {
  const response = await fetch(`/api/articles?id=${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': adminKey,
      'X-HTTP-Method-Override': 'PUT',
    },
    body: JSON.stringify(articleData),
  })

  return parseResponse(response, '更新文章失败')
}

export async function deleteArticle(id, adminKey) {
  const response = await fetch(`/api/articles?id=${id}`, {
    method: 'POST',
    headers: {
      'X-Admin-Key': adminKey,
      'X-HTTP-Method-Override': 'DELETE',
    },
  })

  return parseResponse(response, '删除文章失败')
}

export function getStoredAdminKey() {
  const sessionKey = sessionStorage.getItem(ADMIN_KEY_STORAGE_KEY)
  if (sessionKey) {
    return sessionKey
  }

  const legacyKey = localStorage.getItem(ADMIN_KEY_STORAGE_KEY)
  if (legacyKey) {
    sessionStorage.setItem(ADMIN_KEY_STORAGE_KEY, legacyKey)
    localStorage.removeItem(ADMIN_KEY_STORAGE_KEY)
    return legacyKey
  }

  return ''
}

export function saveAdminKey(adminKey) {
  sessionStorage.setItem(ADMIN_KEY_STORAGE_KEY, adminKey)
  localStorage.removeItem(ADMIN_KEY_STORAGE_KEY)
}

export function clearStoredAdminKey() {
  sessionStorage.removeItem(ADMIN_KEY_STORAGE_KEY)
  localStorage.removeItem(ADMIN_KEY_STORAGE_KEY)
}

export function getLikedArticleIds() {
  return parseJsonSafely(localStorage.getItem('likedArticles') || '[]', [])
}

export function setLikedArticleIds(ids) {
  localStorage.setItem('likedArticles', JSON.stringify(ids))
}
