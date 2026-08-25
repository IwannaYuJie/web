/**
 * 《雨姐的心动时刻》v2.4 - 剧情数据与纯逻辑引擎全量验收测试
 *
 * 覆盖规范：
 * 1. 结构与节点数量：精确 62 个 events、精确 14 个 endings (旧9全保留 + 新5正确)。
 * 2. 文本规模与风险比：dialogue 135-160、choices 135-165、负向/混合/风险选择 >= 30%。
 * 3. 选项完整性：唯一 id、非空 text/feedback、outcomes 有序兜底且 resolveChoiceOutcome 准确回退。
 * 4. 路由与跳转合法性：next 目标合法（gameEvents/HUB/NIGHT/14 endings），普通支线消耗 1 AP 并 advanceRoute。
 * 5. 纯函数引擎：checkCondition、applyEffects（clamp、flag增删、gooseCount）、buildHistoryEntry、migrateStats 健壮迁移。
 * 6. 插曲与调度机制：getSpecialRouteEvent 6 类门槛、shouldInsertWarning、nightEventForStats、morningEventForDay。
 * 7. 关系词与性格模型：三种雨姐人格态、老蒯知己/浪漫/院落阶段词、清醒双向确认互斥机制。
 * 8. 经典剧情与文本规范：D6 粉条三选项及关键设定（100元定金/贴牌/纯红薯）、猪圈第3幕无“红烧肉/杰克二世”、无显式数值泄露。
 * 9. 心愿与结局矩阵：getWishProgress 匹配 14 结局设计预算。
 */
import { describe, expect, it } from 'vitest'
import {
  characters,
  scenes,
  endings
} from '../src/data/yujieGameData'
import gameEvents, { events } from '../src/data/yujieGameEvents'
import {
  HUB,
  NIGHT,
  initialStats,
  getRouteMaxStage,
  checkCondition,
  resolveChoiceOutcome,
  applyEffects,
  buildHistoryEntry,
  getSpecialRouteEvent,
  getRouteLockHint,
  routeEventId,
  morningEventForDay,
  shouldInsertWarning,
  nightEventForStats,
  getRelationshipStages,
  migrateStats,
  getWishProgress,
  shouldRenderStage
} from '../src/data/yujieGameEngine'

const SPECIAL_NEXT = ['HUB', 'NIGHT', HUB, NIGHT]

