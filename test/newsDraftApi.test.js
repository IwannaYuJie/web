import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { request as httpRequest } from 'node:http'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createArticleApiServer } from '../server/app.mjs'
import { NewsDraftStore } from '../server/newsDraftStore.mjs'
import { ArticleStore } from '../server/articleStore.mjs'
import { createNewsDraftService } from '../shared/news-drafts/service.js'

const ADMIN_KEY = 'test-admin-key'
const TOKEN = 'test-collector-secret'
const ADMIN = { 'X-Admin-Key': ADMIN_KEY }
const COLLECTOR = { Authorization: `Bearer ${TOKEN}` }
const item = (runId, suffix = 'one') => ({
  runId,
  sourceId: 'cloudflare',
  sourceName: 'untrusted-name',
  sourceUrl: `https://blog.cloudflare.com/${suffix}/`,
  sourceTitle: `Original ${suffix}`,
  sourcePublishedAt: '2026-09-22T00:00:00Z',
  title: `资讯 ${suffix}`,
  description: '简短摘要',
  content: '## 发生了什么\n\n新的功能正式发布。\n\n## 有什么用\n\n适合开发网站。',
  tags: ['AI', 'Cloudflare'],
  model: '@cf/test/model'
})

describe('private news draft API', () => {
  let directory
  let server
  let baseUrl
  let currentTime
  let fetchImpl

  async function request(path = '', { method = 'GET', headers = ADMIN, body } = {}) {
    const response = await fetch(`${baseUrl}/api/news-drafts${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {})
    })
    return { status: response.status, headers: response.headers, data: await response.json() }
  }

  async function start(runId) {
    return request('/collector/start', {
      method: 'POST',
      headers: COLLECTOR,
      body: runId ? { runId } : {}
    })
  }

  async function ingest(runId, suffix = 'one', overrides = {}) {
    return request('/collector/ingest', {
      method: 'POST',
      headers: COLLECTOR,
      body: { ...item(runId, suffix), ...overrides }
    })
  }

  async function finish(runId, overrides = {}) {
    return request('/collector/finish', {
      method: 'POST',
      headers: COLLECTOR,
      body: { runId, status: 'success', ...overrides }
    })
  }

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'orange-cat-news-'))
    currentTime = '2026-09-22T01:00:00.000Z'
    fetchImpl = vi.fn().mockResolvedValue(new Response('{}', { status: 202 }))
    server = await createArticleApiServer({
      dataFile: join(directory, 'articles.json'),
      adminKey: ADMIN_KEY,
      collectorToken: TOKEN,
      workerUrl: 'https://collector.example.com',
      fetchImpl,
      now: () => currentTime
    })
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    baseUrl = `http://127.0.0.1:${server.address().port}`
  })

  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve))
    await rm(directory, { recursive: true, force: true })
  })

  it('keeps every draft private and separates collector and admin privileges', async () => {
    for (const [path, method] of [
      ['', 'GET'],
      ['/collect', 'POST'],
      ['/any/publish', 'POST'],
      ['/any', 'PUT'],
      ['/any', 'DELETE']
    ]) {
      expect((await request(path, { method, headers: {} })).status).toBe(401)
      expect((await request(path, { method, headers: COLLECTOR })).status).toBe(401)
    }
    expect((await request('/collector', { headers: ADMIN })).status).toBe(401)
    expect((await request('/collector/start', { method: 'POST', headers: ADMIN })).status).toBe(401)
    const listed = await request()
    expect(listed.headers.get('cache-control')).toBe('no-store')
    expect(listed.data).toMatchObject({
      drafts: [],
      dailyLimit: 3,
      remaining: 3,
      collector: { status: 'idle' }
    })
    expect(listed.data.sources.map((source) => source.id)).toEqual(['cloudflare', 'openai'])
  })

  it('rejects malformed absolute request targets without terminating the article server', async () => {
    const status = await new Promise((resolve, reject) => {
      const outgoing = httpRequest(
        {
          hostname: '127.0.0.1',
          port: server.address().port,
          path: 'http://[invalid',
          method: 'GET'
        },
        (response) => {
          response.resume()
          response.on('end', () => resolve(response.statusCode))
        }
      )
      outgoing.on('error', reject)
      outgoing.end()
    })
    expect(status).toBe(400)
    expect((await fetch(`${baseUrl}/healthz`)).status).toBe(200)
  })

  it('deduplicates canonical original URLs, including dismissed drafts, without publishing', async () => {
    const { data: run } = await start()
    const first = await ingest(run.runId, 'one', {
      sourceUrl: 'https://blog.cloudflare.com/one/?utm_source=rss#top'
    })
    expect(first.data.created).toBe(true)
    expect((await ingest(run.runId)).data).toMatchObject({
      created: false,
      alreadyCreatedForRun: true,
      remaining: 2
    })
    expect((await request()).data.drafts[0].sourceName).toBe('Cloudflare Blog')
    expect((await finish(run.runId, { created: 999 })).data.collector.created).toBe(1)
    expect((await request(`/${first.data.draftId}`, { method: 'DELETE' })).status).toBe(200)
    expect((await request()).data.drafts).toEqual([])
    expect((await request('/collector', { headers: COLLECTOR })).data.seenUrls).toEqual([
      'https://blog.cloudflare.com/one/'
    ])
    const next = await start()
    expect((await ingest(next.data.runId)).data.created).toBe(false)
    expect(await fetch(`${baseUrl}/api/articles`).then((response) => response.json())).toEqual([])
  })

  it('enforces the daily limit atomically across concurrent ingests and resets at UTC+8 midnight', async () => {
    const { data: run } = await start()
    const results = await Promise.all(
      Array.from({ length: 9 }, (_, index) => ingest(run.runId, `item-${index}`))
    )
    expect(results.filter((result) => result.data.created)).toHaveLength(3)
    expect(results.filter((result) => result.status === 429)).toHaveLength(6)
    expect((await finish(run.runId)).data.collector.created).toBe(3)
    expect((await start()).status).toBe(429)
    expect((await request('/collect', { method: 'POST' })).status).toBe(429)
    expect(fetchImpl).not.toHaveBeenCalled()
    currentTime = '2026-09-22T16:00:00.000Z'
    const next = await start()
    expect(next.data.remaining).toBe(3)
    expect((await ingest(next.data.runId, 'next-day')).data.remaining).toBe(2)
  })

  it('locks concurrent collectors and supports durable workflow start and finish retries', async () => {
    const results = await Promise.all([start('workflow-one'), start('workflow-two')])
    expect(results.map((result) => result.status).sort()).toEqual([200, 409])
    const runId = results.find((result) => result.status === 200).data.runId
    expect((await request('/collect', { method: 'POST' })).status).toBe(409)
    expect(fetchImpl).not.toHaveBeenCalled()
    expect((await start(runId)).data.runId).toBe(runId)
    await ingest(runId)
    expect((await finish(runId, { status: 'error', error: TOKEN })).status).toBe(200)
    expect((await finish(runId, { status: 'success' })).data.collector.status).toBe('error')
    expect((await start(runId)).data).toMatchObject({ runId, finished: true, status: 'error' })
    expect(JSON.stringify((await request()).data)).not.toContain(TOKEN)
    expect(await readFile(join(directory, 'news-drafts.json'), 'utf8')).not.toContain(TOKEN)
  })

  it('recovers expired collection locks and prevents the stale owner from writing', async () => {
    const first = await start()
    currentTime = '2026-09-22T01:21:00.000Z'
    expect((await request()).data.collector.status).toBe('error')
    const second = await start()
    expect(second.status).toBe(200)
    expect(second.data.runId).not.toBe(first.data.runId)
    expect((await ingest(first.data.runId)).status).toBe(409)
    expect((await finish(first.data.runId)).status).toBe(409)
    expect((await ingest(second.data.runId)).data.created).toBe(true)
  })

  it('rejects nonofficial sources, malformed fields, and large bodies without breaking the queue', async () => {
    const { data: run } = await start()
    for (const sourceUrl of [
      'http://blog.cloudflare.com/x/',
      'https://blog.cloudflare.com.evil.test/x/',
      'https://user:secret@blog.cloudflare.com/x/',
      'https://openai.com/x/'
    ]) {
      expect((await ingest(run.runId, 'one', { sourceUrl })).status).toBe(400)
    }
    expect((await ingest(run.runId, 'one', { title: '', tags: [] })).status).toBe(400)
    expect((await ingest(run.runId, 'one', { tags: Array(11).fill('tag') })).status).toBe(400)
    expect((await ingest(run.runId, 'one', { content: 'x'.repeat(256 * 1024) })).status).toBe(413)
    expect((await ingest(run.runId)).data.created).toBe(true)
  })

  it('edits draft fields and publishes once during concurrent requests; normal article edits keep the marker', async () => {
    const { data: run } = await start()
    const { data: saved } = await ingest(run.runId)
    const edited = await request(`/${saved.draftId}`, {
      method: 'PUT',
      body: { title: '人工修订', sourceUrl: 'https://evil.test/' }
    })
    expect(edited.data.draft.title).toBe('人工修订')
    expect(edited.data.draft.sourceUrl).toBe('https://blog.cloudflare.com/one/')
    const sourceEdited = await request(`/${saved.draftId}`, {
      method: 'PUT',
      body: { sourcePublishedAt: '2026-01-01T00:00:00Z' }
    })
    expect(sourceEdited.data.draft.sourcePublishedAt).toBe('2026-09-22T00:00:00.000Z')
    const published = await Promise.all(
      Array.from({ length: 6 }, () => request(`/${saved.draftId}/publish`, { method: 'POST' }))
    )
    expect(published.every((response) => response.status === 200)).toBe(true)
    expect(new Set(published.map((response) => response.data.article.id)).size).toBe(1)
    const articleId = published[0].data.article.id
    const updated = await fetch(`${baseUrl}/api/articles?id=${articleId}`, {
      method: 'PUT',
      headers: { ...ADMIN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '文章再修订', newsDraftId: 'override' })
    }).then((response) => response.json())
    expect(updated.newsDraftId).toBe(saved.draftId)
    expect(updated.content).toContain('https://blog.cloudflare.com/one/')
    expect(updated.content).toContain('原文发布时间：2026-09-22 08:00（UTC+8）')
    expect(updated.content).toContain('AI 辅助整理，经人工审核发布')
    expect((await request(`/${saved.draftId}/publish`, { method: 'POST' })).data.article.id).toBe(
      articleId
    )
    expect(
      (await request(`/${saved.draftId}`, { method: 'PUT', body: { title: 'too late' } })).status
    ).toBe(409)
    expect(await fetch(`${baseUrl}/api/articles`).then((response) => response.json())).toHaveLength(
      1
    )
  })

  it('triggers only the configured worker and gives sanitized upstream errors', async () => {
    expect((await request('/collect', { method: 'POST' })).status).toBe(202)
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://collector.example.com/run',
      expect.objectContaining({
        method: 'POST',
        redirect: 'error',
        headers: expect.objectContaining({ Authorization: `Bearer ${TOKEN}` })
      })
    )
    fetchImpl.mockResolvedValueOnce(new Response(TOKEN, { status: 409 }))
    expect((await request('/collect', { method: 'POST' })).status).toBe(409)
    fetchImpl.mockRejectedValueOnce(new Error(TOKEN))
    const failed = await request('/collect', { method: 'POST' })
    expect(failed.status).toBe(502)
    expect(JSON.stringify(failed.data)).not.toContain(TOKEN)
  })
})

