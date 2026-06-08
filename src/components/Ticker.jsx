import { memo } from 'react'

const TICKER_ITEMS = [
  ['🐱 最近在写 ', 'Java 25'],
  ['🔥 标签 · ', '虚拟线程'],
  ['✍️ 慢更，', '一周一两篇'],
  ['🐾 写完会回头改', ''],
  ['☕ 来杯咖啡再读', ''],
]

function TickerRun() {
  return (
    <>
      {TICKER_ITEMS.map((it, i) => (
        <span key={i}>
          {it[0]}
          {it[1] && <b>{it[1]}</b>}
        </span>
      ))}
    </>
  )
}

function Ticker() {
  return (
    <div className="ticker" aria-hidden="true">
      <div className="run">
        <TickerRun />
        <TickerRun />
      </div>
    </div>
  )
}

export default memo(Ticker)
