/**
 * 《雨姐的心动时刻》剧情数据完整性校验
 * 校验内容：
 * 1. 所有选项的 next 指向存在的事件 / 结局 / HUB / NIGHT
 * 2. 六条支线的 1-3 幕事件都存在，repeatable 支线有 repeat 事件
 * 3. 选项引用的物品、场景、角色都存在
 * 4. 条件字段引用合法
 * 5. v2.2+ CG / 幕次 / 目标指引 / 日程 / 立绘舞台校验
 * 6. D12杀猪宴五条专属分支与通用兜底汇入 ev_feast_end
 * 7. 代表状态下 checkCondition 正确解锁，空白状态有通用兜底
 * 8. night_rest / ev_feast 系列 / ev_final / ev_expose 特殊日程标记
 * 9. 猪圈第三幕无红烧肉/杰克二世硬编码
 * 10. D6粉条桥段明确出现100元定金、贴牌/纯红薯要求
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
  pickStageSprite,
  checkCondition
} from '../src/data/yujieGameEngine'

const { scenes, items, routes, endings, characters, acts, wishGuides } = gameData
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

  it('序章入口存在，终章事件存在，入夜过渡事件存在', () => {
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

  it('D12杀猪宴事件体系：五条专属分支与通用兜底存在且都汇入ev_feast_end', () => {
    const feast = gameEvents.ev_feast
    expect(feast).toBeDefined()
    expect(feast.choices).toHaveLength(6)

    const choiceMap = Object.fromEntries(feast.choices.map((c) => [c.id, c]))
    expect(choiceMap.feast_chef).toBeDefined()
    expect(choiceMap.feast_streamer).toBeDefined()
    expect(choiceMap.feast_love).toBeDefined()
    expect(choiceMap.feast_family).toBeDefined()
    expect(choiceMap.feast_goose).toBeDefined()
    expect(choiceMap.feast_generic).toBeDefined()

    // 目标事件存在且为对应专属事件
    expect(choiceMap.feast_chef.next).toBe('ev_feast_chef')
    expect(choiceMap.feast_streamer.next).toBe('ev_feast_streamer')
    expect(choiceMap.feast_love.next).toBe('ev_feast_love')
    expect(choiceMap.feast_family.next).toBe('ev_feast_family')
    expect(choiceMap.feast_goose.next).toBe('ev_feast_goose')
    expect(choiceMap.feast_generic.next).toBe('ev_feast_generic')

    // 所有分支事件选项均汇入 ev_feast_end
    const subEventIds = [
      'ev_feast_chef',
      'ev_feast_streamer',
      'ev_feast_love',
      'ev_feast_family',
      'ev_feast_goose',
      'ev_feast_generic'
    ]
    for (const subId of subEventIds) {
      const subEvent = gameEvents[subId]
      expect(subEvent, `子事件 ${subId} 存在`).toBeDefined()
      expect(subEvent.choices.length).toBeGreaterThanOrEqual(1)
      for (const c of subEvent.choices) {
        expect(c.next).toBe('ev_feast_end')
      }
    }

    // ev_feast_end 选项进入 NIGHT
    const feastEnd = gameEvents.ev_feast_end
    expect(feastEnd).toBeDefined()
    expect(feastEnd.choices[0].next).toBe('NIGHT')
  })

  it('D12条件检查：代表状态下精确解锁对应分支，空白状态有通用兜底', () => {
    const feastChoices = gameEvents.ev_feast.choices

    // 空白状态
    const blankStats = {
      affection: 0,
      laokuaiAlert: 0,
      gooseCount: 0,
      routes: {},
      flags: {},
      items: {},
      money: 0
    }
    const blankAvailable = feastChoices.filter((c) => checkCondition(c.condition, blankStats))
    expect(blankAvailable.map((c) => c.id)).toEqual(['feast_generic'])

    // 大厨状态 (厨房+猪圈满3)
    const chefStats = { ...blankStats, routes: { kitchen: 3, pigpen: 3 } }
    expect(checkCondition(feastChoices.find((c) => c.id === 'feast_chef').condition, chefStats)).toBe(true)

    // 直播状态 (大集满3 + livePath + refusedNoodles)
    const streamerStats = {
      ...blankStats,
      routes: { market: 3 },
      flags: { livePath: true, refusedNoodles: true }
    }
    expect(checkCondition(feastChoices.find((c) => c.id === 'feast_streamer').condition, streamerStats)).toBe(true)

    // 心动状态 (河边满3 + 好感>=75 + 警觉<=40)
    const loveStats = {
      ...blankStats,
      routes: { riverside: 3 },
      affection: 75,
      laokuaiAlert: 40
    }
    expect(checkCondition(feastChoices.find((c) => c.id === 'feast_love').condition, loveStats)).toBe(true)

    // 一家人状态 (老蒯满3 + 警觉<=20)
    const familyStats = {
      ...blankStats,
      routes: { laokuai: 3 },
      laokuaiAlert: 20
    }
    expect(checkCondition(feastChoices.find((c) => c.id === 'feast_family').condition, familyStats)).toBe(true)

    // 大鹅状态 (鹅数量>=3)
    const gooseStats = { ...blankStats, gooseCount: 3 }
    expect(checkCondition(feastChoices.find((c) => c.id === 'feast_goose').condition, gooseStats)).toBe(true)
  })

  it('特殊日程语义：night_rest / ev_feast系列 / ev_final / ev_expose 均带有 specialSchedule: true', () => {
    const specialEvents = [
      'night_rest',
      'ev_expose',
      'ev_feast',
      'ev_feast_chef',
      'ev_feast_streamer',
      'ev_feast_love',
      'ev_feast_family',
      'ev_feast_goose',
      'ev_feast_generic',
      'ev_feast_end',
      'ev_final'
    ]
    for (const id of specialEvents) {
      expect(gameEvents[id]?.specialSchedule, `事件 ${id} 应具有 specialSchedule: true`).toBe(true)
    }
  })

  it('猪圈第三幕（route_pigpen_3）不硬编码"红烧肉"或"杰克二世"', () => {
    const p3 = gameEvents.route_pigpen_3
    expect(p3).toBeDefined()
    const allText = [
      p3.narration || '',
      ...(p3.dialogue || []).map((d) => d.text),
      ...(p3.choices || []).map((c) => c.text)
    ].join(' ')

    expect(allText).not.toContain('红烧肉')
    expect(allText).not.toContain('杰克二世')
    expect(allText).toContain('半扇猪')
  })

  it('D6粉条桥段（ev_noodle_man）文本中明确出现 100元定金 以及 贴牌/纯红薯 要求', () => {
    const noodleEvent = gameEvents.ev_noodle_man
    expect(noodleEvent).toBeDefined()

    const fullNoodleText = [
      noodleEvent.narration || '',
      ...(noodleEvent.dialogue || []).map((d) => d.text),
      ...(noodleEvent.choices || []).map((c) => c.text)
    ].join(' ')

    expect(fullNoodleText).toContain('定金')
    expect(fullNoodleText).toMatch(/一百元|100/)
    expect(fullNoodleText).toContain('贴牌')
    expect(fullNoodleText).toContain('纯红薯')
  })
})
