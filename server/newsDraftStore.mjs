import { copyFile, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { randomUUID } from 'node:crypto'
import { emptyNewsState } from '../shared/news-drafts/model.js'

function validateState(state) {
  if (
    state?.version !== 1 ||
    !Array.isArray(state.drafts) ||
    !state.collector ||
    typeof state.collector !== 'object'
  ) {
    throw new Error('资讯草稿文件格式错误')
  }
  return state
}

// 单 Node 进程内串行写入，与文章数据分文件保存；失败时保留原文件和写队列。
export class NewsDraftStore {
  constructor(filePath) {
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
      await this.writeState(emptyNewsState())
    }
  }

  async read() {
    return validateState(JSON.parse(await readFile(this.filePath, 'utf8')))
  }

  async update(mutator) {
    const operation = this.writeQueue.then(async () => {
      const state = await this.read()
      const result = await mutator(state)
      await this.writeState(state)
      return result
    })
    this.writeQueue = operation.catch(() => {})
    return operation
  }

  async writeState(state) {
    validateState(state)
    const temporaryPath = `${this.filePath}.${randomUUID()}.tmp`
    try {
      await writeFile(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, {
        encoding: 'utf8',
        mode: 0o600
      })
      try {
        await copyFile(this.filePath, `${this.filePath}.previous`)
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
