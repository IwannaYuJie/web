import { seededArticles } from '../shared/content/articlesSeed.js'
import { createArticleApiHandler } from '../server/articleHandler.mjs'
import { MemoryArticleStore } from './memoryArticleStore.js'

export function createMockApiPlugin(devAdminKey) {
  return {
    name: 'mock-articles-api',
    configureServer(server) {
      const store = new MemoryArticleStore(seededArticles)
      const handler = createArticleApiHandler({ store, adminKey: devAdminKey })
      server.middlewares.use((req, res, next) => {
        const { pathname } = new URL(req.url || '/', 'http://localhost')
        if (pathname === '/healthz' || pathname === '/api/articles' || pathname.startsWith('/api/articles/')) {
          return handler(req, res)
        }
        next()
      })
    },
  }
}
