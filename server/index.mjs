import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createArticleApiServer } from './app.mjs'

const host = process.env.API_HOST || '127.0.0.1'
const port = Number.parseInt(process.env.API_PORT || '8361', 10)
const dataFile = resolve(process.env.ARTICLES_DATA_FILE || './data/articles.json')
const adminKeyFile = process.env.ADMIN_KEY_FILE || ''
const adminKey = process.env.ADMIN_KEY || (
  adminKeyFile ? readFileSync(adminKeyFile, 'utf8').trim() : ''
)

if (!adminKey) {
  console.error('缺少 ADMIN_KEY，文章 API 拒绝启动')
  process.exit(1)
}

const server = await createArticleApiServer({ dataFile, adminKey })

server.listen(port, host, () => {
  console.log(`Orange Cat API listening on http://${host}:${port}`)
})

function shutdown(signal) {
  console.log(`收到 ${signal}，正在停止 Orange Cat API`)
  server.close((error) => {
    if (error) {
      console.error('停止 Orange Cat API 失败', error)
      process.exit(1)
    }
    process.exit(0)
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
