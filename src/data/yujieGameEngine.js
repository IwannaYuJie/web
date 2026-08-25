/**
 * 《雨姐的心动时刻》v2.4 - 纯逻辑引擎
 * 与 UI 解耦，供组件、剧本与自动化测试使用
 */
import gameData from './yujieGameData'

const {
  routes,
  acts,
  wishGuides,
  scheduledEvents,
  MAX_ROUTE_STAGE,
  GALLERY_KEY,
  dateEvents
} = gameData

export const HUB = 'HUB'
export const NIGHT = 'NIGHT'

/**
 * 初始状态工厂
 */
export const initialStats = () => ({
  affection: 0,
  yujieSoftness: 0,
  laokuaiBond: 0,
  laokuaiRomance: 0,
  laokuaiAlert: 0,
  integrity: 0,
  money: 100,
  day: 1,
  actionPoints: 0,
  items: [],
  routes: {
    kitchen: 0,
    pigpen: 0,
    market: 0,
    riverside: 0,
    laokuai: 0,
    mountain: 0
  },
  flags: {},
  gooseCount: 0,
  historyLog: []
})

/**
 * 读取已解锁图鉴
 */
export const loadGallery = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(GALLERY_KEY) || '[]')
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

/**
 * 获取指定支线最大幕数
 */
export const getRouteMaxStage = (routeId) => {
  if (routes && routes[routeId] && typeof routes[routeId].maxStage === 'number') {
    return routes[routeId].maxStage
  }
  if (routeId === 'laokuai') {
    return 5
  }
  return MAX_ROUTE_STAGE || 3
}

/**
 * 检查条件是否满足
 */
export const checkCondition = (condition, stats = {}) => {
  if (!condition) {
    return true
  }

  const stage = (r) => (stats.routes && stats.routes[r]) || 0
  const f = stats.flags || {}

  // 基础数值区间
  if (condition.minAffection !== undefined && (stats.affection || 0) < condition.minAffection) {
    return false
  }
  if (condition.maxAffection !== undefined && (stats.affection || 0) > condition.maxAffection) {
    return false
  }
  if (condition.minAlert !== undefined && (stats.laokuaiAlert || 0) < condition.minAlert) {
    return false
  }
  if (condition.maxAlert !== undefined && (stats.laokuaiAlert || 0) > condition.maxAlert) {
    return false
  }
  if (condition.minMoney !== undefined && (stats.money || 0) < condition.minMoney) {
    return false
  }
  if (condition.maxMoney !== undefined && (stats.money || 0) > condition.maxMoney) {
    return false
  }

  // v2.4 新增数值区间
  if (condition.minYujieSoftness !== undefined && (stats.yujieSoftness || 0) < condition.minYujieSoftness) {
    return false
  }
  if (condition.maxYujieSoftness !== undefined && (stats.yujieSoftness || 0) > condition.maxYujieSoftness) {
    return false
  }
  if (condition.minLaokuaiBond !== undefined && (stats.laokuaiBond || 0) < condition.minLaokuaiBond) {
    return false
  }
  if (condition.maxLaokuaiBond !== undefined && (stats.laokuaiBond || 0) > condition.maxLaokuaiBond) {
    return false
  }
  if (condition.minLaokuaiRomance !== undefined && (stats.laokuaiRomance || 0) < condition.minLaokuaiRomance) {
    return false
  }
  if (condition.maxLaokuaiRomance !== undefined && (stats.laokuaiRomance || 0) > condition.maxLaokuaiRomance) {
    return false
  }
  if (condition.minIntegrity !== undefined && (stats.integrity || 0) < condition.minIntegrity) {
    return false
  }
  if (condition.maxIntegrity !== undefined && (stats.integrity || 0) > condition.maxIntegrity) {
    return false
  }
  if (condition.minGooseCount !== undefined && (stats.gooseCount || 0) < condition.minGooseCount) {
    return false
  }
  if (condition.maxGooseCount !== undefined && (stats.gooseCount || 0) > condition.maxGooseCount) {
    return false
  }

  // 日期限制
  if (condition.minDay !== undefined && (stats.day || 1) < condition.minDay) {
    return false
  }
  if (condition.maxDay !== undefined && (stats.day || 1) > condition.maxDay) {
    return false
  }

  // 物品检查
  if (condition.hasItem && !(stats.items || []).includes(condition.hasItem)) {
    return false
  }
  if (condition.hasItems && !condition.hasItems.every((item) => (stats.items || []).includes(item))) {
    return false
  }

  // 标记检查
  if (condition.flag && !f[condition.flag]) {
    return false
  }
  if (condition.notFlag && f[condition.notFlag]) {
    return false
  }
  if (condition.flagsAll && !condition.flagsAll.every((flagKey) => Boolean(f[flagKey]))) {
    return false
  }
  if (condition.flagsAny && !condition.flagsAny.some((flagKey) => Boolean(f[flagKey]))) {
    return false
  }
  if (condition.notFlags && condition.notFlags.some((flagKey) => Boolean(f[flagKey]))) {
    return false
  }

  // 路线阶段检查
  if (condition.routeCompleted && stage(condition.routeCompleted) < getRouteMaxStage(condition.routeCompleted)) {
    return false
  }
  if (
    condition.routesCompleted &&
    !condition.routesCompleted.every((r) => stage(r) >= getRouteMaxStage(r))
  ) {
    return false
  }
  if (condition.routeMinStages) {
    for (const [rId, reqMin] of Object.entries(condition.routeMinStages)) {
      if (stage(rId) < reqMin) {
        return false
      }
    }
  }

  return true
}

