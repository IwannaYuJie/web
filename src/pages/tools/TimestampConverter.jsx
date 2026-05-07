import { useEffect, useState } from 'react'
import ToolHero from './ToolHero'

function pad(n) { return n < 10 ? `0${n}` : `${n}` }

function toLocalString(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function toUtcString(date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} UTC`
}

function relative(ms) {
  const diff = (Date.now() - ms) / 1000
  const abs = Math.abs(diff)
  const sign = diff >= 0 ? '前' : '后'
  if (abs < 60) {return `${Math.round(abs)} 秒${sign}`}
  if (abs < 3600) {return `${Math.round(abs / 60)} 分钟${sign}`}
  if (abs < 86400) {return `${Math.round(abs / 3600)} 小时${sign}`}
  if (abs < 86400 * 30) {return `${Math.round(abs / 86400)} 天${sign}`}
  if (abs < 86400 * 365) {return `${Math.round(abs / 86400 / 30)} 个月${sign}`}
  return `${(abs / 86400 / 365).toFixed(1)} 年${sign}`
}

function TimestampConverter() {
  const [now, setNow] = useState(Date.now())
  const [tsInput, setTsInput] = useState(String(Math.floor(Date.now() / 1000)))
  const [dateInput, setDateInput] = useState(toLocalString(new Date()))
  const [unit, setUnit] = useState('s')

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  let parsedMs = null
  let parseError = null
  if (tsInput.trim() !== '') {
    const n = Number(tsInput.trim())
    if (Number.isFinite(n)) {
      parsedMs = unit === 's' ? n * 1000 : n
    } else {
      parseError = '不是合法的数字'
    }
  }
  const parsedDate = parsedMs != null && !parseError ? new Date(parsedMs) : null

  let dateMs = null
  let dateError = null
  if (dateInput.trim() !== '') {
    const d = new Date(dateInput.replace(' ', 'T'))
    if (Number.isNaN(d.getTime())) {
      dateError = '无法识别的日期格式'
    } else {
      dateMs = d.getTime()
    }
  }

  const fillNow = () => {
    setTsInput(unit === 's' ? String(Math.floor(Date.now() / 1000)) : String(Date.now()))
    setDateInput(toLocalString(new Date()))
  }

  return (
    <div className="container pb-12 animate-fade-in">
      <ToolHero
        emoji="⏱️"
        tag="时间工具"
        title="时间戳转换"
        desc="Unix 时间戳与日期时间双向转换，支持秒 / 毫秒，本地时区与 UTC 同时显示。"
      />

      <div className="card mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm text-text-secondary">当前时间</div>
            <div className="font-mono text-lg text-text-color">{toLocalString(new Date(now))}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-text-secondary">时间戳 (秒 / 毫秒)</div>
            <div className="font-mono text-lg text-primary">
              {Math.floor(now / 1000)} <span className="text-text-secondary">/</span> {now}
            </div>
          </div>
          <button
            onClick={fillNow}
            className="px-4 py-2 rounded-full bg-primary text-white text-sm font-bold hover:bg-primary-hover"
          >
            填入当前时间
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="font-bold text-primary mb-3">时间戳 → 日期</h3>
          <div className="flex gap-2 mb-3">
            <input
              value={tsInput}
              onChange={(e) => setTsInput(e.target.value)}
              placeholder="例如 1700000000"
              className="flex-1 px-3 py-2 rounded-xl border-2 border-[var(--border-color)] bg-white focus:outline-none focus:border-primary font-mono"
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="px-3 py-2 rounded-xl border-2 border-[var(--border-color)] bg-white"
            >
              <option value="s">秒</option>
              <option value="ms">毫秒</option>
            </select>
          </div>

          {parseError ? (
            <div className="text-red-600 text-sm">{parseError}</div>
          ) : parsedDate ? (
            <ResultRows rows={[
              ['本地时间', toLocalString(parsedDate)],
              ['UTC 时间', toUtcString(parsedDate)],
              ['ISO 8601', parsedDate.toISOString()],
              ['距现在', relative(parsedDate.getTime())],
            ]} />
          ) : (
            <div className="text-text-secondary text-sm">输入一个时间戳查看结果</div>
          )}
        </div>

        <div className="card">
          <h3 className="font-bold text-primary mb-3">日期 → 时间戳</h3>
          <input
            type="text"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            placeholder="2025-01-01 12:00:00"
            className="w-full px-3 py-2 mb-3 rounded-xl border-2 border-[var(--border-color)] bg-white focus:outline-none focus:border-primary font-mono"
          />

          {dateError ? (
            <div className="text-red-600 text-sm">{dateError}</div>
          ) : dateMs != null ? (
            <ResultRows rows={[
              ['秒', String(Math.floor(dateMs / 1000))],
              ['毫秒', String(dateMs)],
              ['ISO 8601', new Date(dateMs).toISOString()],
              ['距现在', relative(dateMs)],
            ]} />
          ) : (
            <div className="text-text-secondary text-sm">输入一个日期查看时间戳</div>
          )}
        </div>
      </div>
    </div>
  )
}

function ResultRows({ rows }) {
  return (
    <div className="rounded-xl bg-white/60 border border-[var(--border-color)] divide-y divide-[var(--border-color)]">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
          <span className="text-text-secondary">{label}</span>
          <button
            onClick={() => navigator.clipboard.writeText(value)}
            title="点击复制"
            className="font-mono text-text-color hover:text-primary text-right truncate"
          >
            {value}
          </button>
        </div>
      ))}
    </div>
  )
}

export default TimestampConverter
