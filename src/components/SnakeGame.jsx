import { useState, useEffect, useRef, useCallback } from 'react'
import './SnakeGame.css'

/**
 * 贪吃蛇游戏 🐍
 * 经典小游戏 - 橘猫主题风格
 *
 * 功能：方向键/WASD控制，空格暂停，移动端虚拟方向键
 */

// ==================== 游戏常量 ====================
const CELL_SIZE = 20          // 每个格子的像素大小
const BOARD_WIDTH = 20        // 棋盘宽度（格子数）
const BOARD_HEIGHT = 20       // 棋盘高度（格子数）
const INITIAL_SPEED = 150     // 初始移速（ms）
const SPEED_INCREASE = 5      // 每吃一个食物加速（ms）
const MIN_SPEED = 60          // 最快速度限制（ms）

// 方向常量
const DIR = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
}

/**
 * 生成随机食物位置（避开蛇身）
 * @param {Array} snake - 蛇身坐标数组
 * @returns {{x: number, y: number}} 食物坐标
 */
const spawnFood = (snake) => {
  let pos
  do {
    pos = {
      x: Math.floor(Math.random() * BOARD_WIDTH),
      y: Math.floor(Math.random() * BOARD_HEIGHT),
    }
  } while (snake.some(s => s.x === pos.x && s.y === pos.y))
  return pos
}

