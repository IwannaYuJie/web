import { requestJson } from './http'

const ADMIN_KEY_STORAGE_KEY = 'adminKey'

function parseJsonSafely(value, fallback) {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export async function fetchArticlesList(signal) {
  return requestJson('/api/articles', { signal }, '获取文章列表失败')
}

export async function fetchArticleById(id, signal) {
  return requestJson(`/api/articles?id=${id}`, { signal }, '获取文章失败')
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
  return requestJson('/api/articles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': adminKey,
    },
    body: JSON.stringify(articleData),
  }, '创建文章失败')
}

export async function updateArticle(id, articleData, adminKey) {
  return requestJson(`/api/articles?id=${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': adminKey,
      'X-HTTP-Method-Override': 'PUT',
    },
    body: JSON.stringify(articleData),
  }, '更新文章失败')
}

export async function deleteArticle(id, adminKey) {
  return requestJson(`/api/articles?id=${id}`, {
    method: 'POST',
    headers: {
      'X-Admin-Key': adminKey,
      'X-HTTP-Method-Override': 'DELETE',
    },
  }, '删除文章失败')
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
