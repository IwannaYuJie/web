import { copyFile, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

function assertArticleArray(value) {
  if (!Array.isArray(value)) {
    throw new Error('文章数据文件必须是 JSON 数组')
  }

  return value
}

export class ArticleStore {
  constructor(filePath) {
    if (!filePath) {
      throw new Error('缺少文章数据文件路径')
    }

    this.filePath = filePath
    this.writeQueue = Promise.resolve()
  }

  async init() {
    await mkdir(dirname(this.filePath), { recursive: true })

    try {
      await this.read()
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error
      }

      await this.writeArticles([])
    }
  }

  async read() {
    const content = await readFile(this.filePath, 'utf8')
    return assertArticleArray(JSON.parse(content))
  }

  async update(mutator) {
    const operation = this.writeQueue.then(async () => {
      const currentArticles = await this.read()
      const mutation = await mutator(structuredClone(currentArticles))

      if (!mutation || !Array.isArray(mutation.articles)) {
        throw new Error('文章更新必须返回 articles 数组')
      }

      await this.writeArticles(mutation.articles)
      return mutation.result
    })

    this.writeQueue = operation.catch(() => {})
    return operation
  }

  async writeArticles(articles) {
    assertArticleArray(articles)

    const temporaryPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`
    const previousPath = `${this.filePath}.previous`
    const serialized = `${JSON.stringify(articles, null, 2)}\n`

    await writeFile(temporaryPath, serialized, { encoding: 'utf8', mode: 0o600 })

    try {
      try {
        await copyFile(this.filePath, previousPath)
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error
        }
      }

      await rename(temporaryPath, this.filePath)
    } finally {
      await unlink(temporaryPath).catch(() => {})
    }
  }
}
