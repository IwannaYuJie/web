import { useState, useEffect, useRef, useCallback } from 'react'
import './Gobang.css'

/**
 * 智能五子棋对战小游戏 🌌
 *
 * 玩法：支持单人对局（对战智能启发式 AI）与本地双人对战。
 * 视觉风格：赛博朋克暗色调霓虹棋盘，支持落子水波纹与获胜连线闪烁效果。
 */

const GRID_SIZE = 15 // 15x15 棋盘
const CELL_SIZE = 26 // 每个格子的间距
const PADDING = 28 // 边缘留白
const CANVAS_SIZE = PADDING * 2 + (GRID_SIZE - 1) * CELL_SIZE // 420px

// 方向向量：右、下、右下、右上
const DIRECTIONS = [
  { dr: 0, dc: 1 },
  { dr: 1, dc: 0 },
  { dr: 1, dc: 1 },
  { dr: 1, dc: -1 },
]

const Gobang = ({ onExit }) => {
  const [mode, setMode] = useState('pve') // 'pve' | 'pvp'
  const [phase, setPhase] = useState('start') // 'start' | 'playing' | 'won' | 'draw'
  const [board, setBoard] = useState(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)))
  const [turn, setTurn] = useState('black') // 'black' | 'white'
  const [winner, setWinner] = useState(null) // 'black' | 'white' | 'draw'
  const [winningLine, setWinningLine] = useState([]) // 获胜的五个点，用来画连线

  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const ripplesRef = useRef([]) // 存放落子水波纹特效: { r, c, radius, maxRadius, color, alpha }

  // 最好记录本地存储
  const [pveRecord, setPveRecord] = useState(() => {
    const rec = localStorage.getItem('gobang_pve_record')
    return rec ? JSON.parse(rec) : { win: 0, lose: 0 }
  })

  // 重置棋盘
  const resetGame = useCallback(() => {
    setBoard(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)))
    setTurn('black')
    setWinner(null)
    setWinningLine([])
    ripplesRef.current = []
    setPhase('playing')
  }, [])

  // 开始新游戏（可选模式）
  const startGame = (selectedMode) => {
    setMode(selectedMode)
    resetGame()
  }

  // ==================== 胜负判定算法 ====================
  const checkWin = useCallback((currentBoard, r, c, color) => {
    for (const { dr, dc } of DIRECTIONS) {
      const line = [{ r, c }]

      // 正向查找
      let nr = r + dr
      let nc = c + dc
      while (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && currentBoard[nr][nc] === color) {
        line.push({ r: nr, c: nc })
        nr += dr
        nc += dc
      }

      // 反向查找
      nr = r - dr
      nc = c - dc
      while (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && currentBoard[nr][nc] === color) {
        line.unshift({ r: nr, c: nc })
        nr -= dr
        nc -= dc
      }

      if (line.length >= 5) {
        return line.slice(0, 5) // 返回前五个获胜的坐标点
      }
    }
    return null
  }, [])

  // 判定平局
  const checkDraw = (currentBoard) => {
    return currentBoard.every(row => row.every(cell => cell !== null))
  }

  // ==================== 智能启发式 AI 算法 ====================
  // 评估空点分数
  const evaluateCell = useCallback((currentBoard, r, c, color) => {
    let score = 0

    for (const { dr, dc } of DIRECTIONS) {
      let count = 1 // 自己在这个方向能连成的石子数
      let openEnds = 0 // 两端空白的端口数
      
      // 正向探测
      let i = 1
      while (i <= 4) {
        const nr = r + dr * i
        const nc = c + dc * i
        if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) {
          break
        }
        if (currentBoard[nr][nc] === color) {
          count++
        } else if (currentBoard[nr][nc] === null) {
          openEnds++
          break
        } else {
          break
        }
        i++
      }

      // 反向探测
      i = 1
      while (i <= 4) {
        const nr = r - dr * i
        const nc = c - dc * i
        if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) {
          break
        }
        if (currentBoard[nr][nc] === color) {
          count++
        } else if (currentBoard[nr][nc] === null) {
          openEnds++
          break
        } else {
          break
        }
        i++
      }

      // 根据这个方向上棋子相连和两端是否被堵来评分
      if (count >= 5) {
        score += 100000 // 成五，无敌分
      } else if (count === 4) {
        if (openEnds === 2) {
          score += 15000 // 活四
        } else if (openEnds === 1) {
          score += 2500 // 冲四/半开四
        }
      } else if (count === 3) {
        if (openEnds === 2) {
          score += 3000 // 活三
        } else if (openEnds === 1) {
          score += 500 // 冲三
        }
      } else if (count === 2) {
        if (openEnds === 2) {
          score += 400 // 活二
        } else if (openEnds === 1) {
          score += 50 // 冲二
        }
      } else if (count === 1) {
        if (openEnds === 2) {
          score += 10 // 活一
        }
      }
    }
    return score
  }, [])

  // 获取 AI 最优落子位置
  const getBestAIMove = useCallback((currentBoard) => {
    let maxScore = -1
    let bestMoves = []

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (currentBoard[r][c] !== null) {
          continue
        }

        // 1. 进攻评分：AI 执白
        const attackScore = evaluateCell(currentBoard, r, c, 'white')
        // 2. 防守评分：防守黑棋
        const defenseScore = evaluateCell(currentBoard, r, c, 'black')

        // 综合打分：优先进攻 (进攻权重 1.25，防守权重 1.0)
        const cellScore = attackScore * 1.25 + defenseScore

        if (cellScore > maxScore) {
          maxScore = cellScore
          bestMoves = [{ r, c }]
        } else if (cellScore === maxScore) {
          bestMoves.push({ r, c })
        }
      }
    }

    // 棋盘中央的权重（越靠近中心越优先，用于平分决策）
    let bestMove = bestMoves[0]
    let minDistance = 999
    bestMoves.forEach(m => {
      const dist = Math.abs(m.r - 7) + Math.abs(m.c - 7)
      if (dist < minDistance) {
        minDistance = dist
        bestMove = m
      }
    })

    return bestMove
  }, [evaluateCell])

  // AI 思考并下子
  const makeAIMove = useCallback((currentBoard) => {
    // 延迟 300ms 模拟思考
    setTimeout(() => {
      if (phase !== 'playing') {
        return
      }

      const move = getBestAIMove(currentBoard)
      if (!move) {
        return
      }

      const { r, c } = move
      const nextBoard = currentBoard.map(row => [...row])
      nextBoard[r][c] = 'white'
      setBoard(nextBoard)

      // 触发水波纹动画
      ripplesRef.current.push({
        x: PADDING + c * CELL_SIZE,
        y: PADDING + r * CELL_SIZE,
        radius: 4,
        maxRadius: 24,
        color: 'rgba(236, 72, 153, 0.7)', // 霓虹粉
        alpha: 1.0,
      })

      // 检测胜负
      const line = checkWin(nextBoard, r, c, 'white')
      if (line) {
        setWinner('white')
        setWinningLine(line)
        setPhase('won')
        // 更新记录
        const newRecord = { ...pveRecord, lose: pveRecord.lose + 1 }
        setPveRecord(newRecord)
        localStorage.setItem('gobang_pve_record', JSON.stringify(newRecord))
      } else if (checkDraw(nextBoard)) {
        setWinner('draw')
        setPhase('draw')
      } else {
        setTurn('black')
      }
    }, 350)
  }, [phase, getBestAIMove, checkWin, pveRecord])

  // ==================== 玩家落子 ====================
  const handleBoardClick = (e) => {
    if (phase !== 'playing') {
      return
    }
    if (mode === 'pve' && turn === 'white') {
      return // AI 回合不能落子
    }

    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // 计算点击格子的坐标点
    const c = Math.round((x - PADDING) / CELL_SIZE)
    const r = Math.round((y - PADDING) / CELL_SIZE)

    // 溢出或占位检查
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE || board[r][c] !== null) {
      return
    }

    const nextBoard = board.map(row => [...row])
    const currentColor = turn
    nextBoard[r][c] = currentColor
    setBoard(nextBoard)

    // 落子音效水波纹
    ripplesRef.current.push({
      x: PADDING + c * CELL_SIZE,
      y: PADDING + r * CELL_SIZE,
      radius: 4,
      maxRadius: 24,
      color: currentColor === 'black' ? 'rgba(59, 130, 246, 0.7)' : 'rgba(236, 72, 153, 0.7)',
      alpha: 1.0,
    })

    // 检测胜利
    const line = checkWin(nextBoard, r, c, currentColor)
    if (line) {
      setWinner(currentColor)
      setWinningLine(line)
      setPhase('won')

      if (mode === 'pve') {
        const newRecord = { ...pveRecord, win: pveRecord.win + 1 }
        setPveRecord(newRecord)
        localStorage.setItem('gobang_pve_record', JSON.stringify(newRecord))
      }
    } else if (checkDraw(nextBoard)) {
      setWinner('draw')
      setPhase('draw')
    } else {
      // 轮换回合
      const nextTurn = currentColor === 'black' ? 'white' : 'black'
      setTurn(nextTurn)
      if (mode === 'pve' && nextTurn === 'white') {
        makeAIMove(nextBoard)
      }
    }
  }

  // ==================== Canvas 渲染核心 ====================

  const drawBoard = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    const ctx = canvas.getContext('2d')
    const stateRipples = ripplesRef.current

    // 清屏，用非常深沉的黑蓝色背景
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    ctx.fillStyle = '#0F172A'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // 1. 绘制网格线 - 赛博蓝色霓虹感
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.16)'
    ctx.lineWidth = 1

    for (let i = 0; i < GRID_SIZE; i++) {
      // 横线
      ctx.beginPath()
      ctx.moveTo(PADDING, PADDING + i * CELL_SIZE)
      ctx.lineTo(CANVAS_SIZE - PADDING, PADDING + i * CELL_SIZE)
      ctx.stroke()

      // 竖线
      ctx.beginPath()
      ctx.moveTo(PADDING + i * CELL_SIZE, PADDING)
      ctx.lineTo(PADDING + i * CELL_SIZE, CANVAS_SIZE - PADDING)
      ctx.stroke()
    }

    // 2. 绘制星位（九个特殊定位圆点，古棋盘传统）
    ctx.fillStyle = '#3B82F6'
    const stars = [3, 7, 11]
    stars.forEach(r => {
      stars.forEach(c => {
        ctx.beginPath()
        ctx.arc(PADDING + c * CELL_SIZE, PADDING + r * CELL_SIZE, 3, 0, Math.PI * 2)
        ctx.fill()
        // 加微弱呼吸发光
        ctx.shadowColor = '#3B82F6'
        ctx.shadowBlur = 4
        ctx.fill()
        ctx.shadowBlur = 0 // 重置
      })
    })

    // 3. 绘制水波纹动画粒子
    stateRipples.forEach((rip) => {
      ctx.save()
      ctx.strokeStyle = rip.color
      ctx.lineWidth = 2 * rip.alpha
      ctx.beginPath()
      ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()

      // 展开并淡出
      rip.radius += 1.2
      rip.alpha -= 0.04
    })
    ripplesRef.current = stateRipples.filter(r => r.alpha > 0)

    // 4. 绘制棋子
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = board[r][c]
        if (cell === null) {
          continue
        }

        const cx = PADDING + c * CELL_SIZE
        const cy = PADDING + r * CELL_SIZE

        ctx.save()

        // 黑色棋子：代表赛博蓝色霓虹
        if (cell === 'black') {
          // 霓虹背光发光阴影
          ctx.shadowColor = '#3B82F6'
          ctx.shadowBlur = 10
          ctx.fillStyle = '#2563EB'
          ctx.beginPath()
          ctx.arc(cx, cy, 10, 0, Math.PI * 2)
          ctx.fill()

          // 高亮光圈
          ctx.shadowBlur = 0
          ctx.strokeStyle = '#60A5FA'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(cx, cy, 10, 0, Math.PI * 2)
          ctx.stroke()

          // 核心白色反光点
          ctx.fillStyle = '#E0F2FE'
          ctx.beginPath()
          ctx.arc(cx - 3, cy - 3, 2.5, 0, Math.PI * 2)
          ctx.fill()
        }

        // 白色棋子：代表赛博粉色霓虹
        if (cell === 'white') {
          ctx.shadowColor = '#EC4899'
          ctx.shadowBlur = 10
          ctx.fillStyle = '#DB2777'
          ctx.beginPath()
          ctx.arc(cx, cy, 10, 0, Math.PI * 2)
          ctx.fill()

          // 高亮光圈
          ctx.shadowBlur = 0
          ctx.strokeStyle = '#F472B6'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(cx, cy, 10, 0, Math.PI * 2)
          ctx.stroke()

          // 核心反光点
          ctx.fillStyle = '#FCE7F3'
          ctx.beginPath()
          ctx.arc(cx - 3, cy - 3, 2.5, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.restore()
      }
    }

    // 5. 获胜时绘制霓虹闪烁连线
    if (phase === 'won' && winningLine.length >= 5) {
      ctx.save()
      const color = winner === 'black' ? '#60A5FA' : '#F472B6'
      ctx.strokeStyle = color
      // 闪烁粗线
      const blink = Math.sin(Date.now() * 0.01) * 2 + 5
      ctx.shadowColor = color
      ctx.shadowBlur = blink + 4
      ctx.lineWidth = 4
      ctx.lineCap = 'round'

      ctx.beginPath()
      const first = winningLine[0]
      ctx.moveTo(PADDING + first.c * CELL_SIZE, PADDING + first.r * CELL_SIZE)
      for (let i = 1; i < winningLine.length; i++) {
        const pt = winningLine[i]
        ctx.lineTo(PADDING + pt.c * CELL_SIZE, PADDING + pt.r * CELL_SIZE)
      }
      ctx.stroke()
      ctx.restore()
    }
  }, [board, phase, winner, winningLine])

  // 定时重绘动画帧
  useEffect(() => {
    const loop = () => {
      drawBoard()
      animRef.current = requestAnimationFrame(loop)
    }
    loop()
    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current)
      }
    }
  }, [drawBoard])

  // 清零战绩
  const clearRecord = () => {
    const fresh = { win: 0, lose: 0 }
    setPveRecord(fresh)
    localStorage.setItem('gobang_pve_record', JSON.stringify(fresh))
  }

  // ==================== 渲染 HTML ====================

  // 1. 开始屏幕
  if (phase === 'start') {
    return (
      <div className="gobang-container">
        <div className="gobang-console">
          <div className="game-icon">🌌</div>
          <h1 className="game-title">智能霓虹五子棋</h1>
          <p className="game-desc">
            赛博霓虹风格的经典五子棋对决！<br />
            您可以挑战内置的智能启发式计算 AI，也可以和旁边的好友来一局线下 PK。
          </p>

          <div className="gobang-mode-select">
            <button className="gobang-btn pve" onClick={() => startGame('pve')}>
              🤖 对战智能 AI
            </button>
            <button className="gobang-btn pvp" onClick={() => startGame('pvp')}>
              👥 本地双人对决
            </button>
          </div>

          <div className="flappy-controls-info" style={{ display: 'inline-block', width: '100%', margin: '0 auto 12px' }}>
            <h4>🏆 PVE 挑战记录</h4>
            <div className="control-row">
              <span style={{ marginRight: '16px' }}>胜: <b style={{ color: '#3B82F6' }}>{pveRecord.win}</b></span>
              <span>败: <b style={{ color: '#EC4899' }}>{pveRecord.lose}</b></span>
              <button onClick={clearRecord} style={{ marginLeft: '16px', background: 'transparent', border: 'none', textDecoration: 'underline', color: 'var(--ink-soft)', cursor: 'pointer', fontSize: '12px' }}>清空记录</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 2. 游戏进行中 / 结束
  return (
    <div className="gobang-container">
      <div className="gobang-board-wrapper">
        {/* 顶部指示栏 */}
        <div className="gobang-status-row">
          <div className="gobang-turn-indicator">
            <span>执子回合:</span>
            <div className={`gobang-indicator-dot ${turn}`} />
            <span>{turn === 'black' ? (mode === 'pve' ? '你 (蓝霓) ' : '蓝子玩家') : (mode === 'pve' ? 'AI (粉霓) ' : '粉子玩家')}</span>
          </div>

          <div className="gobang-stat">
            <span>模式:</span>
            <span style={{ color: 'var(--ink)' }}>{mode === 'pve' ? '🤖 对抗AI' : '👥 双人'}</span>
          </div>
        </div>

        {/* 棋盘 Canvas */}
        <div className="gobang-board-canvas-box" onClick={handleBoardClick}>
          <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} />
        </div>

        {/* 结果公示弹板 */}
        {(phase === 'won' || phase === 'draw') && (
          <div className="gobang-result-panel">
            <h3>
              {phase === 'draw'
                ? '🤝 势均力敌！棋逢对手'
                : winner === 'black'
                ? `🎉 蓝子方 (${mode === 'pve' ? '你' : '蓝方'}) 获得胜利！`
                : `🏆 粉子方 (${mode === 'pve' ? 'AI' : '粉方'}) 获得胜利！`}
            </h3>
            <p>{phase === 'draw' ? '棋盘落满了子，本次以平局收尾。' : '成功的将五子连成一线，实力超群！'}</p>
            <div className="gobang-action-row" style={{ justifyContent: 'center', margin: 0 }}>
              <button className="gobang-btn" onClick={() => resetGame()}>
                🔄 再来一盘
              </button>
              <button className="gobang-btn secondary" onClick={() => setPhase('start')}>
                ⚙️ 模式选择
              </button>
            </div>
          </div>
        )}

        {/* 控制按钮 */}
        <div className="gobang-action-row">
          <button className="gobang-btn secondary" onClick={() => resetGame()}>
            🔄 重新开始
          </button>
          <button className="gobang-btn secondary" onClick={() => setPhase('start')}>
            ⚙️ 返回主页
          </button>
          {onExit && (
            <button className="gobang-btn secondary" onClick={onExit}>
              ← 退出游戏
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Gobang
