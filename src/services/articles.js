import { requestJson } from './http'

const ADMIN_KEY_STORAGE_KEY = 'adminKey'
const CACHE_TTL_MS = 30_000

const listCache = {
  data: null,
  fetchedAt: 0,
  promise: null,
}

// id -> { data, fetchedAt, promise }
const detailCache = new Map()
const cacheSubscribers = new Set()

function parseJsonSafely(value, fallback) {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function notifyCacheSubscribers(payload) {
  cacheSubscribers.forEach((listener) => {
    try {
      listener(payload)
    } catch {
      // ignore subscriber errors
    }
  })
}

export function subscribeArticlesCache(listener) {
  cacheSubscribers.add(listener)
  return () => {
    cacheSubscribers.delete(listener)
  }
}

function seedDetailsFromList(articles) {
  if (!Array.isArray(articles)) {
    return
  }
  const now = Date.now()
  articles.forEach((item) => {
    if (item && item.id !== undefined && item.id !== null) {
      const key = String(item.id)
      const prev = detailCache.get(key)
      detailCache.set(key, {
        data: item,
        fetchedAt: now,
        promise: prev?.promise || null,
      })
    }
  })
}

export function getCachedArticlesList() {
  return listCache.data
}

export function isArticlesListStale() {
  if (!listCache.data) {
    return true
  }
  return Date.now() - listCache.fetchedAt > CACHE_TTL_MS
}

export function getCachedArticleById(id) {
  if (id === undefined || id === null || id === '') {
    return null
  }
  const key = String(id)
  const entry = detailCache.get(key)
  if (entry?.data) {
    return entry.data
  }
  if (Array.isArray(listCache.data)) {
    return listCache.data.find((item) => String(item.id) === key) || null
  }
  return null
}

export function isArticleStale(id) {
  if (id === undefined || id === null || id === '') {
    return true
  }
  const entry = detailCache.get(String(id))
  if (!entry?.data) {
    return true
  }
  return Date.now() - entry.fetchedAt > CACHE_TTL_MS
}

export function invalidateArticlesCache(id) {
  listCache.fetchedAt = 0
  listCache.data = null
  listCache.promise = null

  if (id !== undefined && id !== null && id !== '') {
    detailCache.delete(String(id))
  } else {
    detailCache.clear()
  }
  notifyCacheSubscribers({ type: 'invalidate', id: id ? String(id) : null })
}

export function clearArticlesMemoryCache() {
  invalidateArticlesCache()
}

export async function fetchArticlesList(signal) {
  return requestJson('/api/articles', { signal }, '获取文章列表失败')
}

export async function fetchArticleById(id, signal) {
  return requestJson(`/api/articles?id=${id}`, { signal }, '获取文章失败')
}

export async function loadArticlesList({ force = false } = {}) {
  if (!force && listCache.data && !isArticlesListStale()) {
    return listCache.data
  }

  if (listCache.promise && !force) {
    return listCache.promise
  }

  const pending = fetchArticlesList()
    .then((data) => {
      const normalized = Array.isArray(data) ? data : []
      listCache.data = normalized
      listCache.fetchedAt = Date.now()
      seedDetailsFromList(normalized)
      notifyCacheSubscribers({ type: 'list', data: normalized })
      return normalized
    })
    .finally(() => {
      if (listCache.promise === pending) {
        listCache.promise = null
      }
    })

  listCache.promise = pending
  return pending
}

export async function loadArticleById(id, { force = false } = {}) {
  const key = String(id)
  const existing = detailCache.get(key)
  if (!force && existing?.data && !isArticleStale(key)) {
    return existing.data
  }

  if (existing?.promise && !force) {
    return existing.promise
  }

  const pending = fetchArticleById(id)
    .then((data) => {
      detailCache.set(key, {
        data,
        fetchedAt: Date.now(),
        promise: null,
      })
      if (Array.isArray(listCache.data)) {
        const idx = listCache.data.findIndex((item) => String(item.id) === key)
        if (idx >= 0) {
          const updatedList = [...listCache.data]
          updatedList[idx] = data
          listCache.data = updatedList
        }
      }
      notifyCacheSubscribers({ type: 'detail', id: key, data })
      return data
    })
    .finally(() => {
      const entry = detailCache.get(key)
      if (entry && entry.promise === pending) {
        detailCache.set(key, { ...entry, promise: null })
      }
    })

  detailCache.set(key, {
    data: existing?.data || null,
    fetchedAt: existing?.fetchedAt || 0,
    promise: pending,
  })
  return pending
}

export function prefetchArticlesList() {
  if (!isArticlesListStale() || listCache.promise) {
    return
  }
  loadArticlesList({ force: Boolean(listCache.data) }).catch(() => {})
}

export function prefetchArticleById(id) {
  if (!id) {
    return
  }
  const key = String(id)
  const entry = detailCache.get(key)
  if ((!isArticleStale(key) && entry?.data) || entry?.promise) {
    return
  }
  loadArticleById(id, { force: Boolean(entry?.data) }).catch(() => {})
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
  const created = await requestJson('/api/articles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': adminKey,
    },
    body: JSON.stringify(articleData),
  }, '创建文章失败')

  invalidateArticlesCache()
  loadArticlesList({ force: true }).catch(() => {})
  return created
}

export async function updateArticle(id, articleData, adminKey) {
  const updated = await requestJson(`/api/articles?id=${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': adminKey,
      'X-HTTP-Method-Override': 'PUT',
    },
    body: JSON.stringify(articleData),
  }, '更新文章失败')

  invalidateArticlesCache(id)
  loadArticlesList({ force: true }).catch(() => {})
  return updated
}

export async function deleteArticle(id, adminKey) {
  const deleted = await requestJson(`/api/articles?id=${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': adminKey,
      'X-HTTP-Method-Override': 'DELETE',
    },
  }, '删除文章失败')

  invalidateArticlesCache(id)
  loadArticlesList({ force: true }).catch(() => {})
  return deleted
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
