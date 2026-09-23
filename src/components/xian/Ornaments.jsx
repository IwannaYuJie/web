import { useId } from 'react'
import './xian.css'

/** 水墨远山：三层山峦，由浓到淡，山脚没入云雾 */
export function Mountains({ className = '', pavilion = false }) {
  const uid = useId().replace(/:/g, '')
  const layers = [
    {
      key: 'far',
      d: 'M0 400L0 240C40 230 70 170 100 150C125 135 140 190 170 200C200 210 215 120 250 90C275 70 290 150 320 175C350 200 380 160 420 150C470 138 490 200 540 205C590 210 610 110 650 80C680 58 700 130 730 160C760 190 800 170 840 165C900 158 920 60 960 40C990 26 1010 110 1040 150C1070 190 1110 180 1150 170C1200 158 1220 100 1260 95C1300 90 1320 170 1360 185C1400 200 1420 180 1440 175L1440 400Z',
    },
    {
      key: 'mid',
      d: 'M0 400L0 280C60 270 90 230 130 215C170 200 190 250 230 262C270 274 300 205 345 190C380 178 400 240 440 255C490 272 520 250 560 240C610 228 640 185 690 180C730 176 750 235 790 250C840 268 880 230 920 215C960 200 990 245 1030 258C1080 272 1110 205 1160 195C1200 187 1230 245 1270 256C1320 270 1370 240 1440 230L1440 400Z',
    },
    {
      key: 'near',
      d: 'M0 400L0 330C80 315 140 300 200 310C260 320 300 290 360 292C430 295 470 330 540 326C610 322 650 290 720 295C790 300 830 335 900 330C980 324 1020 296 1090 300C1160 304 1200 330 1270 326C1340 322 1390 305 1440 310L1440 400Z',
    },
  ]

  return (
    <svg className={`xian-mountains ${className}`} viewBox="0 0 1440 400" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        {layers.map(l => (
          <linearGradient key={l.key} id={`${uid}-${l.key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className={`stop-${l.key}`} stopOpacity="1" />
            <stop offset="0.55" className={`stop-${l.key}`} stopOpacity="0.55" />
            <stop offset="1" className={`stop-${l.key}`} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {layers.map(l => (
        <path key={l.key} className={`m-${l.key}`} d={l.d} fill={`url(#${uid}-${l.key})`} />
      ))}
      {pavilion && (
        <g className="m-pavilion">
          <path d="M944 43Q960 30 976 43Q968 40 960 40Q952 40 944 43Z" />
          <rect x="948" y="42" width="1.6" height="8" />
          <rect x="970.4" y="42" width="1.6" height="8" />
          <rect x="959.2" y="33" width="1.6" height="4" />
        </g>
      )}
    </svg>
  )
}

/** 祥云纹 */
export function Cloud({ className = '', size = 72 }) {
  return (
    <svg className={`xian-cloud ${className}`} width={size} height={size * 0.4} viewBox="0 0 120 48" fill="none" aria-hidden="true">
      <path d="M8 40H112" />
      <path d="M20 40C8 40 6 26 16 24C24 22 28 30 22 33C18 35 15 31 18 29" />
      <path d="M34 40C26 30 34 14 50 18C54 6 76 4 82 18C94 14 104 26 96 34C92 38 86 36 86 32C86 28 91 28 92 31" />
      <path d="M58 30C52 30 51 22 57 21C62 20 64 26 60 27" />
      <path d="M100 40C110 40 114 30 108 27C103 25 100 30 103 32" />
    </svg>
  )
}

/** 远处飞鸟 */
export function Birds({ className = '' }) {
  return (
    <svg className={`xian-birds ${className}`} viewBox="0 0 120 50" fill="none" aria-hidden="true">
      <path d="M10 22q6-7 12 0q6-7 12 0" />
      <path d="M48 10q4-5 8 0q4-5 8 0" />
      <path d="M70 32q3-4 6 0q3-4 6 0" />
    </svg>
  )
}

/** 朱砂印：两字竖排或四字成方 */
export function Seal({ text = '橘猫', size = 44, className = '' }) {
  const chars = [...text]
  const grid = chars.length === 4
  return (
    <span
      className={`xian-seal ${grid ? 'grid4' : ''} ${className}`}
      style={{ '--seal': `${size}px` }}
      aria-hidden="true"
    >
      {/* 印文自右列起、自上而下读，网格按行排布，所以要换位 */}
      {grid ? [chars[2], chars[0], chars[3], chars[1]].map((c, i) => <i key={i}>{c}</i>) : chars.map((c, i) => <i key={i}>{c}</i>)}
    </span>
  )
}

/** 一轮明月 / 晨日 */
export function Moon({ className = '' }) {
  return <span className={`xian-moon ${className}`} aria-hidden="true" />
}

/** 祥云分隔线 */
export function CloudDivider({ className = '' }) {
  return (
    <div className={`xian-divider ${className}`} aria-hidden="true">
      <span className="line" />
      <Cloud size={64} />
      <span className="line r" />
    </div>
  )
}

// 梅枝主干：折线走势（梅枝多"折角"），粗细逐段收细
const PLUM_TRUNK = [
  [-10, 14], [40, 30], [78, 40], [112, 64], [160, 86], [206, 104],
  [252, 124], [296, 140], [334, 160], [372, 184], [404, 208], [430, 232],
]
const PLUM_TWIGS = [
  ['M112 64L126 44L150 34L192 20', 3.2],
  ['M252 124L266 104L290 92L338 82', 3],
  ['M334 160L360 150L386 146L418 122', 2.4],
  ['M206 104L212 130L208 156L194 196', 2.8],
  ['M372 184L388 198L400 214', 1.8],
  ['M78 40L70 22L76 4', 2.2],
  ['M296 140L302 166L322 182', 1.8],
  ['M160 86L176 66L178 48', 1.8],
]
// 梅花：[x, y, 缩放, 旋转]
const PLUM_BLOSSOMS = [
  [192, 20, 1.5, 10], [150, 36, 1.2, 40], [176, 50, 1.1, -20], [126, 46, 1.3, 70],
  [236, 112, 1.55, -12], [290, 92, 1.3, 25], [338, 82, 1.5, 5], [312, 104, 1.05, 55],
  [386, 146, 1.35, 50], [418, 122, 1.2, -8], [208, 150, 1.25, -30], [194, 196, 1.3, 15],
  [430, 232, 1.35, 30], [322, 182, 1.1, 60], [76, 6, 1.2, 0], [60, 34, 0.95, 35],
]
const PLUM_BUDS = [[102, 56], [270, 132], [352, 174], [220, 176], [398, 212], [166, 90], [40, 26]]

function Blossom({ x, y, s, r }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} className="plum-blossom">
      {[0, 72, 144, 216, 288].map(a => (
        <ellipse key={a} cx="0" cy="-5.6" rx="5" ry="5.8" transform={`rotate(${a})`} className="petal" />
      ))}
      <circle r="2.2" className="heart" />
      {[20, 95, 170, 245, 320].map(a => (
        <line key={a} x1="0" y1="0" x2="0" y2="-5.2" transform={`rotate(${a})`} className="stamen" />
      ))}
    </g>
  )
}