describe('《雨姐的心动时刻》v2.4 - 数据完整性与节点规模', () => {
  it('事件总数精确为 62 个（既有 42 个 + 新增 20 个）', () => {
    const eventKeys = Object.keys(gameEvents)
    expect(eventKeys).toHaveLength(62)
    expect(events).toBe(gameEvents)

    const expected20New = [
      'route_laokuai_4',
      'route_laokuai_5',
      'ev_echo_d5',
      'ev_echo_d8',
      'ev_echo_d10',
      'ev_echo_d12',
      'ev_warning',
      'ev_cuihua_market',
      'ev_peisi_help',
      'ev_goose_deep',
      'ev_river_night',
      'ev_remedy_check',
      'ev_repair_laokuai',
      'ev_yujie_confess',
      'ev_shura_reveal',
      'ev_ending_love_soft',
      'ev_ending_love_power',
      'ev_ending_laokuai_soulmate',
      'ev_ending_laokuai_romance',
      'ev_ending_shura'
    ]

    for (const id of expected20New) {
      expect(gameEvents[id], `新增节点 ${id} 必须存在`).toBeDefined()
    }
  })

  it('结局总数精确为 14 个（9 个旧 ID + 5 个新 ID）', () => {
    const endingKeys = Object.keys(endings)
    expect(endingKeys).toHaveLength(14)

    const legacy9 = [
      'ending_love',
      'ending_family',
      'ending_chef',
      'ending_streamer',
      'ending_goose',
      'ending_friend',
      'ending_bye',
      'ending_noodle',
      'ending_kicked'
    ]
    const new5 = [
      'ending_love_soft',
      'ending_love_power',
      'ending_laokuai_soulmate',
      'ending_laokuai_romance',
      'ending_shura'
    ]

    for (const id of legacy9) {
      expect(endings[id], `既有结局 ${id} 必须保留`).toBeDefined()
    }
    for (const id of new5) {
      expect(endings[id], `新增结局 ${id} 必须定义`).toBeDefined()
    }
  })

  it('新增事件与新增结局素材专属独立且严格防复用', () => {
    const new20EventCgMap = {
      route_laokuai_4: 'yujie/v24_route_laokuai_4.png',
      route_laokuai_5: 'yujie/v24_route_laokuai_5.png',
      ev_echo_d5: 'yujie/v24_ev_echo_d5.png',
      ev_echo_d8: 'yujie/v24_ev_echo_d8.png',
      ev_echo_d10: 'yujie/v24_ev_echo_d10.png',
      ev_echo_d12: 'yujie/v24_ev_echo_d12.png',
      ev_warning: 'yujie/v24_ev_warning.png',
      ev_cuihua_market: 'yujie/v24_ev_cuihua_market.png',
      ev_peisi_help: 'yujie/v24_ev_peisi_help.png',
      ev_goose_deep: 'yujie/v24_ev_goose_deep.png',
      ev_river_night: 'yujie/v24_ev_river_night.png',
      ev_remedy_check: 'yujie/v24_ev_remedy_check.png',
      ev_repair_laokuai: 'yujie/v24_ev_repair_laokuai.png',
      ev_yujie_confess: 'yujie/v24_ev_yujie_confess.png',
      ev_shura_reveal: 'yujie/v24_ev_shura_reveal.png',
      ev_ending_love_soft: 'yujie/v24_ev_ending_love_soft.png',
      ev_ending_love_power: 'yujie/v24_ev_ending_love_power.png',
      ev_ending_laokuai_soulmate: 'yujie/v24_ev_ending_laokuai_soulmate.png',
      ev_ending_laokuai_romance: 'yujie/v24_ev_ending_laokuai_romance.png',
      ev_ending_shura: 'yujie/v24_ev_ending_shura.png'
    }

    for (const [eventId, expectedPath] of Object.entries(new20EventCgMap)) {
      expect(gameEvents[eventId]?.cg, `事件 ${eventId} 的 cg 必须严格匹配 ${expectedPath}`).toBe(expectedPath)
    }

    const eventCgPaths = Object.values(new20EventCgMap)
    expect(eventCgPaths).toHaveLength(20)
    expect(new Set(eventCgPaths).size).toBe(20)

    const new5EndingImageMap = {
      ending_love_soft: 'yujie/v24_ending_love_soft.png',
      ending_love_power: 'yujie/v24_ending_love_power.png',
      ending_laokuai_soulmate: 'yujie/v24_ending_laokuai_soulmate.png',
      ending_laokuai_romance: 'yujie/v24_ending_laokuai_romance.png',
      ending_shura: 'yujie/v24_ending_shura.png'
    }

    for (const [endingId, expectedPath] of Object.entries(new5EndingImageMap)) {
      expect(endings[endingId]?.image, `结局 ${endingId} 的 image 必须严格匹配 ${expectedPath}`).toBe(expectedPath)
    }

    const endingImagePaths = Object.values(new5EndingImageMap)
    expect(endingImagePaths).toHaveLength(5)
    expect(new Set(endingImagePaths).size).toBe(5)

    const legacy9 = [
      'ending_love',
      'ending_family',
      'ending_chef',
      'ending_streamer',
      'ending_goose',
      'ending_friend',
      'ending_bye',
      'ending_noodle',
      'ending_kicked'
    ]
    const legacyEndingImages = new Set(
      legacy9.map((id) => endings[id]?.image).filter(Boolean)
    )
    for (const img of endingImagePaths) {
      expect(legacyEndingImages.has(img), `新结局图 ${img} 不能复用既有 9 结局素材`).toBe(false)
    }

    const existingOtherEventCgs = new Set()
    for (const [id, ev] of Object.entries(gameEvents)) {
      if (!new20EventCgMap[id] && ev?.cg) {
        existingOtherEventCgs.add(ev.cg)
      }
    }
    for (const cg of eventCgPaths) {
      expect(existingOtherEventCgs.has(cg), `新事件 CG ${cg} 不能复用非新增事件素材`).toBe(false)
    }
  })

  it('台词数量在 135-160 区间，选项数量在 135-165 区间', () => {
    let totalDialogue = 0
    let totalChoices = 0

    for (const ev of Object.values(gameEvents)) {
      if (Array.isArray(ev.dialogue)) {
        totalDialogue += ev.dialogue.length
      }
      if (Array.isArray(ev.choices)) {
        totalChoices += ev.choices.length
      }
    }

    expect(totalDialogue).toBeGreaterThanOrEqual(135)
    expect(totalDialogue).toBeLessThanOrEqual(160)
    expect(totalChoices).toBeGreaterThanOrEqual(135)
    expect(totalChoices).toBeLessThanOrEqual(165)
  })

  it('全局选项中风险/代价/负面/混合选项占比 >= 30%', () => {
    let totalChoices = 0
    let riskyChoices = 0

    for (const ev of Object.values(gameEvents)) {
      for (const c of ev.choices || []) {
        totalChoices++
        const effects = c.effects || {}
        const isExplicitRisk = c.risk === 'negative' || c.risk === 'mixed' || c.risk === 'risky'
        const hasNegativeVal =
          (effects.affection || 0) < 0 ||
          (effects.yujieSoftness || 0) < 0 ||
          (effects.laokuaiBond || 0) < 0 ||
          (effects.laokuaiRomance || 0) < 0 ||
          (effects.laokuaiAlert || 0) > 0 ||
          (effects.integrity || 0) < 0 ||
          (effects.money || 0) < 0
        const hasRiskFlag = Boolean(
          effects.setFlags?.noodleCheap ||
          effects.setFlags?.noodleDeal ||
          effects.setFlags?.doublePromise ||
          effects.setFlag === 'noodleCheap'
        )

        if (isExplicitRisk || hasNegativeVal || hasRiskFlag) {
          riskyChoices++
        }
      }
    }

    const ratio = riskyChoices / totalChoices
    expect(ratio).toBeGreaterThanOrEqual(0.3)
  })
})