/**
 * 解析选项的动态后果：
 * 顺序选择首个满足 condition 的 outcome；无 outcome 命中时回退基础 choice。
 */
export const resolveChoiceOutcome = (choice = {}, stats = {}) => {
  if (!choice) {
    return {}
  }

  const outcomes = Array.isArray(choice.outcomes) ? choice.outcomes : null
  let matchedOutcome = null

  if (outcomes && outcomes.length > 0) {
    for (const oc of outcomes) {
      if (!oc.condition || checkCondition(oc.condition, stats)) {
        matchedOutcome = oc
        break
      }
    }
  }

  if (!matchedOutcome) {
    return { ...choice }
  }

  const baseEffects = choice.effects || {}
  const outEffects = matchedOutcome.effects || {}

  // 合并 setFlags
  let mergedSetFlags = {}
  if (baseEffects.setFlags) {
    if (Array.isArray(baseEffects.setFlags)) {
      baseEffects.setFlags.forEach((k) => {
        mergedSetFlags[k] = true
      })
    } else if (typeof baseEffects.setFlags === 'object') {
      mergedSetFlags = { ...mergedSetFlags, ...baseEffects.setFlags }
    }
  }
  if (baseEffects.setFlag) {
    mergedSetFlags[baseEffects.setFlag] = true
  }

  if (outEffects.setFlags) {
    if (Array.isArray(outEffects.setFlags)) {
      outEffects.setFlags.forEach((k) => {
        mergedSetFlags[k] = true
      })
    } else if (typeof outEffects.setFlags === 'object') {
      mergedSetFlags = { ...mergedSetFlags, ...outEffects.setFlags }
    }
  }
  if (outEffects.setFlag) {
    mergedSetFlags[outEffects.setFlag] = true
  }

  // 合并 clearFlags
  const mergedClearFlags = new Set()
  if (Array.isArray(baseEffects.clearFlags)) {
    baseEffects.clearFlags.forEach((k) => mergedClearFlags.add(k))
  } else if (typeof baseEffects.clearFlag === 'string') {
    mergedClearFlags.add(baseEffects.clearFlag)
  }
  if (Array.isArray(outEffects.clearFlags)) {
    outEffects.clearFlags.forEach((k) => mergedClearFlags.add(k))
  } else if (typeof outEffects.clearFlag === 'string') {
    mergedClearFlags.add(outEffects.clearFlag)
  }

  const combinedEffects = {
    ...baseEffects,
    ...outEffects,
    affection: (baseEffects.affection || 0) + (outEffects.affection || 0),
    yujieSoftness: (baseEffects.yujieSoftness || 0) + (outEffects.yujieSoftness || 0),
    laokuaiBond: (baseEffects.laokuaiBond || 0) + (outEffects.laokuaiBond || 0),
    laokuaiRomance: (baseEffects.laokuaiRomance || 0) + (outEffects.laokuaiRomance || 0),
    laokuaiAlert: (baseEffects.laokuaiAlert || 0) + (outEffects.laokuaiAlert || 0),
    integrity: (baseEffects.integrity || 0) + (outEffects.integrity || 0),
    money: (baseEffects.money || 0) + (outEffects.money || 0),
    ap: (baseEffects.ap || 0) + (outEffects.ap || 0),
    gooseCount: (baseEffects.gooseCount || 0) + (outEffects.gooseCount || 0)
  }

  if (Object.keys(mergedSetFlags).length > 0) {
    combinedEffects.setFlags = mergedSetFlags
  }
  if (mergedClearFlags.size > 0) {
    combinedEffects.clearFlags = Array.from(mergedClearFlags)
  }

  return {
    ...choice,
    ...matchedOutcome,
    id: choice.id || matchedOutcome.id,
    text: choice.text,
    feedback: matchedOutcome.feedback !== undefined ? matchedOutcome.feedback : choice.feedback,
    next: matchedOutcome.next !== undefined ? matchedOutcome.next : choice.next,
    effects: combinedEffects
  }
}

