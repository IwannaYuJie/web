import { useState, useEffect, useRef, useCallback } from 'react'
import './TetrisGame.css'

/**
 * 俄罗斯方块游戏 🧱
 * 经典小游戏 - 橘猫主题风格
 *
 * 功能：← → 移动，↑ 旋转，↓ 软降，空格硬降
 */

// ==================== 游戏常量 ====================
const COLS = 10              // 列数
const ROWS = 20              // 行数
const CELL = 28              // 单元格像素
const PREVIEW_CELL = 18      // 预览区单元格像素
const BASE_SPEED = 800       // 基础下落速度（ms）

// 7种经典方块形状定义（每种含旋转状态）
const SHAPES = {
  I: { color: '#FF6B6B', cells: [[0,0],[1,0],[2,0],[3,0]] },
  O: { color: '#FFD93D', cells: [[0,0],[1,0],[0,1],[1,1]] },
  T: { color: '#FF9F45', cells: [[0,0],[1,0],[2,0],[1,1]] },
  S: { color: '#6BCB77', cells: [[1,0],[2,0],[0,1],[1,1]] },
  Z: { color: '#FF8C8C', cells: [[0,0],[1,0],[1,1],[2,1]] },
  J: { color: '#4D96FF', cells: [[0,0],[0,1],[1,1],[2,1]] },
  L: { color: '#FFB366', cells: [[2,0],[0,1],[1,1],[2,1]] },
}

const SHAPE_KEYS = Object.keys(SHAPES)

/**
 * 随机获取一个方块类型
 * @returns {string} 方块类型 key
 */
const randomShape = () => SHAPE_KEYS[Math.floor(Math.random() * SHAPE_KEYS.length)]

/**
 * 旋转方块坐标（顺时针90度）
 * @param {Array} cells - 方块坐标数组
 * @returns {Array} 旋转后的坐标
 */
const rotateCells = (cells) => {
  // 找到边界来计算旋转中心
  const maxY = Math.max(...cells.map(c => c[1]))
  return cells.map(([x, y]) => [maxY - y, x])
}

/**
 * 创建空白棋盘
 * @returns {Array} ROWS x COLS 的二维数组
 */
const createBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null))

