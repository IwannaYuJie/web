/**
 * 《雨姐的心动时刻》剧情数据完整性校验
 * 校验内容：
 * 1. 所有选项的 next 指向存在的事件 / 结局 / HUB / NIGHT
 * 2. 六条支线的 1-3 幕事件都存在，repeatable 支线有 repeat 事件
 * 3. 选项引用的物品、场景、角色都存在
 * 4. 条件字段引用合法
 * 5. v2.2 CG / 幕次 / 目标指引 / 日程 / 立绘舞台校验
 * 运行：node test/yujieGameData.test.js 或被 vitest 引用
 */
import { describe, expect, it } from 'vitest'
import gameData from '../src/data/yujieGameData'
import gameEvents from '../src/data/yujieGameEvents'
import {
  getActForDay,
  getNextScheduledEvent,
  getWishProgress,
  getRecommendedRoutes,
  shouldRenderStage,
  pickStageSprite
} from '../src/data/yujieGameEngine'

const { scenes, items, routes, endings, characters, acts, wishGuides, scheduledEvents } = gameData
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
      for (const img of Object.values(char.portraits || {})) {
        refs.push(img)
      }
      for (const img of Object.values(char.sprites || {})) {
        refs.push(img)
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
    const empty = Object.values(gameEvents)
      .filter((event) => !(event.choices || []).length)
      .map((event) => event.id)
    expect(empty).toEqual([])
  })

  it('6个CG事件路径数量=6、互不重复、都含_v2且无旧版CG引用，route_pigpen_3无cg', () => {
    const expectedCgEvents = [
      'pro_meet_yujie',
      'route_kitchen_3',
      'route_market_3',
      'route_mountain_3',
      'ev_goose_attack',
      'ev_feast'
    ]
    const cgList = []
    const eventsWithCg = []

    for (const [eventId, ev] of Object.entries(gameEvents)) {
      if (ev.cg) {
        eventsWithCg.push(eventId)
        cgList.push(ev.cg)
      }
    }

    expect(eventsWithCg.sort()).toEqual([...expectedCgEvents].sort())
    expect(cgList).toHaveLength(6)
    expect(new Set(cgList).size).toBe(6)
    for (const cgPath of cgList) {
      expect(cgPath).toContain('_v2')
    }

    const legacyCgNames = [
      'cg_carry_pork.jpg',
      'cg_live.jpg',
      'cg_goose.jpg',
      'cg_feast.jpg'
    ]
    for (const cgPath of cgList) {
      for (const legacy of legacyCgNames) {
        expect(cgPath.endsWith(`/${legacy}`) || cgPath === legacy).toBe(false)
      }
    }

    expect(gameEvents.route_pigpen_3.cg).toBeUndefined()
  })

  it('所有dialogue.pose都存在于对应characters[character].sprites', () => {
    const badPoses = []
    for (const [eventId, event] of Object.entries(gameEvents)) {
      for (const [idx, line] of (event.dialogue || []).entries()) {
        if (line.pose) {
          const char = characters[line.character]
          if (!char || !char.sprites || !char.sprites[line.pose]) {
            badPoses.push(`${eventId} dialogue[${idx}] char=${line.character} pose=${line.pose}`)
          }
        }
      }
    }
    expect(badPoses).toEqual([])
  })

  it('shouldRenderStage对CG为false、hideStageSprites为true时为false、普通event为true，并验证pickStageSprite', () => {
    expect(shouldRenderStage({ cg: 'yujie/cg_pro_v2.jpg' })).toBe(false)
    expect(shouldRenderStage({ hideStageSprites: true })).toBe(false)
    expect(shouldRenderStage({ id: 'route_kitchen_1', scene: 'kitchen' })).toBe(true)
    expect(shouldRenderStage(null)).toBe(true)

    expect(pickStageSprite(characters.yujie, 'seed', 'cooking', 'serious')).toBe(characters.yujie.sprites.cooking)
    expect(pickStageSprite(characters.yujie, 'seed', 'unknown_pose', 'serious')).toBe(characters.yujie.sprites.serious)
    expect(pickStageSprite(null, 'seed', 'cooking', 'serious')).toBeNull()
  })

  it('acts覆盖1..13且每一天恰好一次；getActForDay关键日返回正确；getNextScheduledEvent校验准确', () => {
    expect(Array.isArray(acts)).toBe(true)
    expect(acts.length).toBeGreaterThanOrEqual(4)

    const coveredDays = acts.flatMap((act) => act.days)
    expect(coveredDays).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13])

    const act1 = getActForDay(1)
    const act2 = getActForDay(6)
    const act3 = getActForDay(9)
    const act4 = getActForDay(12)
    const actOverflow = getActForDay(99)

    expect(act1?.title).toContain('序章')
    expect(act2?.title).toContain('选择方向')
    expect(act3?.title).toContain('最后冲刺')
    expect(act4?.title).toContain('盛宴与告别')
    expect(actOverflow).toBe(acts[acts.length - 1])

    const nextFrom6 = getNextScheduledEvent(6)
    expect(nextFrom6?.day).toBe(9)
    expect(nextFrom6?.name).toBe('雨姐的烦恼')

    const nextFrom13 = getNextScheduledEvent(13)
    expect(nextFrom13).toBeNull()
  })

  it('所有wishGuides recommendedRoutes都合法；getRecommendedRoutes返回副本；getWishProgress对条件包含<=判定准确', () => {
    for (const [key, guide] of Object.entries(wishGuides)) {
      for (const r of guide.recommendedRoutes || []) {
        expect(routes[r], `wishGuides[${key}] route ${r}`).toBeDefined()
      }
    }

    const recLove = getRecommendedRoutes('love')
    expect(recLove).toEqual(wishGuides.love.recommendedRoutes)
    recLove.push('corrupted_route')
    expect(getRecommendedRoutes('love')).not.toContain('corrupted_route')

    // love: affection >= 90, laokuaiAlert <= 40, routes.riverside >= 3
    const loveAlert41 = { affection: 90, laokuaiAlert: 41, routes: { riverside: 3 } }
    const loveAlert40 = { affection: 90, laokuaiAlert: 40, routes: { riverside: 3 } }
    const loveAffectionLow = { affection: 89, laokuaiAlert: 40, routes: { riverside: 3 } }
    expect(getWishProgress('love', loveAlert41).requirements.every((i) => i.met)).toBe(false)
    expect(getWishProgress('love', loveAffectionLow).requirements.every((i) => i.met)).toBe(false)
    expect(getWishProgress('love', loveAlert40).requirements.every((i) => i.met)).toBe(true)

    // family: routes.laokuai >= 3, laokuaiAlert <= 20
    const famStateUnmet = { routes: { laokuai: 3 }, laokuaiAlert: 21 }
    const famStateMet = { routes: { laokuai: 3 }, laokuaiAlert: 20 }
    expect(getWishProgress('family', famStateUnmet).requirements.every((i) => i.met)).toBe(false)
    expect(getWishProgress('family', famStateMet).requirements.every((i) => i.met)).toBe(true)

    // chef: routes.kitchen >= 3, routes.pigpen >= 3, affection >= 60
    const chefStateUnmet = { routes: { kitchen: 3, pigpen: 2 }, affection: 60 }
    const chefStateMet = { routes: { kitchen: 3, pigpen: 3 }, affection: 60 }
    expect(getWishProgress('chef', chefStateUnmet).requirements.every((i) => i.met)).toBe(false)
    expect(getWishProgress('chef', chefStateMet).requirements.every((i) => i.met)).toBe(true)

    // streamer: routes.market >= 3, flags.livePath = true, flags.refusedNoodles = true
    const strStateUnmet = { routes: { market: 3 }, flags: { livePath: true, refusedNoodles: false } }
    const strStateMet = { routes: { market: 3 }, flags: { livePath: true, refusedNoodles: true } }
    expect(getWishProgress('streamer', strStateUnmet).requirements.every((i) => i.met)).toBe(false)
    expect(getWishProgress('streamer', strStateMet).requirements.every((i) => i.met)).toBe(true)

    // goose: gooseCount >= 3
    const gooseStateUnmet = { gooseCount: 2 }
    const gooseStateMet = { gooseCount: 3 }
    expect(getWishProgress('goose', gooseStateUnmet).requirements.every((i) => i.met)).toBe(false)
    expect(getWishProgress('goose', gooseStateMet).requirements.every((i) => i.met)).toBe(true)

    // casual: requirements 为空数组
    const casualProg = getWishProgress('casual', {})
    expect(casualProg.requirements).toEqual([])
    expect(casualProg.requirements.every((i) => i.met)).toBe(true)
  })

  it('D12 ev_feast与ev_expose带有specialSchedule: true', () => {
    expect(gameEvents.ev_feast.specialSchedule).toBe(true)
    expect(gameEvents.ev_expose.specialSchedule).toBe(true)
  })
})