/**
 * 结算选项效果，返回新状态副本（只接收已解析 choice，不重复执行 outcome）
 */
export const applyEffects = (stats, choice = {}) => {
  const effects = choice.effects || {}
  const next = {
    ...stats,
    routes: { ...(stats.routes || {}) },
    flags: { ...(stats.flags || {}) },
    items: [...(stats.items || [])],
    historyLog: Array.isArray(stats.historyLog) ? [...stats.historyLog] : []
  }

  // 数值 clamp
  next.affection = Math.max(0, Math.min(120, (stats.affection || 0) + (effects.affection || 0)))
  next.yujieSoftness = Math.max(-40, Math.min(40, (stats.yujieSoftness || 0) + (effects.yujieSoftness || 0)))
  next.laokuaiBond = Math.max(0, Math.min(100, (stats.laokuaiBond || 0) + (effects.laokuaiBond || 0)))
  next.laokuaiRomance = Math.max(0, Math.min(100, (stats.laokuaiRomance || 0) + (effects.laokuaiRomance || 0)))
  next.laokuaiAlert = Math.max(0, Math.min(100, (stats.laokuaiAlert || 0) + (effects.laokuaiAlert || 0)))
  next.integrity = Math.max(-30, Math.min(30, (stats.integrity || 0) + (effects.integrity || 0)))
  next.money = Math.max(0, Math.min(9999, (stats.money || 0) + (effects.money || 0)))

  if (typeof effects.ap === 'number') {
    next.actionPoints = Math.max(0, Math.min(2, (stats.actionPoints || 0) + effects.ap))
  }

  // 大鹅交互次数
  let gooseDelta = 0
  if (typeof effects.gooseCount === 'number') {
    gooseDelta += effects.gooseCount
  }
  if (typeof effects.goose === 'number') {
    gooseDelta += effects.goose
  } else if (effects.goose === true) {
    gooseDelta += 1
  }
  if (typeof choice.goose === 'number') {
    gooseDelta += choice.goose
  } else if (choice.goose === true) {
    gooseDelta += 1
  }
  next.gooseCount = Math.max(0, Math.min(10, (stats.gooseCount || 0) + gooseDelta))

  // 道具管理
  if (effects.addItem && !next.items.includes(effects.addItem)) {
    next.items.push(effects.addItem)
  }
  if (effects.addItems && Array.isArray(effects.addItems)) {
    effects.addItems.forEach((it) => {
      if (!next.items.includes(it)) {
        next.items.push(it)
      }
    })
  }
  if (effects.removeItem) {
    next.items = next.items.filter((i) => i !== effects.removeItem)
  }
  if (effects.removeItems && Array.isArray(effects.removeItems)) {
    next.items = next.items.filter((i) => !effects.removeItems.includes(i))
  }

  // 标记设值
  if (effects.setFlag) {
    next.flags[effects.setFlag] = true
  }
  if (effects.setFlags) {
    if (Array.isArray(effects.setFlags)) {
      effects.setFlags.forEach((key) => {
        next.flags[key] = true
      })
    } else if (typeof effects.setFlags === 'object') {
      Object.assign(next.flags, effects.setFlags)
    }
  }

  // 标记清理
  if (effects.clearFlag) {
    delete next.flags[effects.clearFlag]
  }
  if (effects.clearFlags && Array.isArray(effects.clearFlags)) {
    effects.clearFlags.forEach((key) => {
      delete next.flags[key]
    })
  }

  // 路线推进
  const advanceRouteKey = choice.advanceRoute || effects.advanceRoute
  if (advanceRouteKey && next.routes[advanceRouteKey] !== undefined) {
    const current = next.routes[advanceRouteKey] || 0
    const max = getRouteMaxStage(advanceRouteKey)
    next.routes[advanceRouteKey] = Math.min(max, current + 1)
  }

  return next
}

