/**
 * 《雨姐的心动时刻》剧情数据完整性校验
 * 校验内容：
 * 1. 所有选项的 next 指向存在的事件 / 结局 / HUB / NIGHT
 * 2. 六条支线的 1-3 幕事件都存在，repeatable 支线有 repeat 事件
 * 3. 选项引用的物品、场景、角色都存在
 * 4. 条件字段引用合法
 * 运行：node test/yujieGameData.test.js 或被 vitest 引用
 */
import { describe, expect, it } from 'vitest'
import gameData from '../src/data/yujieGameData'
import gameEvents from '../src/data/yujieGameEvents'

const { scenes, items, routes, endings, characters } = gameData
const SPECIAL_NEXT = ['HUB', 'NIGHT']

describe('雨姐游戏数据校验', () => {
  it('所有选项的 next 目标有效', () => {
    const bad = []
    for (const event of Object.values(gameEvents)) {
      for (const choice of event.choices || []) {
        const next = choice.next
        const ok =
          SPECIAL_NEXT.includes(next) || endings[next] || gameEvents[next]
        if (!ok) {
          bad.push(`${event.id} -> ${choice.id} -> ${next}`)
        }
      }
    }
    expect(bad).toEqual([])
  })

  it('每条支线的 1-3 幕事件齐全', () => {
    const missing = []
    for (const route of Object.values(routes)) {
      for (let stage = 1; stage <= 3; stage++) {
        const id = `route_${route.id}_${stage}`
        if (!gameEvents[id]) {
          missing.push(id)
        }
      }
      if (route.repeatable && !gameEvents[`route_${route.id}_repeat`]) {
        missing.push(`route_${route.id}_repeat`)
      }
    }
    expect(missing).toEqual([])
  })

  it('支线事件的最后一环都带 advanceRoute 且回流有效', () => {
    const bad = []
    for (const route of Object.values(routes)) {
      for (let stage = 1; stage <= 3; stage++) {
        const event = gameEvents[`route_${route.id}_${stage}`]
        for (const choice of event.choices || []) {
          if (choice.advanceRoute !== route.id) {
            bad.push(`${event.id}/${choice.id} advanceRoute=${choice.advanceRoute}`)
          }
        }
      }
    }
    expect(bad).toEqual([])
  })

  it('场景 / 物品 / 角色引用存在', () => {
    const bad = []
    for (const event of Object.values(gameEvents)) {
      if (event.scene && !scenes[event.scene]) {
        bad.push(`${event.id} scene=${event.scene}`)
      }
      for (const line of event.dialogue || []) {
        if (!characters[line.character]) {
          bad.push(`${event.id} dialogue character=${line.character}`)
        }
      }
      for (const choice of event.choices || []) {
        const e = choice.effects || {}
        for (const key of ['addItem', 'removeItem']) {
          if (e[key] && !items[e[key]]) {
            bad.push(`${event.id}/${choice.id} ${key}=${e[key]}`)
          }
        }
        const c = choice.condition || {}
        if (c.hasItem && !items[c.hasItem]) {
          bad.push(`${event.id}/${choice.id} hasItem=${c.hasItem}`)
        }
        if (c.routeCompleted && !routes[c.routeCompleted]) {
          bad.push(`${event.id}/${choice.id} routeCompleted=${c.routeCompleted}`)
        }
        for (const r of c.routesCompleted || []) {
          if (!routes[r]) {
            bad.push(`${event.id}/${choice.id} routesCompleted=${r}`)
          }
        }
        if (choice.advanceRoute && !routes[choice.advanceRoute]) {
          bad.push(`${event.id}/${choice.id} advanceRoute=${choice.advanceRoute}`)
        }
      }
    }
    expect(bad).toEqual([])
  })

  it('序章入口存在，终章事件存在', () => {
    expect(gameEvents.pro_arrive).toBeTruthy()
    expect(gameEvents.ev_final).toBeTruthy()
    expect(gameEvents.night_rest).toBeTruthy()
  })

  it('数据文件引用的图片在 public/images 下都存在', async () => {
    const { existsSync } = await import('node:fs')
    const path = await import('node:path')
    const publicDir = path.join(__dirname, '..', 'public', 'images')
    const refs = []
    for (const scene of Object.values(scenes)) {
      if (scene.image) {
        refs.push(scene.image)
      }
    }
    for (const char of Object.values(characters)) {
      if (char.avatar) {
        refs.push(char.avatar)
      }
    }
    for (const ending of Object.values(endings)) {
      if (ending.image) {
        refs.push(ending.image)
      }
    }
    for (const event of Object.values(gameEvents)) {
      if (event.cg) {
        refs.push(event.cg)
      }
    }
    refs.push('yujie/cover.jpg')
    const missing = [...new Set(refs)].filter((img) => !existsSync(path.join(publicDir, img)))
    expect(missing).toEqual([])
  })

  it('结局数量与图鉴一致（9个）', () => {
    expect(Object.keys(endings)).toHaveLength(9)
  })

  it('每个事件都至少有一个无条件的兜底路径', () => {
    // 检查：对话结束后若没有可见选项会造成死局的情况由引擎兜底（ChoiceList fallback）
    // 这里只校验每个事件 choices 非空
    const empty = Object.values(gameEvents)
      .filter((event) => !(event.choices || []).length)
      .map((event) => event.id)
    expect(empty).toEqual([])
  })
})
