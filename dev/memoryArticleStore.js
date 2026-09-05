export class MemoryArticleStore {
  constructor(articles = []) {
    this.articles = structuredClone(articles)
    this.writeQueue = Promise.resolve()
  }

  async read() {
    return structuredClone(this.articles)
  }

  async update(mutator) {
    const operation = this.writeQueue.then(async () => {
      const mutation = await mutator(await this.read())
      if (!mutation || !Array.isArray(mutation.articles)) {
        throw new Error('文章更新必须返回 articles 数组')
      }
      this.articles = structuredClone(mutation.articles)
      return structuredClone(mutation.result)
    })
    this.writeQueue = operation.catch(() => {})
    return operation
  }
}
