import { memo } from 'react'
import './xian.css'

// 固定的灵光位置，避免每次渲染随机跳动：[left%, 大小px, 周期s, 延迟s, 横向飘移px]
const MOTES = [
  [6, 3, 22, 0, 30], [14, 2, 28, 6, -24], [23, 4, 25, 12, 18], [31, 2, 31, 3, -30],
  [42, 3, 27, 16, 26], [51, 2, 24, 9, -18], [60, 4, 33, 1, 34], [68, 2, 26, 14, -26],
  [76, 3, 29, 5, 20], [84, 2, 23, 18, -22], [91, 3, 30, 10, 28], [97, 2, 27, 21, -16],
]

/** 全站氛围：两团缓慢漂移的云雾 + 缓缓上升的灵光。纯装饰，不响应鼠标 */
function Atmosphere() {
  return (
    <div className="xian-atmos" aria-hidden="true">
      <div className="mist mist-a" />
      <div className="mist mist-b" />
      <div className="mist mist-c" />
      {MOTES.map(([left, size, dur, delay, drift], i) => (
        <span
          key={i}
          className="mote"
          style={{
            left: `${left}%`,
            width: size,
            height: size,
            animationDuration: `${dur}s`,
            animationDelay: `-${delay}s`,
            '--drift': `${drift}px`,
          }}
        />
      ))}
    </div>
  )
}

export default memo(Atmosphere)