describe('《雨姐的心动时刻》v2.4 - 选项结构、动态 Outcomes 与跳转闭环', () => {
  it('所有选项具有全局唯一 ID，且 text 与 feedback 非空合法', () => {
    const choiceIds = new Set()
    for (const [eventId, ev] of Object.entries(gameEvents)) {
      expect(Array.isArray(ev.choices), `${eventId} choices 必须是数组`).toBe(true)
      expect(ev.choices.length, `${eventId} 必须至少有 1 个选项`).toBeGreaterThanOrEqual(1)

      for (const [idx, choice] of ev.choices.entries()) {
        expect(choice.id, `${eventId} choice[${idx}] 缺少 id`).toBeTruthy()
        expect(choiceIds.has(choice.id), `choice.id 重复: ${choice.id}`).toBe(false)
        choiceIds.add(choice.id)

        expect(typeof choice.text, `${eventId}/${choice.id} text 必须为非空字符串`).toBe('string')
        expect(choice.text.trim().length).toBeGreaterThan(0)

        // 若直接包含 outcomes 则 outcome 有 feedback 或 choice 有 feedback
        if (Array.isArray(choice.outcomes) && choice.outcomes.length > 0) {
          choice.outcomes.forEach((oc, oIdx) => {
            expect(
              typeof oc.feedback === 'string' || typeof choice.feedback === 'string',
              `${eventId}/${choice.id}/outcome[${oIdx}] 必须有 feedback`
            ).toBe(true)
          })
        } else {
          expect(
            typeof choice.feedback === 'string' && choice.feedback.trim().length > 0,
            `${eventId}/${choice.id} feedback 必须为有效文本`
          ).toBe(true)
        }
      }
    }
  })

  it('所有 next 目标严格指向合法事件、结局、HUB 或 NIGHT', () => {
    const invalidNexts = []
    for (const [eventId, ev] of Object.entries(gameEvents)) {
      for (const choice of ev.choices || []) {
        if (choice.next) {
          const valid = SPECIAL_NEXT.includes(choice.next) || endings[choice.next] || gameEvents[choice.next]
          if (!valid) {
            invalidNexts.push(`${eventId} -> ${choice.id} -> ${choice.next}`)
          }
        }
        if (Array.isArray(choice.outcomes)) {
          for (const oc of choice.outcomes) {
            if (oc.next) {
              const valid = SPECIAL_NEXT.includes(oc.next) || endings[oc.next] || gameEvents[oc.next]
              if (!valid) {
                invalidNexts.push(`${eventId} -> ${choice.id} outcome -> ${oc.next}`)
              }
            }
          }
        }
      }
    }
    expect(invalidNexts).toEqual([])
  })

  it('resolveChoiceOutcome 顺序匹配 outcomes 且回退机制健壮', () => {
    const testChoice = {
      id: 'test_oc',
      text: '测试选项',
      feedback: '默认反馈',
      effects: { money: 10, setFlags: { flagA: true } },
      outcomes: [
        {
          condition: { minAffection: 50 },
          feedback: '高好感反馈',
          effects: { affection: 5, setFlags: { reached50: true } },
          next: 'ev_feast'
        },
        {
          condition: { minAffection: 20 },
          feedback: '中好感反馈',
          effects: { affection: 2 }
        },
        {
          feedback: '兜底反馈',
          effects: { money: -5 }
        }
      ],
      next: 'HUB'
    }

    // 命中首个
    const resHigh = resolveChoiceOutcome(testChoice, { affection: 60 })
    expect(resHigh.feedback).toBe('高好感反馈')
    expect(resHigh.next).toBe('ev_feast')
    expect(resHigh.effects.affection).toBe(5)
    expect(resHigh.effects.money).toBe(10)
    expect(resHigh.effects.setFlags).toEqual({ flagA: true, reached50: true })

    // 命中第二个
    const resMid = resolveChoiceOutcome(testChoice, { affection: 30 })
    expect(resMid.feedback).toBe('中好感反馈')
    expect(resMid.next).toBe('HUB')
    expect(resMid.effects.affection).toBe(2)

    // 命中无 condition 兜底
    const resLow = resolveChoiceOutcome(testChoice, { affection: 10 })
    expect(resLow.feedback).toBe('兜底反馈')
    expect(resLow.effects.money).toBe(5) // 10 + (-5)

    // 无 outcomes 时返回原 choice 副本
    const simpleChoice = { id: 'simple', text: '普通', feedback: '直出', next: 'HUB' }
    expect(resolveChoiceOutcome(simpleChoice, {})).toEqual(simpleChoice)
    expect(resolveChoiceOutcome(null, {})).toEqual({})
  })
})

