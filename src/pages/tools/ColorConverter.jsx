import { useMemo, useState } from 'react'
import ToolHero from './ToolHero'

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)) }

function hexToRgb(hex) {
  const m = hex.trim().replace(/^#/, '')
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(m)) {return null}
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

function rgbToHex({ r, g, b }) {
  const h = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

function rgbToHsl({ r, g, b }) {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break
      case gn: h = (bn - rn) / d + 2; break
      case bn: h = (rn - gn) / d + 4; break
      default: break
    }
    h *= 60
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToRgb({ h, s, l }) {
  const sn = s / 100, ln = l / 100
  const c = (1 - Math.abs(2 * ln - 1)) * sn
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = ln - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) {[r, g, b] = [c, x, 0]}
  else if (h < 120) {[r, g, b] = [x, c, 0]}
  else if (h < 180) {[r, g, b] = [0, c, x]}
  else if (h < 240) {[r, g, b] = [0, x, c]}
  else if (h < 300) {[r, g, b] = [x, 0, c]}
  else {[r, g, b] = [c, 0, x]}
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
}

function ColorConverter() {
  const [hex, setHex] = useState('#FF9F45')

  const rgb = useMemo(() => hexToRgb(hex) || { r: 255, g: 159, b: 69 }, [hex])
  const hsl = useMemo(() => rgbToHsl(rgb), [rgb])

  const updateRgb = (key, value) => {
    const next = { ...rgb, [key]: clamp(Number(value) || 0, 0, 255) }
    setHex(rgbToHex(next))
  }

  const updateHsl = (key, value) => {
    const max = key === 'h' ? 360 : 100
    const next = { ...hsl, [key]: clamp(Number(value) || 0, 0, max) }
    setHex(rgbToHex(hslToRgb(next)))
  }

  const cssRgb = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
  const cssHsl = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
  const isValid = !!hexToRgb(hex)

  const presets = ['#FF9F45', '#FFB366', '#5C4033', '#FFF8F0', '#22c55e', '#3b82f6', '#ef4444', '#a855f7']

  return (
    <div className="container pb-12 animate-fade-in">
      <ToolHero
        emoji="🎨"
        tag="设计工具"
        title="颜色转换"
        desc="HEX、RGB、HSL 三种颜色格式互转，配色取色都顺手。"
      />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
        <div className="card flex flex-col items-center gap-4">
          <div
            className="w-full aspect-square rounded-2xl border-2 border-[var(--border-color)] shadow-inner"
            style={{ background: isValid ? hex : 'transparent' }}
          />
          <input
            type="color"
            value={isValid ? hex : '#000000'}
            onChange={(e) => setHex(e.target.value.toUpperCase())}
            className="w-full h-12 rounded-xl border border-[var(--border-color)] cursor-pointer"
          />
          <div className="flex flex-wrap gap-2 justify-center">
            {presets.map((p) => (
              <button
                key={p}
                onClick={() => setHex(p)}
                className="w-8 h-8 rounded-full border-2 border-white shadow"
                style={{ background: p }}
                title={p}
              />
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="card">
            <h3 className="font-bold text-primary mb-3">HEX</h3>
            <div className="flex gap-2">
              <input
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                className={`flex-1 px-3 py-2 rounded-xl border-2 bg-white font-mono focus:outline-none ${isValid ? 'border-[var(--border-color)] focus:border-primary' : 'border-red-300'}`}
              />
              <CopyButton value={hex} />
            </div>
            {!isValid && <div className="mt-2 text-sm text-red-600">不是合法的 HEX 颜色</div>}
          </div>

          <div className="card">
            <h3 className="font-bold text-primary mb-3">RGB</h3>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {['r', 'g', 'b'].map((k) => (
                <label key={k} className="block">
                  <span className="text-xs text-text-secondary uppercase">{k}</span>
                  <input
                    type="number"
                    min={0}
                    max={255}
                    value={rgb[k]}
                    onChange={(e) => updateRgb(k, e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border-2 border-[var(--border-color)] bg-white font-mono focus:outline-none focus:border-primary"
                  />
                </label>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-xl bg-white/60 border border-[var(--border-color)] text-sm">{cssRgb}</code>
              <CopyButton value={cssRgb} />
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold text-primary mb-3">HSL</h3>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[['h', 360, '°'], ['s', 100, '%'], ['l', 100, '%']].map(([k, max, unit]) => (
                <label key={k} className="block">
                  <span className="text-xs text-text-secondary uppercase">{k} ({unit})</span>
                  <input
                    type="number"
                    min={0}
                    max={max}
                    value={hsl[k]}
                    onChange={(e) => updateHsl(k, e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border-2 border-[var(--border-color)] bg-white font-mono focus:outline-none focus:border-primary"
                  />
                </label>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-xl bg-white/60 border border-[var(--border-color)] text-sm">{cssHsl}</code>
              <CopyButton value={cssHsl} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CopyButton({ value }) {
  const [done, setDone] = useState(false)
  const onClick = async () => {
    await navigator.clipboard.writeText(value)
    setDone(true)
    setTimeout(() => setDone(false), 1200)
  }
  return (
    <button
      onClick={onClick}
      className="px-3 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-hover whitespace-nowrap"
    >
      {done ? '✓' : '复制'}
    </button>
  )
}

export default ColorConverter