/**
 * 选项叙事反馈（仅返回叙事文本数组，不泄露任何数值）
 */
export const summarizeChoice = (choice = {}) => {
  if (!choice) {
    return []
  }
  if (Array.isArray(choice.feedback)) {
    return choice.feedback.filter(Boolean)
  }
  if (typeof choice.feedback === 'string' && choice.feedback.trim().length > 0) {
    return [choice.feedback.trim()]
  }
  return []
}

/**
 * 构造历史回顾条目
 */
export const buildHistoryEntry = (day, resolvedChoice = {}) => {
  const fb = summarizeChoice(resolvedChoice)
  return {
    day: typeof day === 'number' ? day : 1,
    choiceId: resolvedChoice.id || '',
    text: resolvedChoice.text || '',
    feedback: fb,
    effects: resolvedChoice.effects ? { ...resolvedChoice.effects } : {}
  }
}

/**
 * 特殊支线插曲调度（不扣 AP，通过 seen flag 防重复）
 */
export const getSpecialRouteEvent = (routeId, stats = {}) => {
  const f = stats.flags || {}
  const r = stats.routes || {}
  const day = stats.day || 1
  const alert = stats.laokuaiAlert || 0
  const affection = stats.affection || 0
  const gooseCount = stats.gooseCount || 0

  // 1. 粉条补救插曲：D8/D10 且处于粉条危机、未补救、未触发过补救判定
  if (
    (routeId === 'market' || routeId === 'kitchen') &&
    (day === 8 || day === 10) &&
    (f.noodleCheap || f.noodleDeal) &&
    !f.noodleRemedied &&
    !f.remedyCheckSeen
  ) {
    return 'ev_remedy_check'
  }

  // 2. 翠花集市插曲：D4+，集市至少走过第 1 幕，未获得翠花帮助
  if (routeId === 'market' && day >= 4 && (r.market || 0) >= 1 && !f.cuihuaHelp && !f.cuihuaMarketSeen) {
    return 'ev_cuihua_market'
  }

  // 3. 佩斯帮厨插曲：D7+，厨房至少第 2 幕，未触发过
  if (routeId === 'kitchen' && day >= 7 && (r.kitchen || 0) >= 2 && !f.peisiHelp && !f.peisiHelpSeen) {
    return 'ev_peisi_help'
  }

  // 4. 大鹅深层插曲：互动次数>=2，后山至少第 2 幕，未结盟
  if (routeId === 'mountain' && gooseCount >= 2 && (r.mountain || 0) >= 2 && !f.gooseAlly && !f.gooseDeepSeen) {
    return 'ev_goose_deep'
  }

  // 5. 老蒯关系修复插曲：警觉>=20 且未修复过
  if (routeId === 'laokuai' && alert >= 20 && !f.laokuaiRepaired && !f.repairLaokuaiSeen) {
    return 'ev_repair_laokuai'
  }

  // 6. 河边夜谈插曲：D7+，好感>=50，河边至少第 2 幕，未触发过
  if (routeId === 'riverside' && day >= 7 && affection >= 50 && (r.riverside || 0) >= 2 && !f.riverNightSeen) {
    return 'ev_river_night'
  }

  return null
}

