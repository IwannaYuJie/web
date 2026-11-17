import { prefetchArticlesList } from '../services/articles'

const prefetchedPaths = new Set()

const ROUTE_LOADERS = {
  '/': () => import('../pages/Home'),
  '/archive': () => import('../pages/Archive'),
  '/tags': () => import('../pages/Tags'),
  '/creative': () => import('../pages/CreativeShowcase'),
  '/games': () => import('../pages/GameHub'),
  '/toolbox': () => import('../pages/Toolbox'),
  '/about': () => import('../pages/About'),
  '/admin/articles': () => import('../pages/ArticleManager'),
}

const ARTICLE_DATA_ROUTES = new Set(['/', '/archive', '/tags', '/admin/articles'])

export function prefetchRoute(path) {
  if (!path) {
    return
  }

  if (ARTICLE_DATA_ROUTES.has(path)) {
    prefetchArticlesList()
  }

  if (path === '/games' || path.startsWith('/games/')) {
    if (!prefetchedPaths.has('/games')) {
      prefetchedPaths.add('/games')
      ROUTE_LOADERS['/games']().catch(() => {
        prefetchedPaths.delete('/games')
      })
    }
    return
  }

  if (path.startsWith('/article/')) {
    if (!prefetchedPaths.has('__article_detail__')) {
      prefetchedPaths.add('__article_detail__')
      Promise.all([
        import('../pages/ArticleDetail'),
        import('../components/MarkdownRenderer'),
      ]).catch(() => {
        prefetchedPaths.delete('__article_detail__')
      })
    }
    return
  }

  const loader = ROUTE_LOADERS[path]
  if (loader && !prefetchedPaths.has(path)) {
    prefetchedPaths.add(path)
    loader().catch(() => {
      prefetchedPaths.delete(path)
    })
  }
}
