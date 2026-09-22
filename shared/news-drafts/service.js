import { ArticleError } from '../articles/errors.js'
import { nextArticleId } from '../articles/model.js'
import {
  activeRun,
  assertObject,
  DAILY_LIMIT,
  localDay,
  NEWS_SCHEDULE,
  NEWS_SOURCES,
  normalizeDraft,
  normalizeSource,
  remainingToday
} from './model.js'

function findDraft(state, id) {
  const draft = state.drafts.find((item) => item.id === id)
  if (!draft || draft.status === 'dismissed') {
    throw new ArticleError('草稿不存在', 404)
  }
  return draft
}

function requireRun(state, runId, now) {
  if (!runId || state.collector.runId !== runId || !activeRun(state.collector, now)) {
    throw new ArticleError('采集任务已结束或锁已过期，请重新启动采集', 409)
  }
}

function context(state, now) {
  return {
    seenUrls: state.drafts.map((draft) => draft.sourceUrl),
    remaining: remainingToday(state, now),
    ...(activeRun(state.collector, now) ? { runId: state.collector.runId } : {})
  }
}

function collectorView(collector, now, enabled) {
  const { status, lastStartedAt, lastFinishedAt, error, created, skipped } = collector
  if (status === 'running' && !activeRun(collector, now)) {
    return {
      status: 'error',
      lastStartedAt,
      lastFinishedAt,
      created,
      skipped,
      error: '上次采集超时，可重新采集'
    }
  }
  return {
    status: enabled ? status : 'disabled',
    lastStartedAt,
    lastFinishedAt,
    error: enabled ? error : '资讯采集尚未配置，可继续管理已有草稿',
    created,
    skipped
  }
}

