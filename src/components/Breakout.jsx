import { useState, useEffect, useRef, useCallback } from 'react'
import './Breakout.css'

/**
 * 打砖块游戏 🏓
 * 橘猫主题风格
 * 操作：← → 或鼠标移动控制挡板
 */

// 游戏常量
const W = 480           // 画布宽
const H = 400           // 画布高
const PADDLE_W = 80     // 挡板宽
const PADDLE_H = 12     // 挡板高
const BALL_R = 6        // 球半径
const BRICK_ROWS = 5    // 砖块行数
const BRICK_COLS = 8    // 砖块列数
const BRICK_H = 18      // 砖块高
const BRICK_GAP = 4     // 砖块间距

// 砖块颜色（每行不同）
const BRICK_COLORS = ['#FF6B6B', '#FF9F45', '#FFD93D', '#6BCB77', '#4D96FF']

const Breakout = () => {
  const [phase, setPhase] = useState('start')
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const canvasRef = useRef(null)
  const stateRef = useRef({})
  const rafRef = useRef(null)

  /** 初始化游戏状态对象 */
  const initState = useCallback(() => {
    const brickW = (W - (BRICK_COLS + 1) * BRICK_GAP) / BRICK_COLS
    const bricks = []
    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        bricks.push({
          x: BRICK_GAP + c * (brickW + BRICK_GAP),
          y: 30 + r * (BRICK_H + BRICK_GAP),
          w: brickW, h: BRICK_H,
          color: BRICK_COLORS[r], alive: true,
        })
      }
    }
    return {
      paddleX: (W - PADDLE_W) / 2,
      ballX: W / 2, ballY: H - 40,
      ballDX: 3, ballDY: -3,
      bricks, leftPressed: false, rightPressed: false,
      scoreLocal: 0, livesLocal: 3,
    }
  }, [])

  /** 开始游戏 */
  const startGame = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current) }
    const s = initState()
    stateRef.current = s
    setScore(0)
    setLives(3)
    setPhase('playing')
  }, [initState])

  /** 游戏主循环 */
  const gameLoop = useCallback(() => {
    const s = stateRef.current
    const cvs = canvasRef.current
    if (!cvs || !s.bricks) { return }
    const ctx = cvs.getContext('2d')

    // 挡板移动
    if (s.leftPressed && s.paddleX > 0) { s.paddleX -= 6 }
    if (s.rightPressed && s.paddleX < W - PADDLE_W) { s.paddleX += 6 }

    // 球移动
    s.ballX += s.ballDX
    s.ballY += s.ballDY

    // 球-墙碰撞
    if (s.ballX - BALL_R <= 0 || s.ballX + BALL_R >= W) { s.ballDX = -s.ballDX }
    if (s.ballY - BALL_R <= 0) { s.ballDY = -s.ballDY }

    // 球-挡板碰撞
    if (s.ballY + BALL_R >= H - PADDLE_H - 10 && s.ballY + BALL_R <= H - 10 &&
        s.ballX >= s.paddleX && s.ballX <= s.paddleX + PADDLE_W) {
      s.ballDY = -Math.abs(s.ballDY)
      // 根据击中位置改变水平速度
      const hit = (s.ballX - s.paddleX) / PADDLE_W - 0.5
      s.ballDX = hit * 8
    }

    // 球-砖块碰撞
    for (const brick of s.bricks) {
      if (!brick.alive) { continue }
      if (s.ballX + BALL_R > brick.x && s.ballX - BALL_R < brick.x + brick.w &&
          s.ballY + BALL_R > brick.y && s.ballY - BALL_R < brick.y + brick.h) {
        brick.alive = false
        s.ballDY = -s.ballDY
        s.scoreLocal += 10
        setScore(s.scoreLocal)
        // 检查胜利
        if (s.bricks.every(b => !b.alive)) {
          cancelAnimationFrame(rafRef.current)
          setPhase('won')
          return
        }
        break
      }
    }

    // 球落底
    if (s.ballY + BALL_R >= H) {
      s.livesLocal--
      setLives(s.livesLocal)
      if (s.livesLocal <= 0) {
        cancelAnimationFrame(rafRef.current)
        setPhase('lost')
        return
      }
      // 重置球和挡板
      s.paddleX = (W - PADDLE_W) / 2
      s.ballX = W / 2; s.ballY = H - 40
      s.ballDX = 3; s.ballDY = -3
    }

    // === 绘制 ===
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#FFF8F0'; ctx.fillRect(0, 0, W, H)

    // 砖块
    for (const brick of s.bricks) {
      if (!brick.alive) { continue }
      ctx.fillStyle = brick.color
      ctx.beginPath()
      ctx.roundRect(brick.x, brick.y, brick.w, brick.h, 4)
      ctx.fill()
      // 高光
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.fillRect(brick.x, brick.y, brick.w, 3)
    }

    // 挡板
    ctx.fillStyle = '#FF9F45'
    ctx.beginPath()
    ctx.roundRect(s.paddleX, H - PADDLE_H - 10, PADDLE_W, PADDLE_H, 6)
    ctx.fill()

    // 球
    ctx.fillStyle = '#FF6B6B'
    ctx.beginPath()
    ctx.arc(s.ballX, s.ballY, BALL_R, 0, Math.PI * 2)
    ctx.fill()

    rafRef.current = requestAnimationFrame(gameLoop)
  }, [])

  // 启动/停止游戏循环
  useEffect(() => {
    if (phase === 'playing') {
      rafRef.current = requestAnimationFrame(gameLoop)
    }
    return () => { if (rafRef.current) { cancelAnimationFrame(rafRef.current) } }
  }, [phase, gameLoop])

  // 键盘控制
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'ArrowLeft') { stateRef.current.leftPressed = true }
      if (e.key === 'ArrowRight') { stateRef.current.rightPressed = true }
    }
    const up = (e) => {
      if (e.key === 'ArrowLeft') { stateRef.current.leftPressed = false }
      if (e.key === 'ArrowRight') { stateRef.current.rightPressed = false }
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  // 鼠标/触摸控制
  useEffect(() => {
    const cvs = canvasRef.current
    if (!cvs) { return }
    const move = (e) => {
      const rect = cvs.getBoundingClientRect()
      const x = (e.clientX || e.touches?.[0]?.clientX || 0) - rect.left
      stateRef.current.paddleX = Math.max(0, Math.min(W - PADDLE_W, x - PADDLE_W / 2))
    }
    cvs.addEventListener('mousemove', move)
    cvs.addEventListener('touchmove', move, { passive: true })
    return () => { cvs.removeEventListener('mousemove', move); cvs.removeEventListener('touchmove', move) }
  })

  // ==================== 渲染：开始界面 ====================
  if (phase === 'start') {
    return (
      <div className="breakout-container">
        <div className="breakout-panel">
          <div className="game-icon">🏓</div>
          <h1 className="game-title">打砖块</h1>
          <p className="game-desc">
            移动挡板反弹小球击碎所有砖块！<br />
            3条命，把全部砖块打碎就赢了！
          </p>
          <button className="breakout-start-btn" onClick={() => startGame()}>
            <span>▶️</span><span>开始游戏</span>
          </button>
        </div>
      </div>
    )
  }

  // ==================== 渲染：结束界面 ====================
  if (phase === 'won' || phase === 'lost') {
    return (
      <div className="breakout-container">
        <div className="breakout-panel">
          <div className="game-icon">{phase === 'won' ? '🎉' : '💥'}</div>
          <h2 className="game-title">{phase === 'won' ? '恭喜通关！' : '游戏结束'}</h2>
          <div className="breakout-over-scores">
            <div className="score-card">
              <div className="score-label">得分</div>
              <div className="score-num">{score}</div>
            </div>
          </div>
          <button className="breakout-start-btn" onClick={() => startGame()}>
            <span>🔄</span><span>再来一局</span>
          </button>
        </div>
      </div>
    )
  }

  // ==================== 渲染：游戏中 ====================
  return (
    <div className="breakout-container">
      <div className="breakout-game-board">
        <div className="breakout-status">
          <div className="breakout-stat">
            <span>🏆</span><span>得分</span>
            <span className="stat-value">{score}</span>
          </div>
          <div className="breakout-stat">
            <span>❤️</span><span>生命</span>
            <span className="stat-value">{lives}</span>
          </div>
        </div>

        <div className="breakout-canvas-wrap">
          <canvas ref={canvasRef} width={W} height={H} />
        </div>

        <div className="breakout-btn-group">
          <button className="breakout-btn breakout-btn-restart" onClick={() => startGame()}>
            🔄 重新开始
          </button>
        </div>

        <div className="breakout-mobile-controls">
          <button className="breakout-mobile-btn" onPointerDown={() => { stateRef.current.leftPressed = true }} onPointerUp={() => { stateRef.current.leftPressed = false }}>◀</button>
          <button className="breakout-mobile-btn" onPointerDown={() => { stateRef.current.rightPressed = true }} onPointerUp={() => { stateRef.current.rightPressed = false }}>▶</button>
        </div>
      </div>
    </div>
  )
}

export default Breakout