const TetrisGame = () => {
  // ==================== 状态定义 ====================
  const [phase, setPhase] = useState('start')     // 'start' | 'playing' | 'over'
  const [board, setBoard] = useState(createBoard)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [lines, setLines] = useState(0)
  const [paused, setPaused] = useState(false)

  // 当前方块
  const [currentPiece, setCurrentPiece] = useState(null)
  // 下一个方块
  const [nextShape, setNextShape] = useState(randomShape)

  // Refs
  const boardRef = useRef(board)
  const pieceRef = useRef(currentPiece)
  const scoreRef = useRef(score)
  const levelRef = useRef(level)
  const linesRef = useRef(lines)
  const pausedRef = useRef(paused)
  const canvasRef = useRef(null)
  const previewRef = useRef(null)
  const timerRef = useRef(null)

  // 同步 ref
  useEffect(() => { boardRef.current = board }, [board])
  useEffect(() => { pieceRef.current = currentPiece }, [currentPiece])
  useEffect(() => { scoreRef.current = score }, [score])
  useEffect(() => { levelRef.current = level }, [level])
  useEffect(() => { linesRef.current = lines }, [lines])
  useEffect(() => { pausedRef.current = paused }, [paused])

  /** 碰撞检测 —— 检查方块在指定位置是否合法 */
  const isValid = useCallback((cells, offX, offY, brd) => {
    return cells.every(([cx, cy]) => {
      const nx = cx + offX
      const ny = cy + offY
      if (nx < 0 || nx >= COLS || ny >= ROWS) { return false }
      if (ny < 0) { return true }
      return !brd[ny][nx]
    })
  }, [])

  /** 生成新方块 */
  const spawnPiece = useCallback((shapeKey) => {
    const shape = SHAPES[shapeKey]
    return { key: shapeKey, cells: shape.cells.map(c => [...c]), x: 3, y: -1, color: shape.color }
  }, [])

  /** 开始游戏 */
  const startGame = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current) }
    const newBoard = createBoard()
    const first = randomShape()
    const next = randomShape()
    const piece = spawnPiece(first)
    setBoard(newBoard); boardRef.current = newBoard
    setCurrentPiece(piece); pieceRef.current = piece
    setNextShape(next)
    setScore(0); scoreRef.current = 0
    setLevel(1); levelRef.current = 1
    setLines(0); linesRef.current = 0
    setPaused(false); pausedRef.current = false
    setPhase('playing')
  }, [spawnPiece])

  /** 移动方块（dx水平，dy垂直） */
  const movePiece = useCallback((dx, dy) => {
    if (pausedRef.current) { return false }
    const p = pieceRef.current
    if (!p) { return false }
    if (isValid(p.cells, p.x + dx, p.y + dy, boardRef.current)) {
      const np = { ...p, x: p.x + dx, y: p.y + dy }
      setCurrentPiece(np); pieceRef.current = np
      return true
    }
    return false
  }, [isValid])

  /** 旋转方块 */
  const rotatePiece = useCallback(() => {
    if (pausedRef.current) { return }
    const p = pieceRef.current
    if (!p || p.key === 'O') { return }
    const newCells = rotateCells(p.cells)
    // 尝试原位旋转，不行就左移/右移1格（wall kick）
    for (const kick of [0, -1, 1, -2, 2]) {
      if (isValid(newCells, p.x + kick, p.y, boardRef.current)) {
        const np = { ...p, cells: newCells, x: p.x + kick }
        setCurrentPiece(np); pieceRef.current = np
        return
      }
    }
  }, [isValid])

  /** 锁定方块到棋盘 + 消行 + 生成新方块 */
  const lockPiece = useCallback((piece) => {
    const brd = boardRef.current.map(row => [...row])
    // 将方块写入棋盘
    piece.cells.forEach(([cx, cy]) => {
      const nx = cx + piece.x
      const ny = cy + piece.y
      if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS) {
        brd[ny][nx] = piece.color
      }
    })
    // 消行
    let cleared = 0
    for (let r = ROWS - 1; r >= 0; r--) {
      if (brd[r].every(cell => cell !== null)) {
        brd.splice(r, 1)
        brd.unshift(Array(COLS).fill(null))
        cleared++
        r++ // 重新检查当前行
      }
    }
    // 计分（1行100、2行300、3行500、4行800）
    const pts = [0, 100, 300, 500, 800]
    const newScore = scoreRef.current + (pts[cleared] || 0)
    const newLines = linesRef.current + cleared
    const newLevel = Math.floor(newLines / 10) + 1
    setBoard(brd); boardRef.current = brd
    setScore(newScore); scoreRef.current = newScore
    setLines(newLines); linesRef.current = newLines
    setLevel(newLevel); levelRef.current = newLevel
    // 保存最高分
    const best = parseInt(localStorage.getItem('tetris_best') || '0', 10)
    if (newScore > best) { localStorage.setItem('tetris_best', String(newScore)) }
    // 生成新方块
    const ns = nextShape
    const newNext = randomShape()
    const newPiece = spawnPiece(ns)
    setNextShape(newNext)
    // 检查新方块是否能放下（游戏结束判定）
    if (!isValid(newPiece.cells, newPiece.x, newPiece.y, brd)) {
      setPhase('over')
      if (timerRef.current) { clearInterval(timerRef.current) }
      return
    }
    setCurrentPiece(newPiece); pieceRef.current = newPiece
  }, [isValid, spawnPiece, nextShape])

  /** 硬降（直接落到底） */
  const hardDrop = useCallback(() => {
    if (pausedRef.current) { return }
    const p = pieceRef.current
    if (!p) { return }
    let dy = 0
    while (isValid(p.cells, p.x, p.y + dy + 1, boardRef.current)) { dy++ }
    const np = { ...p, y: p.y + dy }
    setCurrentPiece(np); pieceRef.current = np
    // 硬降后立即锁定
    lockPiece(np)
  }, [isValid, lockPiece])

  /** 暂停/继续 */
  const togglePause = useCallback(() => {
    setPaused(p => !p)
    pausedRef.current = !pausedRef.current
  }, [])

  /** 绘制主棋盘 */
  const draw = useCallback(() => {
    const cvs = canvasRef.current
    if (!cvs) { return }
    const ctx = cvs.getContext('2d')
    ctx.clearRect(0, 0, cvs.width, cvs.height)
    // 背景
    ctx.fillStyle = '#FFF8F0'
    ctx.fillRect(0, 0, cvs.width, cvs.height)
    // 网格线
    ctx.strokeStyle = 'rgba(255,212,163,0.25)'
    ctx.lineWidth = 0.5
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath(); ctx.moveTo(x * CELL, 0)
      ctx.lineTo(x * CELL, cvs.height); ctx.stroke()
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath(); ctx.moveTo(0, y * CELL)
      ctx.lineTo(cvs.width, y * CELL); ctx.stroke()
    }
    // 已固定方块
    const brd = boardRef.current
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (brd[r][c]) {
          ctx.fillStyle = brd[r][c]
          ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2)
          ctx.fillStyle = 'rgba(255,255,255,0.3)'
          ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, 3)
        }
      }
    }
    // 当前方块 + 落影
    const p = pieceRef.current
    if (p) {
      // 落影
      let ghostY = p.y
      while (isValid(p.cells, p.x, ghostY + 1, brd)) { ghostY++ }
      ctx.fillStyle = 'rgba(255,159,69,0.15)'
      p.cells.forEach(([cx, cy]) => {
        const gx = cx + p.x, gy = cy + ghostY
        if (gy >= 0) { ctx.fillRect(gx * CELL + 1, gy * CELL + 1, CELL - 2, CELL - 2) }
      })
      // 当前方块
      ctx.fillStyle = p.color
      p.cells.forEach(([cx, cy]) => {
        const px = cx + p.x, py = cy + p.y
        if (py >= 0) {
          ctx.fillRect(px * CELL + 1, py * CELL + 1, CELL - 2, CELL - 2)
          ctx.fillStyle = 'rgba(255,255,255,0.35)'
          ctx.fillRect(px * CELL + 1, py * CELL + 1, CELL - 2, 4)
          ctx.fillStyle = p.color
        }
      })
    }
  }, [isValid])

  /** 绘制预览区 */
  const drawPreview = useCallback(() => {
    const cvs = previewRef.current
    if (!cvs) { return }
    const ctx = cvs.getContext('2d')
    ctx.clearRect(0, 0, cvs.width, cvs.height)
    ctx.fillStyle = '#FFF8F0'
    ctx.fillRect(0, 0, cvs.width, cvs.height)
    const shape = SHAPES[nextShape]
    if (!shape) { return }
    const off = PREVIEW_CELL
    ctx.fillStyle = shape.color
    shape.cells.forEach(([cx, cy]) => {
      ctx.fillRect(cx * off + off / 2, cy * off + off / 2, off - 2, off - 2)
    })
  }, [nextShape])

  // ==================== 键盘事件 ====================
  useEffect(() => {
    const handleKey = (e) => {
      if (phase !== 'playing') { return }
      switch (e.key) {
        case 'ArrowLeft': e.preventDefault(); movePiece(-1, 0); break
        case 'ArrowRight': e.preventDefault(); movePiece(1, 0); break
        case 'ArrowUp': e.preventDefault(); rotatePiece(); break
        case 'ArrowDown': e.preventDefault(); movePiece(0, 1); break
        case ' ': e.preventDefault(); hardDrop(); break
        case 'p': case 'P': e.preventDefault(); togglePause(); break
        default: break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [phase, movePiece, rotatePiece, hardDrop, togglePause])

  // ==================== 自动下落定时器 ====================
  useEffect(() => {
    if (phase !== 'playing') { return }
    const spd = Math.max(100, BASE_SPEED - (level - 1) * 80)
    if (timerRef.current) { clearInterval(timerRef.current) }
    timerRef.current = setInterval(() => {
      if (pausedRef.current) { return }
      const p = pieceRef.current
      if (!p) { return }
      if (!isValid(p.cells, p.x, p.y + 1, boardRef.current)) {
        lockPiece(p)
      } else {
        const np = { ...p, y: p.y + 1 }
        setCurrentPiece(np); pieceRef.current = np
      }
    }, spd)
    return () => { if (timerRef.current) { clearInterval(timerRef.current) } }
  }, [phase, level, isValid, lockPiece])

  // ==================== 绘制触发 ====================
  useEffect(() => {
    if (phase === 'playing') { draw(); drawPreview() }
  }, [phase, board, currentPiece, nextShape, draw, drawPreview])

  // ==================== 渲染：开始界面 ====================
  if (phase === 'start') {
    return (
      <div className="tetris-game-container">
        <div className="tetris-start-screen">
          <div className="game-icon">🧱</div>
          <h1 className="game-title">俄罗斯方块</h1>
          <p className="game-desc">
            经典中的经典！消除整行方块获得分数，<br />
            随着等级提升，方块下落速度加快！
          </p>
          <div className="tetris-controls-info">
            <h4>🎮 操作说明</h4>
            <div className="control-row">
              <span className="control-key">← →</span>
              <span>左右移动</span>
            </div>
            <div className="control-row">
              <span className="control-key">↑</span>
              <span>旋转方块</span>
            </div>
            <div className="control-row">
              <span className="control-key">↓</span>
              <span>加速下落</span>
            </div>
            <div className="control-row">
              <span className="control-key">空格</span>
              <span>直接落底</span>
            </div>
          </div>
          <button className="tetris-start-btn" onClick={() => startGame()}>
            <span>▶️</span>
            <span>开始游戏</span>
          </button>
        </div>
      </div>
    )
  }

  // ==================== 渲染：游戏结束 ====================
  if (phase === 'over') {
    return (
      <div className="tetris-game-container">
        <div className="tetris-game-over">
          <div className="over-icon">💥</div>
          <h2 className="over-title">游戏结束</h2>
          <div className="over-stats">
            <div className="stat-card">
              <div className="stat-label">得分</div>
              <div className="stat-num">{score}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">等级</div>
              <div className="stat-num">{level}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">消除行</div>
              <div className="stat-num">{lines}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">最高分</div>
              <div className="stat-num">
                {Math.max(score, parseInt(localStorage.getItem('tetris_best') || '0', 10))}
              </div>
            </div>
          </div>
          <button className="tetris-start-btn" onClick={() => startGame()}>
            <span>🔄</span>
            <span>再来一局</span>
          </button>
        </div>
      </div>
    )
  }

  // ==================== 渲染：游戏进行中 ====================
  return (
    <div className="tetris-game-container">
      <div className="tetris-game-board">
        {/* 暂停遮罩 */}
        {paused && (
          <div className="tetris-pause-overlay">
            <div className="tetris-pause-text">⏸️ 已暂停</div>
          </div>
        )}

        {/* 左侧：主游戏区 */}
        <div className="tetris-main-area">
          <div className="tetris-canvas-wrap">
            <canvas ref={canvasRef} width={COLS * CELL} height={ROWS * CELL} />
          </div>
          {/* 控制按钮 */}
          <div className="tetris-btn-group">
            <button className="tetris-btn tetris-btn-pause" onClick={() => togglePause()}>
              {paused ? '▶️ 继续' : '⏸️ 暂停'}
            </button>
            <button className="tetris-btn tetris-btn-restart" onClick={() => startGame()}>
              🔄 重开
            </button>
          </div>
        </div>

        {/* 右侧：信息面板 */}
        <div className="tetris-side-panel">
          <div className="tetris-next-preview">
            <div className="preview-label">下一个</div>
            <canvas
              ref={previewRef}
              className="tetris-next-canvas"
              width={PREVIEW_CELL * 5}
              height={PREVIEW_CELL * 4}
            />
          </div>
          <div className="tetris-info-card">
            <div className="info-label">🏆 得分</div>
            <div className="info-value">{score}</div>
          </div>
          <div className="tetris-info-card">
            <div className="info-label">📊 等级</div>
            <div className="info-value">{level}</div>
          </div>
          <div className="tetris-info-card">
            <div className="info-label">📏 消行</div>
            <div className="info-value">{lines}</div>
          </div>
        </div>
      </div>

      {/* 移动端虚拟按钮 */}
      <div className="tetris-mobile-controls">
        <button className="tetris-mobile-btn" onClick={() => movePiece(-1, 0)}>◀</button>
        <button className="tetris-mobile-btn" onClick={() => rotatePiece()}>🔄</button>
        <button className="tetris-mobile-btn" onClick={() => movePiece(1, 0)}>▶</button>
        <button className="tetris-mobile-btn" onClick={() => movePiece(0, 1)}>▼</button>
        <button className="tetris-mobile-btn wide" onClick={() => hardDrop()}>⬇ 落底</button>
      </div>
    </div>
  )
}

export default TetrisGame
