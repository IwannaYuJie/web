/**
 * 《雨姐的心动时刻》重制版 - 纯逻辑引擎
 * 与 UI 解耦，供 YujieGame.jsx 与测试脚本共用
 */
import gameData from './yujieGameData'

const { items, routes, acts, wishGuides, scheduledEvents, MAX_ROUTE_STAGE, GALLERY_KEY, dateEvents } = gameData

export const HUB = 'HUB'
export const NIGHT = 'NIGHT'

export const initialStats = () => ({
  affection: 0,
  laokuaiAlert: 0,
  money: 100,
  day: 1,
  actionPoints: 0,
  items: [],
  routes: { kitchen: 0, pigpen: 0, market: 0, riverside: 0, laokuai: 0, mountain: 0 },
  flags: {},
  gooseCount: 0
})

export const loadGallery = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(GALLERY_KEY) || '[]')
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

// 结算选项效果，返回新状态
export const applyEffects = (stats, choice) => {
  const effects = choice.effects || {}
  const next = { ...stats }
  next.affection = Math.max(0, stats.affection + (effects.affection || 0))
  next.laokuaiAlert = Math.min(100, Math.max(0, stats.laokuaiAlert + (effects.laokuaiAlert || 0)))
  next.money = Math.max(0, stats.money + (effects.money || 0))
  if (effects.ap) {
    next.actionPoints = Math.max(0, stats.actionPoints + effects.ap)
  }
  if (effects.addItem && !next.items.includes(effects.addItem)) {
    next.items = [...next.items, effects.addItem]
  }
  if (effects.removeItem) {
    next.items = next.items.filter((i) => i !== effects.removeItem)
  }
  if (effects.setFlag) {
    next.flags = { ...next.flags, [effects.setFlag]: true }
  }
  if (effects.goose || choice.goose) {
    next.gooseCount = stats.gooseCount + 1
  }
  if (choice.advanceRoute) {
    const current = next.routes[choice.advanceRoute] || 0
    next.routes = { ...next.routes, [choice.advanceRoute]: Math.min(MAX_ROUTE_STAGE, current + 1) }
  }
  return next
}

// 选项条件判定
export const checkCondition = (condition, stats) => {
  if (!condition) {
    return true
  }
  const stage = (r) => stats.routes[r] || 0
  if (condition.minAffection !== undefined && stats.affection < condition.minAffection) {
    return false
  }
  if (condition.maxAffection !== undefined && stats.affection > condition.maxAffection) {
    return false
  }
  if (condition.minAlert !== undefined && stats.laokuaiAlert < condition.minAlert) {
    return false
  }
  if (condition.maxAlert !== undefined && stats.laokuaiAlert > condition.maxAlert) {
    return false
  }
  if (condition.hasItem && !stats.items.includes(condition.hasItem)) {
    return false
  }
  if (condition.minMoney !== undefined && stats.money < condition.minMoney) {
    return false
  }
  if (condition.flag && !stats.flags[condition.flag]) {
    return false
  }
  if (condition.notFlag && stats.flags[condition.notFlag]) {
    return false
  }
  if (condition.flagsAll && !condition.flagsAll.every((f) => stats.flags[f])) {
    return false
  }
  if (condition.minGooseCount !== undefined && stats.gooseCount < condition.minGooseCount) {
    return false
  }
  if (condition.routeCompleted && stage(condition.routeCompleted) < MAX_ROUTE_STAGE) {
    return false
  }
  if (
    condition.routesCompleted &&
    !condition.routesCompleted.every((r) => stage(r) >= MAX_ROUTE_STAGE)
  ) {
    return false
  }
  return true
}

// 选项效果摘要（用于飘字提示）
export const summarizeChoice = (choice) => {
  const e = choice.effects || {}
  const parts = []
  if (e.affection) {
    parts.push(`❤️好感${e.affection > 0 ? '+' : ''}${e.affection}`)
  }
  if (e.laokuaiAlert) {
    parts.push(`👀警觉${e.laokuaiAlert > 0 ? '+' : ''}${e.laokuaiAlert}`)
  }
  if (e.money) {
    parts.push(`💰金钱${e.money > 0 ? '+' : ''}${e.money}`)
  }
  if (e.addItem && items[e.addItem]) {
    parts.push(`📦获得「${items[e.addItem].name}」`)
  }
  if (e.removeItem && items[e.removeItem]) {
    parts.push(`📦送出「${items[e.removeItem].name}」`)
  }
  if (e.goose || choice.goose) {
    parts.push('🪿鹅王之证+1')
  }
  if (choice.advanceRoute && routes[choice.advanceRoute]) {
    parts.push(`📖「${routes[choice.advanceRoute].name}」剧情推进`)
  }
  return parts
}

// 进入某天早晨时应强制触发的事件；返回 null 表示直接进入自由行动
export const morningEventForDay = (day, flags) => {
  if (day === 12) {
    return flags.noodleDeal ? 'ev_expose' : 'ev_feast'
  }
  return dateEvents[day] || null
}

// hub 中选择某条支线后应进入的事件
export const routeEventId = (routeId, stage) => {
  const route = routes[routeId]
  if (!route) {
    return null
  }
  if (stage >= MAX_ROUTE_STAGE) {
    return route.repeatable ? `route_${routeId}_repeat` : null
  }
  return `route_${routeId}_${stage + 1}`
}

// 获取当前天数所属的幕（Act）
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

// 获取严格晚于当前天的下一个固定日程
export const getNextScheduledEvent = (day) => {
  const list = Object.values(scheduledEvents || {}).sort((a, b) => a.day - b.day)
  return list.find((item) => item.day > day) || null
}

// 获取指定心愿的达成进度
export const getWishProgress = (wishId, stats) => {
  const s = stats || {}
  const r = s.routes || {}
  const f = s.flags || {}
  const affection = s.affection || 0
  const alert = s.laokuaiAlert || 0
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
          label: '拒绝贴牌粉条',
          current: Boolean(f.refusedNoodles),
          target: true,
          met: Boolean(f.refusedNoodles)
        }
      ]
      break

    case 'goose':
      requirements = [
        {
          key: 'gooseCount',
          label: '大鹅互动次数',
          current: gooseCount,
          target: 3,
          met: gooseCount >= 3
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

// 获取心愿推荐支线列表
export const getRecommendedRoutes = (wishId) => {
  const guide = wishGuides[wishId] || wishGuides.casual
  return guide && Array.isArray(guide.recommendedRoutes) ? [...guide.recommendedRoutes] : []
}

// 判断当前事件是否应渲染舞台立绘
export const shouldRenderStage = (event) => {
  if (event && (event.cg || event.hideStageSprites === true)) {
    return false
  }
  return true
}

// djb2 字符串哈希：同一 事件+台词 永远得到同一差分，保证可复现
export const hashSeed = (str) => {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = ((h * 33) ^ str.charCodeAt(i)) >>> 0
  }
  return h
}

// 从角色形象池选图：
// - kind='sprite' 取透明立绘池，kind='avatar' 取头像照片池
// - 台词标了 expression 且池里有对应图 → 直接用（图文对应）
// - 池里没有该表情 → 回退 default
// - 没标表情 → 按种子哈希轮换（同一句台词永远同一张图）
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

// 舞台立绘选图：优先 pose，再 expression，最后 pickPortrait 回退
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