/**
 * 获取路线自然门槛锁提示
 */
export const getRouteLockHint = (routeId, stage, stats = {}) => {
  const currentStage = typeof stage === 'number' ? stage : (stats.routes && stats.routes[routeId]) || 0
  const day = stats.day || 1

  if (routeId === 'laokuai') {
    if (currentStage === 3 && day < 7) {
      return '需第7天后开启清醒长谈'
    }
    if (currentStage === 4 && day < 10) {
      return '需第10天后开启信物托付'
    }
  }
  return null
}

/**
 * 支线事件 ID 计算（支持老蒯 5 幕与时间门槛锁）
 */
export const routeEventId = (routeId, stage, stats = null) => {
  const route = routes[routeId]
  if (!route) {
    return null
  }

  const currentStage = typeof stage === 'number' ? stage : (stats && stats.routes && stats.routes[routeId]) || 0
  const currentDay = (stats && stats.day) || 1
  const maxStage = getRouteMaxStage(routeId)

  // 老蒯自然日门槛锁定
  if (routeId === 'laokuai') {
    if (currentStage === 3 && currentDay < 7) {
      return null
    }
    if (currentStage === 4 && currentDay < 10) {
      return null
    }
  }

  if (currentStage >= maxStage) {
    return route.repeatable ? `route_${routeId}_repeat` : null
  }

  return `route_${routeId}_${currentStage + 1}`
}

/**
 * 晨间强制事件
 */
export const morningEventForDay = (day, _flags = {}) => {
  if (day === 12) {
    return 'ev_echo_d12'
  }
  return dateEvents[day] || null
}

/**
 * 警戒告警插曲触发判定（laokuaiAlert 在 [30, 44] 且未触发过）
 */
export const shouldInsertWarning = (stats = {}) => {
  const alert = stats.laokuaiAlert || 0
  const f = stats.flags || {}
  return alert >= 30 && alert <= 44 && !f.warningSeen
}

/**
 * 晚间结算事件
 */
export const nightEventForStats = (stats = {}) => {
  const day = stats.day || 1
  const affection = stats.affection || 0
  const f = stats.flags || {}

  if (
    day === 11 &&
    affection >= 75 &&
    Boolean(f.promiseYujie) &&
    !f.doublePromise &&
    !f.yujieConfessSeen
  ) {
    return 'ev_yujie_confess'
  }

  return 'night_rest'
}

/**
 * 关系阶段词与氛围描述
 */
export const getRelationshipStages = (stats = {}) => {
  const affection = stats.affection || 0
  const softness = stats.yujieSoftness || 0
  const bond = stats.laokuaiBond || 0
  const romance = stats.laokuaiRomance || 0
  const alert = stats.laokuaiAlert || 0

  let yujieStage = '萍水相逢'
  if (affection >= 100) {
    yujieStage = '生死搭档'
  } else if (affection >= 70) {
    yujieStage = '知心密友'
  } else if (affection >= 30) {
    yujieStage = '合拍帮手'
  } else {
    yujieStage = '客套东家'
  }

  let yujiePersona = '并肩搭档'
  if (softness > 10) {
    yujiePersona = '柔软依恋'
  } else if (softness < -10) {
    yujiePersona = '强势主导'
  }

  let laokuaiSoulmateStage = '默默观察'
  if (bond >= 55) {
    laokuaiSoulmateStage = '过命知己'
  } else if (bond >= 30) {
    laokuaiSoulmateStage = '同舟工友'
  } else if (bond >= 15) {
    laokuaiSoulmateStage = '点头之交'
  }

  let laokuaiRomanceStage = '心如止水'
  if (romance >= 50) {
    romance >= 70 ? (laokuaiRomanceStage = '情定终身') : (laokuaiRomanceStage = '暗生默契')
  } else if (romance >= 25) {
    laokuaiRomanceStage = '微澜初现'
  }

  let yardAtmosphere = '平静祥和'
  if (alert >= 30) {
    yardAtmosphere = '剑拔弩张'
  } else if (alert >= 15) {
    yardAtmosphere = '暗存戒备'
  } else if (affection >= 70 || bond >= 40) {
    yardAtmosphere = '融洽欢腾'
  }

  return {
    yujieStage,
    yujiePersona,
    laokuaiSoulmateStage,
    laokuaiRomanceStage,
    yardAtmosphere
  }
}

