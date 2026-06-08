import { useCallback, useEffect, useState } from 'react'
import ToolHero from './ToolHero'

const SETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>/?~',
}
const AMBIGUOUS = /[Il1O0o]/g

function randomInt(max) {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] % max
}

function generate({ length, lower, upper, digits, symbols, noAmbiguous }) {
  let pool = ''
  const required = []
  if (lower) {pool += SETS.lower; required.push(SETS.lower)}
  if (upper) {pool += SETS.upper; required.push(SETS.upper)}
  if (digits) {pool += SETS.digits; required.push(SETS.digits)}
  if (symbols) {pool += SETS.symbols; required.push(SETS.symbols)}
  if (noAmbiguous) {
    pool = pool.replace(AMBIGUOUS, '')
  }
  if (!pool) {return ''}

  const pick = (set) => {
    const filtered = noAmbiguous ? set.replace(AMBIGUOUS, '') : set
    return filtered[randomInt(filtered.length)] || ''
  }

  const chars = []
  for (let i = 0; i < length; i++) {chars.push(pool[randomInt(pool.length)])}
  // Ensure at least one from each required set
  required.forEach((set, i) => {
    if (i < length) {chars[i] = pick(set)}
  })
  // Shuffle
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}

function strengthOf(pwd) {
  if (!pwd) {return { label: '—', score: 0, color: '#ddd' }}
  let score = 0
  if (pwd.length >= 8) {score++}
  if (pwd.length >= 12) {score++}
  if (pwd.length >= 16) {score++}
  if (/[a-z]/.test(pwd)) {score++}
  if (/[A-Z]/.test(pwd)) {score++}
  if (/[0-9]/.test(pwd)) {score++}
  if (/[^A-Za-z0-9]/.test(pwd)) {score++}
  const levels = [
    { label: '极弱', color: '#ef4444' },
    { label: '弱', color: '#f97316' },
    { label: '一般', color: '#eab308' },
    { label: '中等', color: '#84cc16' },
    { label: '强', color: '#22c55e' },
    { label: '很强', color: '#10b981' },
    { label: '极强', color: '#059669' },
  ]
  const idx = Math.min(score, levels.length - 1)
  return { label: levels[idx].label, color: levels[idx].color, score }
}

function PasswordGenerator() {
  const [length, setLength] = useState(16)
  const [lower, setLower] = useState(true)
  const [upper, setUpper] = useState(true)
  const [digits, setDigits] = useState(true)
  const [symbols, setSymbols] = useState(true)
  const [noAmbiguous, setNoAmbiguous] = useState(false)
  const [count, setCount] = useState(5)
  const [list, setList] = useState([])
  const [copiedIdx, setCopiedIdx] = useState(-1)

  const refresh = useCallback(() => {
    const opts = { length, lower, upper, digits, symbols, noAmbiguous }
    setList(Array.from({ length: count }, () => generate(opts)))
  }, [length, lower, upper, digits, symbols, noAmbiguous, count])

  useEffect(() => { refresh() }, [refresh])

  const copy = async (text, idx) => {
    await navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(-1), 1200)
  }

  return (
    <div className="container pb-12 animate-fade-in">
      <ToolHero
        emoji="🔑"
        tag="安全工具"
        title="密码生成"
        desc="用浏览器自带的随机数生成器 (crypto) 做密码，长度、字符集随便调，全本地运行。"
      />

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
        <div className="card space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text-secondary">长度</span>
              <span className="font-mono font-bold text-primary">{length}</span>
            </div>
            <input
              type="range"
              min={4}
              max={64}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: 'var(--primary-color)' }}
            />
          </div>

          <div className="space-y-2 text-sm">
            {[
              ['lower', '小写字母 (a-z)', lower, setLower],
              ['upper', '大写字母 (A-Z)', upper, setUpper],
              ['digits', '数字 (0-9)', digits, setDigits],
              ['symbols', '符号 (!@#…)', symbols, setSymbols],
              ['noAmbiguous', '排除易混淆字符 (I l 1 O 0)', noAmbiguous, setNoAmbiguous],
            ].map(([key, label, val, setVal]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={val} onChange={(e) => setVal(e.target.checked)} />
                <span>{label}</span>
              </label>
            ))}
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text-secondary">生成数量</span>
              <span className="font-mono font-bold text-primary">{count}</span>
            </div>
            <input
              type="range"
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: 'var(--primary-color)' }}
            />
          </div>

          <button
            onClick={refresh}
            className="w-full py-2 rounded-full bg-primary text-white font-bold hover:bg-primary-hover"
          >
            🔄 重新生成
          </button>
        </div>

        <div className="card">
          <h3 className="font-bold text-primary mb-3">随机密码</h3>
          <div className="space-y-2">
            {list.map((pwd, i) => {
              const s = strengthOf(pwd)
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/60 border border-[var(--border-color)]"
                >
                  <code className="flex-1 font-mono text-sm break-all">{pwd || '— 至少选择一个字符集 —'}</code>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full text-white whitespace-nowrap"
                    style={{ background: s.color }}
                  >
                    {s.label}
                  </span>
                  <button
                    disabled={!pwd}
                    onClick={() => copy(pwd, i)}
                    className="text-xs px-3 py-1 rounded-full bg-primary text-white hover:bg-primary-hover disabled:opacity-40"
                  >
                    {copiedIdx === i ? '✓' : '复制'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PasswordGenerator
