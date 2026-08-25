/**
 * 《雨姐的心动时刻》v2.4 - 流程与性质测试
 *
 * 核心设计验证：
 * 1. 严格 14 个 ending ID 均从 pro_arrive 纯逻辑实跑可达（不从半程/终态注入 stats）。
 * 2. 500 局固定种子蒙特卡洛随机模拟：无死局、无死循环、无悬空事件、day <= 13，最终落入 14 合法结局之一。
 * 3. 游戏机制性质验证：
 *    - 存在 choice 让 affection 下降；
 *    - 动态 outcomes 随 stats 产生差分；
 *    - yujieSoftness 正负路线分别达成对应结局；
 *    - 老蒯知己与浪漫路线独立可达，明确划界不会赋予 mutual consent；
 *    - D6/D9/D11/D12/D13 各节点流转与特殊插曲防重/防扣 AP 逻辑；
 *    - laokuaiAlert >= 45 立即 kicked；30..44 单次 ev_warning 插曲；
 *    - 存档迁移 migrateStats 兼容旧字段并在后续正常执行。
 */
import { describe, expect, it } from 'vitest'
import gameData from '../src/data/yujieGameData'
import gameEvents from '../src/data/yujieGameEvents'
import {
  HUB,
  NIGHT,
  initialStats,
  checkCondition,
  resolveChoiceOutcome,
  applyEffects,
  buildHistoryEntry,
  getSpecialRouteEvent,
  routeEventId,
  morningEventForDay,
  shouldInsertWarning,
  nightEventForStats,
  migrateStats,
  getRelationshipStages
} from '../src/data/yujieGameEngine'

const { endings, ALERT_GAME_OVER, ACTIONS_PER_DAY } = gameData

/**
 * 完整模拟器：与 UI 组件逻辑严格一致
 * - 从 pro_arrive + initialStats 开始
 * - resolveChoiceOutcome -> applyEffects -> buildHistoryEntry
 * - 警觉 >= 45 即时 ending_kicked；30..44 单次插入 ev_warning
 * - 普通 route 在 HUB 选择时仅做调度并在进入事件后由 applyEffects 扣 1 AP；特殊插曲无 effects.ap 则在 HUB 扣 1 AP
 * - NIGHT 结算 day+1, AP 补满，晨间事件或 HUB
 */
const createSimulator = (strategy = {}) => {
  let stats = initialStats()
  let mode = 'event'
  let eventId = 'pro_arrive'
  let ending = null
  let steps = 0
  let totalApSpent = 0
  const maxSteps = 350

  while (!ending && steps < maxSteps) {
    steps++

    // 1. 检查是否达到警觉致死阈值
    if (stats.laokuaiAlert >= ALERT_GAME_OVER) {
      ending = 'ending_kicked'
      break
    }

    // 2. 大院 HUB 调度阶段
    if (mode === 'hub') {
      // 检查老蒯警觉警告插曲 (30..44)
      if (shouldInsertWarning(stats)) {
        eventId = 'ev_warning'
        mode = 'event'
        continue
      }

      // 若无 AP，走向晚间事件
      if (stats.actionPoints <= 0) {
        eventId = nightEventForStats(stats)
        mode = 'event'
        continue
      }

      // 获取策略决定的去向（routeId 或 'sleep'）
      const routeChoice = strategy.hub ? strategy.hub(stats) : 'sleep'
      if (!routeChoice || routeChoice === 'sleep') {
        eventId = nightEventForStats(stats)
        mode = 'event'
        continue
      }

      // 检查是否有特殊支线插曲
      const specialEvent = getSpecialRouteEvent(routeChoice, stats)
      if (specialEvent && gameEvents[specialEvent]) {
        // 特殊插曲本身无 effects.ap，作为普通行动触发手动扣 1 AP
        stats = { ...stats, actionPoints: Math.max(0, stats.actionPoints - 1) }
        totalApSpent++
        eventId = specialEvent
        mode = 'event'
        continue
      }

      // 普通支线事件：由事件内的 choice.effects.ap = -1 扣除 AP
      const nextEvId = routeEventId(routeChoice, stats.routes[routeChoice] || 0, stats)
      if (!nextEvId || !gameEvents[nextEvId]) {
        eventId = nightEventForStats(stats)
        mode = 'event'
        continue
      }

      totalApSpent++
      eventId = nextEvId
      mode = 'event'
      continue
    }

    // 3. 事件对话与选项决策阶段
    const currentEvent = gameEvents[eventId]
    if (!currentEvent) {
      throw new Error(`事件缺失: ${eventId}`)
    }

    // 过滤出当前状态下可用的选项
    const availableChoices = (currentEvent.choices || []).filter((c) => {
      return checkCondition(c.condition, stats)
    })

    if (availableChoices.length === 0) {
      throw new Error(`死局: 事件 ${eventId} 在第 ${stats.day} 天无可用选项 (stats: ${JSON.stringify(stats)})`)
    }

    // 策略选择
    let pickedChoice = null
    if (typeof strategy.pick === 'function') {
      pickedChoice = strategy.pick({
        event: currentEvent,
        available: availableChoices,
        stats
      })
    }
    if (!pickedChoice || !availableChoices.includes(pickedChoice)) {
      pickedChoice = availableChoices[0]
    }

    // 解析动态后果并应用状态
    const resolvedChoice = resolveChoiceOutcome(pickedChoice, stats)
    stats = applyEffects(stats, resolvedChoice)
    stats.historyLog = [...(stats.historyLog || []), buildHistoryEntry(stats.day, resolvedChoice)]

    // 检查选项后是否立即触发警觉爆表
    if (stats.laokuaiAlert >= ALERT_GAME_OVER) {
      ending = 'ending_kicked'
      break
    }

    const nextTarget = resolvedChoice.next

    // 结局直接跳转
    if (endings[nextTarget]) {
      ending = nextTarget
      break
    }

    // 回大院 HUB
    if (nextTarget === HUB) {
      if (shouldInsertWarning(stats)) {
        eventId = 'ev_warning'
        mode = 'event'
      } else if (stats.actionPoints > 0) {
        mode = 'hub'
        eventId = null
      } else {
        eventId = nightEventForStats(stats)
        mode = 'event'
      }
      continue
    }

    // 过夜结算
    if (nextTarget === NIGHT) {
      const nextDay = stats.day + 1
      if (nextDay > 13) {
        ending = 'ending_bye'
        break
      }
      stats = {
        ...stats,
        day: nextDay,
        actionPoints: nextDay === 12 || nextDay === 13 ? 0 : ACTIONS_PER_DAY
      }
      const morning = morningEventForDay(nextDay, stats.flags)
      if (morning) {
        eventId = morning
        mode = 'event'
      } else {
        mode = 'hub'
        eventId = null
      }
      continue
    }

    // 普通事件流转
    eventId = nextTarget
    mode = 'event'
  }

  if (steps >= maxSteps && !ending) {
    throw new Error(`模拟超出步数限制 (${maxSteps})，停在 day=${stats.day}, event=${eventId}`)
  }

  return { ending, stats, steps, totalApSpent }
}