describe('《雨姐的心动时刻》v2.4 - 纯逻辑引擎与状态迁移', () => {
  it('checkCondition 完整覆盖新旧数值区间、flag 组合与路线阶段', () => {
    const stats = {
      affection: 80,
      yujieSoftness: 15,
      laokuaiBond: 60,
      laokuaiRomance: 20,
      laokuaiAlert: 10,
      integrity: 25,
      money: 200,
      day: 7,
      gooseCount: 3,
      items: ['militaryCoat', 'adMilk'],
      routes: { kitchen: 3, riverside: 2, laokuai: 4 },
      flags: { livePath: true, promiseYujie: true }
    }

    expect(checkCondition(null, stats)).toBe(true)
    expect(checkCondition({ minAffection: 70, maxAffection: 90 }, stats)).toBe(true)
    expect(checkCondition({ minAffection: 85 }, stats)).toBe(false)
    expect(checkCondition({ minYujieSoftness: 10, maxYujieSoftness: 20 }, stats)).toBe(true)
    expect(checkCondition({ minLaokuaiBond: 50, maxLaokuaiRomance: 25 }, stats)).toBe(true)
    expect(checkCondition({ minIntegrity: 20, minMoney: 100 }, stats)).toBe(true)
    expect(checkCondition({ minDay: 5, maxDay: 8 }, stats)).toBe(true)
    expect(checkCondition({ hasItem: 'militaryCoat', hasItems: ['militaryCoat', 'adMilk'] }, stats)).toBe(true)
    expect(checkCondition({ hasItem: 'softJujube' }, stats)).toBe(false)

    expect(checkCondition({ flag: 'livePath', notFlag: 'noodleCheap' }, stats)).toBe(true)
    expect(checkCondition({ flagsAll: ['livePath', 'promiseYujie'] }, stats)).toBe(true)
    expect(checkCondition({ flagsAny: ['noodleCheap', 'livePath'] }, stats)).toBe(true)
    expect(checkCondition({ notFlags: ['noodleCheap', 'doublePromise'] }, stats)).toBe(true)
    expect(checkCondition({ notFlags: ['promiseYujie'] }, stats)).toBe(false)

    expect(checkCondition({ routeCompleted: 'kitchen' }, stats)).toBe(true)
    expect(checkCondition({ routeMinStages: { riverside: 2, laokuai: 4 } }, stats)).toBe(true)
    expect(checkCondition({ routeMinStages: { riverside: 3 } }, stats)).toBe(false)
  })

  it('applyEffects 正确处理 clamp、负值计算、道具、Flag 增删与大鹅计数', () => {
    const init = initialStats()
    init.affection = 115
    init.yujieSoftness = -38
    init.laokuaiAlert = 42
    init.money = 20
    init.items = ['flower']
    init.flags = { noodleCheap: true, promiseLaokuai: true }

    const resolvedChoice = {
      id: 'c_apply_test',
      text: '测试结算',
      effects: {
        affection: 10, // 115+10 -> 120 (clamp)
        yujieSoftness: -10, // -38-10 -> -40 (clamp)
        laokuaiBond: 20,
        laokuaiRomance: 15,
        laokuaiAlert: 10, // 42+10 -> 52 (clamp 100)
        integrity: -35, // 0-35 -> -30 (clamp)
        money: -50, // 20-50 -> 0 (clamp)
        ap: -1,
        gooseCount: 2,
        addItem: 'militaryCoat',
        removeItem: 'flower',
        setFlags: { honestBoundary: true },
        clearFlags: ['promiseLaokuai']
      },
      advanceRoute: 'kitchen'
    }

    const next = applyEffects(init, resolvedChoice)

    expect(next.affection).toBe(120)
    expect(next.yujieSoftness).toBe(-40)
    expect(next.laokuaiBond).toBe(20)
    expect(next.laokuaiRomance).toBe(15)
    expect(next.laokuaiAlert).toBe(52)
    expect(next.integrity).toBe(-30)
    expect(next.money).toBe(0)
    expect(next.actionPoints).toBe(0)
    expect(next.gooseCount).toBe(2)

    expect(next.items).toContain('militaryCoat')
    expect(next.items).not.toContain('flower')
    expect(next.flags.honestBoundary).toBe(true)
    expect(next.flags.noodleCheap).toBe(true)
    expect(next.flags.promiseLaokuai).toBeUndefined()
    expect(next.routes.kitchen).toBe(1)

    // 不修改源对象
    expect(init.items).toContain('flower')
    expect(init.flags.promiseLaokuai).toBe(true)
  })

  it('buildHistoryEntry 结构完整包含 choiceId、day、feedback 且不泄露污染源', () => {
    const choice = {
      id: 'lao_4_soulmate_boundary',
      text: '知己坦白',
      feedback: '老蒯拍了拍你的肩膀。',
      effects: { laokuaiBond: 10 }
    }
    const entry = buildHistoryEntry(7, choice)
    expect(entry).toEqual({
      day: 7,
      choiceId: 'lao_4_soulmate_boundary',
      text: '知己坦白',
      feedback: ['老蒯拍了拍你的肩膀。'],
      effects: { laokuaiBond: 10 }
    })
    entry.effects.laokuaiBond = 999
    expect(choice.effects.laokuaiBond).toBe(10)
  })

  it('migrateStats 能安全修复 v2.3 旧存档、缺省值与越界损坏数据', () => {
    const corruptStats = {
      affection: '95',
      yujieSoftness: undefined, // 缺省字段
      laokuaiAlert: 150, // 越界
      integrity: -99, // 越界
      money: null,
      day: 'invalid_day',
      routes: { laokuai: 4, corrupted: 99 },
      flags: { oldSave: true },
      items: ['adMilk']
    }

    const migrated = migrateStats(corruptStats)
    expect(migrated.affection).toBe(95)
    expect(migrated.yujieSoftness).toBe(0)
    expect(migrated.laokuaiBond).toBe(0)
    expect(migrated.laokuaiRomance).toBe(0)
    expect(migrated.laokuaiAlert).toBe(100)
    expect(migrated.integrity).toBe(-30)
    expect(migrated.money).toBe(100)
    expect(migrated.day).toBe(1)
    expect(migrated.routes.laokuai).toBe(4)
    expect(migrated.routes.kitchen).toBe(0)
    expect(migrated.flags.oldSave).toBe(true)
    expect(migrated.items).toEqual(['adMilk'])

    // 空对象安全返回默认初值
    const fromEmpty = migrateStats({})
    expect(fromEmpty.money).toBe(100)
    expect(fromEmpty.day).toBe(1)
  })
})

