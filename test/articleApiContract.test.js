import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer as createViteServer } from 'vite'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createArticleApiServer } from '../server/app.mjs'
import { createMockApiPlugin } from '../dev/viteMocks.js'
import { onRequest } from '../functions/api/articles.js'
import { ARTICLES_LIST_KEY } from '../functions/_shared/articles.js'
import { seededArticles } from '../shared/content/articlesSeed.js'

const ADMIN_KEY = 'contract-test-key'
const headers = { 'Content-Type': 'application/json', 'X-Admin-Key': ADMIN_KEY }
const articleInput = {
  title: ' 契约测试文章 ', description: ' 摘要 ', category: ' 测试 ', readTime: 5,
  date: '2026-09-01', content: '测试正文', tags: [' 架构 ', ''],
}

describe.each(['VPS 文件存储', 'Vite 开发接口', 'Pages KV 适配'])('%s：共享接口契约', (runtime) => {
  let request
  let cleanup

  beforeEach(async () => {
    cleanup = async () => {}
    if (runtime === 'Pages KV 适配') {
      const kv = new Map([[ARTICLES_LIST_KEY, JSON.stringify(seededArticles)]])
      const env = {
        ADMIN_KEY,
        ARTICLES_KV: {
          get: async (key) => JSON.parse(kv.get(key) || 'null'),
          put: async (key, value) => { kv.set(key, value) },
        },
      }
      request = (path, options) => onRequest({ request: new Request(`http://localhost${path}`, options), env })
      return
    }
    if (runtime === 'Vite 开发接口') {
      const server = await createViteServer({
        configFile: false,
        plugins: [createMockApiPlugin(ADMIN_KEY)],
        server: { host: '127.0.0.1', port: 0 },
        appType: 'custom',
        logLevel: 'silent',
      })
      cleanup = () => server.close()
      await server.listen()
      request = (path, options) => fetch(`http://127.0.0.1:${server.httpServer.address().port}${path}`, options)
      return
    }
    const directory = await mkdtemp(join(tmpdir(), 'orange-cat-contract-'))
    const dataFile = join(directory, 'articles.json')
    cleanup = () => rm(directory, { recursive: true, force: true })
    await writeFile(dataFile, JSON.stringify(seededArticles))
    const server = await createArticleApiServer({ dataFile, adminKey: ADMIN_KEY })
    cleanup = async () => {
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
      await rm(directory, { recursive: true, force: true })
    }
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    request = (path, options) => fetch(`http://127.0.0.1:${server.address().port}${path}`, options)
  })

  afterEach(async () => { await cleanup() })

  async function createArticle() {
    const response = await request('/api/articles', { method: 'POST', headers, body: JSON.stringify(articleInput) })
    expect(response.status).toBe(201)
    return response.json()
  }

  it('支持规范化创建、部分更新、详情和删除，保持字段及响应格式', async () => {
    const created = await createArticle()
    expect(created).toMatchObject({
      title: '契约测试文章', description: '摘要', category: '测试', readTime: '5',
      content: '测试正文', date: '2026-09-01', tags: ['架构'], author: '橘猫博主',
      createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      updatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    })
    const update = await request(`/api/articles?id=${created.id}`, {
      method: 'POST', headers: { ...headers, 'X-HTTP-Method-Override': 'put' },
      body: JSON.stringify({ title: '新标题', id: 99999, createdAt: '1900-01-01' }),
    })
    expect(update.status).toBe(200)
    const updated = await update.json()
    expect(updated).toEqual({ ...created, title: '新标题' })
    expect(await request(`/api/articles?id=${created.id}`).then(r => r.json())).toEqual(updated)
    expect(await request(`/api/articles/${created.id}`).then(r => r.json())).toEqual(updated)

    const removed = await request(`/api/articles?id=${created.id}`, {
      method: 'POST', headers: { ...headers, 'X-HTTP-Method-Override': 'DELETE' },
    })
    expect(removed.status).toBe(200)
    expect(await removed.json()).toEqual({ message: '文章删除成功', deletedArticle: updated })
    expect((await request(`/api/articles?id=${created.id}`)).status).toBe(404)
  })

  it('列表按日期倒序返回', async () => {
    const response = await request('/api/articles')
    expect(response.status).toBe(200)
    const dates = (await response.json()).map(article => new Date(article.date).getTime())
    expect(dates.length).toBeGreaterThan(0)
    expect(dates).toEqual([...dates].sort((a, b) => b - a))
  })

  it('鉴权失败时不修改数据，查询参数和路径都支持登录校验', async () => {
    const before = await request('/api/articles').then(r => r.json())
    for (const method of ['POST', 'PUT', 'DELETE']) {
      const response = await request(`/api/articles?id=${before[0].id}`, {
        method, headers: { ...headers, 'X-Admin-Key': 'wrong-key' },
        ...(method !== 'DELETE' ? { body: JSON.stringify(articleInput) } : {}),
      })
      expect(response.status).toBe(401)
    }
    for (const path of ['/api/articles?id=auth-check', '/api/articles/auth-check']) {
      expect((await request(path, { method: 'POST' })).status).toBe(401)
      expect((await request(path, { method: 'POST', headers })).status).toBe(200)
    }
    expect(await request('/api/articles').then(r => r.json())).toEqual(before)
  })

  it.each(['title', 'description', 'category', 'readTime'])('创建和更新都校验必填字段 %s，拒绝后还能继续写入', async (field) => {
    const response = await request('/api/articles', {
      method: 'POST', headers, body: JSON.stringify({ ...articleInput, [field]: ' ' }),
    })
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: `缺少必填字段: ${field}` })
    const created = await createArticle()
    const update = await request(`/api/articles?id=${created.id}`, {
      method: 'PUT', headers, body: JSON.stringify({ [field]: '' }),
    })
    expect(update.status).toBe(400)
    expect(await request(`/api/articles?id=${created.id}`).then(r => r.json())).toEqual(created)
    const retry = await request(`/api/articles?id=${created.id}`, {
      method: 'PUT', headers, body: JSON.stringify({ title: '校验失败后仍能更新' }),
    })
    expect(retry.status).toBe(200)
  })

  it.each(['{', 'null', '[]', '42'])('非法请求体 %s 返回 400', async (body) => {
    expect((await request('/api/articles', { method: 'POST', headers, body })).status).toBe(400)
  })

  it('拒绝截断 ID 和多余路径段，避免误删文章或误返回列表', async () => {
    const before = await request('/api/articles').then(r => r.json())
    const invalidId = `${before[0].id}oops`
    expect((await request(`/api/articles?id=${invalidId}`, { method: 'DELETE', headers })).status).toBe(400)
    expect((await request('/api/articles/1/extra')).status).toBe(404)
    expect(await request('/api/articles').then(r => r.json())).toEqual(before)
  })

  it('保留 OPTIONS，拒绝不支持的方法及方法覆盖', async () => {
    expect((await request('/api/articles', { method: 'OPTIONS' })).status).toBe(204)
    expect((await request('/api/articles', { method: 'PATCH' })).status).toBe(405)
    expect((await request('/api/articles', {
      method: 'POST', headers: { ...headers, 'X-HTTP-Method-Override': 'GET' },
    })).status).toBe(400)
  })
})