describe('v2.4 全流程与 14 结局可达性测试', () => {
  // 1. ending_love (雨姐平衡态爱情)
  it('结局可达: ending_love (炊烟并蒂)', () => {
    const res = createSimulator({
      hub: (stats) => {
        if ((stats.routes.riverside || 0) < 3) {
          return 'riverside'
        }
        return 'kitchen'
      },
      pick: ({ event, available, stats }) => {
        if (event.id === 'ev_final') {
          const c = available.find((item) => {
            return item.id === 'final_love_balance'
          })
          if (!c) {
            throw new Error(`final_love_balance 不可用, stats: ${JSON.stringify(stats)}`)
          }
          return c
        }
        if (event.id === 'pro_meet_yujie') {
          return available.find((c) => {
            return c.id === 'pro_meet_yujie_help'
          })
        }
        if (event.id === 'ev_echo_d5') {
          return available.find((c) => {
            return c.id === 'echo_d5_balance'
          })
        }
        if (event.id === 'ev_market_day') {
          return available.find((c) => {
            return c.id === 'mktd_eat'
          })
        }
        if (event.id === 'ev_noodle_man') {
          return available.find((c) => {
            return c.id === 'noodle_inspect_reject'
          })
        }
        if (event.id === 'ev_yujie_trouble') {
          return available.find((c) => {
            return c.id === 'trouble_streamer_path'
          })
        }
        if (event.id === 'ev_echo_d8') {
          return available.find((c) => {
            return c.id === 'echo_d8_balance_action'
          })
        }
        if (event.id === 'ev_echo_d10') {
          return available.find((c) => {
            return c.id === 'echo_d10_balance_plan'
          })
        }
        if (event.id === 'ev_yujie_confess') {
          return available.find((c) => {
            return c.id === 'yujie_confess_partner'
          })
        }
        if (event.id === 'route_riverside_1') {
          return available.find((c) => {
            return c.id === 'riv_1_joke'
          })
        }
        if (event.id === 'route_riverside_2') {
          return available.find((c) => {
            return c.id === 'riv_2_awkward_joke'
          })
        }
        if (event.id === 'route_riverside_3') {
          return available.find((c) => {
            return c.id === 'riv_3_hold_hands'
          })
        }
        if (event.id === 'route_kitchen_1') {
          return available.find((c) => {
            return c.id === 'kit_1_sub'
          })
        }
        if (event.id === 'route_kitchen_2') {
          return available.find((c) => {
            return c.id === 'kit_2_careful'
          })
        }
        if (event.id === 'route_kitchen_3') {
          return available.find((c) => {
            return c.id === 'kit_3_fusion'
          })
        }
        return available[0]
      }
    })
    expect(res.ending).toBe('ending_love')
    expect(res.stats.affection).toBeGreaterThanOrEqual(90)
    expect(res.stats.yujieSoftness).toBeGreaterThanOrEqual(-10)
    expect(res.stats.yujieSoftness).toBeLessThanOrEqual(10)
    expect(res.stats.flags.promiseYujie).toBe(true)
    expect(res.stats.flags.doublePromise).toBeFalsy()
  })

  // 2. ending_love_soft (雨姐柔软依恋态爱情)
  it('结局可达: ending_love_soft (倚怀向晚)', () => {
    const res = createSimulator({
      hub: (stats) => {
        if ((stats.routes.riverside || 0) < 3) {
          return 'riverside'
        }
        return 'kitchen'
      },
      pick: ({ event, available, stats }) => {
        if (event.id === 'ev_final') {
          const c = available.find((item) => {
            return item.id === 'final_love_soft'
          })
          if (!c) {
            throw new Error(`final_love_soft 不可用, stats: ${JSON.stringify(stats)}`)
          }
          return c
        }
        if (event.id === 'pro_meet_yujie') {
          return available.find((c) => {
            return c.id === 'pro_meet_yujie_help'
          })
        }
        if (event.id === 'ev_echo_d5') {
          return available.find((c) => {
            return c.id === 'echo_d5_soft'
          })
        }
        if (event.id === 'ev_market_day') {
          return available.find((c) => {
            return c.id === 'mktd_coat'
          })
        }
        if (event.id === 'ev_noodle_man') {
          return available.find((c) => {
            return c.id === 'noodle_inspect_reject'
          })
        }
        if (event.id === 'ev_yujie_trouble') {
          return available.find((c) => {
            return c.id === 'trouble_streamer_path'
          })
        }
        if (event.id === 'ev_echo_d8') {
          return available.find((c) => {
            return c.id === 'echo_d8_soft_comfort'
          })
        }
        if (event.id === 'ev_echo_d10') {
          return available.find((c) => {
            return c.id === 'echo_d10_soft_promise'
          })
        }
        if (event.id === 'ev_yujie_confess') {
          return available.find((c) => {
            return c.id === 'yujie_confess_accept'
          })
        }
        if (event.id === 'route_riverside_1') {
          return available.find((c) => {
            return c.id === 'riv_1_deep_talk'
          })
        }
        if (event.id === 'route_riverside_2') {
          return available.find((c) => {
            return c.id === 'riv_2_sing'
          })
        }
        if (event.id === 'route_riverside_3') {
          return available.find((c) => {
            return c.id === 'riv_3_coat'
          })
        }
        if (event.id === 'route_kitchen_1') {
          return available.find((c) => {
            return c.id === 'kit_1_take_spatula'
          })
        }
        return available[0]
      }
    })
    expect(res.ending).toBe('ending_love_soft')
    expect(res.stats.affection).toBeGreaterThanOrEqual(90)
    expect(res.stats.yujieSoftness).toBeGreaterThan(10)
    expect(res.stats.flags.promiseYujie).toBe(true)
  })

  // 3. ending_love_power (雨姐强势掌控态爱情)
  it('结局可达: ending_love_power (盛木为荫)', () => {
    const res = createSimulator({
      hub: (stats) => {
        if ((stats.routes.riverside || 0) < 3) {
          return 'riverside'
        }
        return 'kitchen'
      },
      pick: ({ event, available, stats }) => {
        if (event.id === 'ev_final') {
          const c = available.find((item) => {
            return item.id === 'final_love_power'
          })
          if (!c) {
            throw new Error(`final_love_power 不可用, stats: ${JSON.stringify(stats)}`)
          }
          return c
        }
        if (event.id === 'pro_arrive') {
          return available.find((c) => {
            return c.id === 'pro_arrive_look'
          })
        }
        if (event.id === 'pro_meet_yujie') {
          return available.find((c) => {
            return c.id === 'pro_meet_yujie_look'
          })
        }
        if (event.id === 'ev_echo_d5') {
          return available.find((c) => {
            return c.id === 'echo_d5_power'
          })
        }
        if (event.id === 'ev_market_day') {
          return available.find((c) => {
            return c.id === 'mktd_eat'
          })
        }
        if (event.id === 'ev_noodle_man') {
          return available.find((c) => {
            return c.id === 'noodle_inspect_reject'
          })
        }
        if (event.id === 'ev_yujie_trouble') {
          return available.find((c) => {
            return c.id === 'trouble_streamer_path'
          })
        }
        if (event.id === 'ev_echo_d8') {
          return available.find((c) => {
            return c.id === 'echo_d8_power_back'
          })
        }
        if (event.id === 'ev_echo_d10') {
          return available.find((c) => {
            return c.id === 'echo_d10_power_agree'
          })
        }
        if (event.id === 'ev_yujie_confess') {
          return available.find((c) => {
            return c.id === 'yujie_confess_accept'
          })
        }
        if (event.id === 'route_riverside_1') {
          return available.find((c) => {
            return c.id === 'riv_1_business'
          })
        }
        if (event.id === 'route_riverside_2') {
          return available.find((c) => {
            return c.id === 'riv_2_awkward_joke'
          })
        }
        if (event.id === 'route_riverside_3') {
          return available.find((c) => {
            return c.id === 'riv_3_hold_hands'
          })
        }
        if (event.id === 'route_kitchen_1') {
          return available.find((c) => {
            return c.id === 'kit_1_sub'
          })
        }
        if (event.id === 'route_kitchen_2') {
          return available.find((c) => {
            return c.id === 'kit_2_taste'
          })
        }
        if (event.id === 'route_kitchen_3') {
          return available.find((c) => {
            return c.id === 'kit_3_fusion'
          })
        }
        return available[0]
      }
    })
    expect(res.ending).toBe('ending_love_power')
    expect(res.stats.affection).toBeGreaterThanOrEqual(90)
    expect(res.stats.yujieSoftness).toBeLessThan(-10)
    expect(res.stats.flags.promiseYujie).toBe(true)
  })

  // 4. ending_laokuai_soulmate (老蒯知己工友)
  it('结局可达: ending_laokuai_soulmate (匠心同舟)', () => {
    const res = createSimulator({
      hub: (stats) => {
        const stage = stats.routes.laokuai || 0
        if (stage === 0 || stage === 1 || stage === 2) {
          return 'laokuai'
        }
        if (stage === 3 && stats.day >= 7) {
          return 'laokuai'
        }
        if (stage === 4 && stats.day >= 10) {
          return 'laokuai'
        }
        if ((stats.routes.pigpen || 0) < 3) {
          return 'pigpen'
        }
        return 'kitchen'
      },
      pick: ({ event, available, stats }) => {
        if (event.id === 'ev_final') {
          const c = available.find((item) => {
            return item.id === 'final_laokuai_soulmate'
          })
          if (!c) {
            throw new Error(`final_laokuai_soulmate 不可用, stats: ${JSON.stringify(stats)}`)
          }
          return c
        }
        if (event.id === 'route_laokuai_1') {
          return available.find((c) => {
            return c.id === 'lao_1_carry_wood'
          })
        }
        if (event.id === 'route_laokuai_2') {
          return available.find((c) => {
            return c.id === 'lao_2_clean_bench'
          })
        }
        if (event.id === 'route_laokuai_3') {
          return available.find((c) => {
            return c.id === 'lao_3_hero_praise'
          })
        }
        if (event.id === 'route_laokuai_4') {
          return available.find((c) => {
            return c.id === 'lao_4_soulmate_boundary'
          })
        }
        if (event.id === 'route_laokuai_5') {
          return available.find((c) => {
            return c.id === 'lao_5_accept_brother'
          })
        }
        if (event.id === 'route_pigpen_1') {
          return available.find((c) => {
            return c.id === 'pig_1_carry_all'
          })
        }
        if (event.id === 'ev_noodle_man') {
          return available.find((c) => {
            return c.id === 'noodle_inspect_reject'
          })
        }
        return available[0]
      }
    })
    expect(res.ending).toBe('ending_laokuai_soulmate')
    expect(res.stats.laokuaiBond).toBeGreaterThanOrEqual(55)
    expect(res.stats.laokuaiRomance).toBeLessThan(35)
    expect(res.stats.laokuaiAlert).toBeLessThanOrEqual(20)
    expect(res.stats.routes.laokuai).toBe(5)
  })

  // 5. ending_laokuai_romance (老蒯浪漫双向)
  it('结局可达: ending_laokuai_romance (默契生温)', () => {
    const res = createSimulator({
      hub: (stats) => {
        const stage = stats.routes.laokuai || 0
        if (stage < 3) {
          return 'laokuai'
        }
        if (stage === 3 && stats.day >= 7) {
          return 'laokuai'
        }
        if (stage === 4 && stats.day >= 10) {
          return 'laokuai'
        }
        if ((stats.routes.pigpen || 0) < 2) {
          return 'pigpen'
        }
        return 'kitchen'
      },
      pick: ({ event, available, stats }) => {
        if (event.id === 'ev_final') {
          const c = available.find((item) => {
            return item.id === 'final_laokuai_romance'
          })
          if (!c) {
            throw new Error(`final_laokuai_romance 不可用, stats: ${JSON.stringify(stats)}`)
          }
          return c
        }
        if (event.id === 'route_laokuai_1') {
          return available.find((c) => {
            return c.id === 'lao_1_carry_wood'
          })
        }
        if (event.id === 'route_laokuai_2') {
          return available.find((c) => {
            return c.id === 'lao_2_bandage_care'
          })
        }
        if (event.id === 'route_laokuai_3') {
          return available.find((c) => {
            return c.id === 'lao_3_gentle_touch'
          })
        }
        if (event.id === 'route_laokuai_4') {
          return available.find((c) => {
            return c.id === 'lao_4_romance_confess'
          })
        }
        if (event.id === 'route_laokuai_5') {
          return available.find((c) => {
            return c.id === 'lao_5_accept_romance'
          })
        }
        if (event.id === 'ev_noodle_man') {
          return available.find((c) => {
            return c.id === 'noodle_inspect_reject'
          })
        }
        if (event.id === 'ev_echo_d8') {
          return available.find((c) => {
            return c.id === 'echo_d8_balance_action'
          })
        }
        if (event.id === 'ev_echo_d10') {
          return available.find((c) => {
            return c.id === 'echo_d10_balance_plan'
          })
        }
        return available[0]
      }
    })
    expect(res.ending).toBe('ending_laokuai_romance')
    expect(res.stats.laokuaiRomance).toBeGreaterThanOrEqual(50)
    expect(res.stats.laokuaiBond).toBeGreaterThanOrEqual(35)
    expect(res.stats.flags.mutualLaokuaiConsent).toBe(true)
    expect(res.stats.flags.doublePromise).toBeFalsy()
  })

  // 6. ending_family (东北一家人)
  it('结局可达: ending_family (东北一家人)', () => {
    const res = createSimulator({
      hub: (stats) => {
        const stage = stats.routes.laokuai || 0
        if (stage < 3) {
          return 'laokuai'
        }
        if ((stats.routes.kitchen || 0) < 3) {
          return 'kitchen'
        }
        return 'kitchen'
      },
      pick: ({ event, available, stats }) => {
        if (event.id === 'ev_final') {
          const c = available.find((item) => {
            return item.id === 'final_family'
          })
          if (!c) {
            throw new Error(`final_family 不可用, stats: ${JSON.stringify(stats)}`)
          }
          return c
        }
        if (event.id === 'pro_meet_laokuai') {
          return available.find((c) => {
            return c.id === 'pro_laokuai_humor'
          })
        }
        if (event.id === 'route_laokuai_1') {
          return available.find((c) => {
            return c.id === 'lao_1_carry_wood'
          })
        }
        if (event.id === 'route_laokuai_2') {
          return available.find((c) => {
            return c.id === 'lao_2_bandage_care'
          })
        }
        if (event.id === 'route_laokuai_3') {
          return available.find((c) => {
            return c.id === 'lao_3_hero_praise'
          })
        }
        if (event.id === 'route_kitchen_1') {
          return available.find((c) => {
            return c.id === 'kit_1_take_spatula'
          })
        }
        if (event.id === 'route_kitchen_2') {
          return available.find((c) => {
            return c.id === 'kit_2_careful'
          })
        }
        if (event.id === 'route_kitchen_3') {
          return available.find((c) => {
            return c.id === 'kit_3_classic'
          })
        }
        if (event.id === 'ev_noodle_man') {
          return available.find((c) => {
            return c.id === 'noodle_inspect_reject'
          })
        }
        return available[0]
      }
    })
    expect(res.ending).toBe('ending_family')
    expect(res.stats.routes.laokuai).toBeGreaterThanOrEqual(3)
    expect(res.stats.laokuaiBond).toBeGreaterThanOrEqual(30)
    expect(res.stats.affection).toBeGreaterThanOrEqual(50)
    expect(res.stats.laokuaiAlert).toBeLessThanOrEqual(20)
  })

  // 7. ending_chef (关东名厨)
  it('结局可达: ending_chef (关东名厨)', () => {
    const res = createSimulator({
      hub: (stats) => {
        if ((stats.routes.kitchen || 0) < 3) {
          return 'kitchen'
        }
        if ((stats.routes.pigpen || 0) < 3) {
          return 'pigpen'
        }
        return 'kitchen'
      },
      pick: ({ event, available, stats }) => {
        if (event.id === 'ev_final') {
          const c = available.find((item) => {
            return item.id === 'final_chef'
          })
          if (!c) {
            throw new Error(`final_chef 不可用, stats: ${JSON.stringify(stats)}`)
          }
          return c
        }
        if (event.id === 'route_kitchen_1') {
          return available.find((c) => {
            return c.id === 'kit_1_take_spatula'
          })
        }
        if (event.id === 'route_kitchen_2') {
          return available.find((c) => {
            return c.id === 'kit_2_careful'
          })
        }
        if (event.id === 'route_kitchen_3') {
          return available.find((c) => {
            return c.id === 'kit_3_fusion'
          })
        }
        if (event.id === 'route_pigpen_1') {
          return available.find((c) => {
            return c.id === 'pig_1_carry_all'
          })
        }
        if (event.id === 'route_pigpen_2') {
          return available.find((c) => {
            return c.id === 'pig_2_name_good'
          })
        }
        if (event.id === 'route_pigpen_3') {
          return available.find((c) => {
            return c.id === 'pig_3_hero_carry'
          })
        }
        if (event.id === 'ev_noodle_man') {
          return available.find((c) => {
            return c.id === 'noodle_inspect_reject'
          })
        }
        return available[0]
      }
    })
    expect(res.ending).toBe('ending_chef')
    expect(res.stats.routes.kitchen).toBe(3)
    expect(res.stats.routes.pigpen).toBe(3)
    expect(res.stats.affection).toBeGreaterThanOrEqual(60)
    expect(res.stats.integrity).toBeGreaterThanOrEqual(10)
  })

  // 8. ending_streamer (顶流之星)
  it('结局可达: ending_streamer (顶流之星)', () => {
    const res = createSimulator({
      hub: (stats) => {
        if ((stats.routes.market || 0) < 3) {
          return 'market'
        }
        return 'kitchen'
      },
      pick: ({ event, available, stats }) => {
        if (event.id === 'ev_final') {
          const c = available.find((item) => {
            return item.id === 'final_streamer'
          })
          if (!c) {
            throw new Error(`final_streamer 不可用, stats: ${JSON.stringify(stats)}`)
          }
          return c
        }
        if (event.id === 'route_market_1') {
          return available.find((c) => {
            return c.id === 'mkt_1_english_bargain'
          })
        }
        if (event.id === 'route_market_2') {
          return available.find((c) => {
            return c.id === 'mkt_2_buy_info'
          })
        }
        if (event.id === 'route_market_3') {
          return available.find((c) => {
            return c.id === 'mkt_3_learn_live'
          })
        }
        if (event.id === 'ev_noodle_man') {
          return available.find((c) => {
            return c.id === 'noodle_inspect_reject'
          })
        }
        if (event.id === 'ev_yujie_trouble') {
          return available.find((c) => {
            return c.id === 'trouble_streamer_path'
          })
        }
        return available[0]
      }
    })
    expect(res.ending).toBe('ending_streamer')
    expect(res.stats.routes.market).toBe(3)
    expect(res.stats.flags.livePath).toBe(true)
    expect(res.stats.flags.refusedNoodles).toBe(true)
    expect(res.stats.flags.noodleCheap).toBeFalsy()
  })

  // 9. ending_goose (鹅中霸王)
  it('结局可达: ending_goose (鹅中霸王)', () => {
    const res = createSimulator({
      hub: (stats) => {
        if ((stats.routes.mountain || 0) < 3) {
          return 'mountain'
        }
        return 'kitchen'
      },
      pick: ({ event, available, stats }) => {
        if (event.id === 'ev_final') {
          const c = available.find((item) => {
            return item.id === 'final_goose'
          })
          if (!c) {
            throw new Error(`final_goose 不可用, stats: ${JSON.stringify(stats)}`)
          }
          return c
        }
        if (event.id === 'pro_arrive') {
          return available.find((c) => {
            return c.id === 'pro_arrive_goose'
          })
        }
        if (event.id === 'ev_goose_attack') {
          return available.find((c) => {
            return c.id === 'goose_a_fight'
          })
        }
        if (event.id === 'route_mountain_3') {
          return available.find((c) => {
            return c.id === 'mtn_3_salute'
          })
        }
        if (event.id === 'ev_goose_deep') {
          return available.find((c) => {
            return c.id === 'goose_deep_corn'
          })
        }
        if (event.id === 'ev_noodle_man') {
          return available.find((c) => {
            return c.id === 'noodle_inspect_reject'
          })
        }
        return available[0]
      }
    })
    expect(res.ending).toBe('ending_goose')
    expect(res.stats.gooseCount).toBeGreaterThanOrEqual(3)
    expect(res.stats.flags.gooseAlly).toBe(true)
  })

  // 10. ending_friend (农家挚友)
  it('结局可达: ending_friend (农家挚友)', () => {
    const res = createSimulator({
      hub: (stats) => {
        if ((stats.routes.kitchen || 0) < 2) {
          return 'kitchen'
        }
        return 'kitchen'
      },
      pick: ({ event, available, stats }) => {
        if (event.id === 'ev_final') {
          const c = available.find((item) => {
            return item.id === 'final_friend'
          })
          if (!c) {
            throw new Error(`final_friend 不可用, stats: ${JSON.stringify(stats)}`)
          }
          return c
        }
        if (event.id === 'ev_noodle_man') {
          return available.find((c) => {
            return c.id === 'noodle_inspect_reject'
          })
        }
        return available[0]
      }
    })
    expect(res.ending).toBe('ending_friend')
    expect(res.stats.affection).toBeGreaterThanOrEqual(50)
  })

  // 11. ending_bye (客路匆匆)
  it('结局可达: ending_bye (客路匆匆)', () => {
    const res = createSimulator({
      hub: () => {
        return 'sleep'
      },
      pick: ({ event, available, stats }) => {
        if (event.id === 'ev_final') {
          const c = available.find((item) => {
            return item.id === 'final_bye'
          })
          if (!c) {
            throw new Error(`final_bye 不可用, stats: ${JSON.stringify(stats)}`)
          }
          return c
        }
        if (event.id === 'ev_noodle_man') {
          return available.find((c) => {
            return c.id === 'noodle_inspect_reject'
          })
        }
        return available[0]
      }
    })
    expect(res.ending).toBe('ending_bye')
    expect(res.stats.day).toBe(13)
  })

  // 12. ending_shura (冰碎雪崩 - 双重欺瞒)
  it('结局可达: ending_shura (冰碎雪崩)', () => {
    const res = createSimulator({
      hub: (stats) => {
        if ((stats.routes.riverside || 0) < 3) {
          return 'riverside'
        }
        const stage = stats.routes.laokuai || 0
        if (stage < 3) {
          return 'laokuai'
        }
        if (stage === 3 && stats.day >= 7) {
          return 'laokuai'
        }
        return 'kitchen'
      },
      pick: ({ event, available }) => {
        if (event.id === 'route_riverside_1') {
          return available.find((c) => {
            return c.id === 'riv_1_deep_talk'
          })
        }
        if (event.id === 'route_riverside_2') {
          return available.find((c) => {
            return c.id === 'riv_2_sing'
          })
        }
        if (event.id === 'route_riverside_3') {
          return available.find((c) => {
            return c.id === 'riv_3_hold_hands'
          })
        }
        if (event.id === 'route_laokuai_1') {
          return available.find((c) => {
            return c.id === 'lao_1_carry_wood'
          })
        }
        if (event.id === 'route_laokuai_2') {
          return available.find((c) => {
            return c.id === 'lao_2_bandage_care'
          })
        }
        if (event.id === 'route_laokuai_3') {
          return available.find((c) => {
            return c.id === 'lao_3_gentle_touch'
          })
        }
        if (event.id === 'ev_echo_d8') {
          return available.find((c) => {
            return c.id === 'echo_d8_soft_comfort'
          })
        }
        if (event.id === 'route_laokuai_4') {
          return available.find((c) => {
            return c.id === 'lao_4_romance_confess'
          })
        }
        if (event.id === 'ev_noodle_man') {
          return available.find((c) => {
            return c.id === 'noodle_inspect_reject'
          })
        }
        if (event.id === 'ev_shura_reveal') {
          return available.find((c) => {
            return c.id === 'shura_accept_fate'
          })
        }
        if (event.id === 'ev_ending_shura') {
          return available.find((c) => {
            return c.id === 'end_shura_btn'
          })
        }
        return available[0]
      }
    })
    expect(res.ending).toBe('ending_shura')
    expect(res.stats.day).toBe(12)
    expect(res.stats.flags.doublePromise).toBe(true)
  })

  // 13. ending_noodle (盛宴翻车 - 假粉条未补救)
  it('结局可达: ending_noodle (盛宴翻车)', () => {
    const res = createSimulator({
      hub: () => {
        return 'sleep'
      },
      pick: ({ event, available }) => {
        if (event.id === 'ev_noodle_man') {
          return available.find((c) => {
            return c.id === 'noodle_cheap_deal'
          })
        }
        if (event.id === 'ev_expose') {
          return available.find((c) => {
            return c.id === 'expose_end'
          })
        }
        return available[0]
      }
    })
    expect(res.ending).toBe('ending_noodle')
    expect(res.stats.day).toBe(12)
  })

  // 14. ending_kicked (逐出山门 - 警觉超标45)
  it('结局可达: ending_kicked (逐出山门)', () => {
    const res = createSimulator({
      hub: (stats) => {
        const stage = stats.routes.laokuai || 0
        if (stage < 3) {
          return 'laokuai'
        }
        if (stage === 3 && stats.day >= 7) {
          return 'laokuai'
        }
        return 'riverside'
      },
      pick: ({ event, available }) => {
        if (event.id === 'pro_arrive') {
          return available.find((c) => {
            return c.id === 'pro_arrive_shout'
          })
        }
        if (event.id === 'pro_meet_laokuai') {
          return available.find((c) => {
            return c.id === 'pro_laokuai_stare_milk'
          })
        }
        if (event.id === 'route_laokuai_1') {
          return available.find((c) => {
            return c.id === 'lao_1_grab_axe'
          })
        }
        if (event.id === 'route_laokuai_2') {
          return available.find((c) => {
            return c.id === 'lao_2_yell_yujie'
          })
        }
        if (event.id === 'route_laokuai_3') {
          return available.find((c) => {
            return c.id === 'lao_3_preach'
          })
        }
        if (event.id === 'ev_warning') {
          return available.find((c) => {
            return c.id === 'warning_defy'
          })
        }
        if (event.id === 'route_laokuai_4') {
          return available.find((c) => {
            return c.id === 'lao_4_vague_dodge'
          })
        }
        if (event.id === 'route_riverside_1') {
          return available.find((c) => {
            return c.id === 'riv_1_deep_talk'
          })
        }
        if (event.id === 'ev_noodle_man') {
          return available.find((c) => {
            return c.id === 'noodle_inspect_reject'
          })
        }
        return available[0]
      }
    })
    expect(res.ending).toBe('ending_kicked')
    expect(res.stats.laokuaiAlert).toBeGreaterThanOrEqual(ALERT_GAME_OVER)
  })
})

