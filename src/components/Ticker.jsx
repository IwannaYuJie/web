import { memo } from 'react'

const TICKER_ITEMS = [
  ['🐱 新文章 · ', 'Java 25 新特性'],
  ['🔥 热门标签 · ', '虚拟线程'],
  ['☕ 用 🧡 和咖啡制作', ''],
  ['✍️ 偏长文复盘 · ', '先讲结论'],
  ['🐾 踩坑 / 复盘 / ', '取舍'],
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