const SnakeGame = () => {
  // ==================== 状态定义 ====================
  const [phase, setPhase] = useState('start')   // 'start' | 'playing' | 'over'
  const [snake, setSnake] = useState([{ x: 10, y: 10 }])
  const [food, setFood] = useState({ x: 15, y: 10 })
  const [direction, setDirection] = useState(DIR.RIGHT)
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('snake_best') || '0', 10)
  })
  const [speed, setSpeed] = useState(INITIAL_SPEED)
  const [paused, setPaused] = useState(false)

  // Refs（用于在定时器回调中读取最新值）
  const dirRef = useRef(direction)
  const snakeRef = useRef(snake)
  const foodRef = useRef(food)
  const scoreRef = useRef(score)
  const speedRef = useRef(speed)
  const pausedRef = useRef(paused)
  const canvasRef = useRef(null)
  const timerRef = useRef(null)

  // 同步 ref
  useEffect(() => { dirRef.current = direction }, [direction])
  useEffect(() => { snakeRef.current = snake }, [snake])
  useEffect(() => { foodRef.current = food }, [food])
  useEffect(() => { scoreRef.current = score }, [score])
  useEffect(() => { speedRef.current = speed }, [speed])
  useEffect(() => { pausedRef.current = paused }, [paused])

  // ==================== 开始游戏 ====================
  const startGame = useCallback(() => {
    // 清除之前的定时器
    if (timerRef.current) clearInterval(timerRef.current)
    // 初始化蛇身（3节，向右）
    const initSnake = [
      { x: 12, y: 10 },
      { x: 11, y: 10 },
      { x: 10, y: 10 },
    ]
    const initFood = spawnFood(initSnake)
    setSnake(initSnake)
    setFood(initFood)
    setDirection(DIR.RIGHT)
    setScore(0)
    setSpeed(INITIAL_SPEED)
    setPaused(false)
    // 直接赋值 ref，避免闭包延迟
    snakeRef.current = initSnake
    foodRef.current = initFood
    dirRef.current = DIR.RIGHT
    scoreRef.current = 0
    speedRef.current = INITIAL_SPEED
    pausedRef.current = false
    setPhase('playing')
  }, [])

  // ==================== 游戏主循环 ====================
  const gameLoop = useCallback(() => {
    if (pausedRef.current) return

    const curSnake = [...snakeRef.current]
    const head = curSnake[0]
    const dir = dirRef.current

    // 计算新头部位置
    const newHead = { x: head.x + dir.x, y: head.y + dir.y }

    // 碰撞检测 —— 撞墙
    if (newHead.x < 0 || newHead.x >= BOARD_WIDTH ||
        newHead.y < 0 || newHead.y >= BOARD_HEIGHT) {
      // 游戏结束
      if (timerRef.current) clearInterval(timerRef.current)
      const finalScore = scoreRef.current
      const best = Math.max(finalScore, parseInt(localStorage.getItem('snake_best') || '0', 10))
      localStorage.setItem('snake_best', String(best))
      setBestScore(best)
      setPhase('over')
      return
    }

    // 碰撞检测 —— 撞自己（排除尾巴，因为尾巴会移走）
    if (curSnake.some((seg, i) => i !== curSnake.length - 1 && seg.x === newHead.x && seg.y === newHead.y)) {
      if (timerRef.current) clearInterval(timerRef.current)
      const finalScore = scoreRef.current
      const best = Math.max(finalScore, parseInt(localStorage.getItem('snake_best') || '0', 10))
      localStorage.setItem('snake_best', String(best))
      setBestScore(best)
      setPhase('over')
      return
    }

    // 添加新头部
    curSnake.unshift(newHead)

    // 判断是否吃到食物
    const curFood = foodRef.current
    if (newHead.x === curFood.x && newHead.y === curFood.y) {
      // 吃到了！加分，生成新食物，加速
      const newScore = scoreRef.current + 10
      setScore(newScore)
      scoreRef.current = newScore
      const newFood = spawnFood(curSnake)
      setFood(newFood)
      foodRef.current = newFood
      // 加速（有最低速度限制）
      const newSpeed = Math.max(MIN_SPEED, speedRef.current - SPEED_INCREASE)
      setSpeed(newSpeed)
      speedRef.current = newSpeed
    } else {
      // 没吃到，移除尾巴（正常移动）
      curSnake.pop()
    }

    setSnake(curSnake)
    snakeRef.current = curSnake
  }, [])

  // ==================== Canvas 绘制 ====================
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height

    // 清空画布
    ctx.clearRect(0, 0, w, h)

    // 绘制背景网格
    ctx.fillStyle = '#FFF8F0'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = 'rgba(255, 212, 163, 0.3)'
    ctx.lineWidth = 0.5
    for (let x = 0; x <= BOARD_WIDTH; x++) {
      ctx.beginPath()
      ctx.moveTo(x * CELL_SIZE, 0)
      ctx.lineTo(x * CELL_SIZE, h)
      ctx.stroke()
    }
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
      ctx.beginPath()
      ctx.moveTo(0, y * CELL_SIZE)
      ctx.lineTo(w, y * CELL_SIZE)
      ctx.stroke()
    }

    // 绘制食物（小苹果）
    const fd = foodRef.current
    ctx.fillStyle = '#FF6B6B'
    ctx.beginPath()
    ctx.arc(
      fd.x * CELL_SIZE + CELL_SIZE / 2,
      fd.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 2, 0, Math.PI * 2
    )
    ctx.fill()
    // 苹果高光
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.beginPath()
    ctx.arc(
      fd.x * CELL_SIZE + CELL_SIZE / 2 - 2,
      fd.y * CELL_SIZE + CELL_SIZE / 2 - 3,
      3, 0, Math.PI * 2
    )
    ctx.fill()

    // 绘制蛇
    const curSnake = snakeRef.current
    curSnake.forEach((seg, i) => {
      const isHead = i === 0
      const radius = CELL_SIZE / 2 - 1
      const cx = seg.x * CELL_SIZE + CELL_SIZE / 2
      const cy = seg.y * CELL_SIZE + CELL_SIZE / 2

      // 蛇身渐变色（头部深，尾部浅）
      const ratio = i / Math.max(curSnake.length - 1, 1)
      const r = Math.round(255 - ratio * 40)
      const g = Math.round(159 - ratio * 60)
      const b = Math.round(69 - ratio * 30)
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`

      // 圆角方块绘制
      const x = seg.x * CELL_SIZE + 1
      const y = seg.y * CELL_SIZE + 1
      const size = CELL_SIZE - 2
      const r2 = isHead ? 6 : 4
      ctx.beginPath()
      ctx.moveTo(x + r2, y)
      ctx.lineTo(x + size - r2, y)
      ctx.quadraticCurveTo(x + size, y, x + size, y + r2)
      ctx.lineTo(x + size, y + size - r2)
      ctx.quadraticCurveTo(x + size, y + size, x + size - r2, y + size)
      ctx.lineTo(x + r2, y + size)
      ctx.quadraticCurveTo(x, y + size, x, y + size - r2)
      ctx.lineTo(x, y + r2)
      ctx.quadraticCurveTo(x, y, x + r2, y)
      ctx.closePath()
      ctx.fill()

      // 蛇头画眼睛
      if (isHead) {
        const dir = dirRef.current
        ctx.fillStyle = '#FFF'
        const eyeOff = 4
        let e1x = cx - eyeOff, e1y = cy - eyeOff
        let e2x = cx + eyeOff, e2y = cy - eyeOff
        if (dir === DIR.LEFT || dir === DIR.RIGHT) {
          e1x = cx; e1y = cy - eyeOff
          e2x = cx; e2y = cy + eyeOff
        }
        ctx.beginPath(); ctx.arc(e1x, e1y, 3, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(e2x, e2y, 3, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#333'
        ctx.beginPath(); ctx.arc(e1x + dir.x, e1y + dir.y, 1.5, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(e2x + dir.x, e2y + dir.y, 1.5, 0, Math.PI * 2); ctx.fill()
      }
    })
  }, [])

  // ==================== 暂停/继续 ====================
  const togglePause = useCallback(() => {
    setPaused(p => !p)
    pausedRef.current = !pausedRef.current
  }, [])

  // ==================== 方向控制 ====================
  const changeDir = useCallback((newDir) => {
    const cur = dirRef.current
    // 禁止180度掉头
    if (cur.x + newDir.x === 0 && cur.y + newDir.y === 0) return
    setDirection(newDir)
    dirRef.current = newDir
  }, [])

  // ==================== 键盘事件 ====================
  useEffect(() => {
    const handleKey = (e) => {
      if (phase !== 'playing') return
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W':
          e.preventDefault(); changeDir(DIR.UP); break
        case 'ArrowDown': case 's': case 'S':
          e.preventDefault(); changeDir(DIR.DOWN); break
        case 'ArrowLeft': case 'a': case 'A':
          e.preventDefault(); changeDir(DIR.LEFT); break
        case 'ArrowRight': case 'd': case 'D':
          e.preventDefault(); changeDir(DIR.RIGHT); break
        case ' ':
          e.preventDefault(); togglePause(); break
        default: break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [phase, changeDir, togglePause])

  // ==================== 游戏主定时器 ====================
  useEffect(() => {
    if (phase !== 'playing') return
    // 每次 speed 变化时重建定时器
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      gameLoop()
      draw()
    }, speed)
    // 首次立即绘制
    draw()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, speed, gameLoop, draw])

  // ==================== 渲染：开始界面 ====================
  if (phase === 'start') {
    return (
      <div className="snake-game-container">
        <div className="snake-start-screen">
          <div className="game-icon">🐍</div>
          <h1 className="game-title">贪吃蛇</h1>
          <p className="game-desc">
            控制小蛇吃掉食物不断成长！<br />
            小心别撞到墙壁和自己的身体哦～
          </p>
          <div className="snake-controls-info">
            <h4>🎮 操作说明</h4>
            <div className="control-row">
              <span className="control-key">↑ ↓ ← →</span>
              <span>或</span>
              <span className="control-key">W A S D</span>
              <span>控制方向</span>
            </div>
            <div className="control-row">
              <span className="control-key">空格</span>
              <span>暂停 / 继续</span>
            </div>
          </div>
          <button className="snake-start-btn" onClick={() => startGame()}>
            <span>▶️</span>
            <span>开始游戏</span>
          </button>
        </div>
      </div>
    )
  }

  // ==================== 渲染：游戏结束界面 ====================
  if (phase === 'over') {
    return (
      <div className="snake-game-container">
        <div className="snake-game-over">
          <div className="over-icon">😵</div>
          <h2 className="over-title">游戏结束</h2>
          <div className="over-scores">
            <div className="score-card">
              <div className="score-label">本次得分</div>
              <div className="score-num">{score}</div>
            </div>
            <div className="score-card best">
              <div className="score-label">最高记录</div>
              <div className="score-num">{bestScore}</div>
            </div>
          </div>
          <button className="snake-start-btn" onClick={() => startGame()}>
            <span>🔄</span>
            <span>再来一局</span>
          </button>
        </div>
      </div>
    )
  }

  // ==================== 渲染：游戏进行中 ====================
  return (
    <div className="snake-game-container">
      <div className="snake-game-board">
        {/* 暂停遮罩 */}
        {paused && (
          <div className="snake-pause-overlay">
            <div className="snake-pause-text">⏸️ 已暂停</div>
          </div>
        )}

        {/* 状态栏 */}
        <div className="snake-status-bar">
          <div className="snake-stat">
            <span className="stat-icon">🍎</span>
            <span>得分</span>
            <span className="stat-value">{score}</span>
          </div>
          <div className="snake-stat">
            <span className="stat-icon">🏆</span>
            <span>最高</span>
            <span className="stat-value">{bestScore}</span>
          </div>
          <div className="snake-stat">
            <span className="stat-icon">📏</span>
            <span>长度</span>
            <span className="stat-value">{snake.length}</span>
          </div>
        </div>

        {/* Canvas 画布 */}
        <div className="snake-canvas-wrap">
          <canvas
            ref={canvasRef}
            width={BOARD_WIDTH * CELL_SIZE}
            height={BOARD_HEIGHT * CELL_SIZE}
          />
        </div>

        {/* 控制按钮 */}
        <div className="snake-btn-group">
          <button className="snake-btn snake-btn-pause" onClick={() => togglePause()}>
            {paused ? '▶️ 继续' : '⏸️ 暂停'}
          </button>
          <button className="snake-btn snake-btn-restart" onClick={() => startGame()}>
            🔄 重新开始
          </button>
        </div>

        {/* 移动端虚拟方向键 */}
        <div className="snake-dpad">
          <button className="snake-dpad-btn snake-dpad-up" onClick={() => changeDir(DIR.UP)}>▲</button>
          <button className="snake-dpad-btn snake-dpad-down" onClick={() => changeDir(DIR.DOWN)}>▼</button>
          <button className="snake-dpad-btn snake-dpad-left" onClick={() => changeDir(DIR.LEFT)}>◀</button>
          <button className="snake-dpad-btn snake-dpad-right" onClick={() => changeDir(DIR.RIGHT)}>▶</button>
        </div>
      </div>
    </div>
  )
}

export default SnakeGame
