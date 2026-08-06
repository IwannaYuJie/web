/**
 * 《雨姐的心动时刻》流程仿真测试
 * 用与 UI 共用的纯逻辑引擎自动跑完整局游戏，验证：
 * 1. 九个结局全部可达
 * 2. 随机乱选也不会死局/死循环
 */
import { describe, expect, it } from 'vitest'
import gameData from '../src/data/yujieGameData'
import gameEvents from '../src/data/yujieGameEvents'
import {
  HUB,
  NIGHT,
  applyEffects,
  checkCondition,
  initialStats,
  morningEventForDay,
  routeEventId
} from '../src/data/yujieGameEngine'

const { endings, ALERT_GAME_OVER, ACTIONS_PER_DAY } = gameData

// 用与组件一致的规则自动打一局
const simulate = (strategy = {}) => {
  let stats = initialStats()
  let mode = 'event'
  let eventId = 'pro_arrive'
  let ending = null
  let steps = 0
  const maxSteps = 300

  while (!ending && steps < maxSteps) {
    steps++
    if (mode === 'hub') {
      const decision = strategy.hub ? strategy.hub(stats) : 'sleep'
      const evId = decision === 'sleep' ? null : routeEventId(decision, stats.routes[decision] || 0)
      if (!evId || !gameEvents[evId]) {
        eventId = 'night_rest'
        mode = 'event'
        continue
      }
      stats = { ...stats, actionPoints: Math.max(0, stats.actionPoints - 1) }
      eventId = evId
      mode = 'event'
      continue
    }

    const event = gameEvents[eventId]
    if (!event) {
      throw new Error(`事件缺失: ${eventId}`)
    }
    const available = (event.choices || []).filter((c) => checkCondition(c.condition, stats))
    if (!available.length) {
      throw new Error(`死局: ${eventId} 没有可用选项`)
    }
    const picked = strategy.pick ? strategy.pick({ event, available, stats }) : null
    const choice = available.includes(picked) ? picked : available[0]
    stats = applyEffects(stats, choice)

    const next = choice.next
    if (stats.laokuaiAlert >= ALERT_GAME_OVER && !endings[next]) {
      ending = 'ending_kicked'
      break
    }
    if (next === HUB) {
      if (stats.actionPoints > 0) {
        mode = 'hub'
      } else {
        eventId = 'night_rest'
        mode = 'event'
      }
    } else if (next === NIGHT) {
      const nextDay = stats.day + 1
      stats = { ...stats, day: nextDay, actionPoints: ACTIONS_PER_DAY }
      const morning = morningEventForDay(nextDay, stats.flags)
      if (morning) {
        eventId = morning
        mode = 'event'
      } else {
        mode = 'hub'
      }
    } else if (endings[next]) {
      ending = next
    } else {
      eventId = next
      mode = 'event'
    }
  }
  return { ending, stats, steps }
}

// 在终章优先选指定结局
const preferEnding = (endingId, fallback) => ({ event, available }) => {
  if (event.id === 'ev_final') {
    return available.find((c) => c.next === endingId) || available[0]
  }
  return fallback ? fallback({ event, available }) : available[0]
}

// 选好感加成最高的选项
const maxAffection = ({ available }) =>
  available.reduce((best, c) =>
    (c.effects?.affection || 0) > (best.effects?.affection || 0) ? c : best
  )

// 选警觉增量最低的选项
const minAlert = ({ available }) =>
  available.reduce((best, c) =>
    (c.effects?.laokuaiAlert || 0) < (best.effects?.laokuaiAlert || 0) ? c : best
  )

// 按优先级依次推支线，走完就睡
const routeOrder = (order) => (stats) => {
  for (const r of order) {
    if ((stats.routes[r] || 0) < 3) {
      return r
    }
  }
  return 'sleep'
}

