import { useState, useEffect, useRef, useCallback } from 'react'
import './SuperCat.css'

/**
 * 超级橘猫 🐱🍄
 *
 * 马里奥风格横版平台跳跃：跑酷、顶问号砖、吃金币、踩毛栗怪、
 * 收集蘑菇/火力花/无敌星三件道具，跨越水管与深坑，摸到终点旗！
 */

const TILE = 32
const VIEW_W = 640
const VIEW_H = 416
const ROWS = 13

const GRAVITY = 0.48
const MOVE_ACCEL = 0.45
const MAX_SPEED = 3.8
const FRICTION = 0.82
const JUMP_FORCE = -11.5 // 满跳约 4.3 格高
const JUMP_CUT = 0.45 // 松开跳跃键时保留的上升速度比例
const COYOTE_FRAMES = 7 // 土狼时间：离开平台后仍可起跳的帧数
const BUFFER_FRAMES = 7 // 跳跃缓冲：落地前按跳也算数
const START_LIVES = 3
const STAR_FRAMES = 480 // 无敌星持续帧数
const SMALL_H = 26
const BIG_H = 34

// ---------- 复古音效（WebAudio 合成，可静音） ----------
let audioCtx = null
let sfxMuted = typeof localStorage !== 'undefined' && localStorage.getItem('super_cat_muted') === '1'

function tone(freq, dur, type = 'square', vol = 0.035, slideTo = 0, delay = 0) {
  if (sfxMuted) {
    return
  }
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)()
    const t0 = audioCtx.currentTime + delay
    const o = audioCtx.createOscillator()
    const g = audioCtx.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, t0)
    if (slideTo) {
      o.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t0 + dur)
    }
    g.gain.setValueAtTime(vol, t0)
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur)
    o.connect(g)
    g.connect(audioCtx.destination)
    o.start(t0)
    o.stop(t0 + dur + 0.02)
  } catch {
    /* 音频不可用时静默 */
  }
}

const sfx = {
  jump: () => tone(330, 0.12, 'square', 0.03, 660),
  coin: () => { tone(988, 0.07); tone(1319, 0.18, 'square', 0.035, 0, 0.07) },
  stomp: () => tone(220, 0.1, 'square', 0.045, 110),
  brick: () => tone(160, 0.1, 'square', 0.05, 80),
  item: () => [262, 330, 392, 523].forEach((f, i) => tone(f, 0.07, 'square', 0.03, 0, i * 0.045)),
  power: () => [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.09, 'square', 0.03, 0, i * 0.06)),
  hurt: () => tone(440, 0.25, 'sawtooth', 0.04, 110),
  die: () => [494, 466, 440, 415, 392, 330, 262].forEach((f, i) => tone(f, 0.09, 'square', 0.035, 0, i * 0.07)),
  win: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.12, 'triangle', 0.045, 0, i * 0.09)),
  shoot: () => tone(880, 0.06, 'square', 0.03, 440),
  kick: () => tone(523, 0.08, 'square', 0.04, 262),
}

// ---------- 关卡 ----------
// # 地面砖  = 红砖(可顶碎)  ? 问号砖(金币)  X 用过的砖
// M/W/* 问号砖（蘑菇/火力花/无敌星）  n 水管口  | 水管身
// o 金币  F 终点旗
function buildLevel() {
  const W = 152
  const rows = Array.from({ length: ROWS }, () => ' '.repeat(W).split(''))

  const put = (r, c, ch) => {
    if (r >= 0 && r < ROWS && c >= 0 && c < W) {
      rows[r][c] = ch
    }
  }
  const fill = (r, c0, c1, ch) => {
    for (let c = c0; c <= c1; c++) {
      put(r, c, ch)
    }
  }

  // 地面（含三个深坑）
  const pits = [[38, 40], [70, 72], [108, 110]]
  const inPit = (c) => pits.some(([a, b]) => c >= a && c <= b)
  for (let c = 0; c < W; c++) {
    if (!inPit(c)) {
      put(11, c, '#')
      put(12, c, '#')
    }
  }

  // 第一段（出生安全区，无怪）：低平台教学
  put(8, 8, 'M') // 第一个蘑菇砖，离地 3 格轻松够到
  fill(8, 13, 17, '=')
  put(8, 14, '?')
  put(8, 16, '?')
  put(4, 15, '?') // 站上砖台后跳起可顶
  fill(5, 13, 17, 'o') // 砖台上方一排金币

  // 水管两根（2 列宽），怪物在两管间巡逻
  fill(9, 23, 24, 'n'); fill(10, 23, 24, '|')
  fill(8, 29, 30, 'n'); fill(9, 29, 30, '|'); fill(10, 29, 30, '|')

  // 跨坑金币弧线
  put(5, 38, 'o'); put(4, 39, 'o'); put(5, 40, 'o')

  // 第二段：砖桥（火力花）+ 阶梯 + 高台金币
  fill(7, 44, 48, '=')
  put(7, 46, 'W')
  fill(10, 56, 58, '#')
  fill(9, 56, 57, '#')
  fill(8, 56, 56, '#')
  fill(6, 62, 67, '=')
  fill(3, 64, 66, 'o')

  // 跨第二坑
  put(5, 70, 'o'); put(4, 71, 'o'); put(5, 72, 'o')

  // 第三段：高低砖阵（备用蘑菇）+ 水管 + 砖桥
  fill(7, 76, 80, '=')
  put(7, 77, 'M')
  put(7, 79, '?')
  fill(9, 86, 87, 'n'); fill(10, 86, 87, '|')
  fill(7, 92, 95, '=')
  fill(4, 93, 94, 'o')

  // 通往第三坑的台阶
  fill(10, 100, 103, '#')
  fill(9, 101, 103, '#')
  fill(8, 102, 103, '#')
  put(5, 108, 'o'); put(4, 109, 'o'); put(5, 110, 'o')

  // 第四段：无敌星冲刺 + 大台阶
  fill(7, 114, 118, '=')
  put(7, 116, '*')
  for (let i = 0; i < 8; i++) {
    for (let h = 0; h <= i; h++) {
      put(10 - h, 128 + i, '#')
    }
  }

  // 终点旗
  put(10, 142, 'F')

  // 怪物：type walker=毛栗怪(可踩)  spiky=刺果怪(不可踩)
  // 出生区(0~22)无怪；巡逻怪遇墙/遇崖折返
  const mk = (c, type = 'walker', topRow = 11) => ({
    x: c * TILE,
    y: topRow * TILE - 24,
    vx: -0.8,
    vy: 0,
    w: 26,
    h: 24,
    type,
    alive: true,
    squash: 0,
    active: false,
  })
  const enemies = [
    mk(27),               // 两根水管之间巡逻
    mk(34),
    mk(51), mk(54),       // 砖桥下双怪
    mk(64, 'walker', 6),  // 高台砖上巡逻
    mk(83, 'spiky'),
    mk(97),
    mk(120, 'spiky'),
    mk(124),
  ]

  return { rows, width: W, enemies }
}

