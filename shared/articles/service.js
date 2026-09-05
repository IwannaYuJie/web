import { ArticleError } from './errors.js'
import { nextArticleId, normalizeArticleInput, sortArticlesByDate, validateRequiredArticleFields } from './model.js'

function parseArticleId(id) {
  const numericId = Number(id)
  if (!/^\d+$/.test(String(id)) || !Number.isSafeInteger(numericId) || numericId < 1) {
    throw new ArticleError('无效的文章 ID')
  }
  return numericId
}

function assertArticleInput(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ArticleError('文章数据必须是 JSON 对象')
  }
}

function normalizeAndValidate(data, fallbackDate) {
  const normalized = normalizeArticleInput(data, fallbackDate)
  const missingField = validateRequiredArticleFields(normalized)
  if (missingField) {
    throw new ArticleError(`缺少必填字段: ${missingField}`)
  }
  return normalized
}

function findArticleIndex(articles, id) {
  const index = articles.findIndex((article) => article.id === id)
  if (index === -1) {
    throw new ArticleError('文章不存在', 404)
  }
  return index
}

/**
 * 存储契约：read() 返回文章快照；update(mutator) 提交 { articles, result }。
 * 读改写的隔离与持久化由存储实现负责；业务层不依赖 Node、KV 或 HTTP 对象。
 */
export function createArticleService(store, { today = () => new Date().toISOString().split('T')[0] } = {}) {
  return {
    async list() {
      return sortArticlesByDate(await store.read())
    },

    async get(id) {
      const numericId = parseArticleId(id)
      const articles = await store.read()
      return articles[findArticleIndex(articles, numericId)]
    },

    async create(data) {
      assertArticleInput(data)
      const now = today()
      const normalized = normalizeAndValidate(data, now)
      return store.update((articles) => {
        const article = { id: nextArticleId(articles), ...normalized, createdAt: now, updatedAt: now }
        articles.push(article)
        return { articles, result: article }
      })
    },

    async update(id, data) {
      const numericId = parseArticleId(id)
      assertArticleInput(data)
      return store.update((articles) => {
        const index = findArticleIndex(articles, numericId)
        const existing = articles[index]
        const now = today()
        const normalized = normalizeAndValidate({ ...existing, ...data }, existing.date || now)
        const article = {
          ...normalized,
          id: numericId,
          createdAt: existing.createdAt || now,
          updatedAt: now,
        }
        articles[index] = article
        return { articles, result: article }
      })
    },

    async remove(id) {
      const numericId = parseArticleId(id)
      return store.update((articles) => {
        const index = findArticleIndex(articles, numericId)
        const [deletedArticle] = articles.splice(index, 1)
        return { articles, result: { message: '文章删除成功', deletedArticle } }
      })
    },
  }
}