export function createNewsDraftService({
  store,
  articleStore,
  enabled = false,
  now = () => new Date().toISOString(),
  makeId = () => globalThis.crypto.randomUUID()
}) {
  return {
    async list() {
      const state = await store.read()
      return {
        drafts: state.drafts
          .filter((draft) => draft.status !== 'dismissed')
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        collector: collectorView(state.collector, now(), enabled),
        sources: NEWS_SOURCES.map(({ id, name, url }) => ({ id, name, url })),
        schedule: NEWS_SCHEDULE,
        dailyLimit: DAILY_LIMIT,
        remaining: remainingToday(state, now())
      }
    },

    async collectorContext() {
      return context(await store.read(), now())
    },

    async start(data = {}) {
      assertObject(data)
      if (
        data.runId !== undefined &&
        (typeof data.runId !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(data.runId))
      ) {
        throw new ArticleError('采集任务 ID 无效')
      }
      return store.update((state) => {
        const timestamp = now()
        if (data.runId && state.collector.runId === data.runId) {
          if (['success', 'error'].includes(state.collector.status)) {
            return {
              ...context(state, timestamp),
              runId: data.runId,
              finished: true,
              status: state.collector.status
            }
          }
          if (activeRun(state.collector, timestamp)) {
            return context(state, timestamp)
          }
        }
        if (activeRun(state.collector, timestamp)) {
          throw new ArticleError('已有资讯采集任务正在运行', 409)
        }
        if (!remainingToday(state, timestamp)) {
          throw new ArticleError('今天已经生成 3 篇草稿，明天再来吧', 429)
        }
        const runId = data.runId || makeId()
        state.collector = {
          status: 'running',
          runId,
          lastStartedAt: timestamp,
          lastActivityAt: timestamp,
          lastFinishedAt: null,
          error: null,
          created: state.drafts.filter((draft) => draft.collectorRunId === runId).length,
          skipped: 0
        }
        return context(state, timestamp)
      })
    },

    async ingest(data) {
      assertObject(data)
      const normalized = normalizeDraft(data)
      const source = normalizeSource(data)
      return store.update((state) => {
        const timestamp = now()
        requireRun(state, data.runId, timestamp)
        state.collector.lastActivityAt = timestamp
        const existing = state.drafts.find((draft) => draft.sourceUrl === source.sourceUrl)
        if (existing) {
          const alreadyCreatedForRun = existing.collectorRunId === data.runId
          if (!alreadyCreatedForRun) {
            state.collector.skipped += 1
          }
          return {
            created: false,
            skipped: !alreadyCreatedForRun,
            alreadyCreatedForRun,
            draftId: existing.id,
            remaining: remainingToday(state, timestamp)
          }
        }
        if (!remainingToday(state, timestamp)) {
          throw new ArticleError('今天已经生成 3 篇草稿', 429)
        }
        const draft = {
          id: makeId(),
          ...normalized,
          ...source,
          collectorRunId: data.runId,
          status: 'draft',
          createdAt: timestamp,
          updatedAt: timestamp,
          publishedArticleId: null
        }
        state.drafts.push(draft)
        state.collector.created += 1
        return { created: true, draftId: draft.id, remaining: remainingToday(state, timestamp) }
      })
    },

    async finish(data) {
      assertObject(data)
      if (!['success', 'error'].includes(data.status)) {
        throw new ArticleError('采集结果状态无效')
      }
      return store.update((state) => {
        const timestamp = now()
        if (
          data.runId &&
          state.collector.runId === data.runId &&
          ['success', 'error'].includes(state.collector.status)
        ) {
          return { collector: collectorView(state.collector, timestamp, enabled) }
        }
        requireRun(state, data.runId, timestamp)
        // Store server-counted successful writes; the worker cannot inflate the daily allowance.
        state.collector.status = data.status
        state.collector.lastFinishedAt = timestamp
        state.collector.skipped = Math.max(
          state.collector.skipped,
          Number.isSafeInteger(data.skipped) ? Math.min(Math.max(data.skipped, 0), 1000) : 0
        )
        state.collector.error =
          data.status === 'error' ? '采集未完成，请稍后重试；已保存的草稿仍可使用' : null
        return { collector: collectorView(state.collector, timestamp, enabled) }
      })
    },

    async edit(id, data) {
      assertObject(data)
      return store.update((state) => {
        const draft = findDraft(state, id)
        if (draft.status !== 'draft') {
          throw new ArticleError('已发布的草稿请到文章管理中编辑', 409)
        }
        Object.assign(draft, normalizeDraft(data, draft), { updatedAt: now() })
        return { draft }
      })
    },

    async dismiss(id) {
      return store.update((state) => {
        const draft = state.drafts.find((item) => item.id === id)
        if (!draft) {
          throw new ArticleError('草稿不存在', 404)
        }
        if (draft.status === 'published') {
          throw new ArticleError('已发布的草稿请到文章管理中删除文章', 409)
        }
        draft.status = 'dismissed'
        draft.updatedAt = now()
        return { ok: true }
      })
    },

    async publish(id) {
      return store.update(async (state) => {
        const draft = findDraft(state, id)
        const timestamp = now()
        // The article marker is committed first. If saving draft status fails or the process
        // stops here, a retry finds the same article instead of creating a second copy.
        const article = await articleStore.update((articles) => {
          let article = articles.find((item) => item.newsDraftId === draft.id)
          if (!article && draft.status === 'published') {
            throw new ArticleError('对应文章已删除，请勿重复发布', 409)
          }
          if (!article) {
            const date = localDay(timestamp)
            const sourceDate = draft.sourcePublishedAt
              ? new Date(new Date(draft.sourcePublishedAt).getTime() + 8 * 60 * 60 * 1000)
                  .toISOString()
                  .slice(0, 16)
                  .replace('T', ' ')
              : null
            const sourceFooter = `\n\n---\n\n来源：[${draft.sourceName}](${draft.sourceUrl}) · 原文：${draft.sourceTitle}${sourceDate ? `\n\n原文发布时间：${sourceDate}（UTC+8）` : ''}\n\n本文为 AI 辅助整理，经人工审核发布。`
            article = {
              id: nextArticleId(articles),
              title: draft.title,
              description: draft.description,
              content: `${draft.content}${sourceFooter}`,
              tags: draft.tags,
              category: 'AI 资讯',
              author: '橘猫博主',
              date,
              readTime: String(Math.max(1, Math.ceil(draft.content.length / 500))),
              createdAt: date,
              updatedAt: date,
              newsDraftId: draft.id
            }
            articles.push(article)
          }
          return { articles, result: article }
        })
        Object.assign(draft, {
          status: 'published',
          publishedArticleId: article.id,
          publishedAt: timestamp,
          updatedAt: timestamp
        })
        return { draft, article }
      })
    }
  }
}