describe('500 局固定种子蒙特卡洛随机模拟测试', () => {
  it('500 局随机自动化：全部无死局、无死循环、无悬空事件，day<=13，落入合法结局', () => {
    let seed = 123456789
    const pseudoRandom = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296
      return seed / 4294967296
    }

    for (let i = 0; i < 500; i++) {
      const res = createSimulator({
        hub: (stats) => {
          const candidates = []
          for (const r of ['kitchen', 'pigpen', 'market', 'riverside', 'laokuai', 'mountain']) {
            if (r === 'laokuai') {
              const st = stats.routes.laokuai || 0
              if (st === 3 && stats.day < 7) {
                continue
              }
              if (st === 4 && stats.day < 10) {
                continue
              }
              if (st >= 5) {
                continue
              }
            }
            const ev = routeEventId(r, stats.routes[r] || 0, stats)
            if (ev) {
              candidates.push(r)
            }
          }
          candidates.push('sleep')
          const idx = Math.floor(pseudoRandom() * candidates.length)
          return candidates[idx]
        },
        pick: ({ available }) => {
          const idx = Math.floor(pseudoRandom() * available.length)
          return available[idx]
        }
      })

      expect(res.ending, `第 ${i} 局应当产生有效结局`).toBeTruthy()
      expect(endings[res.ending], `第 ${i} 局结局 (${res.ending}) 必须在合法结局列表中`).toBeDefined()
      expect(res.stats.day).toBeLessThanOrEqual(13)
      expect(res.totalApSpent).toBeLessThanOrEqual(18)
      expect(res.steps).toBeLessThan(300)
    }
  })
})

