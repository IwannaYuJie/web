import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ArticleStore } from '../server/articleStore.mjs'
import { MemoryArticleStore } from '../dev/memoryArticleStore.js'
import { createArticleService } from '../shared/articles/service.js'

const input = { title: '文章', description: '摘要', category: '测试', readTime: '3', tags: ['架构'] }

describe.each(['文件', '内存'])('%s存储：写入隔离', (kind) => {
  let store
  let service
  let directory

  beforeEach(async () => {
    if (kind === '文件') {
      directory = await mkdtemp(join(tmpdir(), 'orange-cat-store-'))
      store = new ArticleStore(join(directory, 'articles.json'))
      await store.init()
    } else {
      store = new MemoryArticleStore()
    }
    service = createArticleService(store, { today: () => '2026-09-05' })
  })

  afterEach(async () => {
    if (directory) {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it('并发创建不丢文章且 ID 唯一', async () => {
    const created = await Promise.all(Array.from({ length: 20 }, (_, index) => service.create({ ...input, title: `文章${index}` })))
    expect(new Set(created.map(article => article.id)).size).toBe(20)
    expect(await store.read()).toHaveLength(20)
  })

  it('失败的读改写不污染已保存数据，也不阻塞后续写入', async () => {
    const created = await service.create(input)
    const failed = store.update(async (articles) => {
      articles[0].tags.push('不应保存')
      throw new Error('模拟业务失败')
    })
    const next = service.create({ ...input, title: '下一篇' })
    await expect(failed).rejects.toThrow('模拟业务失败')
    await expect(next).resolves.toMatchObject({ id: 2 })
    expect(await service.get(created.id)).toEqual(created)
  })

  it('读取结果和写入返回值不会成为存储的可变引用', async () => {
    const created = await service.create(input)
    created.tags.push('外部改动')
    const snapshot = await store.read()
    snapshot[0].tags.push('快照改动')
    expect((await service.get(created.id)).tags).toEqual(['架构'])
  })

  if (kind === '文件') {
    it('保留上一次数据备份，重新打开后仍可读取最新文章', async () => {
      const created = await service.create(input)
      await service.update(created.id, { title: '更新后的标题' })
      const previous = JSON.parse(await readFile(`${store.filePath}.previous`, 'utf8'))
      expect(previous).toEqual([created])
      const reopened = new ArticleStore(store.filePath)
      await reopened.init()
      expect(await reopened.read()).toMatchObject([{ id: created.id, title: '更新后的标题' }])
    })
  }
})
