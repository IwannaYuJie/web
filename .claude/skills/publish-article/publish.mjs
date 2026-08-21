#!/usr/bin/env node
/**
 * 橘猫小窝 - 文章发布助手脚本
 *
 * 封装了对 /api/articles 接口的调用（鉴权、字段校验、错误处理）。
 * 配置（baseUrl / adminKey）从同目录 config.local.json 读取，
 * 也可用环境变量 BLOG_BASE_URL / BLOG_ADMIN_KEY 覆盖。
 *
 * 用法:
 *   node publish.mjs auth                      # 仅验证管理密码是否正确
 *   node publish.mjs list                      # 列出现有文章(id/日期/分类/标题)，便于对齐风格、避免撞分类
 *   node publish.mjs publish <article.(mjs|json)>   # 发布一篇文章
 *   node publish.mjs update <id> <article.(mjs|json)>  # 更新指定 id 的文章
 *
 * 文章文件可以是:
 *   - .json  : 直接是文章对象的 JSON
 *   - .mjs/.js: 默认导出(default)或命名导出 `article` 一个文章对象
 *               (推荐，中文 Markdown 用模板字符串写，无需转义)
 */

import { readFileSync } from 'node:fs'
import { resolve, dirname, extname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TIMEOUT_MS = 20000
const REQUIRED_FIELDS = ['title', 'description', 'category', 'readTime']

function loadConfig() {
  let fileCfg = {}
  try {
    fileCfg = JSON.parse(readFileSync(resolve(__dirname, 'config.local.json'), 'utf8'))
  } catch {
    // 文件不存在时回退到环境变量
  }
  const baseUrl = process.env.BLOG_BASE_URL || fileCfg.baseUrl
  const adminKey = process.env.BLOG_ADMIN_KEY || fileCfg.adminKey
  if (!baseUrl || !adminKey) {
    fail(
      '缺少配置：请在 .claude/skills/publish-article/config.local.json 中填写 baseUrl 和 adminKey，' +
        '或设置环境变量 BLOG_BASE_URL / BLOG_ADMIN_KEY。'
    )
  }
  return { baseUrl: baseUrl.replace(/\/$/, ''), adminKey }
}

function fail(msg, extra) {
  console.error(`❌ ${msg}`)
  if (extra) console.error(extra)
  process.exit(1)
}

async function withTimeout(promiseFactory) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    return await promiseFactory(ctrl.signal)
  } finally {
    clearTimeout(t)
  }
}

async function loadArticle(filePath) {
  const abs = resolve(process.cwd(), filePath)
  const ext = extname(abs).toLowerCase()
  if (ext === '.json') {
    return JSON.parse(readFileSync(abs, 'utf8'))
  }
  const mod = await import(pathToFileURL(abs).href)
  const article = mod.default || mod.article
  if (!article || typeof article !== 'object') {
    fail(`${filePath} 需要默认导出(export default)或命名导出(export const article) 一个文章对象`)
  }
  return article
}

function validate(article) {
  const missing = REQUIRED_FIELDS.filter((f) => !String(article[f] ?? '').trim())
  if (missing.length) {
    fail(`文章缺少必填字段: ${missing.join(', ')}（必填: ${REQUIRED_FIELDS.join('/')})`)
  }
  if (article.tags && !Array.isArray(article.tags)) {
    fail('tags 必须是字符串数组')
  }
}

async function cmdAuth({ baseUrl, adminKey }) {
  const res = await withTimeout((signal) =>
    fetch(`${baseUrl}/api/articles?id=auth-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
      signal,
    })
  )
  if (res.ok) {
    console.log('✅ 管理密码验证通过')
  } else {
    fail(`管理密码验证失败 (HTTP ${res.status})`, await res.text())
  }
}

async function cmdList({ baseUrl }) {
  const res = await withTimeout((signal) => fetch(`${baseUrl}/api/articles`, { signal }))
  if (!res.ok) fail(`获取文章列表失败 (HTTP ${res.status})`, await res.text())
  const list = await res.json()
  const sorted = [...list].sort((a, b) => new Date(b.date) - new Date(a.date))
  console.log(`线上共 ${list.length} 篇文章。现有分类: ${[...new Set(list.map((a) => a.category))].join(' / ')}\n`)
  for (const a of sorted) {
    console.log(`  [${a.id}] ${a.date} | ${a.category} | ${a.readTime}min | ${a.title}`)
  }
}

async function cmdPublish({ baseUrl, adminKey }, filePath) {
  if (!filePath) fail('用法: node publish.mjs publish <article.(mjs|json)>')
  const article = await loadArticle(filePath)
  validate(article)
  const res = await withTimeout((signal) =>
    fetch(`${baseUrl}/api/articles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
      body: JSON.stringify(article),
      signal,
    })
  )
  const body = await res.text()
  if (res.status !== 201) fail(`发布失败 (HTTP ${res.status})`, body)
  const created = JSON.parse(body)
  console.log('✅ 发布成功')
  console.log(`   ID:    ${created.id}`)
  console.log(`   标题:  ${created.title}`)
  console.log(`   分类:  ${created.category} | ${created.readTime}min | ${created.date}`)
  console.log(`   标签:  ${(created.tags || []).join(' / ')}`)
  console.log(`   链接:  ${baseUrl}/article/${created.id}`)
}

async function cmdUpdate({ baseUrl, adminKey }, id, filePath) {
  if (!id || !filePath) fail('用法: node publish.mjs update <id> <article.(mjs|json)>')
  const article = await loadArticle(filePath)
  const res = await withTimeout((signal) =>
    fetch(`${baseUrl}/api/articles?id=${encodeURIComponent(id)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey,
        'X-HTTP-Method-Override': 'PUT',
      },
      body: JSON.stringify(article),
      signal,
    })
  )
  const body = await res.text()
  if (!res.ok) fail(`更新失败 (HTTP ${res.status})`, body)
  const updated = JSON.parse(body)
  console.log(`✅ 文章 ${updated.id} 更新成功: ${updated.title}`)
  console.log(`   链接: ${baseUrl}/article/${updated.id}`)
}

const [cmd, ...rest] = process.argv.slice(2)
const cfg = loadConfig()

switch (cmd) {
  case 'auth':
    await cmdAuth(cfg)
    break
  case 'list':
    await cmdList(cfg)
    break
  case 'publish':
    await cmdPublish(cfg, rest[0])
    break
  case 'update':
    await cmdUpdate(cfg, rest[0], rest[1])
    break
  default:
    console.log('用法: node publish.mjs <auth|list|publish <file>|update <id> <file>>')
    process.exit(cmd ? 1 : 0)
}