/**
 * 存档数据迁移与安全补齐（纯函数，深拷贝）
 */
export const migrateStats = (oldStats = {}) => {
  const init = initialStats()
  const source = typeof oldStats === 'object' && oldStats !== null ? oldStats : {}

  const parseNumber = (val, min, max, defaultVal) => {
    if (typeof val === 'number') {
      if (Number.isFinite(val)) {
        return Math.max(min, Math.min(max, val))
      }
      return defaultVal
    }
    if (typeof val === 'string' && val.trim() !== '') {
      const num = Number(val)
      if (Number.isFinite(num)) {
        return Math.max(min, Math.min(max, num))
      }
      return defaultVal
    }
    return defaultVal
  }

  const rawRoutes = typeof source.routes === 'object' && source.routes !== null ? source.routes : {}
  const mergedRoutes = {
    kitchen: parseNumber(rawRoutes.kitchen, 0, getRouteMaxStage('kitchen'), init.routes.kitchen),
    pigpen: parseNumber(rawRoutes.pigpen, 0, getRouteMaxStage('pigpen'), init.routes.pigpen),
    market: parseNumber(rawRoutes.market, 0, getRouteMaxStage('market'), init.routes.market),
    riverside: parseNumber(rawRoutes.riverside, 0, getRouteMaxStage('riverside'), init.routes.riverside),
    laokuai: parseNumber(rawRoutes.laokuai, 0, getRouteMaxStage('laokuai'), init.routes.laokuai),
    mountain: parseNumber(rawRoutes.mountain, 0, getRouteMaxStage('mountain'), init.routes.mountain)
  }

  const mergedItems = Array.isArray(source.items) ? [...source.items] : [...init.items]
  const mergedFlags = typeof source.flags === 'object' && source.flags !== null ? { ...source.flags } : { ...init.flags }
  const mergedHistory = Array.isArray(source.historyLog) ? JSON.parse(JSON.stringify(source.historyLog)) : [...init.historyLog]

  return {
    affection: parseNumber(source.affection, 0, 120, init.affection),
    yujieSoftness: parseNumber(source.yujieSoftness, -40, 40, init.yujieSoftness),
    laokuaiBond: parseNumber(source.laokuaiBond, 0, 100, init.laokuaiBond),
    laokuaiRomance: parseNumber(source.laokuaiRomance, 0, 100, init.laokuaiRomance),
    laokuaiAlert: parseNumber(source.laokuaiAlert, 0, 100, init.laokuaiAlert),
    integrity: parseNumber(source.integrity, -30, 30, init.integrity),
    money: parseNumber(source.money, 0, 9999, init.money),
    day: parseNumber(source.day, 1, 13, init.day),
    actionPoints: parseNumber(source.actionPoints, 0, 2, init.actionPoints),
    gooseCount: parseNumber(source.gooseCount, 0, 10, init.gooseCount),
    items: mergedItems,
    routes: mergedRoutes,
    flags: mergedFlags,
    historyLog: mergedHistory
  }
}

/**
 * 获取当前天所属的幕（Act）
 */
export const getActForDay = (day) => {
  const actList = acts || []
  if (!actList.length) {
    return null
  }
  const match = actList.find((act) => Array.isArray(act.days) && act.days.includes(day))
  if (match) {
    return match
  }
  if (typeof day !== 'number' || Number.isNaN(day)) {
    return null
  }
  if (day < 1) {
    return actList[0]
  }
  if (day > 13) {
    return actList[actList.length - 1]
  }
  return null
}

/**
 * 获取严格晚于当前天的下一个固定日程
 */
export const getNextScheduledEvent = (day) => {
  const list = Object.values(scheduledEvents || {}).sort((a, b) => a.day - b.day)
  return list.find((item) => item.day > day) || null
}

