import { memo } from 'react'

const TICKER_ITEMS = [
  ['🐱 最近在写 ', 'Java 25'],
  ['最近常打的标签：', '虚拟线程'],
  ['想到再写，', '更得很慢'],
  ['写完隔阵子会回头改', ''],
  ['主要是写给自己看的笔记', ''],
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