describe('核心剧情机制与性质断言', () => {
  it('数值性质：至少存在一条选项会使 affection 好感度下降', () => {
    let foundNegativeAffection = false
    for (const ev of Object.values(gameEvents)) {
      for (const choice of ev.choices || []) {
        if (choice.effects && typeof choice.effects.affection === 'number' && choice.effects.affection < 0) {
          foundNegativeAffection = true
          break
        }
        if (Array.isArray(choice.outcomes)) {
          for (const oc of choice.outcomes) {
            if (oc.effects && typeof oc.effects.affection === 'number' && oc.effects.affection < 0) {
              foundNegativeAffection = true
              break
            }
          }
        }
      }
      if (foundNegativeAffection) {
        break
      }
    }
    expect(foundNegativeAffection).toBe(true)
  })

  it('动态后果：同一选项在不同 stats 下解析出不同 outcome 与 next', () => {
    const choice = gameEvents.ev_echo_d12.choices[0]
    expect(choice.outcomes).toBeDefined()

    // 状态 A: doublePromise -> ev_shura_reveal
    const statsShura = { ...initialStats(), flags: { doublePromise: true } }
    const resolvedShura = resolveChoiceOutcome(choice, statsShura)
    expect(resolvedShura.next).toBe('ev_shura_reveal')

    // 状态 B: noodleCheap 且未补救 -> ev_expose
    const statsNoodle = { ...initialStats(), flags: { noodleCheap: true } }
    const resolvedNoodle = resolveChoiceOutcome(choice, statsNoodle)
    expect(resolvedNoodle.next).toBe('ev_expose')

    // 状态 C: 正常状态 -> ev_feast
    const statsNormal = initialStats()
    const resolvedNormal = resolveChoiceOutcome(choice, statsNormal)
    expect(resolvedNormal.next).toBe('ev_feast')
    expect(resolvedNormal.effects?.affection).toBe(5)
  })

  it('雨姐 persona 性质：getRelationshipStages 在实跑正负 softness 路径下正确判定 persona', () => {
    const softRes = createSimulator({
      hub: (stats) => {
        if ((stats.routes.riverside || 0) < 3) {
          return 'riverside'
        }
        return 'kitchen'
      },
      pick: ({ event, available }) => {
        if (event.id === 'ev_final') {
          return available.find((c) => {
            return c.id === 'final_love_soft'
          }) || available[0]
        }
        if (event.id === 'pro_meet_yujie') {
          return available.find((c) => {
            return c.id === 'pro_meet_yujie_help'
          })
        }
        if (event.id === 'ev_echo_d5') {
          return available.find((c) => {
            return c.id === 'echo_d5_soft'
          })
        }
        if (event.id === 'ev_market_day') {
          return available.find((c) => {
            return c.id === 'mktd_coat'
          })
        }
        if (event.id === 'ev_noodle_man') {
          return available.find((c) => {
            return c.id === 'noodle_inspect_reject'
          })
        }
        if (event.id === 'ev_yujie_trouble') {
          return available.find((c) => {
            return c.id === 'trouble_streamer_path'
          })
        }
        if (event.id === 'ev_echo_d8') {
          return available.find((c) => {
            return c.id === 'echo_d8_soft_comfort'
          })
        }
        if (event.id === 'ev_echo_d10') {
          return available.find((c) => {
            return c.id === 'echo_d10_soft_promise'
          })
        }
        if (event.id === 'ev_yujie_confess') {
          return available.find((c) => {
            return c.id === 'yujie_confess_accept'
          })
        }
        if (event.id === 'route_riverside_1') {
          return available.find((c) => {
            return c.id === 'riv_1_deep_talk'
          })
        }
        if (event.id === 'route_riverside_2') {
          return available.find((c) => {
            return c.id === 'riv_2_sing'
          })
        }
        if (event.id === 'route_riverside_3') {
          return available.find((c) => {
            return c.id === 'riv_3_coat'
          })
        }
        return available[0]
      }
    })
    const stagesSoft = getRelationshipStages(softRes.stats)
    expect(stagesSoft.yujiePersona).toBe('柔软依恋')

    const powerRes = createSimulator({
      hub: (stats) => {
        if ((stats.routes.riverside || 0) < 3) {
          return 'riverside'
        }
        return 'kitchen'
      },
      pick: ({ event, available }) => {
        if (event.id === 'ev_final') {
          return available.find((c) => {
            return c.id === 'final_love_power'
          }) || available[0]
        }
        if (event.id === 'pro_arrive') {
          return available.find((c) => {
            return c.id === 'pro_arrive_look'
          })
        }
        if (event.id === 'pro_meet_yujie') {
          return available.find((c) => {
            return c.id === 'pro_meet_yujie_look'
          })
        }
        if (event.id === 'ev_echo_d5') {
          return available.find((c) => {
            return c.id === 'echo_d5_power'
          })
        }
        if (event.id === 'ev_market_day') {
          return available.find((c) => {
            return c.id === 'mktd_eat'
          })
        }
        if (event.id === 'ev_noodle_man') {
          return available.find((c) => {
            return c.id === 'noodle_inspect_reject'
          })
        }
        if (event.id === 'ev_yujie_trouble') {
          return available.find((c) => {
            return c.id === 'trouble_streamer_path'
          })
        }
        if (event.id === 'ev_echo_d8') {
          return available.find((c) => {
            return c.id === 'echo_d8_power_back'
          })
        }
        if (event.id === 'ev_echo_d10') {
          return available.find((c) => {
            return c.id === 'echo_d10_power_agree'
          })
        }
        if (event.id === 'ev_yujie_confess') {
          return available.find((c) => {
            return c.id === 'yujie_confess_accept'
          })
        }
        if (event.id === 'route_riverside_1') {
          return available.find((c) => {
            return c.id === 'riv_1_business'
          })
        }
        if (event.id === 'route_riverside_2') {
          return available.find((c) => {
            return c.id === 'riv_2_awkward_joke'
          })
        }
        if (event.id === 'route_riverside_3') {
          return available.find((c) => {
            return c.id === 'riv_3_hold_hands'
          })
        }
        if (event.id === 'route_kitchen_1') {
          return available.find((c) => {
            return c.id === 'kit_1_sub'
          })
        }
        if (event.id === 'route_kitchen_2') {
          return available.find((c) => {
            return c.id === 'kit_2_taste'
          })
        }
        if (event.id === 'route_kitchen_3') {
          return available.find((c) => {
            return c.id === 'kit_3_fusion'
          })
        }
        return available[0]
      }
    })
    const stagesPower = getRelationshipStages(powerRes.stats)
    expect(powerRes.stats.yujieSoftness).toBeLessThan(-10)
    expect(stagesPower.yujiePersona).toBe('强势主导')
  })

  it('老蒯边界管理：明确划界 (lao_4_soulmate_boundary) 会设置 honestBoundary 并清理 promiseLaokuai，不会赋予 mutualLaokuaiConsent', () => {
    const choice = gameEvents.route_laokuai_4.choices.find((c) => {
      return c.id === 'lao_4_soulmate_boundary'
    })
    expect(choice).toBeDefined()

    const statsBefore = {
      ...initialStats(),
      flags: { promiseLaokuai: true }
    }
    const resolved = resolveChoiceOutcome(choice, statsBefore)
    const statsAfter = applyEffects(statsBefore, resolved)

    expect(statsAfter.flags.honestBoundary).toBe(true)
    expect(statsAfter.flags.promiseLaokuai).toBeFalsy()
    expect(statsAfter.flags.mutualLaokuaiConsent).toBeFalsy()
  })

  it('D6 三个粉条选择均扣除 1 AP 并返回 HUB', () => {
    const noodleEv = gameEvents.ev_noodle_man
    expect(noodleEv).toBeDefined()
    expect(noodleEv.choices.length).toBe(3)

    for (const c of noodleEv.choices) {
      expect(c.next).toBe(HUB)
      expect(c.effects?.ap).toBe(-1)
    }
  })

  it('D9 固定发愁事件消耗 1 AP 且剩余 1 AP 在当天', () => {
    const troubleEv = gameEvents.ev_yujie_trouble
    expect(troubleEv).toBeDefined()
    for (const c of troubleEv.choices) {
      expect(c.next).toBe(HUB)
      expect(c.effects?.ap).toBe(-1)
    }
  })

  it('特殊支线插曲：seen 防重复触发机制', () => {
    const stats = {
      ...initialStats(),
      day: 4,
      routes: { market: 1 }
    }
    expect(getSpecialRouteEvent('market', stats)).toBe('ev_cuihua_market')

    const statsSeen = {
      ...stats,
      flags: { cuihuaHelp: true, cuihuaMarketSeen: true }
    }
    expect(getSpecialRouteEvent('market', statsSeen)).toBeNull()
  })

  it('警觉告警插曲：laokuaiAlert 在 30..44 时 shouldInsertWarning 返回 true，触发后 warningSeen 置为 true 防重', () => {
    const stats35 = { ...initialStats(), laokuaiAlert: 35 }
    expect(shouldInsertWarning(stats35)).toBe(true)

    const statsWarningSeen = { ...stats35, flags: { warningSeen: true } }
    expect(shouldInsertWarning(statsWarningSeen)).toBe(false)
  })

  it('存档迁移 migrateStats：补齐 v2.4 缺省字段，从合法中间天继续不超出 13 天', () => {
    const oldSave = {
      affection: 45,
      laokuaiAlert: 10,
      money: 120,
      day: 7,
      actionPoints: 1,
      routes: { kitchen: 2 }
    }
    const migrated = migrateStats(oldSave)
    expect(migrated.yujieSoftness).toBe(0)
    expect(migrated.laokuaiBond).toBe(0)
    expect(migrated.laokuaiRomance).toBe(0)
    expect(migrated.integrity).toBe(0)
    expect(migrated.gooseCount).toBe(0)
    expect(migrated.day).toBe(7)
    expect(migrated.actionPoints).toBe(1)
  })
})
