import { useState, useEffect, useRef, useCallback } from 'react'
import './SuperCat.css'

/**
 * 超级橘猫 🐱🍄
 *
 * 马里奥风格横版平台跳跃：跑酷、顶问号砖、吃金币、踩毛栗怪、
 * 跨越水管与深坑，最终摸到终点旗！
 */

const TILE = 32
const VIEW_W = 640
const VIEW_H = 416
const ROWS = 13

const GRAVITY = 0.5
const MOVE_ACCEL = 0.45
const MAX_SPEED = 3.6
const FRICTION = 0.82
const JUMP_FORCE = -10.6
const JUMP_CUT = 0.45 // 松开跳跃键时保留的上升速度比例
const START_LIVES = 3

// 关卡地图：每行等宽字符串
// # 地面砖  = 红砖(可顶碎)  ? 问号砖(金币)  X 用过的砖
// n 水管口  | 水管身  o 金币  E 毛栗怪  F 终点旗  S 出生点
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

  put(10, 3, 'S')

  // 第一段：热身问号砖
  put(7, 8, '?')
  fill(7, 14, 18, '=')
  put(7, 15, '?')
  put(7, 17, '?')
  put(3, 16, '?')

  // 水管两根（2 列宽）
  fill(9, 24, 25, 'n'); fill(10, 24, 25, '|')
  fill(8, 30, 31, 'n'); fill(9, 30, 31, '|'); fill(10, 30, 31, '|')

  // 跨坑金币弧线
  put(5, 38, 'o'); put(4, 39, 'o'); put(5, 40, 'o')

  // 第二段：砖桥 + 空中金币
  fill(7, 44, 48, '=')
  put(7, 46, '?')
  fill(4, 46, 49, 'o')
  fill(8, 56, 56, '#'); fill(9, 56, 56, '#'); fill(10, 56, 56, '#')
  fill(9, 57, 57, '#'); fill(10, 57, 57, '#')
  fill(10, 58, 58, '#')
  fill(6, 62, 67, '=')
  fill(3, 64, 66, 'o')

  // 跨第二坑
  put(5, 70, 'o'); put(4, 71, 'o'); put(5, 72, 'o')

  // 第三段：高低砖阵
  fill(7, 76, 80, '=')
  put(7, 78, '?')
  put(4, 77, '?')
  put(4, 79, '?')
  fill(9, 86, 87, 'n'); fill(10, 86, 87, '|')
  fill(7, 92, 95, '=')
  fill(4, 93, 94, 'o')

  // 通往第三坑的台阶
  fill(10, 100, 103, '#')
  fill(9, 101, 103, '#')
  fill(8, 102, 103, '#')
  put(5, 108, 'o'); put(4, 109, 'o'); put(5, 110, 'o')

  // 第四段：最后冲刺 + 大台阶
  fill(7, 114, 118, '=')
  put(7, 116, '?')
  for (let i = 0; i < 8; i++) {
    // 高度 i+1 的实心台阶，列 128+i
    for (let h = 0; h <= i; h++) {
      put(10 - h, 128 + i, '#')
    }
  }

  // 终点旗与小猫窝
  put(10, 142, 'F')

  // 毛栗怪
  const enemies = [20, 34, 52, 65, 84, 96, 120].map((c) => ({
    x: c * TILE,
    y: 10 * TILE,
    vx: -0.8,
    vy: 0,
    w: 26,
    h: 24,
    alive: true,
    squash: 0,
    active: false,
  }))

  return { rows, width: W, enemies }
}

const SOLID = new Set(['#', '=', '?', 'X', 'n', '|'])

