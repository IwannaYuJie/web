/**
 * 《雨姐的心动时刻》重制版 - 纯逻辑引擎
 * 与 UI 解耦，供 YujieGame.jsx 与测试脚本共用
 */
import gameData from './yujieGameData'

const { items, routes, MAX_ROUTE_STAGE, GALLERY_KEY, dateEvents } = gameData

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

// djb2 字符串哈希：同一 事件+台词 永远得到同一差分，保证可复现
export const hashSeed = (str) => {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = ((h * 33) ^ str.charCodeAt(i)) >>> 0
  }
  return h
}

// 从角色形象池（avatar + portraits 差分）中按种子轮换选一张；无图返回 null（走 emoji 兜底）
export const pickPortrait = (char, seed) => {
  if (!char) {
    return null
  }
  const pool = [char.avatar, ...(char.portraits || [])].filter(Boolean)
  if (!pool.length) {
    return null
  }
  return pool[hashSeed(String(seed)) % pool.length]
}