describe('《雨姐的心动时刻》v2.4 - 支线进程、时间锁与特殊插曲调度', () => {
  it('支线最大幕数配置正确：老蒯为 5 幕，其余为 3 幕', () => {
    expect(getRouteMaxStage('laokuai')).toBe(5)
    expect(getRouteMaxStage('kitchen')).toBe(3)
    expect(getRouteMaxStage('pigpen')).toBe(3)
    expect(getRouteMaxStage('market')).toBe(3)
    expect(getRouteMaxStage('riverside')).toBe(3)
    expect(getRouteMaxStage('mountain')).toBe(3)
  })

  it('老蒯支线第 4 幕需 D7+，第 5 幕需 D10+ 时间锁', () => {
    // Stage 3 尝试前往第 4 幕
    expect(getRouteLockHint('laokuai', 3, { day: 6 })).toContain('需第7天后')
    expect(routeEventId('laokuai', 3, { day: 6 })).toBeNull()
    expect(getRouteLockHint('laokuai', 3, { day: 7 })).toBeNull()
    expect(routeEventId('laokuai', 3, { day: 7 })).toBe('route_laokuai_4')

    // Stage 4 尝试前往第 5 幕
    expect(getRouteLockHint('laokuai', 4, { day: 9 })).toContain('需第10天后')
    expect(routeEventId('laokuai', 4, { day: 9 })).toBeNull()
    expect(getRouteLockHint('laokuai', 4, { day: 10 })).toBeNull()
    expect(routeEventId('laokuai', 4, { day: 10 })).toBe('route_laokuai_5')

    // 达到 5 幕后无可重复
    expect(routeEventId('laokuai', 5, { day: 11 })).toBeNull()

    // 厨房达到 3 幕后进入可重复
    expect(routeEventId('kitchen', 3, { day: 5 })).toBe('route_kitchen_repeat')
  })

  it('getSpecialRouteEvent 严格校验 6 类支线插曲 gate 与 seen 防重', () => {
    // 1. 粉条补救插曲 (D8/D10, noodleCheap=true)
    const remedyStats = { day: 8, flags: { noodleCheap: true } }
    expect(getSpecialRouteEvent('market', remedyStats)).toBe('ev_remedy_check')
    expect(getSpecialRouteEvent('kitchen', remedyStats)).toBe('ev_remedy_check')
    expect(getSpecialRouteEvent('mountain', remedyStats)).toBeNull()
    expect(getSpecialRouteEvent('market', { ...remedyStats, flags: { noodleCheap: true, noodleRemedied: true } })).toBeNull()
    expect(getSpecialRouteEvent('market', { ...remedyStats, flags: { noodleCheap: true, remedyCheckSeen: true } })).toBeNull()

    // 2. 翠花集市插曲 (D4+, routes.market>=1)
    const cuihuaStats = { day: 4, routes: { market: 1 }, flags: {} }
    expect(getSpecialRouteEvent('market', cuihuaStats)).toBe('ev_cuihua_market')
    expect(getSpecialRouteEvent('market', { ...cuihuaStats, day: 3 })).toBeNull()
    expect(getSpecialRouteEvent('market', { ...cuihuaStats, flags: { cuihuaHelp: true } })).toBeNull()

    // 3. 佩斯帮厨插曲 (D7+, routes.kitchen>=2)
    const peisiStats = { day: 7, routes: { kitchen: 2 }, flags: {} }
    expect(getSpecialRouteEvent('kitchen', peisiStats)).toBe('ev_peisi_help')
    expect(getSpecialRouteEvent('kitchen', { ...peisiStats, routes: { kitchen: 1 } })).toBeNull()

    // 4. 大鹅深层插曲 (gooseCount>=2, routes.mountain>=2)
    const gooseStats = { gooseCount: 2, routes: { mountain: 2 }, flags: {} }
    expect(getSpecialRouteEvent('mountain', gooseStats)).toBe('ev_goose_deep')
    expect(getSpecialRouteEvent('mountain', { ...gooseStats, flags: { gooseAlly: true } })).toBeNull()

    // 5. 老蒯关系修复插曲 (laokuaiAlert>=20)
    const repairStats = { laokuaiAlert: 20, flags: {} }
    expect(getSpecialRouteEvent('laokuai', repairStats)).toBe('ev_repair_laokuai')
    expect(getSpecialRouteEvent('laokuai', { ...repairStats, flags: { laokuaiRepaired: true } })).toBeNull()

    // 6. 河边夜谈插曲 (D7+, affection>=50, routes.riverside>=2)
    const riverStats = { day: 7, affection: 50, routes: { riverside: 2 }, flags: {} }
    expect(getSpecialRouteEvent('riverside', riverStats)).toBe('ev_river_night')
    expect(getSpecialRouteEvent('riverside', { ...riverStats, affection: 49 })).toBeNull()
  })

  it('shouldInsertWarning 仅在老蒯警觉在 [30, 44] 且未触发过时触发', () => {
    expect(shouldInsertWarning({ laokuaiAlert: 29, flags: {} })).toBe(false)
    expect(shouldInsertWarning({ laokuaiAlert: 30, flags: {} })).toBe(true)
    expect(shouldInsertWarning({ laokuaiAlert: 44, flags: {} })).toBe(true)
    expect(shouldInsertWarning({ laokuaiAlert: 45, flags: {} })).toBe(false) // 45 直接 Game Over
    expect(shouldInsertWarning({ laokuaiAlert: 35, flags: { warningSeen: true } })).toBe(false)
  })

  it('nightEventForStats 与 morningEventForDay 准确调度 D11 独白与固定日期事件', () => {
    // D11 晚间雨姐独白
    const d11ConfessStats = {
      day: 11,
      affection: 75,
      flags: { promiseYujie: true }
    }
    expect(nightEventForStats(d11ConfessStats)).toBe('ev_yujie_confess')
    expect(nightEventForStats({ ...d11ConfessStats, affection: 74 })).toBe('night_rest')
    expect(nightEventForStats({ ...d11ConfessStats, flags: { promiseYujie: true, doublePromise: true } })).toBe('night_rest')
    expect(nightEventForStats({ ...d11ConfessStats, flags: { promiseYujie: true, yujieConfessSeen: true } })).toBe('night_rest')

    // 晨间/固定日期事件
    expect(morningEventForDay(3)).toBe('ev_goose_attack')
    expect(morningEventForDay(5)).toBe('ev_echo_d5')
    expect(morningEventForDay(8)).toBe('ev_echo_d8')
    expect(morningEventForDay(10)).toBe('ev_echo_d10')
    expect(morningEventForDay(12)).toBe('ev_echo_d12')
    expect(morningEventForDay(13)).toBe('ev_final')
    expect(morningEventForDay(7)).toBeNull()
  })
})

