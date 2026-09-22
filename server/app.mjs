import { createServer } from 'node:http'
import { dirname, join } from 'node:path'
import { ArticleStore } from './articleStore.mjs'
import { createArticleApiHandler } from './articleHandler.mjs'
import { NewsDraftStore } from './newsDraftStore.mjs'
import { createNewsDraftHandler, isNewsDraftPath } from './newsDraftHandler.mjs'
import { sendJson } from './http.mjs'

// 生产入口只负责组装文件存储和 HTTP 服务；Vite 使用相同处理器。
export async function createArticleApiServer({
  dataFile,
  adminKey,
  newsDraftsDataFile,
  collectorToken = '',
  workerUrl = '',
  fetchImpl,
  now
}) {
  const store = new ArticleStore(dataFile)
  await store.init()
  const newsStore = new NewsDraftStore(
    newsDraftsDataFile || join(dirname(dataFile), 'news-drafts.json')
  )
  await newsStore.init()
  const articleHandler = createArticleApiHandler({ store, adminKey })
  const newsHandler = createNewsDraftHandler({
    store: newsStore,
    articleStore: store,
    adminKey,
    collectorToken,
    workerUrl,
    fetchImpl,
    now
  })
  return createServer((request, response) => {
    let pathname
    try {
      pathname = new URL(request.url || '/', 'http://localhost').pathname
    } catch {
      sendJson(response, { error: '无效的请求地址' }, 400)
      return
    }
    return isNewsDraftPath(pathname)
      ? newsHandler(request, response)
      : articleHandler(request, response)
  })
}
