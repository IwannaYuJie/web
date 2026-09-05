import { createServer } from 'node:http'
import { ArticleStore } from './articleStore.mjs'
import { createArticleApiHandler } from './articleHandler.mjs'

// 生产入口只负责组装文件存储和 HTTP 服务；Vite 使用相同处理器。
export async function createArticleApiServer({ dataFile, adminKey }) {
  const store = new ArticleStore(dataFile)
  await store.init()
  return createServer(createArticleApiHandler({ store, adminKey }))
}