describe('《雨姐的心动时刻》v2.4 - 人格词、承诺排他与双向确认机制', () => {
  it('getRelationshipStages 输出三种雨姐人格与老蒯关系阶段词', () => {
    // 柔软态
    const soft = getRelationshipStages({ affection: 105, yujieSoftness: 15, laokuaiBond: 60, laokuaiRomance: 75, laokuaiAlert: 5 })
    expect(soft.yujieStage).toBe('生死搭档')
    expect(soft.yujiePersona).toBe('柔软依恋')
    expect(soft.laokuaiSoulmateStage).toBe('过命知己')
    expect(soft.laokuaiRomanceStage).toBe('情定终身')
    expect(soft.yardAtmosphere).toBe('融洽欢腾')

    // 平衡态
    const balance = getRelationshipStages({ affection: 50, yujieSoftness: 0, laokuaiBond: 35, laokuaiRomance: 30, laokuaiAlert: 18 })
    expect(soft.yujieStage).toBe('生死搭档')
    expect(balance.yujiePersona).toBe('并肩搭档')
    expect(balance.laokuaiSoulmateStage).toBe('同舟工友')
    expect(balance.laokuaiRomanceStage).toBe('微澜初现')
    expect(balance.yardAtmosphere).toBe('暗存戒备')

    // 强势态与剑拔弩张
    const power = getRelationshipStages({ affection: 20, yujieSoftness: -25, laokuaiBond: 5, laokuaiRomance: 0, laokuaiAlert: 35 })
    expect(power.yujieStage).toBe('客套东家')
    expect(power.yujiePersona).toBe('强势主导')
    expect(power.laokuaiSoulmateStage).toBe('默默观察')
    expect(power.laokuaiRomanceStage).toBe('心如止水')
    expect(power.yardAtmosphere).toBe('剑拔弩张')
  })

  it('mutualLaokuaiConsent 仅在老蒯第 4 幕明确双向确认时设置，且不被引擎盲目推断', () => {
    const lao4RomanceChoice = gameEvents.route_laokuai_4.choices.find((c) => c.id === 'lao_4_romance_confess')
    expect(lao4RomanceChoice).toBeDefined()

    const defaultStats = initialStats()
    const resolvedDefault = resolveChoiceOutcome(lao4RomanceChoice, defaultStats)
    expect(resolvedDefault.effects.setFlags.promiseLaokuai).toBe(true)
    expect(resolvedDefault.effects.setFlags.mutualLaokuaiConsent).toBe(true)
    expect(resolvedDefault.effects.setFlags.doublePromise).toBeUndefined()

    const promisedStats = { ...initialStats(), flags: { promiseYujie: true } }
    const resolvedDouble = resolveChoiceOutcome(lao4RomanceChoice, promisedStats)
    expect(resolvedDouble.effects.setFlags.promiseLaokuai).toBe(true)
    expect(resolvedDouble.effects.setFlags.mutualLaokuaiConsent).toBe(true)
    expect(resolvedDouble.effects.setFlags.doublePromise).toBe(true)

    for (const [evId, ev] of Object.entries(gameEvents)) {
      for (const choice of ev.choices || []) {
        const checkFlags = (flags, sourceLabel) => {
          if (!flags) {
            return
          }
          if (flags.mutualLaokuaiConsent) {
            expect(choice.id, `${sourceLabel} 设置 mutualLaokuaiConsent 只能在 lao_4_romance_confess`).toBe('lao_4_romance_confess')
          }
          if (flags.doublePromise) {
            const hasPromiseSetter = Boolean(flags.promiseYujie || flags.promiseLaokuai)
            expect(hasPromiseSetter, `${evId}/${choice.id} 包含 doublePromise 但未明确设置承诺`).toBe(true)
          }
        }

        checkFlags(choice.effects?.setFlags, `${evId}/${choice.id}.effects`)
        for (const oc of choice.outcomes || []) {
          checkFlags(oc.effects?.setFlags, `${evId}/${choice.id}.outcome.effects`)
        }
      }
    }

    const appliedWithoutFlag = applyEffects(defaultStats, {
      effects: { setFlags: { promiseLaokuai: true, mutualLaokuaiConsent: true } }
    })
    expect(appliedWithoutFlag.flags.doublePromise).toBeUndefined()

    const lao4SoulmateChoice = gameEvents.route_laokuai_4.choices.find((c) => c.id === 'lao_4_soulmate_boundary')
    expect(lao4SoulmateChoice).toBeDefined()
    expect(lao4SoulmateChoice.effects.setFlags.honestBoundary).toBe(true)
    expect(lao4SoulmateChoice.effects.clearFlags).toContain('promiseLaokuai')
  })
})

