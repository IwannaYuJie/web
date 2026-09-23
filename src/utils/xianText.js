// 仙侠风格用到的中文数字与分类配色

const DIGITS = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九']
const FORMAL = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']

/**
 * 1–99 转中文数字：3 → 三，12 → 十二，40 → 四十。
 * formal 为 true 时用大写（壹贰叁…拾）。超出范围按原样返回。
 */
export function toHanNumeral(value, { formal = false } = {}) {
  const n = Number(value)
  if (!Number.isInteger(n) || n < 0 || n > 99) {
    return String(value)
  }
  const digits = formal ? FORMAL : DIGITS
  const ten = formal ? '拾' : '十'
  if (n === 0) {
    return formal ? FORMAL[0] : '〇'
  }
  if (n < 10) {
    return digits[n]
  }
  const tens = Math.floor(n / 10)
  const ones = n % 10
  return `${tens === 1 ? '' : digits[tens]}${ten}${ones ? digits[ones] : ''}`
}

/** 年份逐位转写：2026 → 二〇二六；非数字原样返回 */
export function toHanYear(year) {
  const text = String(year)
  if (!/^\d+$/.test(text)) {
    return text
  }
  return [...text].map(d => DIGITS[Number(d)]).join('')
}

const MONTHS = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']

/** 月份雅称：3 → 三月，1 → 正月 */
export function toHanMonth(month) {
  const n = Number(month)
  if (!Number.isInteger(n) || n < 1 || n > 12) {
    return String(month)
  }
  return `${MONTHS[n - 1]}月`
}

const SHICHEN = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

/** 十二时辰：23–1 点为子时，13–15 点为未时 */
export function toShichen(hour) {
  const h = ((Number(hour) % 24) + 24) % 24
  return `${SHICHEN[Math.floor(((h + 1) % 24) / 2)]}时`
}

const TONES = ['var(--tone-1)', 'var(--tone-2)', 'var(--tone-3)', 'var(--tone-4)', 'var(--tone-5)']

/** 同一分类总是得到同一种颜色 */
export function categoryTone(category = '') {
  let hash = 0
  for (const ch of String(category)) {
    hash = (hash * 31 + ch.codePointAt(0)) >>> 0
  }
  return TONES[hash % TONES.length]
}