describe('雨姐游戏流程仿真', () => {
  it('心动结局可达（河边主线 + 安抚老蒯 + 扛猪）', () => {
    const { ending, stats } = simulate({
      hub: routeOrder(['riverside', 'laokuai', 'pigpen', 'mountain']),
      pick: (ctx) => {
        if (ctx.event.id === 'ev_noodle_man') {
          return ctx.available.find((c) => c.id === 'noodle_2')
        }
        return preferEnding('ending_love', maxAffection)(ctx)
      }
    })
    expect(ending).toBe('ending_love')
    expect(stats.affection).toBeGreaterThanOrEqual(90)
    expect(stats.laokuaiAlert).toBeLessThanOrEqual(40)
  })

  it('东北一家人结局可达（主攻堂屋线）', () => {
    const refuseNoodles = (ctx) => {
      if (ctx.event.id === 'ev_noodle_man') {
        return ctx.available.find((c) => c.id === 'noodle_2')
      }
      return minAlert(ctx)
    }
    const { ending } = simulate({
      hub: routeOrder(['laokuai']),
      pick: preferEnding('ending_family', refuseNoodles)
    })
    expect(ending).toBe('ending_family')
  })

  it('金牌帮工结局可达（厨房+猪圈）', () => {
    const { ending } = simulate({
      hub: routeOrder(['kitchen', 'pigpen']),
      pick: preferEnding('ending_chef', maxAffection)
    })
    expect(ending).toBe('ending_chef')
  })

  it('带货新星结局可达（大集线+直播+拒卖粉条）', () => {
    const { ending } = simulate({
      hub: routeOrder(['market']),
      pick: (ctx) => {
        if (ctx.event.id === 'ev_noodle_man') {
          return ctx.available.find((c) => c.id === 'noodle_2')
        }
        if (ctx.event.id === 'ev_yujie_trouble') {
          return ctx.available.find((c) => c.id === 'trouble_2') || ctx.available[0]
        }
        if (ctx.event.id === 'route_market_3') {
          return ctx.available.find((c) => c.effects?.setFlag === 'liveSkill') || ctx.available[0]
        }
        return preferEnding('ending_streamer', maxAffection)(ctx)
      }
    })
    expect(ending).toBe('ending_streamer')
  })

  it('翻车彩蛋结局可达（接下贴牌粉条）', () => {
    const { ending } = simulate({
      hub: () => 'sleep',
      pick: ({ event, available }) => {
        if (event.id === 'ev_noodle_man') {
          return available.find((c) => c.id === 'noodle_1')
        }
        return available[0]
      }
    })
    expect(ending).toBe('ending_noodle')
  })

  it('大鹅之主隐藏结局可达（招惹三次大鹅）', () => {
    const gooseLover = ({ available }) => {
      const gooseChoice = available.find((c) => c.effects?.goose || c.goose)
      return gooseChoice || maxAffection({ available })
    }
    const { ending, stats } = simulate({
      hub: routeOrder(['pigpen', 'mountain']),
      pick: (ctx) => preferEnding('ending_goose', gooseLover)(ctx)
    })
    expect(stats.gooseCount).toBeGreaterThanOrEqual(3)
    expect(ending).toBe('ending_goose')
  })

  it('被赶走结局可达（全程挑衅不管老蒯）', () => {
    const maxAlert = ({ available }) =>
      available.reduce((best, c) =>
        (c.effects?.laokuaiAlert || 0) > (best.effects?.laokuaiAlert || 0) ? c : best
      )
    const { ending } = simulate({
      hub: routeOrder(['riverside', 'pigpen', 'mountain', 'market', 'kitchen']),
      pick: maxAlert
    })
    expect(ending).toBe('ending_kicked')
  })

  it('好友结局可达（泛泛而交）', () => {
    const { ending, stats } = simulate({
      hub: routeOrder(['kitchen', 'mountain']),
      pick: preferEnding('ending_friend', maxAffection)
    })
    expect(ending).toBe('ending_friend')
    expect(stats.affection).toBeGreaterThanOrEqual(50)
  })

  it('路人结局可达（睡大觉流）', () => {
    const { ending } = simulate({
      hub: () => 'sleep',
      pick: ({ event, available }) => {
        if (event.id === 'ev_noodle_man') {
          return available.find((c) => c.id === 'noodle_2')
        }
        return available[0]
      }
    })
    expect(ending).toBe('ending_bye')
  })

  it('随机乱选50局：都能走到结局，不会死局死循环', () => {
    // 简单LCG保证可复现
    let seed = 42
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648
      return seed / 2147483648
    }
    const routeIds = ['kitchen', 'pigpen', 'market', 'riverside', 'laokuai', 'mountain', 'sleep']
    for (let run = 0; run < 50; run++) {
      const { ending, steps } = simulate({
        hub: () => routeIds[Math.floor(rand() * routeIds.length)],
        pick: ({ available }) => available[Math.floor(rand() * available.length)]
      })
      expect(ending, `第${run}局在${steps}步内应走到结局`).toBeTruthy()
      expect(steps).toBeLessThan(300)
    }
  })
})