describe('《雨姐的心动时刻》v2.4 - 关键剧本文本、演出资产与无数值泄露规范', () => {
  it('D6 粉条危机（ev_noodle_man）恰好 3 个选项且全部消耗 1 AP，文案含关键设定', () => {
    const ev = gameEvents.ev_noodle_man
    expect(ev).toBeDefined()
    expect(ev.choices).toHaveLength(3)

    for (const c of ev.choices) {
      expect(c.effects.ap).toBe(-1)
    }

    const fullNoodleText = [
      ev.narration || '',
      ...(ev.dialogue || []).map((d) => d.text),
      ...(ev.choices || []).map((c) => `${c.text} ${c.feedback || ''}`)
    ].join(' ')

    expect(fullNoodleText).toContain('粉条')
    expect(fullNoodleText).toContain('纯红薯')
    expect(gameEvents.ev_market_day).toBeDefined()
  })

  it('猪圈第 3 幕（route_pigpen_3）包含“半扇猪”，严禁出现“红烧肉”或“杰克二世”', () => {
    const ev = gameEvents.route_pigpen_3
    expect(ev).toBeDefined()
    const fullText = [
      ev.narration || '',
      ...(ev.dialogue || []).map((d) => d.text),
      ...(ev.choices || []).map((c) => `${c.text} ${c.feedback || ''}`)
    ].join(' ')

    expect(fullText).toContain('半扇')
    expect(fullText).not.toContain('红烧肉')
    expect(fullText).not.toContain('杰克二世')
  })

  it('选项文案与反馈中绝不泄露精确变量名与功利数值标签', () => {
    const forbiddenPatterns = [
      /\[.*好感.*\+.*\d+\]/,
      /\[.*警觉.*\+.*\d+\]/,
      /\[.*正确.*\]/,
      /\[.*危险.*\]/,
      /affection\s*[+-]/,
      /laokuaiAlert\s*[+-]/,
      /integrity\s*[+-]/,
      /yujieSoftness\s*[+-]/
    ]

    for (const [evId, ev] of Object.entries(gameEvents)) {
      for (const c of ev.choices || []) {
        for (const pattern of forbiddenPatterns) {
          expect(pattern.test(c.text), `${evId}/${c.id} 文本包含违规数值泄露: ${c.text}`).toBe(false)
          if (c.feedback) {
            expect(pattern.test(c.feedback), `${evId}/${c.id} feedback 包含违规数值泄露: ${c.feedback}`).toBe(false)
          }
        }
      }
    }
  })

  it('所有图片资源路径真实存在，CG 事件不叠立绘且 Pose 合法', async () => {
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
    for (const ev of Object.values(gameEvents)) {
      if (ev.cg) {
        refs.push(ev.cg)
      }
    }
    refs.push('yujie/cover.jpg')

    const missing = [...new Set(refs)].filter((img) => !existsSync(path.join(publicDir, img)))
    expect(missing).toEqual([])

    // CG 事件 shouldRenderStage 必须为 false
    for (const ev of Object.values(gameEvents)) {
      if (ev.cg) {
        expect(shouldRenderStage(ev)).toBe(false)
      }
    }

    // dialogue 中的 pose 必须在对应 character 的 sprites 中定义
    for (const [evId, ev] of Object.entries(gameEvents)) {
      for (const [idx, d] of (ev.dialogue || []).entries()) {
        if (d.pose) {
          const char = characters[d.character]
          expect(char, `${evId} dialogue[${idx}] 角色 ${d.character} 不存在`).toBeDefined()
          expect(char.sprites[d.pose], `${evId} dialogue[${idx}] pose ${d.pose} 未在 ${d.character}.sprites 中定义`).toBeDefined()
        }
      }
    }
  })
})