describe('news draft persistence and optional configuration', () => {
  let directory
  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'orange-cat-news-state-'))
  })
  afterEach(async () => {
    await rm(directory, { recursive: true, force: true })
  })

  it('recovers after the article commits but the draft status write fails, including a store reopen', async () => {
    const store = new NewsDraftStore(join(directory, 'news-drafts.json'))
    const articleStore = new ArticleStore(join(directory, 'articles.json'))
    await store.init()
    await articleStore.init()
    const service = createNewsDraftService({ store, articleStore, enabled: true })
    const run = await service.start()
    const saved = await service.ingest(item(run.runId))
    const writeSpy = vi
      .spyOn(store, 'writeState')
      .mockRejectedValueOnce(new Error('simulated disk failure'))
    await expect(service.publish(saved.draftId)).rejects.toThrow('simulated disk failure')
    expect(await articleStore.read()).toHaveLength(1)
    expect((await store.read()).drafts[0].status).toBe('draft')
    writeSpy.mockRestore()
    const reopened = new NewsDraftStore(store.filePath)
    await reopened.init()
    const recovered = await createNewsDraftService({
      store: reopened,
      articleStore,
      enabled: true
    }).publish(saved.draftId)
    expect(recovered.draft.status).toBe('published')
    expect(await articleStore.read()).toHaveLength(1)
    expect(JSON.parse(await readFile(`${store.filePath}.previous`, 'utf8')).drafts[0].status).toBe(
      'draft'
    )
  })

  it('keeps article APIs available and reports disabled status without collector configuration', async () => {
    const server = await createArticleApiServer({
      dataFile: join(directory, 'articles.json'),
      adminKey: ADMIN_KEY
    })
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    const baseUrl = `http://127.0.0.1:${server.address().port}`
    try {
      const list = await fetch(`${baseUrl}/api/news-drafts`, { headers: ADMIN }).then((response) =>
        response.json()
      )
      expect(list.collector.status).toBe('disabled')
      expect(
        (await fetch(`${baseUrl}/api/news-drafts/collect`, { method: 'POST', headers: ADMIN }))
          .status
      ).toBe(503)
      expect(
        (await fetch(`${baseUrl}/api/news-drafts/collector`, { headers: COLLECTOR })).status
      ).toBe(503)
      expect((await fetch(`${baseUrl}/healthz`)).status).toBe(200)
      expect(await fetch(`${baseUrl}/api/articles`).then((response) => response.json())).toEqual([])
    } finally {
      await new Promise((resolve) => server.close(resolve))
    }
  })
})