/** 墨梅一枝：折角枯枝带飞白，红梅开得正盛，随风轻摆 */
export function PlumBranch({ className = '' }) {
  const uid = useId().replace(/:/g, '')
  const segments = PLUM_TRUNK.slice(1).map((pt, i) => {
    const prev = PLUM_TRUNK[i]
    return { d: `M${prev[0]} ${prev[1]}L${pt[0]} ${pt[1]}`, w: 13 - i * 1.05 }
  })
  const trunkPath = `M${PLUM_TRUNK.map(p => p.join(' ')).join('L')}`
  return (
    <svg className={`xian-plum ${className}`} viewBox="-12 -8 470 260" fill="none" aria-hidden="true">
      <defs>
        {/* 枯笔的毛边 */}
        <filter id={`${uid}-dry`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="3" />
        </filter>
      </defs>
      <g className="plum-sway">
        <g className="plum-wood" filter={`url(#${uid}-dry)`}>
          {segments.map((seg, i) => <path key={i} d={seg.d} strokeWidth={seg.w} />)}
          {PLUM_TWIGS.map(([d, w]) => <path key={d} d={d} strokeWidth={w} />)}
          {/* 飞白：主干上断续的浅色笔痕 */}
          <path className="plum-flywhite" d={trunkPath} strokeDasharray="18 7 4 12 26 6 9 14" />
          <circle className="plum-knot" cx="112" cy="64" r="4.5" />
          <circle className="plum-knot" cx="252" cy="124" r="3.4" />
        </g>
        <g className="plum-flowers">
          {PLUM_BLOSSOMS.map(([x, y, sc, r], i) => <Blossom key={i} x={x} y={y} s={sc} r={r} />)}
          {PLUM_BUDS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.6" className="bud" />)}
        </g>
      </g>
    </svg>
  )
}

/** 丹顶鹤：修长白身、黑色飞羽、头顶一点朱红，双翅缓缓扇动 */
export function Crane({ className = '', style }) {
  return (
    <svg className={`xian-crane ${className}`} style={style} viewBox="20 0 180 90" aria-hidden="true">
      <g className="wing far">
        <path className="feather" d="M92 57C86 40 76 22 52 6C60 20 62 30 60 42C70 44 82 50 92 57Z" />
        <path className="tip" d="M52 6L58 14L55 16L61 22L58 24L63 31C60 22 57 14 52 6Z" />
      </g>
      <path className="leg" d="M76 64L32 70M76 66L30 76M32 70L28 68M30 76L26 75" />
      <path className="tail" d="M76 60C66 58 58 62 53 68C61 68 69 67 78 65Z" />
      <path className="body" d="M70 62C80 53 104 51 121 55C113 62 96 68 78 67C74 66 71 64 70 62Z" />
      <path className="neck" d="M118 56C132 50 148 45 166 42" />
      <circle className="head" cx="169" cy="41.5" r="4.2" />
      <path className="beak" d="M172.5 41L192 44L172.5 43.4Z" />
      <circle className="crown" cx="167.6" cy="38.8" r="2" />
      <g className="wing near">
        <path className="feather" d="M100 58C106 34 122 16 156 4C150 12 146 16 142 22L146 22L138 30L142 30L132 38C124 46 112 54 100 58Z" />
        <path className="tip" d="M156 4C150 12 146 16 142 22L146 22L138 30L142 30L132 38C138 28 146 16 156 4Z" />
      </g>
    </svg>
  )
}

// 花瓣：[left%, 延迟s, 周期s, 大小px, 横向飘移vw]
const PETALS = [
  [8, 0, 16, 11, 14], [18, 5, 19, 9, 10], [27, 11, 17, 12, 18], [36, 2, 21, 8, 8],
  [12, 8, 18, 10, 20], [22, 14, 20, 9, 12], [4, 17, 15, 12, 16], [31, 20, 22, 8, 22],
]

/** 落梅：花瓣从梅枝下斜斜飘落 */
export function Petals({ className = '', count = PETALS.length }) {
  return (
    <div className={`xian-petals ${className}`} aria-hidden="true">
      {PETALS.slice(0, count).map(([left, delay, dur, size, drift], i) => (
        <span
          key={i}
          style={{
            left: `${left}%`,
            width: size,
            height: size * 0.8,
            animationDelay: `-${delay}s`,
            animationDuration: `${dur}s`,
            '--drift': `${drift}vw`,
          }}
        />
      ))}
    </div>
  )
}
