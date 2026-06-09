import { useState, useEffect, useRef, useCallback } from 'react'
import './Stacker.css'

/**
 * 叠叠乐大挑战小游戏 🧱🌈
 *
 * 玩法：左右滑动的方块，在与下方对齐时点击或空格放置。
 * 错位的部分会被切除坠落，连续完美对齐会有连击加成奖励。
 * 视觉风格：极简彩虹渐变塔，带切片坠落物理与完美光波特效。
 */

const CANVAS_WIDTH = 360
const CANVAS_HEIGHT = 460
const BLOCK_HEIGHT = 18
const BASE_SPEED = 2.8
const TOLERANCE = 4.5 // 完美判定像素误差容差

const Stacker = ({ onExit }) => {
  const [phase, setPhase] = useState('start') // 'start' | 'playing' | 'over'
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('stacker_best') || '0', 10)
  })
  const [comboText, setComboText] = useState('')
  const [comboCount, setComboCount] = useState(0)

  const canvasRef = useRef(null)
  const timerRef = useRef(null)

  // 核心游戏状态，使用 Ref 缓存以保证 60 FPS 绘制帧率
  const stateRef = useRef({
    blocks: [], // 已堆叠的块: { x, y, width, color }
    activeBlock: null, // 当前移动块: { x, y, width, speed, direction, color }
    debris: [], // 切掉坠落的碎块: { x, y, width, vx, vy, gravity, color, alpha }
    perfectWaves: [], // 完美判定波纹: { x, y, radius, alpha }
    cameraY: 0, // 摄像机平滑偏移
    cameraTargetY: 0,
    level: 0,
    combo: 0,
  })

  // 生成 HSL 彩虹渐变色
  const getColorForLevel = (level) => {
    return `hsl(${(level * 14) % 360}, 85%, 55%)`
  }

  // 开始新游戏
  const startGame = useCallback(() => {
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current)
    }

    const initWidth = 160
    const startX = (CANVAS_WIDTH - initWidth) / 2
    const startY = CANVAS_HEIGHT - 50

    stateRef.current = {
      blocks: [
        {
          x: startX,
          y: startY,
          width: initWidth,
          color: getColorForLevel(0),
        },
      ],
      activeBlock: {
        x: 0,
        y: startY - BLOCK_HEIGHT,
        width: initWidth,
        speed: BASE_SPEED,
        direction: 1,
        color: getColorForLevel(1),
      },
      debris: [],
      perfectWaves: [],
      cameraY: 0,
      cameraTargetY: 0,
      level: 1,
      combo: 0,
    }

    setScore(0)
    setComboCount(0)
    setComboText('')
    setPhase('playing')
  }, [])

  // 落子/堆叠动作
  const handleDrop = useCallback(() => {
    if (phase !== 'playing') {
      return
    }

    const state = stateRef.current
    const active = state.activeBlock
    if (!active) {
      return
    }

    const base = state.blocks[state.blocks.length - 1]

    // 左右边缘坐标
    const x1 = active.x
    const x2 = active.x + active.width
    const bx1 = base.x
    const bx2 = base.x + base.width

    // 叠合区域
    const ox1 = Math.max(x1, bx1)
    const ox2 = Math.min(x2, bx2)
    const overlapWidth = ox2 - ox1

    if (overlapWidth <= 0) {
      // 完完全全错过了，跌落深渊，游戏结束
      state.debris.push({
        x: active.x,
        y: active.y,
        width: active.width,
        vx: active.direction * 1.5,
        vy: -1.5,
        color: active.color,
        alpha: 1.0,
      })
      state.activeBlock = null
      handleGameOver()
      return
    }

    // 完美判定
    const offset = Math.abs(x1 - bx1)
    const isPerfect = offset <= TOLERANCE

    let nextWidth = overlapWidth
    let nextX = ox1

    if (isPerfect) {
      // 完美契合，对齐下层
      nextX = bx1
      nextWidth = base.width
      state.combo++
      setComboCount(state.combo)
      
      // 显示鼓励评语
      let label = 'PERFECT!'
      if (state.combo >= 6) { label = 'UNBELIEVABLE!! 🔥' }
      else if (state.combo >= 4) { label = 'INCREDIBLE! 🌟' }
      else if (state.combo >= 2) { label = 'EXCELLENT! ✨' }
      setComboText(label)

      // 完美发光波纹
      state.perfectWaves.push({
        x: nextX + nextWidth / 2,
        y: active.y + BLOCK_HEIGHT / 2,
        radius: nextWidth / 2,
        alpha: 1.0,
      })

      // 连击奖励：连续完美 3 次以上，方块宽度微弱扩张（最大回到 160）
      if (state.combo >= 3 && nextWidth < 160) {
        nextWidth = Math.min(160, nextWidth + 8)
        nextX = Math.max(0, nextX - 4)
      }
    } else {
      // 普通切除，连击清零
      state.combo = 0
      setComboCount(0)
      setComboText('')

      // 产生切除块坠落物理
      let debrisX, debrisW
      if (x1 < bx1) {
        // 切除左端
        debrisX = x1
        debrisW = bx1 - x1
      } else {
        // 切除右端
        debrisX = bx2
        debrisW = x2 - bx2
      }

      state.debris.push({
        x: debrisX,
        y: active.y,
        width: debrisW,
        vx: x1 < bx1 ? -1.8 : 1.8,
        vy: -1.2,
        color: active.color,
        alpha: 1.0,
      })
    }

    // 成功将移动块压入地基
    state.blocks.push({
      x: nextX,
      y: active.y,
      width: nextWidth,
      color: active.color,
    })

    const nextLevel = state.level + 1
    state.level = nextLevel
    setScore(nextLevel - 1)

    // 摄像机高度滑动计算：当堆叠高度超过 8 层时，相机跟进向上滑动
    if (nextLevel > 7) {
      state.cameraTargetY = (nextLevel - 7) * BLOCK_HEIGHT
    }

    // 稍微提速
    const nextSpeed = Math.min(8.5, BASE_SPEED + nextLevel * 0.09)

    // 生成新的上方移动块
    state.activeBlock = {
      x: Math.random() > 0.5 ? 0 : CANVAS_WIDTH - nextWidth,
      y: base.y - BLOCK_HEIGHT * 2, // 移动行在最高层上方一行
      width: nextWidth,
      speed: nextSpeed,
      direction: Math.random() > 0.5 ? 1 : -1,
      color: getColorForLevel(nextLevel),
    }
  }, [phase])

  // 处理按键输入
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === 'Enter') {
        e.preventDefault()
        if (phase === 'start') {
          startGame()
        } else if (phase === 'over') {
          startGame()
        } else {
          handleDrop()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phase, startGame, handleDrop])

  // ==================== 绘制与计算核心循环 ====================

  const drawBlock = (ctx, x, y, width, color, cameraY, _isDebris = false, alpha = 1.0) => {
    const drawY = y + cameraY
    ctx.save()
    ctx.globalAlpha = alpha

    // 伪 3D 渲染：绘制主表面 + 下方厚度面 + 侧面倾角

    // 1. 厚度面 (暗化处理)
    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    ctx.fillRect(x + 3, drawY + BLOCK_HEIGHT, width - 4, 4) // 阴影厚度

    // 2. 主表面
    ctx.fillStyle = color
    ctx.fillRect(x, drawY, width, BLOCK_HEIGHT)

    // 3. 高光线 (顶边和左边)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, drawY + BLOCK_HEIGHT)
    ctx.lineTo(x, drawY)
    ctx.lineTo(x + width, drawY)
    ctx.stroke()

    // 4. 深色描边
    ctx.strokeStyle = '#1E1813'
    ctx.lineWidth = 1.5
    ctx.strokeRect(x, drawY, width, BLOCK_HEIGHT)

    ctx.restore()
  }

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    const ctx = canvas.getContext('2d')
    const state = stateRef.current

    // 1. 物理更新：移动块滑动
    if (state.activeBlock && !state.isDead) {
      const active = state.activeBlock
      active.x += active.speed * active.direction
      if (active.x < 0) {
        active.x = 0
        active.direction = 1
      } else if (active.x + active.width > CANVAS_WIDTH) {
        active.x = CANVAS_WIDTH - active.width
        active.direction = -1
      }
    }

    // 2. 摄像机高度插值
    state.cameraY += (state.cameraTargetY - state.cameraY) * 0.08

    // 3. 碎块坠落物理更新
    state.debris.forEach((deb) => {
      deb.y += deb.vy
      deb.vy += 0.35 // 重力加速度
      deb.x += deb.vx
      deb.alpha -= 0.02
    })
    state.debris = state.debris.filter((deb) => deb.y < CANVAS_HEIGHT + 50 && deb.alpha > 0)

    // 4. 完美判定发光圈动画更新
    state.perfectWaves.forEach((wav) => {
      wav.radius += 2.5
      wav.alpha -= 0.04
    })
    state.perfectWaves = state.perfectWaves.filter((wav) => wav.alpha > 0)

    // ==================== 绘制画布层 ====================
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // 暗黑炫彩网格背景
    ctx.fillStyle = '#0F172A'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // 绘制霓虹科技网格
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.06)'
    ctx.lineWidth = 1
    for (let x = 0; x < CANVAS_WIDTH; x += 24) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke()
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 24) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke()
    }

    // 绘制完美落子环
    state.perfectWaves.forEach((wav) => {
      ctx.save()
      ctx.globalAlpha = wav.alpha
      ctx.strokeStyle = '#00F5FF' // 电光青
      ctx.lineWidth = 3
      ctx.shadowColor = '#00F5FF'
      ctx.shadowBlur = 12
      ctx.beginPath()
      ctx.arc(wav.x, wav.y + state.cameraY, wav.radius, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    })

    // 绘制堆叠塔 (仅绘制在屏幕可视区内的块以优化性能)
    state.blocks.forEach((b) => {
      if (b.y + state.cameraY > -50 && b.y + state.cameraY < CANVAS_HEIGHT + 50) {
        drawBlock(ctx, b.x, b.y, b.width, b.color, state.cameraY)
      }
    })

    // 绘制坠落的碎屑
    state.debris.forEach((deb) => {
      drawBlock(ctx, deb.x, deb.y, deb.width, deb.color, state.cameraY, true, deb.alpha)
    })

    // 绘制当前正在滑动的移动块
    if (state.activeBlock) {
      const active = state.activeBlock
      drawBlock(ctx, active.x, active.y, active.width, active.color, state.cameraY)
    }

    // 重绘下一帧
    timerRef.current = requestAnimationFrame(gameLoop)
  }, [])

  // 游戏失败
  const handleGameOver = () => {
    const state = stateRef.current
    const finalScore = state.level - 1
    const best = Math.max(finalScore, parseInt(localStorage.getItem('stacker_best') || '0', 10))
    localStorage.setItem('stacker_best', String(best))
    setBestScore(best)
    setPhase('over')
  }

  // 启动主定时器
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

  // ==================== 渲染页面 ====================

  // 1. 开始页面
  if (phase === 'start') {
    return (
      <div className="stacker-container">
        <div className="stacker-console">
          <div className="game-icon">🧱</div>
          <h1 className="game-title">炫彩叠叠乐</h1>
          <p className="game-desc">
            考验眼力与手速的魔性方块堆叠！<br />
            方块来回滑动，看准时机按下对齐。连续完美放置（Perfect）能使方块逐渐扩张哦，堆出一个彩虹摩天楼吧！
          </p>

          <div className="stacker-controls-info">
            <h4>🎮 操作说明</h4>
            <div className="control-row">
              <span>按键盘</span>
              <span className="control-key">空格</span>
              <span>/</span>
              <span className="control-key">Enter</span>
              <span>键 或</span>
              <span className="control-key">点击屏幕</span>
              <span>进行堆叠</span>
            </div>
          </div>

          <button className="stacker-btn" onClick={startGame}>
            <span>▶️</span>
            <span>开始挑战</span>
          </button>
        </div>
      </div>
    )
  }

  // 2. 结束页面
  if (phase === 'over') {
    return (
      <div className="stacker-container">
        <div className="stacker-console">
          <div className="game-icon">💥</div>
          <h1 className="game-title">大楼倒塌了！</h1>
          <p className="game-desc">方块完全偏离，大楼失去了平衡垮塌坠落...</p>

          <div className="flappy-scores">
            <div className="flappy-score-card">
              <div className="score-label">堆叠高度</div>
              <div className="score-num">{score} 层</div>
            </div>
            <div className="flappy-score-card best">
              <div className="score-label">最高纪录</div>
              <div className="score-num">{bestScore} 层</div>
            </div>
          </div>

          <div className="stacker-btn-group" style={{ justifyContent: 'center' }}>
            <button className="stacker-btn" onClick={startGame}>
              <span>🔄</span>
              <span>再起高楼</span>
            </button>
            {onExit && (
              <button className="stacker-btn secondary" onClick={onExit}>
                <span>←</span>
                <span>返回列表</span>
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 3. 游戏运行页面
  return (
    <div className="stacker-container">
      <div className="stacker-board">
        {/* 顶部指示 */}
        <div className="stacker-status-bar">
          <div className="stacker-stat">
            <span>🌈 高度:</span>
            <span className="stat-value">{score} 层</span>
          </div>
          <div className="stacker-stat">
            <span>🏆 最高:</span>
            <span className="stat-value">{bestScore} 层</span>
          </div>
        </div>

        {/* 游戏画布 */}
        <div className="stacker-canvas-wrap" onClick={handleDrop}>
          <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />

          {/* 完美的连击连击徽章 */}
          {comboCount > 0 && (
            <div className="stacker-combo-badge" style={{ color: comboCount >= 4 ? '#E5366F' : '#00F5FF' }}>
              <div>{comboText}</div>
              <div style={{ fontSize: '18px', marginTop: '4px' }}>🔥 {comboCount} 连击</div>
            </div>
          )}
        </div>

        <div className="flappy-mobile-hint">点击画面任意位置均可放置方块 📲</div>

        {/* 控制组 */}
        <div className="stacker-btn-group">
          <button className="stacker-btn secondary" onClick={startGame}>
            🔄 重置
          </button>
          {onExit && (
            <button className="stacker-btn secondary" onClick={onExit}>
              ← 返回
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Stacker
