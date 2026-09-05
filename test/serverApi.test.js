import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createArticleApiServer } from '../server/app.mjs'

const ADMIN_KEY = 'test-admin-key'

describe('VPS article API', () => {
  let baseUrl
  let dataFile
  let server
  let temporaryDirectory

  beforeEach(async () => {
    temporaryDirectory = await mkdtemp(join(tmpdir(), 'orange-cat-api-'))
    dataFile = join(temporaryDirectory, 'articles.json')
    await writeFile(
      dataFile,
      JSON.stringify([
        {
          id: 1,
          title: '旧文章',
          description: '旧摘要',
          date: '2026-01-01',
          category: '测试',
          readTime: '3',
          content: '正文',
          tags: ['旧'],
          author: '橘猫博主'
        }
      ])
    )

    server = await createArticleApiServer({ dataFile, adminKey: ADMIN_KEY })
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    baseUrl = `http://127.0.0.1:${address.port}`
  })

  afterEach(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
    await rm(temporaryDirectory, { recursive: true, force: true })
  })

  it('serves health and the article list', async () => {
    const health = await fetch(`${baseUrl}/healthz`).then((response) => response.json())
    const articles = await fetch(`${baseUrl}/api/articles`).then((response) => response.json())

    expect(health).toMatchObject({ ok: true, articleCount: 1 })
    expect(articles).toHaveLength(1)
    expect(articles[0].title).toBe('旧文章')
  })

  it('requires the admin key and supports auth-check', async () => {
    const unauthorized = await fetch(`${baseUrl}/api/articles?id=auth-check`, { method: 'POST' })
    const authorized = await fetch(`${baseUrl}/api/articles?id=auth-check`, {
      method: 'POST',
      headers: { 'X-Admin-Key': ADMIN_KEY }
    })

    expect(unauthorized.status).toBe(401)
    expect(authorized.status).toBe(200)
  })

  it('creates, updates, deletes and persists an article', async () => {
    const headers = {
      'Content-Type': 'application/json',
      'X-Admin-Key': ADMIN_KEY
    }
    const createdResponse = await fetch(`${baseUrl}/api/articles`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: '新文章',
        description: '新摘要',
        category: '测试',
        readTime: '5',
        content: '新正文',
        tags: ['新']
      })
    })
    const created = await createdResponse.json()

    const updatedResponse = await fetch(`${baseUrl}/api/articles?id=${created.id}`, {
      method: 'POST',
      headers: { ...headers, 'X-HTTP-Method-Override': 'PUT' },
      body: JSON.stringify({ title: '更新文章' })
    })
    const updated = await updatedResponse.json()

    const deletedResponse = await fetch(`${baseUrl}/api/articles?id=${created.id}`, {
      method: 'POST',
      headers: {
        'X-Admin-Key': ADMIN_KEY,
        'X-HTTP-Method-Override': 'DELETE'
      }
    })
    const persisted = JSON.parse(await readFile(dataFile, 'utf8'))

    expect(createdResponse.status).toBe(201)
    expect(created.id).toBe(2)
    expect(updated.title).toBe('更新文章')
    expect(deletedResponse.status).toBe(200)
    expect(persisted.map((article) => article.id)).toEqual([1])
  })

  it('does not expose the old unauthenticated initialization endpoint', async () => {
    const response = await fetch(`${baseUrl}/api/init-articles`, { method: 'POST' })
    expect(response.status).toBe(404)
  })

  it('保留请求体大小上限，拒绝超限后仍能正常服务', async () => {
    const response = await fetch(`${baseUrl}/api/articles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': ADMIN_KEY },
      body: JSON.stringify({ content: 'x'.repeat(2 * 1024 * 1024) })
    })
    expect(response.status).toBe(413)
    expect((await fetch(`${baseUrl}/healthz`)).status).toBe(200)
    expect(JSON.parse(await readFile(dataFile, 'utf8'))).toHaveLength(1)
  })
})
