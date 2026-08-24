/**
 * 《雨姐的心动时刻》流程仿真测试
 * 用与 UI 共用的纯逻辑引擎自动跑完整局游戏，验证：
 * 1. 九个结局全部可达
 * 2. 随机乱选也不会死局/死循环
 * 3. 关键节点（D3、D6、D9、D12等）AP与天数精确流转
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

// 纯单步状态推演辅助器（与组件/引擎规则严格保持一致）
const stepEvent = (state, action) => {
  let { stats, mode, eventId, ending } = state
  if (ending) return state

  if (mode === 'hub') {
    const decision = action || 'sleep'
    const evId = decision === 'sleep' ? null : routeEventId(decision, stats.routes[decision] || 0)
    if (!evId || !gameEvents[evId]) {
      return { stats, mode: 'event', eventId: 'night_rest', ending: null }
    }
    return {
      stats: { ...stats, actionPoints: Math.max(0, stats.actionPoints - 1) },
      mode: 'event',
      eventId: evId,
      ending: null
    }
  }

  const event = gameEvents[eventId]
  if (!event) {
    throw new Error(`事件缺失: ${eventId}`)
  }
  const available = (event.choices || []).filter((c) => checkCondition(c.condition, stats))
  if (!available.length) {
    throw new Error(`死局: ${eventId} 没有可用选项`)
  }

  let choice = null
  if (typeof action === 'string') {
    choice = available.find((c) => c.id === action)
    if (!choice) {
      throw new Error(`选项未找到或不可用: ${action} 在事件 ${eventId}`)
    }
  } else if (action && typeof action === 'object' && action.id) {
    choice = available.find((c) => c.id === action.id)
    if (!choice) {
      throw new Error(`选项未找到或不可用: ${action.id} 在事件 ${eventId}`)
    }
  } else if (typeof action === 'function') {
    choice = action({ event, available, stats }) || available[0]
  } else {
    choice = available[0]
  }

  const nextStats = applyEffects(stats, choice)
  const next = choice.next

  if (nextStats.laokuaiAlert >= ALERT_GAME_OVER && !endings[next]) {
    return { stats: nextStats, mode: 'ending', eventId: null, ending: 'ending_kicked' }
  }

  if (next === HUB) {
    if (nextStats.actionPoints > 0) {
      return { stats: nextStats, mode: 'hub', eventId: null, ending: null }
    }
    return { stats: nextStats, mode: 'event', eventId: 'night_rest', ending: null }
  }

  if (next === NIGHT) {
    const nextDay = nextStats.day + 1
    const resetStats = { ...nextStats, day: nextDay, actionPoints: ACTIONS_PER_DAY }
    const morning = morningEventForDay(nextDay, resetStats.flags)
    if (morning) {
      return { stats: resetStats, mode: 'event', eventId: morning, ending: null }
    }
    return { stats: resetStats, mode: 'hub', eventId: null, ending: null }
  }

  if (endings[next]) {
    return { stats: nextStats, mode: 'ending', eventId: null, ending: next }
  }

  return { stats: nextStats, mode: 'event', eventId: next, ending: null }
}

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

  it('静态断言：D6两个商人选择必须ap=-1且next=HUB', () => {
    const noodleEvent = gameEvents.ev_noodle_man
    expect(noodleEvent).toBeDefined()
    const choice1 = noodleEvent.choices.find((c) => c.id === 'noodle_1')
    const choice2 = noodleEvent.choices.find((c) => c.id === 'noodle_2')
    expect(choice1).toBeDefined()
    expect(choice2).toBeDefined()
    expect(choice1.effects?.ap).toBe(-1)
    expect(choice1.next).toBe(HUB)
    expect(choice2.effects?.ap).toBe(-1)
    expect(choice2.next).toBe(HUB)
  })

  it('D6完成固定事件后留在day=6、mode=hub且AP=1，再执行支线后AP=0并进入night_rest', () => {
    let state = {
      stats: { ...initialStats(), day: 6, actionPoints: ACTIONS_PER_DAY },
      mode: 'event',
      eventId: 'ev_market_day',
      ending: null
    }

    state = stepEvent(state, 'mktd_1')
    expect(state.eventId).toBe('ev_noodle_man')
    expect(state.mode).toBe('event')

    state = stepEvent(state, 'noodle_2')
    expect(state.mode).toBe('hub')
    expect(state.stats.day).toBe(6)
    expect(state.stats.actionPoints).toBe(1)
    expect(state.ending).toBeNull()

    state = stepEvent(state, 'kitchen')
    expect(state.mode).toBe('event')
    expect(state.eventId).toBe('route_kitchen_1')
    expect(state.stats.actionPoints).toBe(0)

    state = stepEvent(state, 'kit_1_1')
    expect(state.mode).toBe('event')
    expect(state.eventId).toBe('night_rest')
    expect(state.stats.day).toBe(6)
    expect(state.stats.actionPoints).toBe(0)

    state = stepEvent(state, 'night_1')
    expect(state.stats.day).toBe(7)
    expect(state.stats.actionPoints).toBe(ACTIONS_PER_DAY)
    expect(state.mode).toBe('hub')
  })

  it('D3三条大鹅主分支分别跑到HUB后day=3且AP=2', () => {
    const gooseFlows = [
      { first: 'goose_a_1', intermediate: 'ev_goose_fight', second: 'goose_f_1' },
      { first: 'goose_a_2', intermediate: 'ev_goose_run', second: 'goose_r_1' },
      { first: 'goose_a_3', intermediate: 'ev_goose_save', second: 'goose_s_1' }
    ]
    for (const flow of gooseFlows) {
      let state = {
        stats: { ...initialStats(), day: 3, actionPoints: ACTIONS_PER_DAY },
        mode: 'event',
        eventId: 'ev_goose_attack',
        ending: null
      }
      state = stepEvent(state, flow.first)
      expect(state.eventId).toBe(flow.intermediate)
      expect(state.mode).toBe('event')

      state = stepEvent(state, flow.second)
      expect(state.mode).toBe('hub')
      expect(state.stats.day).toBe(3)
      expect(state.stats.actionPoints).toBe(2)
      expect(state.ending).toBeNull()
    }
  })

  it('D9可用分支跑到HUB后day=9且AP=1', () => {
    const unconditionalChoices = ['trouble_1', 'trouble_3']
    for (const choiceId of unconditionalChoices) {
      let state = {
        stats: { ...initialStats(), day: 9, actionPoints: ACTIONS_PER_DAY },
        mode: 'event',
        eventId: 'ev_yujie_trouble',
        ending: null
      }
      state = stepEvent(state, choiceId)
      expect(state.mode).toBe('hub')
      expect(state.stats.day).toBe(9)
      expect(state.stats.actionPoints).toBe(1)
      expect(state.ending).toBeNull()
    }

    let liveState = {
      stats: {
        ...initialStats(),
        day: 9,
        actionPoints: ACTIONS_PER_DAY,
        flags: { liveSkill: true }
      },
      mode: 'event',
      eventId: 'ev_yujie_trouble',
      ending: null
    }
    liveState = stepEvent(liveState, 'trouble_2')
    expect(liveState.mode).toBe('hub')
    expect(liveState.stats.day).toBe(9)
    expect(liveState.stats.actionPoints).toBe(1)
    expect(liveState.ending).toBeNull()
  })

  it('D12分流后正确导向D13或翻车结局，且全流程不出现day>13', () => {
    const resNoodle = simulate({
      hub: () => 'sleep',
      pick: ({ event, available }) => {
        if (event.id === 'ev_noodle_man') {
          return available.find((c) => c.id === 'noodle_1')
        }
        return available[0]
      }
    })
    expect(resNoodle.ending).toBe('ending_noodle')
    expect(resNoodle.stats.day).toBeLessThanOrEqual(13)

    const resNormal = simulate({
      hub: () => 'sleep',
      pick: ({ event, available }) => {
        if (event.id === 'ev_noodle_man') {
          return available.find((c) => c.id === 'noodle_2')
        }
        return available[0]
      }
    })
    expect(resNormal.ending).toBe('ending_bye')
    expect(resNormal.stats.day).toBe(13)

    let seed = 99
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648
      return seed / 2147483648
    }
    const routeIds = ['kitchen', 'pigpen', 'market', 'riverside', 'laokuai', 'mountain', 'sleep']
    for (let run = 0; run < 20; run++) {
      const { stats } = simulate({
        hub: () => routeIds[Math.floor(rand() * routeIds.length)],
        pick: ({ available }) => available[Math.floor(rand() * available.length)]
      })
      expect(stats.day).toBeLessThanOrEqual(13)
    }
  })
})