/**
 * 获取指定心愿的达成进度（覆盖全部 14 结局与 8 核心指南）
 */
export const getWishProgress = (wishId, stats = {}) => {
  const s = stats || {}
  const r = s.routes || {}
  const f = s.flags || {}
  const affection = s.affection || 0
  const alert = s.laokuaiAlert || 0
  const bond = s.laokuaiBond || 0
  const romance = s.laokuaiRomance || 0
  const integrity = s.integrity || 0
  const gooseCount = s.gooseCount || 0

  const wish = wishGuides[wishId] || (wishId === 'casual' ? wishGuides.casual : null)
  let requirements = []

  switch (wishId) {
    case 'love':
      requirements = [
        {
          key: 'affection',
          label: '雨姐好感',
          current: affection,
          target: 90,
          met: affection >= 90
        },
        {
          key: 'laokuaiAlert',
          label: '老蒯警觉',
          current: alert,
          target: 40,
          met: alert <= 40
        },
        {
          key: 'riverside',
          label: '小河边支线',
          current: r.riverside || 0,
          target: 3,
          met: (r.riverside || 0) >= 3
        },
        {
          key: 'promiseYujie',
          label: '雨姐专属承诺',
          current: Boolean(f.promiseYujie),
          target: true,
          met: Boolean(f.promiseYujie)
        },
        {
          key: 'noDoublePromise',
          label: '无双重欺瞒',
          current: !f.doublePromise,
          target: true,
          met: !f.doublePromise
        }
      ]
      break

    case 'laokuai_soulmate':
      requirements = [
        {
          key: 'laokuaiBond',
          label: '老蒯知己深度',
          current: bond,
          target: 55,
          met: bond >= 55
        },
        {
          key: 'laokuai',
          label: '堂屋支线全幕',
          current: r.laokuai || 0,
          target: 5,
          met: (r.laokuai || 0) >= 5
        },
        {
          key: 'laokuaiRomanceLimit',
          label: '浪漫克制',
          current: romance,
          target: '<35',
          met: romance < 35
        },
        {
          key: 'laokuaiAlert',
          label: '老蒯警觉',
          current: alert,
          target: 20,
          met: alert <= 20
        },
        {
          key: 'noDoublePromise',
          label: '无双重欺瞒',
          current: !f.doublePromise,
          target: true,
          met: !f.doublePromise
        }
      ]
      break

    case 'laokuai_romance':
      requirements = [
        {
          key: 'laokuaiRomance',
          label: '老蒯浪漫情愫',
          current: romance,
          target: 50,
          met: romance >= 50
        },
        {
          key: 'laokuaiBond',
          label: '老蒯信任基础',
          current: bond,
          target: 35,
          met: bond >= 35
        },
        {
          key: 'laokuai',
          label: '堂屋支线深度',
          current: r.laokuai || 0,
          target: 4,
          met: (r.laokuai || 0) >= 4
        },
        {
          key: 'mutualLaokuaiConsent',
          label: '清醒双向确认',
          current: Boolean(f.mutualLaokuaiConsent),
          target: true,
          met: Boolean(f.mutualLaokuaiConsent)
        },
        {
          key: 'laokuaiAlert',
          label: '老蒯警觉',
          current: alert,
          target: 20,
          met: alert <= 20
        },
        {
          key: 'noDoublePromise',
          label: '无双重欺瞒',
          current: !f.doublePromise,
          target: true,
          met: !f.doublePromise
        }
      ]
      break

    case 'family':
      requirements = [
        {
          key: 'laokuai',
          label: '堂屋支线',
          current: r.laokuai || 0,
          target: 3,
          met: (r.laokuai || 0) >= 3
        },
        {
          key: 'laokuaiAlert',
          label: '老蒯警觉',
          current: alert,
          target: 20,
          met: alert <= 20
        },
        {
          key: 'laokuaiBond',
          label: '老蒯知己',
          current: bond,
          target: 30,
          met: bond >= 30
        },
        {
          key: 'affection',
          label: '雨姐好感',
          current: affection,
          target: 50,
          met: affection >= 50
        }
      ]
      break

    case 'chef':
      requirements = [
        {
          key: 'kitchen',
          label: '厨房支线',
          current: r.kitchen || 0,
          target: 3,
          met: (r.kitchen || 0) >= 3
        },
        {
          key: 'pigpen',
          label: '猪圈支线',
          current: r.pigpen || 0,
          target: 3,
          met: (r.pigpen || 0) >= 3
        },
        {
          key: 'affection',
          label: '雨姐好感',
          current: affection,
          target: 60,
          met: affection >= 60
        },
        {
          key: 'integrity',
          label: '诚信品控',
          current: integrity,
          target: 10,
          met: integrity >= 10
        }
      ]
      break

    case 'streamer':
      requirements = [
        {
          key: 'market',
          label: '村口大集支线',
          current: r.market || 0,
          target: 3,
          met: (r.market || 0) >= 3
        },
        {
          key: 'livePath',
          label: '选择直播带货',
          current: Boolean(f.livePath),
          target: true,
          met: Boolean(f.livePath)
        },
        {
          key: 'refusedNoodles',
          label: '守住品控底线',
          current: Boolean(f.refusedNoodles && !f.noodleCheap),
          target: true,
          met: Boolean(f.refusedNoodles && !f.noodleCheap)
        }
      ]
      break

    case 'goose':
      requirements = [
        {
          key: 'gooseCount',
          label: '大鹅交锋次数',
          current: gooseCount,
          target: 3,
          met: gooseCount >= 3
        },
        {
          key: 'gooseAlly',
          label: '收服大鹅盟友',
          current: Boolean(f.gooseAlly),
          target: true,
          met: Boolean(f.gooseAlly)
        }
      ]
      break

    case 'casual':
    default:
      requirements = []
      break
  }

  return {
    wish: wish || wishGuides.casual || null,
    requirements
  }
}

