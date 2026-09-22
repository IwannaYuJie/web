import { seededArticles } from '../shared/content/articlesSeed.js'
import { createArticleApiHandler } from '../server/articleHandler.mjs'
import { NewsDraftStore } from '../server/newsDraftStore.mjs'
import { createNewsDraftHandler, isNewsDraftPath } from '../server/newsDraftHandler.mjs'
import { MemoryArticleStore } from './memoryArticleStore.js'

export function createMockApiPlugin(devAdminKey, newsConfig = {}) {
  return {
    name: 'mock-articles-api',
    async configureServer(server) {
      const store = new MemoryArticleStore(seededArticles)
      const handler = createArticleApiHandler({ store, adminKey: devAdminKey })
      const newsStore = new NewsDraftStore(newsConfig.dataFile || './data/dev-news-drafts.json')
      await newsStore.init()
      const newsHandler = createNewsDraftHandler({
        store: newsStore, articleStore: store, adminKey: devAdminKey,
        collectorToken: newsConfig.collectorToken || '', workerUrl: newsConfig.workerUrl || '',
      })
      server.middlewares.use((req, res, next) => {
        const { pathname } = new URL(req.url || '/', 'http://localhost')
        if (isNewsDraftPath(pathname)) {return newsHandler(req, res)}
        if (pathname === '/healthz' || pathname === '/api/articles' || pathname.startsWith('/api/articles/')) {
          return handler(req, res)
        }
        next()
      })
    },
  }
}