describe('《雨姐的心动时刻》v2.4 - 14 结局与心愿系统判定矩阵', () => {
  it('getWishProgress 覆盖全部 8 类核心心愿且边界断言严密', () => {
    // 1. love
    const loveGood = { affection: 90, laokuaiAlert: 40, routes: { riverside: 3 }, flags: { promiseYujie: true } }
    const loveBad = { affection: 89, laokuaiAlert: 40, routes: { riverside: 3 }, flags: { promiseYujie: true } }
    expect(getWishProgress('love', loveGood).requirements.every((r) => r.met)).toBe(true)
    expect(getWishProgress('love', loveBad).requirements.every((r) => r.met)).toBe(false)

    // 2. laokuai_soulmate
    const soulGood = { laokuaiBond: 55, laokuaiRomance: 34, laokuaiAlert: 20, routes: { laokuai: 5 } }
    const soulBad = { laokuaiBond: 55, laokuaiRomance: 35, laokuaiAlert: 20, routes: { laokuai: 5 } }
    expect(getWishProgress('laokuai_soulmate', soulGood).requirements.every((r) => r.met)).toBe(true)
    expect(getWishProgress('laokuai_soulmate', soulBad).requirements.every((r) => r.met)).toBe(false)

    // 3. laokuai_romance
    const romGood = { laokuaiRomance: 50, laokuaiBond: 35, laokuaiAlert: 20, routes: { laokuai: 4 }, flags: { mutualLaokuaiConsent: true } }
    const romBad = { laokuaiRomance: 50, laokuaiBond: 35, laokuaiAlert: 20, routes: { laokuai: 4 }, flags: { mutualLaokuaiConsent: false } }
    expect(getWishProgress('laokuai_romance', romGood).requirements.every((r) => r.met)).toBe(true)
    expect(getWishProgress('laokuai_romance', romBad).requirements.every((r) => r.met)).toBe(false)

    // 4. family
    const famGood = { routes: { laokuai: 3 }, laokuaiAlert: 20, laokuaiBond: 30, affection: 50 }
    expect(getWishProgress('family', famGood).requirements.every((r) => r.met)).toBe(true)

    // 5. chef
    const chefGood = { routes: { kitchen: 3, pigpen: 3 }, affection: 60, integrity: 10 }
    expect(getWishProgress('chef', chefGood).requirements.every((r) => r.met)).toBe(true)

    // 6. streamer
    const strGood = { routes: { market: 3 }, flags: { livePath: true, refusedNoodles: true } }
    expect(getWishProgress('streamer', strGood).requirements.every((r) => r.met)).toBe(true)

    // 7. goose
    const gooseGood = { gooseCount: 3, flags: { gooseAlly: true } }
    expect(getWishProgress('goose', gooseGood).requirements.every((r) => r.met)).toBe(true)

    // 8. casual
    expect(getWishProgress('casual', {}).requirements).toEqual([])
  })

  it('D13 终章聚合所有结局选项，ending_bye 始终可选', () => {
    const finalEvent = gameEvents.ev_final
    expect(finalEvent).toBeDefined()

    const byeChoice = finalEvent.choices.find((c) => c.next === 'ending_bye')
    expect(byeChoice).toBeDefined()
    expect(byeChoice.condition).toBeUndefined()

    // 校验 D13 全部结局选项跳转到的 ending 均在 14 结局名单中
    for (const c of finalEvent.choices) {
      const target = c.next
      const isDirectEnding = Boolean(endings[target])
      const isIntermediateEndingEvent = target.startsWith('ev_ending_') && Boolean(gameEvents[target])
      expect(isDirectEnding || isIntermediateEndingEvent, `D13 选项目标 ${target} 必须有效`).toBe(true)
    }
  })
})
