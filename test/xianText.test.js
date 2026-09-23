import { describe, expect, it } from 'vitest'
import { categoryTone, toHanMonth, toHanNumeral, toHanYear, toShichen } from '../src/utils/xianText'

describe('toHanNumeral', () => {
  it('转写常见数字', () => {
    expect(toHanNumeral(1)).toBe('一')
    expect(toHanNumeral(10)).toBe('十')
    expect(toHanNumeral(12)).toBe('十二')
    expect(toHanNumeral(40)).toBe('四十')
    expect(toHanNumeral(99)).toBe('九十九')
  })

  it('支持大写', () => {
    expect(toHanNumeral(3, { formal: true })).toBe('叁')
    expect(toHanNumeral(17, { formal: true })).toBe('拾柒')
  })

  it('超出范围原样返回', () => {
    expect(toHanNumeral(120)).toBe('120')
    expect(toHanNumeral('abc')).toBe('abc')
  })
})

describe('toHanYear / toHanMonth', () => {
  it('年份逐位转写', () => {
    expect(toHanYear(2026)).toBe('二〇二六')
    expect(toHanYear('未归档')).toBe('未归档')
  })

  it('月份雅称', () => {
    expect(toHanMonth(1)).toBe('正月')
    expect(toHanMonth('03')).toBe('三月')
    expect(toHanMonth(12)).toBe('腊月')
  })
})

describe('toShichen', () => {
  it('按两小时一个时辰换算', () => {
    expect(toShichen(23)).toBe('子时')
    expect(toShichen(0)).toBe('子时')
    expect(toShichen(1)).toBe('丑时')
    expect(toShichen(12)).toBe('午时')
    expect(toShichen(14)).toBe('未时')
    expect(toShichen(22)).toBe('亥时')
  })
})

describe('categoryTone', () => {
  it('同一分类颜色稳定', () => {
    expect(categoryTone('JVM')).toBe(categoryTone('JVM'))
    expect(categoryTone('JVM')).toMatch(/^var\(--tone-\d\)$/)
  })
})