// ---------- 绘制函数（纯函数，模块级） ----------
function drawTile(ctx, ch, x, y, frame, r, c, rows, width) {
  const INK = '#221A10'
  ctx.lineWidth = 2
  ctx.strokeStyle = INK

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
  } else if (ch === '?') {
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
      // 管口加宽唇边
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
    // 橘色爪印旗
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
  ctx.strokeStyle = '#221A10'
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
  const INK = '#221A10'
  ctx.save()
  ctx.translate(x + e.w / 2, y + h / 2)

  // 身体：毛栗怪
  ctx.fillStyle = '#8D5524'
  ctx.strokeStyle = INK
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.ellipse(0, 0, e.w / 2, h / 2, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  if (e.squash === 0) {
    // 走路小脚
    const step = Math.sin(frame * 0.25) * 3
    ctx.fillStyle = '#5D4037'
    ctx.beginPath()
    ctx.ellipse(-7 + step, h / 2 - 1, 5, 3.5, 0, 0, Math.PI * 2)
    ctx.ellipse(7 - step, h / 2 - 1, 5, 3.5, 0, 0, Math.PI * 2)
    ctx.fill()
    // 凶凶的眉眼
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
    // 被踩扁的眼睛
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

function drawPlayer(ctx, p, cam) {
  const INK = '#221A10'
  const x = p.x - cam + p.w / 2
  const y = p.y + p.h / 2
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(p.facing, 1)
  if (p.dying) {
    ctx.rotate(Math.PI)
  }

  const running = p.onGround && Math.abs(p.vx) > 0.3
  const legSwing = running ? Math.sin(p.runFrame * 4) * 4 : 0
  const inAir = !p.onGround && !p.dying

  // 尾巴
  ctx.strokeStyle = '#FF9800'
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
  ctx.fillStyle = '#FF9800'
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
  ctx.fillStyle = '#FF9800'
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

  // 红色小帽（向超级水管工致敬）
  ctx.fillStyle = '#E53935'
  ctx.beginPath()
  ctx.arc(3, -13, 7.5, Math.PI, 0)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
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

const SuperCat = ({ onExit }) => {
  const [phase, setPhase] = useState('start') // start | playing | over | win
  const [score, setScore] = useState(0)
  const [coins, setCoins] = useState(0)
  const [lives, setLives] = useState(START_LIVES)
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('super_cat_best') || '0', 10)
  })

  const canvasRef = useRef(null)
  const timerRef = useRef(null)
  const keysRef = useRef({ left: false, right: false, jump: false, jumpHeld: false })
  const stateRef = useRef(null)

  const saveBest = useCallback((finalScore) => {
    const best = Math.max(finalScore, parseInt(localStorage.getItem('super_cat_best') || '0', 10))
    localStorage.setItem('super_cat_best', String(best))
    setBestScore(best)
  }, [])

  const startGame = useCallback(() => {
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current)
    }
    const level = buildLevel()
    stateRef.current = {
      level,
      player: {
        x: 3 * TILE,
        y: 10 * TILE,
        vx: 0,
        vy: 0,
        w: 24,
        h: 28,
        onGround: false,
        facing: 1,
        runFrame: 0,
        dying: false,
        invincible: 0,
      },
      camera: 0,
      score: 0,
      coins: 0,
      lives: START_LIVES,
      frameCount: 0,
      particles: [],
      popCoins: [],
      finished: false,
    }
    setScore(0)
    setCoins(0)
    setLives(START_LIVES)
    setPhase('playing')
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

  // ---------- 工具 ----------
  const tileAt = (rows, width, px, py) => {
    const c = Math.floor(px / TILE)
    const r = Math.floor(py / TILE)
    if (c < 0 || c >= width || r >= ROWS) {
      return '#' // 边界视为墙，底部出界由坑判定处理
    }
    if (r < 0) {
      return ' '
    }
    return rows[r][c]
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
    state.score += 100
    setCoins(state.coins)
    setScore(state.score)
    state.popCoins.push({ x, y, vy: -5, life: 32 })
  }

  const killPlayer = useCallback((state) => {
    const p = state.player
    if (p.dying || p.invincible > 0 || state.finished) {
      return
    }
    p.dying = true
    p.vy = -9
    p.vx = 0
    state.lives -= 1
    setLives(state.lives)
  }, [])

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
      // 死亡动画：跃起后坠出屏幕
      p.vy += GRAVITY
      p.y += p.vy
      if (p.y > VIEW_H + 80) {
        if (state.lives > 0) {
          // 重生
          Object.assign(p, { x: 3 * TILE, y: 10 * TILE, vx: 0, vy: 0, dying: false, invincible: 100, facing: 1 })
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

      if (keys.jump && p.onGround) {
        p.vy = JUMP_FORCE
        p.onGround = false
        spawnParticles(state, p.x + p.w / 2, p.y + p.h, '#F6ECD8', 3)
      }
      keys.jump = false
      // 小跳：松开跳跃键提前结束上升
      if (!keys.jumpHeld && p.vy < JUMP_FORCE * JUMP_CUT) {
        p.vy = JUMP_FORCE * JUMP_CUT
      }
      p.vy = Math.min(p.vy + GRAVITY, 12)

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
        // 下落：脚底
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
        // 上升：头顶，可触发顶砖
        const headY = p.y
        for (const px of [p.x + 3, p.x + p.w - 3]) {
          const ch = tileAt(rows, width, px, headY)
          if (SOLID.has(ch)) {
            const c = Math.floor(px / TILE)
            const r = Math.floor(headY / TILE)
            p.y = (r + 1) * TILE + 0.01
            p.vy = 1.5
            if (ch === '?') {
              rows[r][c] = 'X'
              addCoin(state, c * TILE + TILE / 2, r * TILE - 6)
            } else if (ch === '=') {
              rows[r][c] = ' '
              state.score += 50
              setScore(state.score)
              spawnParticles(state, c * TILE + TILE / 2, r * TILE + TILE / 2, '#C0392B', 8)
            }
            break
          }
        }
      }

      // 掉坑
      if (p.y > ROWS * TILE + 40) {
        p.y = VIEW_H - 40
        killPlayer(state)
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
            state.score += 1000
            setScore(state.score)
            saveBest(state.score)
            setTimeout(() => setPhase('win'), 600)
            break
          }
        }
      }

      if (p.invincible > 0) {
        p.invincible--
      }
      if (p.onGround && Math.abs(p.vx) > 0.3) {
        p.runFrame += Math.abs(p.vx) * 0.06
      }
    }

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
      // 撞墙调头
      const front = e.vx < 0 ? e.x : e.x + e.w
      if (SOLID.has(tileAt(rows, width, front, e.y + e.h - 6))) {
        e.vx = -e.vx
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
      if (!p.dying && p.invincible <= 0 && !state.finished &&
        p.x < e.x + e.w && p.x + p.w > e.x &&
        p.y < e.y + e.h && p.y + p.h > e.y) {
        if (p.vy > 0 && p.y + p.h - p.vy <= e.y + 10) {
          // 踩头
          e.squash = 18
          e.vx = 0
          p.vy = -7
          state.score += 200
          setScore(state.score)
          spawnParticles(state, e.x + e.w / 2, e.y + e.h / 2, '#8D6E63', 8)
        } else {
          killPlayer(state)
        }
      }
    })

    // ----- 粒子 / 金币动画 -----
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

    // 瓦片
    const c0 = Math.floor(cam / TILE)
    const c1 = Math.min(width - 1, c0 + Math.ceil(VIEW_W / TILE) + 1)
    for (let r = 0; r < ROWS; r++) {
      for (let c = c0; c <= c1; c++) {
        const ch = rows[r][c]
        if (ch === ' ' || ch === 'S') {
          continue
        }
        const x = c * TILE - cam
        const y = r * TILE
        drawTile(ctx, ch, x, y, state.frameCount, r, c, rows, width)
      }
    }

    // 弹出的金币
    state.popCoins.forEach((c) => {
      drawCoin(ctx, c.x - cam, c.y, state.frameCount, Math.max(0, c.life / 32))
    })

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

    // 玩家（无敌时闪烁）
    if (!(p.invincible > 0 && Math.floor(state.frameCount / 4) % 2 === 0)) {
      drawPlayer(ctx, p, cam)
    }

    timerRef.current = requestAnimationFrame(gameLoop)
  }, [killPlayer, saveBest])

  // 启动循环
  useEffect(() => {
    if (phase === 'playing') {
      timerRef.current = requestAnimationFrame(gameLoop)
    }
    return () => {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current)
      }
    }
  }, [phase, gameLoop])

  // ==================== 渲染 ====================
  if (phase === 'start') {
    return (
      <div className="sc-game-container">
        <div className="sc-screen">
          <div className="game-icon">🐱🍄</div>
          <h1 className="game-title">超级橘猫</h1>
          <p className="game-desc">
            马里奥风格的横版大冒险！戴上小红帽，顶问号砖、吃金币、
            踩扁毛栗怪，跨越水管和深坑，摸到终点的爪印旗就赢啦～
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
          <div className="sc-stat hideSm">
            <span>🏆 最高:</span>
            <span className="stat-value">{bestScore}</span>
          </div>
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
