import { ArticleError } from '../articles/errors.js'

export const NEWS_SOURCES = [
  {
    id: 'cloudflare',
    name: 'Cloudflare Blog',
    url: 'https://blog.cloudflare.com/rss/',
    hosts: ['blog.cloudflare.com']
  },
  {
    id: 'openai',
    name: 'OpenAI News',
    url: 'https://openai.com/news/rss.xml',
    hosts: ['openai.com', 'www.openai.com']
  }
]
export const DAILY_LIMIT = 3
export const LOCK_TIMEOUT_MS = 20 * 60 * 1000
export const NEWS_SCHEDULE = '每天 09:00（UTC+8）'

export function emptyNewsState() {
  return {
    version: 1,
    drafts: [],
    collector: {
      status: 'idle',
      lastStartedAt: null,
      lastFinishedAt: null,
      error: null,
      created: 0,
      skipped: 0
    }
  }
}

export function assertObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ArticleError('请求内容必须是 JSON 对象')
  }
}

function textField(value, name, maxLength, required = true) {
  if (typeof value !== 'string' || value.length > maxLength || (required && !value.trim())) {
    throw new ArticleError(`${name}不能为空且最多 ${maxLength} 个字符`)
  }
  return value.trim()
}

export function normalizeDraft(data, existing = {}) {
  assertObject(data)
  const merged = { ...existing, ...data }
  if (
    !Array.isArray(merged.tags) ||
    merged.tags.length > 10 ||
    merged.tags.some((tag) => typeof tag !== 'string' || tag.length > 40)
  ) {
    throw new ArticleError('标签最多 10 个，每个最多 40 个字符')
  }
  return {
    title: textField(merged.title, '标题', 200),
    description: textField(merged.description, '摘要', 1000),
    content: textField(merged.content, '正文', 50000),
    tags: [...new Set(merged.tags.map((tag) => tag.trim()).filter(Boolean))]
  }
}

export function normalizeSource(data) {
  const source = NEWS_SOURCES.find((entry) => entry.id === data.sourceId)
  if (!source) {
    throw new ArticleError('未知资讯来源')
  }
  let url
  try {
    url = new URL(data.sourceUrl)
  } catch {
    throw new ArticleError('原文链接无效')
  }
  if (
    url.protocol !== 'https:' ||
    !source.hosts.includes(url.hostname) ||
    url.username ||
    url.password ||
    url.port ||
    url.href.length > 2000
  ) {
    throw new ArticleError('原文链接必须来自配置的官方 HTTPS 域名')
  }
  url.hash = ''
  for (const key of [...url.searchParams.keys()]) {
    if (/^utm_/i.test(key) || ['fbclid', 'gclid'].includes(key)) {
      url.searchParams.delete(key)
    }
  }
  let sourcePublishedAt = null
  if (data.sourcePublishedAt) {
    const parsed = new Date(data.sourcePublishedAt)
    if (Number.isNaN(parsed.getTime())) {
      throw new ArticleError('原文发布日期无效')
    }
    sourcePublishedAt = parsed.toISOString()
  }
  return {
    sourceId: source.id,
    sourceName: source.name,
    sourceUrl: url.href,
    sourceTitle: textField(data.sourceTitle, '原文标题', 500),
    sourcePublishedAt,
    model: textField(data.model || 'unknown', '模型', 200)
  }
}

export function localDay(date) {
  return new Date(new Date(date).getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

export function remainingToday(state, now) {
  return Math.max(
    0,
    DAILY_LIMIT - state.drafts.filter((draft) => localDay(draft.createdAt) === localDay(now)).length
  )
}

export function activeRun(collector, now) {
  return (
    collector.status === 'running' &&
    new Date(now).getTime() -
      new Date(collector.lastActivityAt || collector.lastStartedAt).getTime() <
      LOCK_TIMEOUT_MS
  )
}
