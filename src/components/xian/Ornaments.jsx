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
