import { readArticles, writeArticles } from './articles.js'

// KV 仅用于备用环境；整表读改写仍不提供跨请求事务或并发写入保证。
export function createKvArticleStore(env) {
  return {
    read: () => readArticles(env),
    async update(mutator) {
      const articles = structuredClone(await readArticles(env))
      const mutation = await mutator(articles)
      await writeArticles(env, mutation.articles)
      return mutation.result
    },
  }
}