/**
 * 获取心愿推荐支线列表
 */
export const getRecommendedRoutes = (wishId) => {
  const guide = wishGuides[wishId] || wishGuides.casual
  return guide && Array.isArray(guide.recommendedRoutes) ? [...guide.recommendedRoutes] : []
}

/**
 * 判断当前事件是否渲染舞台立绘
 */
export const shouldRenderStage = (event) => {
  if (event && (event.cg || event.hideStageSprites === true)) {
    return false
  }
  return true
}

/**
 * djb2 字符串哈希
 */
export const hashSeed = (str) => {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = ((h * 33) ^ str.charCodeAt(i)) >>> 0
  }
  return h
}

/**
 * 角色立绘/头像选图
 */
export const pickPortrait = (char, seed, expression, kind = 'sprite') => {
  if (!char) {
    return null
  }
  const map = (kind === 'avatar' ? char.portraits : char.sprites) || null
  if (map) {
    if (expression && map[expression]) {
      return map[expression]
    }
    if (expression && map.default) {
      return map.default
    }
    const pool = Object.values(map)
    if (pool.length) {
      return pool[hashSeed(String(seed)) % pool.length]
    }
  }
  return char.avatar || null
}

/**
 * 舞台立绘选图
 */
export const pickStageSprite = (char, seed, pose, expression) => {
  if (!char) {
    return null
  }
  if (pose && char.sprites && char.sprites[pose]) {
    return char.sprites[pose]
  }
  if (expression && char.sprites && char.sprites[expression]) {
    return char.sprites[expression]
  }
  return pickPortrait(char, seed, expression, 'sprite')
}

export default {
  HUB,
  NIGHT,
  initialStats,
  loadGallery,
  getRouteMaxStage,
  checkCondition,
  resolveChoiceOutcome,
  applyEffects,
  summarizeChoice,
  buildHistoryEntry,
  getSpecialRouteEvent,
  getRouteLockHint,
  routeEventId,
  morningEventForDay,
  shouldInsertWarning,
  nightEventForStats,
  getRelationshipStages,
  migrateStats,
  getActForDay,
  getNextScheduledEvent,
  getWishProgress,
  getRecommendedRoutes,
  shouldRenderStage,
  hashSeed,
  pickPortrait,
  pickStageSprite
}