const SOLID = new Set(['#', '=', '?', 'M', 'W', '*', 'X', 'n', '|'])
const ITEM_BLOCK = { M: 'mushroom', W: 'flower', '*': 'star' }

function tileAt(rows, width, px, py) {
  const c = Math.floor(px / TILE)
  const r = Math.floor(py / TILE)
  if (c < 0 || c >= width || r >= ROWS) {
    return '#' // 横向边界视为墙；坠底由掉坑逻辑处理
  }
  if (r < 0) {
    return ' '
  }
  return rows[r][c]
}

// ---------- 绘制函数（纯函数，模块级） ----------
const INK = '#221A10'

function drawTile(ctx, ch, x, y, frame, r, c, rows, width, bumpDy = 0) {
  ctx.lineWidth = 2
  ctx.strokeStyle = INK
  y += bumpDy

  if (ch === '#') {
    ctx.fillStyle = '#C8804A'
    ctx.fillRect(x, y, TILE, TILE)
    ctx.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2)
    ctx.fillStyle = 'rgba(34,26,16,0.18)'
    ctx.fillRect(x + 4, y + 18, 10, 4)
    ctx.fillRect(x + 18, y + 8, 10, 4)
    // 顶面草皮（上方无砖时）
    const above = r > 0 ? rows[r - 1][c] : ' '
    if (!SOLID.has(above)) {
      ctx.fillStyle = '#66BB6A'
      ctx.fillRect(x, y, TILE, 8)
      ctx.strokeRect(x + 1, y + 1, TILE - 2, 8)
    }
  } else if (ch === '=') {
    ctx.fillStyle = '#D35400'
    ctx.fillRect(x, y, TILE, TILE)
    ctx.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2)
    ctx.strokeStyle = 'rgba(34,26,16,0.4)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(x, y + 16); ctx.lineTo(x + TILE, y + 16)
    ctx.moveTo(x + 16, y); ctx.lineTo(x + 16, y + 8)
    ctx.moveTo(x + 8, y + 16); ctx.lineTo(x + 8, y + TILE)
    ctx.moveTo(x + 24, y + 16); ctx.lineTo(x + 24, y + TILE)
    ctx.stroke()
  } else if (ch === '?' || ch === 'M' || ch === 'W' || ch === '*') {
    // 道具砖外观与问号砖一致，保留开箱惊喜
    const bounce = Math.sin(frame * 0.1) * 1.5
    ctx.fillStyle = '#FFB703'
    ctx.fillRect(x, y + bounce, TILE, TILE)
    ctx.strokeRect(x + 1, y + 1 + bounce, TILE - 2, TILE - 2)
    ctx.fillStyle = INK
    ctx.font = 'bold 19px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('?', x + TILE / 2, y + TILE / 2 + 1 + bounce)
  } else if (ch === 'X') {
    ctx.fillStyle = '#9E8B6E'
    ctx.fillRect(x, y, TILE, TILE)
    ctx.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2)
    ctx.fillStyle = 'rgba(34,26,16,0.35)'
    ctx.beginPath()
    ctx.arc(x + TILE / 2, y + TILE / 2, 4, 0, Math.PI * 2)
    ctx.fill()
  } else if (ch === 'n' || ch === '|') {
    const isLeft = c + 1 < width && (rows[r][c + 1] === 'n' || rows[r][c + 1] === '|')
    ctx.fillStyle = '#43A047'
    if (ch === 'n') {
      const lipL = isLeft ? x - 3 : x - 1
      ctx.fillRect(lipL, y, TILE + 4, 12)
      ctx.strokeRect(lipL + 1, y + 1, TILE + 2, 11)
      ctx.fillRect(x, y + 12, TILE, TILE - 12)
      ctx.strokeRect(x + 1, y + 12, TILE - 2, TILE - 13)
    } else {
      ctx.fillRect(x, y, TILE, TILE)
      ctx.strokeRect(x + 1, y, TILE - 2, TILE)
    }
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.fillRect(x + 4, y + (ch === 'n' ? 14 : 2), 5, TILE - 16)
  } else if (ch === 'o') {
    drawCoin(ctx, x + TILE / 2, y + TILE / 2, frame, 1)
  } else if (ch === 'F') {
    // 旗杆从地面拔高 8 格
    const poleTop = y - 8 * TILE
    ctx.fillStyle = '#9E9E9E'
    ctx.fillRect(x + TILE / 2 - 3, poleTop, 6, 9 * TILE)
    ctx.strokeRect(x + TILE / 2 - 3, poleTop, 6, 9 * TILE)
    ctx.fillStyle = '#FFB703'
    ctx.beginPath()
    ctx.arc(x + TILE / 2, poleTop, 7, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    const wave = Math.sin(frame * 0.08) * 4
    ctx.fillStyle = '#F2570A'
    ctx.beginPath()
    ctx.moveTo(x + TILE / 2 + 3, poleTop + 10)
    ctx.lineTo(x + TILE / 2 + 46 + wave, poleTop + 24)
    ctx.lineTo(x + TILE / 2 + 3, poleTop + 38)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#FFF'
    ctx.beginPath()
    ctx.arc(x + TILE / 2 + 18, poleTop + 24, 4, 0, Math.PI * 2)
    ctx.arc(x + TILE / 2 + 13, poleTop + 18, 2, 0, Math.PI * 2)
    ctx.arc(x + TILE / 2 + 23, poleTop + 18, 2, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawCoin(ctx, x, y, frame, alpha) {
  const squeeze = Math.abs(Math.sin(frame * 0.08)) * 0.6 + 0.4
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(x, y)
  ctx.scale(squeeze, 1)
  ctx.fillStyle = '#FFC107'
  ctx.strokeStyle = INK
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(0, 0, 10, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#FFE082'
  ctx.beginPath()
  ctx.arc(0, 0, 5.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawEnemy(ctx, e, cam, frame) {
  const x = e.x - cam
  const squashT = e.squash > 0 ? 1 - e.squash / 18 : 0
  const h = e.squash > 0 ? e.h * (1 - squashT * 0.6) : e.h
  const y = e.y + (e.h - h)
  ctx.save()
  ctx.translate(x + e.w / 2, y + h / 2)

  const body = e.type === 'spiky' ? '#B0413E' : '#8D5524'

  if (e.type === 'spiky' && e.squash === 0) {
    // 一圈尖刺
    ctx.fillStyle = '#7A2E2B'
    ctx.strokeStyle = INK
    ctx.lineWidth = 1.5
    for (let i = 0; i < 7; i++) {
      const a = Math.PI + (i / 6) * Math.PI
      const sx = Math.cos(a) * (e.w / 2 - 1)
      const sy = Math.sin(a) * (h / 2 - 1)
      ctx.beginPath()
      ctx.moveTo(sx * 0.7, sy * 0.7)
      ctx.lineTo(sx * 1.45, sy * 1.45)
      ctx.lineTo(sx * 0.95 + 3, sy * 0.95)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }
  }

  ctx.fillStyle = body
  ctx.strokeStyle = INK
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.ellipse(0, 0, e.w / 2, h / 2, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  if (e.squash === 0) {
    const step = Math.sin(frame * 0.25) * 3
    ctx.fillStyle = '#5D4037'
    ctx.beginPath()
    ctx.ellipse(-7 + step, h / 2 - 1, 5, 3.5, 0, 0, Math.PI * 2)
    ctx.ellipse(7 - step, h / 2 - 1, 5, 3.5, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#FFF'
    ctx.beginPath()
    ctx.arc(-5, -3, 3.5, 0, Math.PI * 2)
    ctx.arc(5, -3, 3.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = INK
    ctx.beginPath()
    ctx.arc(-4, -2.5, 1.6, 0, Math.PI * 2)
    ctx.arc(6, -2.5, 1.6, 0, Math.PI * 2)
    ctx.fill()
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(-9, -8); ctx.lineTo(-2, -5)
    ctx.moveTo(9, -8); ctx.lineTo(2, -5)
    ctx.stroke()
  } else {
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(-7, -2); ctx.lineTo(-2, 1)
    ctx.moveTo(-2, -2); ctx.lineTo(-7, 1)
    ctx.moveTo(7, -2); ctx.lineTo(2, 1)
    ctx.moveTo(2, -2); ctx.lineTo(7, 1)
    ctx.stroke()
  }
  ctx.restore()
}

const STAR_PALETTE = ['#F2570A', '#FFB703', '#43A047', '#3B82F6', '#9C27B0', '#E91E63']

function drawItem(ctx, item, cam, frame) {
  const x = item.x - cam + item.w / 2
  const y = item.y + item.h / 2
  ctx.save()
  ctx.translate(x, y)
  ctx.strokeStyle = INK
  ctx.lineWidth = 2

  if (item.type === 'mushroom') {
    // 菌柄
    ctx.fillStyle = '#FFE9C7'
    ctx.fillRect(-7, 0, 14, 11)
    ctx.strokeRect(-7, 0, 14, 11)
    // 菌盖
    ctx.fillStyle = '#E53935'
    ctx.beginPath()
    ctx.arc(0, 0, 12, Math.PI, 0)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#FFF'
    ctx.beginPath()
    ctx.arc(-6, -5, 3, 0, Math.PI * 2)
    ctx.arc(5, -6, 3.5, 0, Math.PI * 2)
    ctx.fill()
    // 眼睛
    ctx.fillStyle = INK
    ctx.beginPath()
    ctx.arc(-3, 5, 1.4, 0, Math.PI * 2)
    ctx.arc(3, 5, 1.4, 0, Math.PI * 2)
    ctx.fill()
  } else if (item.type === 'flower') {
    const sway = Math.sin(frame * 0.08) * 2
    // 花茎
    ctx.strokeStyle = '#43A047'
    ctx.lineWidth = 3.5
    ctx.beginPath()
    ctx.moveTo(0, 12)
    ctx.quadraticCurveTo(sway, 4, sway, -2)
    ctx.stroke()
    // 花瓣一圈
    ctx.strokeStyle = INK
    ctx.lineWidth = 1.5
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + frame * 0.02
      ctx.fillStyle = i % 2 === 0 ? '#F2570A' : '#FFB703'
      ctx.beginPath()
      ctx.ellipse(sway + Math.cos(a) * 7, -6 + Math.sin(a) * 7, 4.5, 4.5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }
    // 花芯
    ctx.fillStyle = '#FFF3D6'
    ctx.beginPath()
    ctx.arc(sway, -6, 4.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = INK
    ctx.beginPath()
    ctx.arc(sway - 1.5, -6.5, 1, 0, Math.PI * 2)
    ctx.arc(sway + 1.5, -6.5, 1, 0, Math.PI * 2)
    ctx.fill()
  } else if (item.type === 'star') {
    const rot = Math.sin(frame * 0.15) * 0.2
    ctx.rotate(rot)
    ctx.fillStyle = STAR_PALETTE[Math.floor(frame / 4) % STAR_PALETTE.length]
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 === 0 ? 13 : 5.5
      const a = -Math.PI / 2 + (i / 10) * Math.PI * 2
      const px = Math.cos(a) * rr
      const py = Math.sin(a) * rr
      if (i === 0) {
        ctx.moveTo(px, py)
      } else {
        ctx.lineTo(px, py)
      }
    }
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = INK
    ctx.beginPath()
    ctx.arc(-3, -1, 1.3, 0, Math.PI * 2)
    ctx.arc(3, -1, 1.3, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawFireball(ctx, fb, cam, frame) {
  const x = fb.x - cam
  ctx.save()
  ctx.translate(x, fb.y)
  ctx.rotate(frame * 0.3)
  ctx.fillStyle = '#FF7043'
  ctx.strokeStyle = INK
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(0, 0, 7, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#FFD54F'
  ctx.beginPath()
  ctx.arc(0, 0, 3.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawPlayer(ctx, p, cam, frame) {
  const big = p.power !== 'small'
  const scale = big ? 1.22 : 1
  const x = p.x - cam + p.w / 2
  const y = p.y + p.h - 14 * scale // 以脚底为基准摆放
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(p.facing * scale, scale)
  if (p.dying) {
    ctx.rotate(Math.PI)
  }

  const running = p.onGround && Math.abs(p.vx) > 0.3
  const legSwing = running ? Math.sin(p.runFrame * 4) * 4 : 0
  const inAir = !p.onGround && !p.dying

  // 无敌星彩虹皮肤
  const starIdx = p.star > 0 ? Math.floor(frame / 3) % STAR_PALETTE.length : -1
  const furColor = starIdx >= 0 ? STAR_PALETTE[starIdx] : '#FF9800'
  const capColor = starIdx >= 0
    ? STAR_PALETTE[(starIdx + 2) % STAR_PALETTE.length]
    : (p.power === 'fire' ? '#FFF8F0' : '#E53935')

  // 尾巴
  ctx.strokeStyle = furColor
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-10, 4)
  ctx.quadraticCurveTo(-19, inAir ? 8 : -2, -17, inAir ? 12 : -9)
  ctx.stroke()
  ctx.strokeStyle = INK
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(-10, 4)
  ctx.quadraticCurveTo(-19, inAir ? 8 : -2, -17, inAir ? 12 : -9)
  ctx.stroke()

  // 腿
  ctx.fillStyle = '#E65100'
  ctx.beginPath()
  ctx.ellipse(-5 + legSwing, 12, 4, 5, 0, 0, Math.PI * 2)
  ctx.ellipse(5 - legSwing, 12, 4, 5, 0, 0, Math.PI * 2)
  ctx.fill()

  // 身体
  ctx.fillStyle = furColor
  ctx.strokeStyle = INK
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.ellipse(0, 2, 12, 11, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#FFF8F0'
  ctx.beginPath()
  ctx.ellipse(2, 5, 7, 6, 0, 0, Math.PI * 2)
  ctx.fill()

  // 头
  ctx.fillStyle = furColor
  ctx.beginPath()
  ctx.arc(3, -8, 9, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // 耳朵
  ctx.beginPath()
  ctx.moveTo(-4, -13); ctx.lineTo(-1, -20); ctx.lineTo(2, -14)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(6, -15); ctx.lineTo(10, -20); ctx.lineTo(11, -13)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#FFCDD2'
  ctx.beginPath()
  ctx.moveTo(-2.5, -14.5); ctx.lineTo(-1, -18); ctx.lineTo(0.5, -14.5)
  ctx.closePath()
  ctx.fill()

  // 小帽（火力形态变白帽红檐）
  ctx.fillStyle = capColor
  ctx.beginPath()
  ctx.arc(3, -13, 7.5, Math.PI, 0)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = p.power === 'fire' && starIdx < 0 ? '#E53935' : capColor
  ctx.fillRect(3, -14.5, 11, 3.5)
  ctx.strokeRect(3, -14.5, 11, 3.5)

  // 脸
  if (p.dying) {
    ctx.strokeStyle = INK
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(3, -9); ctx.lineTo(6, -6)
    ctx.moveTo(6, -9); ctx.lineTo(3, -6)
    ctx.moveTo(9, -9); ctx.lineTo(12, -6)
    ctx.moveTo(12, -9); ctx.lineTo(9, -6)
    ctx.stroke()
  } else {
    ctx.fillStyle = INK
    ctx.beginPath()
    ctx.arc(5, -8, 1.6, 0, Math.PI * 2)
    ctx.arc(10.5, -8, 1.6, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#FF8A80'
    ctx.beginPath()
    ctx.moveTo(7, -5); ctx.lineTo(9, -5); ctx.lineTo(8, -3.8)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = 'rgba(255,107,107,0.4)'
    ctx.beginPath()
    ctx.arc(2, -4, 2, 0, Math.PI * 2)
    ctx.arc(12, -4, 2, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

const POWER_ICON = { small: '🐱', big: '🍄', fire: '🔥' }

const SuperCat = ({ onExit }) => {
  const [phase, setPhase] = useState('start') // start | playing | over | win
  const [runId, setRunId] = useState(0) // 自增以强制重启游戏循环（进行中按重来）
  const [score, setScore] = useState(0)
  const [coins, setCoins] = useState(0)
  const [lives, setLives] = useState(START_LIVES)
  const [powerUi, setPowerUi] = useState('small')
  const [starSec, setStarSec] = useState(0)
  const [muted, setMuted] = useState(sfxMuted)
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('super_cat_best') || '0', 10)
  })

  const canvasRef = useRef(null)
  const timerRef = useRef(null)
  const keysRef = useRef({ left: false, right: false, jump: false, jumpHeld: false, fire: false })
  const stateRef = useRef(null)

  const toggleMute = () => {
    sfxMuted = !sfxMuted
    localStorage.setItem('super_cat_muted', sfxMuted ? '1' : '0')
    setMuted(sfxMuted)
  }

  const saveBest = useCallback((finalScore) => {
    const best = Math.max(finalScore, parseInt(localStorage.getItem('super_cat_best') || '0', 10))
    localStorage.setItem('super_cat_best', String(best))
    setBestScore(best)
  }, [])

  const startGame = useCallback(() => {
    const level = buildLevel()
    stateRef.current = {
      level,
      player: {
        x: 3 * TILE,
        y: 11 * TILE - SMALL_H,
        vx: 0,
        vy: 0,
        w: 24,
        h: SMALL_H,
        onGround: false,
        facing: 1,
        runFrame: 0,
        dying: false,
        invincible: 0,
        power: 'small',
        star: 0,
        coyote: 0,
        jumpBuffer: 0,
        shootCd: 0,
      },
      camera: 0,
      score: 0,
      coins: 0,
      lives: START_LIVES,
      frameCount: 0,
      particles: [],
      popCoins: [],
      pops: [],
      items: [],
      fireballs: [],
      bumps: [],
      finished: false,
    }
    setScore(0)
    setCoins(0)
    setLives(START_LIVES)
    setPowerUi('small')
    setStarSec(0)
    setPhase('playing')
    setRunId((id) => id + 1)
  }, [])

  // ---------- 输入 ----------
  useEffect(() => {
    const setKey = (e, down) => {
      const k = e.key
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') {
        keysRef.current.left = down
      } else if (k === 'ArrowRight' || k === 'd' || k === 'D') {
        keysRef.current.right = down
      } else if (k === ' ' || k === 'ArrowUp' || k === 'w' || k === 'W') {
        if (down && !keysRef.current.jumpHeld) {
          keysRef.current.jump = true
        }
        keysRef.current.jumpHeld = down
      } else if (k === 'j' || k === 'J' || k === 'x' || k === 'X') {
        keysRef.current.fire = down
      } else {
        return
      }
      e.preventDefault()
    }
    const onDown = (e) => {
      if (phase !== 'playing') {
        if ((e.key === ' ' || e.key === 'Enter') && (phase === 'start' || phase === 'over' || phase === 'win')) {
          e.preventDefault()
          startGame()
        }
        return
      }
      setKey(e, true)
    }
    const onUp = (e) => setKey(e, false)
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [phase, startGame])

  // 移动端虚拟按键
  const press = (name, down) => (e) => {
    e.preventDefault()
    if (name === 'jump') {
      if (down && !keysRef.current.jumpHeld) {
        keysRef.current.jump = true
      }
      keysRef.current.jumpHeld = down
    } else {
      keysRef.current[name] = down
    }
  }

  // ---------- 游戏内事件 ----------
  const addPop = (state, x, y, text, color = '#FFF') => {
    state.pops.push({ x, y, text, color, life: 44 })
  }

  const addScore = (state, n, x, y) => {
    state.score += n
    setScore(state.score)
    if (x !== undefined) {
      addPop(state, x, y, `+${n}`)
    }
  }

  const spawnParticles = (state, x, y, color, count = 6) => {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2
      const spd = Math.random() * 2.5 + 1.5
      state.particles.push({
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 2,
        color,
        size: Math.random() * 4 + 3,
        life: 32,
        alpha: 1,
      })
    }
  }

  const addCoin = (state, x, y) => {
    state.coins += 1
    setCoins(state.coins)
    addScore(state, 100, x, y - 10)
    state.popCoins.push({ x, y, vy: -5, life: 32 })
    sfx.coin()
  }

  const setPower = useCallback((state, power) => {
    const p = state.player
    const wasBig = p.power !== 'small'
    const willBig = power !== 'small'
    if (wasBig !== willBig) {
      // 以脚底为锚改变碰撞盒
      const newH = willBig ? BIG_H : SMALL_H
      p.y += p.h - newH
      p.h = newH
    }
    p.power = power
    setPowerUi(power)
  }, [])

  // 受伤：火力→大→小→死
  const hurtPlayer = useCallback((state) => {
    const p = state.player
    if (p.dying || p.invincible > 0 || p.star > 0 || state.finished) {
      return
    }
    if (p.power !== 'small') {
      setPower(state, p.power === 'fire' ? 'big' : 'small')
      p.invincible = 110
      sfx.hurt()
      return
    }
    p.dying = true
    p.vy = -9
    p.vx = 0
    state.lives -= 1
    setLives(state.lives)
    sfx.die()
  }, [setPower])

  // 顶砖：弹起动画 + 内容物
  const bumpBlock = useCallback((state, r, c, ch) => {
    const { rows } = state.level
    state.bumps.push({ r, c, t: 0 })
    const bx = c * TILE
    const by = r * TILE

    if (ch === '?') {
      rows[r][c] = 'X'
      addCoin(state, bx + TILE / 2, by - 6)
    } else if (ITEM_BLOCK[ch]) {
      rows[r][c] = 'X'
      const type = ITEM_BLOCK[ch]
      state.items.push({
        type,
        x: bx + 3,
        y: by - 26, // 从砖内升起
        w: 26,
        h: 26,
        vx: type === 'star' ? 1.6 : 1.1,
        vy: 0,
        emerging: 52,
        blockX: bx,
        blockY: by,
      })
      sfx.item()
    } else if (ch === '=') {
      const p = state.player
      if (p.power !== 'small') {
        // 大猫顶碎红砖
        rows[r][c] = ' '
        addScore(state, 50, bx + TILE / 2, by)
        spawnParticles(state, bx + TILE / 2, by + TILE / 2, '#C0392B', 8)
        sfx.brick()
      } else {
        sfx.stomp()
      }
    }
  }, [hurtPlayer]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- 主循环 ----------
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current
    const state = stateRef.current
    if (!canvas || !state) {
      return
    }
    const ctx = canvas.getContext('2d')
    const { rows, width } = state.level
    const p = state.player
    const keys = keysRef.current
    state.frameCount++

    // ----- 玩家物理 -----
    if (p.dying) {
      p.vy += GRAVITY
      p.y += p.vy
      if (p.y > VIEW_H + 80) {
        if (state.lives > 0) {
          Object.assign(p, {
            x: 3 * TILE, y: 11 * TILE - SMALL_H, vx: 0, vy: 0,
            dying: false, invincible: 110, facing: 1, star: 0,
          })
          setPower(state, 'small')
          state.camera = 0
        } else {
          saveBest(state.score)
          setPhase('over')
          return
        }
      }
    } else {
      if (keys.left) {
        p.vx -= MOVE_ACCEL
        p.facing = -1
      }
      if (keys.right) {
        p.vx += MOVE_ACCEL
        p.facing = 1
      }
      if (!keys.left && !keys.right) {
        p.vx *= FRICTION
        if (Math.abs(p.vx) < 0.05) {
          p.vx = 0
        }
      }
      p.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, p.vx))

      // 土狼时间 + 跳跃缓冲
      p.coyote = p.onGround ? COYOTE_FRAMES : Math.max(0, p.coyote - 1)
      if (keys.jump) {
        p.jumpBuffer = BUFFER_FRAMES
        keys.jump = false
      } else if (p.jumpBuffer > 0) {
        p.jumpBuffer--
      }
      if (p.jumpBuffer > 0 && p.coyote > 0) {
        p.vy = JUMP_FORCE
        p.onGround = false
        p.coyote = 0
        p.jumpBuffer = 0
        spawnParticles(state, p.x + p.w / 2, p.y + p.h, '#F6ECD8', 3)
        sfx.jump()
      }
      // 小跳：松开跳跃键提前结束上升
      if (!keys.jumpHeld && p.vy < JUMP_FORCE * JUMP_CUT) {
        p.vy = JUMP_FORCE * JUMP_CUT
      }
      p.vy = Math.min(p.vy + GRAVITY, 12)

      // 发射火球
      if (p.shootCd > 0) {
        p.shootCd--
      }
      if (keys.fire && p.power === 'fire' && p.shootCd === 0 && state.fireballs.length < 2) {
        state.fireballs.push({
          x: p.x + p.w / 2 + p.facing * 14,
          y: p.y + p.h * 0.45,
          vx: p.facing * 6,
          vy: 0,
        })
        p.shootCd = 16
        sfx.shoot()
      }

      // X 轴移动与碰撞
      p.x += p.vx
      if (p.x < state.camera) {
        p.x = state.camera
        p.vx = 0
      }
      const xDir = p.vx > 0 ? 1 : -1
      const xEdge = xDir > 0 ? p.x + p.w : p.x
      for (const py of [p.y + 4, p.y + p.h / 2, p.y + p.h - 4]) {
        if (SOLID.has(tileAt(rows, width, xEdge, py))) {
          p.x = xDir > 0
            ? Math.floor(xEdge / TILE) * TILE - p.w - 0.01
            : (Math.floor(xEdge / TILE) + 1) * TILE + 0.01
          p.vx = 0
          break
        }
      }

      // Y 轴移动与碰撞
      p.y += p.vy
      p.onGround = false
      if (p.vy >= 0) {
        const footY = p.y + p.h
        for (const px of [p.x + 3, p.x + p.w - 3]) {
          if (SOLID.has(tileAt(rows, width, px, footY))) {
            p.y = Math.floor(footY / TILE) * TILE - p.h - 0.01
            p.vy = 0
            p.onGround = true
            break
          }
        }
      } else {
        // 上升：头顶（取离瓦片中心最近的触点，避免擦边误顶）
        const headY = p.y
        let best = null
        for (const px of [p.x + 3, p.x + p.w - 3]) {
          const ch = tileAt(rows, width, px, headY)
          if (SOLID.has(ch)) {
            const c = Math.floor(px / TILE)
            const dist = Math.abs(px - (c * TILE + TILE / 2))
            if (!best || dist < best.dist) {
              best = { c, r: Math.floor(headY / TILE), ch, dist }
            }
          }
        }
        if (best) {
          p.y = (best.r + 1) * TILE + 0.01
          p.vy = 1.5
          bumpBlock(state, best.r, best.c, best.ch)
        }
      }

      // 掉坑
      if (p.y > ROWS * TILE + 40) {
        p.y = VIEW_H - 40
        p.power = 'small' // 掉坑直接损命
        p.invincible = 0
        p.star = 0
        hurtPlayer(state)
      }

      // 吃浮空金币
      const cc = Math.floor((p.x + p.w / 2) / TILE)
      const cr = Math.floor((p.y + p.h / 2) / TILE)
      if (cr >= 0 && cr < ROWS && cc >= 0 && cc < width && rows[cr][cc] === 'o') {
        rows[cr][cc] = ' '
        addCoin(state, cc * TILE + TILE / 2, cr * TILE + TILE / 2)
      }

      // 终点旗
      if (!state.finished && cc >= 0 && cc < width) {
        for (let r = 0; r < ROWS; r++) {
          if (rows[r][cc] === 'F') {
            state.finished = true
            addScore(state, 1000, p.x + p.w / 2, p.y - 10)
            saveBest(state.score)
            sfx.win()
            setTimeout(() => setPhase('win'), 700)
            break
          }
        }
      }

      if (p.invincible > 0) {
        p.invincible--
      }
      if (p.star > 0) {
        p.star--
        const s = Math.ceil(p.star / 60)
        setStarSec((prev) => (prev !== s ? s : prev))
      }
      if (p.onGround && Math.abs(p.vx) > 0.3) {
        p.runFrame += Math.abs(p.vx) * 0.06
      }
    }

    // ----- 道具 -----
    state.items = state.items.filter((it) => {
      if (it.emerging > 0) {
        it.emerging--
        it.y -= 0.5
        return true
      }
      if (it.type !== 'flower') {
        it.vy = Math.min(it.vy + GRAVITY * 0.7, 9)
        it.x += it.vx
        // 撞墙折返
        const front = it.vx < 0 ? it.x : it.x + it.w
        if (SOLID.has(tileAt(rows, width, front, it.y + it.h - 6))) {
          it.vx = -it.vx
        }
        it.y += it.vy
        const footY = it.y + it.h
        for (const px of [it.x + 3, it.x + it.w - 3]) {
          if (SOLID.has(tileAt(rows, width, px, footY))) {
            it.y = Math.floor(footY / TILE) * TILE - it.h - 0.01
            it.vy = it.type === 'star' ? -6 : 0 // 无敌星持续弹跳
            break
          }
        }
        if (it.y > ROWS * TILE + 60) {
          return false
        }
      }
      // 玩家拾取
      if (!p.dying &&
        p.x < it.x + it.w && p.x + p.w > it.x &&
        p.y < it.y + it.h && p.y + p.h > it.y) {
        if (it.type === 'mushroom') {
          if (p.power === 'small') {
            setPower(state, 'big')
            addScore(state, 500, it.x + it.w / 2, it.y)
          } else {
            addScore(state, 1000, it.x + it.w / 2, it.y)
          }
        } else if (it.type === 'flower') {
          if (p.power === 'fire') {
            addScore(state, 1000, it.x + it.w / 2, it.y)
          } else {
            setPower(state, 'fire')
            addScore(state, 800, it.x + it.w / 2, it.y)
          }
        } else if (it.type === 'star') {
          p.star = STAR_FRAMES
          addScore(state, 1000, it.x + it.w / 2, it.y)
        }
        sfx.power()
        spawnParticles(state, it.x + it.w / 2, it.y + it.h / 2, '#FFB703', 10)
        return false
      }
      return true
    })

    // ----- 火球 -----
    state.fireballs = state.fireballs.filter((fb) => {
      fb.vy = Math.min(fb.vy + 0.4, 9)
      fb.x += fb.vx
      // 撞墙消失
      if (SOLID.has(tileAt(rows, width, fb.x + (fb.vx > 0 ? 7 : -7), fb.y))) {
        spawnParticles(state, fb.x, fb.y, '#FF7043', 4)
        return false
      }
      fb.y += fb.vy
      if (SOLID.has(tileAt(rows, width, fb.x, fb.y + 7))) {
        fb.y = Math.floor((fb.y + 7) / TILE) * TILE - 7.01
        fb.vy = -4.5 // 贴地弹跳前进
      }
      if (fb.x < state.camera - 40 || fb.x > state.camera + VIEW_W + 40 || fb.y > ROWS * TILE + 40) {
        return false
      }
      // 命中敌人
      for (const e of state.level.enemies) {
        if (e.alive && e.squash === 0 &&
          fb.x > e.x - 7 && fb.x < e.x + e.w + 7 &&
          fb.y > e.y - 7 && fb.y < e.y + e.h + 7) {
          e.squash = 18
          e.vx = 0
          addScore(state, 200, e.x + e.w / 2, e.y)
          spawnParticles(state, e.x + e.w / 2, e.y + e.h / 2, '#FF7043', 8)
          sfx.kick()
          return false
        }
      }
      return true
    })

    // ----- 敌人 -----
    state.level.enemies.forEach((e) => {
      if (!e.alive) {
        return
      }
      if (!e.active) {
        if (e.x < state.camera + VIEW_W + 60) {
          e.active = true
        } else {
          return
        }
      }
      if (e.squash > 0) {
        e.squash--
        if (e.squash === 0) {
          e.alive = false
        }
        return
      }
      e.vy = Math.min(e.vy + GRAVITY, 10)
      e.x += e.vx
      // 撞墙折返
      const front = e.vx < 0 ? e.x : e.x + e.w
      if (SOLID.has(tileAt(rows, width, front, e.y + e.h - 6))) {
        e.vx = -e.vx
      }
      // 平台边缘折返（巡逻怪不再无脑跳坑）
      if (e.vy === 0) {
        const aheadX = e.vx < 0 ? e.x - 2 : e.x + e.w + 2
        if (!SOLID.has(tileAt(rows, width, aheadX, e.y + e.h + 4))) {
          e.vx = -e.vx
        }
      }
      e.y += e.vy
      const footY = e.y + e.h
      for (const px of [e.x + 2, e.x + e.w - 2]) {
        if (SOLID.has(tileAt(rows, width, px, footY))) {
          e.y = Math.floor(footY / TILE) * TILE - e.h - 0.01
          e.vy = 0
          break
        }
      }
      if (e.y > ROWS * TILE + 60) {
        e.alive = false
        return
      }

      // 与玩家碰撞
      if (!p.dying && !state.finished &&
        p.x < e.x + e.w && p.x + p.w > e.x &&
        p.y < e.y + e.h && p.y + p.h > e.y) {
        if (p.star > 0) {
          // 无敌星：撞飞一切
          e.squash = 18
          e.vx = 0
          addScore(state, 200, e.x + e.w / 2, e.y)
          spawnParticles(state, e.x + e.w / 2, e.y + e.h / 2, '#FFB703', 10)
          sfx.kick()
        } else if (e.type !== 'spiky' && p.vy > 0 && p.y + p.h - p.vy <= e.y + 10) {
          // 踩头（刺果怪不可踩）；按住跳跃弹得更高
          e.squash = 18
          e.vx = 0
          p.vy = keys.jumpHeld ? -9.5 : -6.5
          addScore(state, 200, e.x + e.w / 2, e.y)
          spawnParticles(state, e.x + e.w / 2, e.y + e.h / 2, '#8D6E63', 8)
          sfx.stomp()
        } else if (p.invincible <= 0) {
          hurtPlayer(state)
        }
      }
    })

    // ----- 粒子 / 金币 / 飘字动画 -----
    state.particles.forEach((pt) => {
      pt.x += pt.vx
      pt.y += pt.vy
      pt.vy += 0.25
      pt.alpha -= 1 / pt.life
      pt.life--
    })
    state.particles = state.particles.filter((pt) => pt.life > 0)
    state.popCoins.forEach((c) => {
      c.y += c.vy
      c.vy += 0.3
      c.life--
    })
    state.popCoins = state.popCoins.filter((c) => c.life > 0)
    state.pops.forEach((t) => {
      t.y -= 0.8
      t.life--
    })
    state.pops = state.pops.filter((t) => t.life > 0)
    state.bumps.forEach((b) => b.t++)
    state.bumps = state.bumps.filter((b) => b.t <= 12)

    // ----- 相机 -----
    const target = Math.max(state.camera, p.x - VIEW_W * 0.38)
    state.camera = Math.min(target, width * TILE - VIEW_W)

    // ==================== 绘制 ====================
    const cam = state.camera
    ctx.clearRect(0, 0, VIEW_W, VIEW_H)

    // 天空
    const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H)
    sky.addColorStop(0, '#8ED8F5')
    sky.addColorStop(0.7, '#C9EDF9')
    sky.addColorStop(1, '#E8F7EC')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, VIEW_W, VIEW_H)

    // 远山（视差）
    ctx.fillStyle = '#A5D6A7'
    for (let i = 0; i < 6; i++) {
      const hx = ((i * 420 - cam * 0.3) % (width * TILE)) - 60
      if (hx > -300 && hx < VIEW_W + 100) {
        ctx.beginPath()
        ctx.moveTo(hx - 110, 11 * TILE)
        ctx.quadraticCurveTo(hx, 11 * TILE - 130, hx + 110, 11 * TILE)
        ctx.closePath()
        ctx.fill()
      }
    }

    // 白云（视差）
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    for (let i = 0; i < 8; i++) {
      const cx = ((i * 310 + 70 - cam * 0.5) % (width * TILE)) - 40
      const cy = 40 + (i % 3) * 38
      if (cx > -120 && cx < VIEW_W + 60) {
        ctx.beginPath()
        ctx.arc(cx, cy, 18, 0, Math.PI * 2)
        ctx.arc(cx + 18, cy - 8, 14, 0, Math.PI * 2)
        ctx.arc(cx + 34, cy + 2, 15, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // 道具（画在瓦片下层，从砖里钻出来）
    state.items.forEach((it) => {
      if (it.emerging > 0) {
        ctx.save()
        ctx.beginPath()
        ctx.rect(it.blockX - cam, it.blockY - TILE, TILE, TILE)
        ctx.clip()
        drawItem(ctx, it, cam, state.frameCount)
        ctx.restore()
      } else {
        drawItem(ctx, it, cam, state.frameCount)
      }
    })

    // 瓦片（带顶砖弹跳偏移）
    const c0 = Math.floor(cam / TILE)
    const c1 = Math.min(width - 1, c0 + Math.ceil(VIEW_W / TILE) + 1)
    for (let r = 0; r < ROWS; r++) {
      for (let c = c0; c <= c1; c++) {
        const ch = rows[r][c]
        if (ch === ' ') {
          continue
        }
        const bump = state.bumps.find((b) => b.r === r && b.c === c)
        const dy = bump ? -Math.sin((bump.t / 12) * Math.PI) * 7 : 0
        drawTile(ctx, ch, c * TILE - cam, r * TILE, state.frameCount, r, c, rows, width, dy)
      }
    }

    // 弹出的金币
    state.popCoins.forEach((c) => {
      drawCoin(ctx, c.x - cam, c.y, state.frameCount, Math.max(0, c.life / 32))
    })

    // 火球
    state.fireballs.forEach((fb) => drawFireball(ctx, fb, cam, state.frameCount))

    // 粒子
    state.particles.forEach((pt) => {
      ctx.save()
      ctx.globalAlpha = Math.max(0, pt.alpha)
      ctx.fillStyle = pt.color
      ctx.fillRect(pt.x - cam - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size)
      ctx.restore()
    })

    // 敌人
    state.level.enemies.forEach((e) => {
      if (e.alive && e.x - cam > -60 && e.x - cam < VIEW_W + 60) {
        drawEnemy(ctx, e, cam, state.frameCount)
      }
    })

    // 玩家（受伤无敌时闪烁）
    if (!(p.invincible > 0 && Math.floor(state.frameCount / 4) % 2 === 0)) {
      drawPlayer(ctx, p, cam, state.frameCount)
    }

    // 得分飘字
    state.pops.forEach((t) => {
      ctx.save()
      ctx.globalAlpha = Math.min(1, t.life / 20)
      ctx.font = 'bold 13px sans-serif'
      ctx.textAlign = 'center'
      ctx.lineWidth = 3
      ctx.strokeStyle = INK
      ctx.strokeText(t.text, t.x - cam, t.y)
      ctx.fillStyle = t.color
      ctx.fillText(t.text, t.x - cam, t.y)
      ctx.restore()
    })

    timerRef.current = requestAnimationFrame(gameLoop)
  }, [bumpBlock, hurtPlayer, saveBest, setPower]) // eslint-disable-line react-hooks/exhaustive-deps

  // 启动循环（runId 变化时强制重启，覆盖游戏进行中按重来的情况）
  useEffect(() => {
    if (phase === 'playing') {
      timerRef.current = requestAnimationFrame(gameLoop)
    }
    return () => {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current)
      }
    }
  }, [phase, runId, gameLoop])

  // ==================== 渲染 ====================
  if (phase === 'start') {
    return (
      <div className="sc-game-container">
        <div className="sc-screen">
          <div className="game-icon">🐱🍄</div>
          <h1 className="game-title">超级橘猫</h1>
          <p className="game-desc">
            马里奥风格的横版大冒险！顶问号砖开出 🍄 蘑菇变大、
            🌸 火力花发射火球、⭐ 无敌星横冲直撞，
            踩扁毛栗怪（小心带刺的别踩！），摸到终点的爪印旗就赢啦～
          </p>
          <div className="sc-controls-info">
            <h4>🎮 操作说明</h4>
            <div className="control-row">
              <span className="control-key">←→</span>
              <span>/</span>
              <span className="control-key">A D</span>
              <span>移动</span>
              <span className="control-key">空格</span>
              <span>/</span>
              <span className="control-key">↑</span>
              <span>跳跃（长按跳更高）</span>
            </div>
            <div className="control-row" style={{ marginTop: 6 }}>
              <span className="control-key">J</span>
              <span>/</span>
              <span className="control-key">X</span>
              <span>发射火球（火力形态）</span>
            </div>
          </div>
          <button className="sc-btn" onClick={startGame}>
            <span>▶️</span>
            <span>开始冒险</span>
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'over' || phase === 'win') {
    const win = phase === 'win'
    return (
      <div className="sc-game-container">
        <div className="sc-screen">
          <div className="game-icon">{win ? '🏁' : '😿'}</div>
          <h1 className="game-title">{win ? '通关啦！' : '冒险失败'}</h1>
          <p className="game-desc">
            {win
              ? '橘猫成功摸到了爪印旗，吃饱喝足凯旋回窝！'
              : '橘猫的三条命都用完了，回窝里睡一觉再来吧…'}
          </p>
          <div className="sc-scores">
            <div className="sc-score-card">
              <div className="score-label">本次得分</div>
              <div className="score-num">{score}</div>
            </div>
            <div className="sc-score-card">
              <div className="score-label">金币</div>
              <div className="score-num">{coins}</div>
            </div>
            <div className="sc-score-card best">
              <div className="score-label">最高纪录</div>
              <div className="score-num">{bestScore}</div>
            </div>
          </div>
          <div className="sc-btn-group" style={{ justifyContent: 'center' }}>
            <button className="sc-btn" onClick={startGame}>
              <span>🔄</span>
              <span>再来一局</span>
            </button>
            {onExit && (
              <button className="sc-btn sc-btn-secondary" onClick={onExit}>
                <span>←</span>
                <span>返回列表</span>
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="sc-game-container">
      <div className="sc-game-board">
        <div className="sc-status-bar">
          <div className="sc-stat">
            <span>⭐ 得分:</span>
            <span className="stat-value">{score}</span>
          </div>
          <div className="sc-stat">
            <span>🪙</span>
            <span className="stat-value">{coins}</span>
          </div>
          <div className="sc-stat">
            <span>❤️</span>
            <span className="stat-value">{lives}</span>
          </div>
          <div className="sc-stat">
            <span>{POWER_ICON[powerUi]}</span>
            {starSec > 0 && <span className="stat-value">⭐{starSec}s</span>}
          </div>
          <div className="sc-stat hideSm">
            <span>🏆 最高:</span>
            <span className="stat-value">{bestScore}</span>
          </div>
          <button className="sc-stat sc-mute-btn" onClick={toggleMute} aria-label="切换音效">
            {muted ? '🔇' : '🔊'}
          </button>
        </div>

        <div className="sc-canvas-wrap">
          <canvas ref={canvasRef} width={VIEW_W} height={VIEW_H} />
        </div>

        <div className="sc-touch-controls">
          <div className="sc-dpad">
            <button
              className="sc-touch-btn"
              onPointerDown={press('left', true)}
              onPointerUp={press('left', false)}
              onPointerLeave={press('left', false)}
              onContextMenu={(e) => e.preventDefault()}
            >
              ◀
            </button>
            <button
              className="sc-touch-btn"
              onPointerDown={press('right', true)}
              onPointerUp={press('right', false)}
              onPointerLeave={press('right', false)}
              onContextMenu={(e) => e.preventDefault()}
            >
              ▶
            </button>
          </div>
          <div className="sc-dpad">
            {powerUi === 'fire' && (
              <button
                className="sc-touch-btn sc-touch-fire"
                onPointerDown={press('fire', true)}
                onPointerUp={press('fire', false)}
                onPointerLeave={press('fire', false)}
                onContextMenu={(e) => e.preventDefault()}
              >
                🔥
              </button>
            )}
            <button
              className="sc-touch-btn sc-touch-jump"
              onPointerDown={press('jump', true)}
              onPointerUp={press('jump', false)}
              onPointerLeave={press('jump', false)}
              onContextMenu={(e) => e.preventDefault()}
            >
              ⬆ 跳
            </button>
          </div>
        </div>

        <div className="sc-btn-group">
          <button className="sc-btn sc-btn-secondary" onClick={startGame}>
            🔄 重来
          </button>
          {onExit && (
            <button className="sc-btn sc-btn-secondary" onClick={onExit}>
              ← 返回
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default SuperCat
