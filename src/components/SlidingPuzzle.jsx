import { useState, useCallback, useEffect, useRef } from 'react'
import './SlidingPuzzle.css'

/**
 * 数字华容道 🧩
 * 4x4 数字滑块，复原 1-15 顺序
 */

const SIZE = 4
const TOTAL = SIZE * SIZE
const SOLVED = Array.from({ length: TOTAL }, (_, i) => (i + 1) % TOTAL)

const cloneSolved = () => SOLVED.slice()

/** 通过从解状态做大量随机合法移动，保证生成的局面一定可解 */
const generateBoard = () => {
  const board = cloneSolved()
  let emptyIdx = TOTAL - 1
  let lastMoved = -1
  const steps = 200
  for (let i = 0; i < steps; i++) {
    const neighbors = getNeighbors(emptyIdx).filter((n) => n !== lastMoved)
    const next = neighbors[Math.floor(Math.random() * neighbors.length)]
    board[emptyIdx] = board[next]
    board[next] = 0
    lastMoved = emptyIdx
    emptyIdx = next
  }
  return board
}

const getNeighbors = (idx) => {
  const r = Math.floor(idx / SIZE)
  const c = idx % SIZE
  const out = []
  if (r > 0) out.push(idx - SIZE)
  if (r < SIZE - 1) out.push(idx + SIZE)
  if (c > 0) out.push(idx - 1)
  if (c < SIZE - 1) out.push(idx + 1)
  return out
}

const isSolved = (board) => {
  for (let i = 0; i < TOTAL; i++) {
    if (board[i] !== SOLVED[i]) return false
  }
  return true
}

const formatTime = (sec) => {
  const m = Math.floor(sec / 60).toString().padStart(2, '0')
  const s = (sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

const SlidingPuzzle = () => {
  const [phase, setPhase] = useState('start')
  const [board, setBoard] = useState(cloneSolved)
  const [moves, setMoves] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [bestMoves, setBestMoves] = useState(() =>
    parseInt(localStorage.getItem('slide_best_moves') || '0', 10),
  )
  const [bestTime, setBestTime] = useState(() =>
    parseInt(localStorage.getItem('slide_best_time') || '0', 10),
  )
  const timerRef = useRef(null)

  useEffect(() => {
    if (phase !== 'playing') return undefined
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [phase])

  const startGame = useCallback(() => {
    setBoard(generateBoard())
    setMoves(0)
    setSeconds(0)
    setPhase('playing')
  }, [])

  const handleTileClick = useCallback(
    (idx) => {
      if (phase !== 'playing') return
      const emptyIdx = board.indexOf(0)
      if (!getNeighbors(emptyIdx).includes(idx)) return

      const next = board.slice()
      next[emptyIdx] = next[idx]
      next[idx] = 0
      const newMoves = moves + 1
      setBoard(next)
      setMoves(newMoves)

      if (isSolved(next)) {
        clearInterval(timerRef.current)
        const finalTime = seconds
        const newBestMoves =
          bestMoves === 0 ? newMoves : Math.min(bestMoves, newMoves)
        const newBestTime =
          bestTime === 0 ? finalTime : Math.min(bestTime, finalTime)
        setBestMoves(newBestMoves)
        setBestTime(newBestTime)
        localStorage.setItem('slide_best_moves', String(newBestMoves))
        localStorage.setItem('slide_best_time', String(newBestTime))
        setTimeout(() => setPhase('won'), 250)
      }
    },
    [board, moves, seconds, bestMoves, bestTime, phase],
  )

  if (phase === 'start') {
    return (
      <div className="slide-container">
        <div className="slide-panel">
          <div className="game-icon">🧩</div>
          <h1 className="game-title">数字华容道</h1>
          <p className="game-desc">
            点击空格旁的数字方块滑动它，<br />
            把 1-15 按顺序复原！
          </p>
          <button className="slide-start-btn" onClick={startGame}>
            <span>▶️</span><span>开始游戏</span>
          </button>
          {bestMoves > 0 && (
            <div className="slide-best-line">
              最佳：{bestMoves} 步 · {formatTime(bestTime)}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (phase === 'won') {
    return (
      <div className="slide-container">
        <div className="slide-panel">
          <div className="game-icon">🎉</div>
          <h2 className="game-title">复原成功！</h2>
          <div className="slide-over-stats">
            <div className="stat-card">
              <div className="stat-label">用时</div>
              <div className="stat-num">{formatTime(seconds)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">步数</div>
              <div className="stat-num">{moves}</div>
            </div>
          </div>
          <div className="slide-best-line">
            最佳：{bestMoves} 步 · {formatTime(bestTime)}
          </div>
          <button className="slide-start-btn" onClick={startGame}>
            <span>🔄</span><span>再来一局</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="slide-container">
      <div className="slide-board">
        <div className="slide-status">
          <div className="slide-stat">
            <span>👆</span><span>步数</span>
            <span className="stat-value">{moves}</span>
          </div>
          <div className="slide-stat">
            <span>⏱️</span><span>用时</span>
            <span className="stat-value">{formatTime(seconds)}</span>
          </div>
        </div>

        <div className="slide-grid">
          {board.map((value, idx) => (
            <button
              type="button"
              key={idx}
              className={`slide-tile${value === 0 ? ' empty' : ''}${
                value !== 0 && value === SOLVED[idx] ? ' settled' : ''
              }`}
              onClick={() => handleTileClick(idx)}
              disabled={value === 0}
            >
              {value !== 0 ? value : ''}
            </button>
          ))}
        </div>

        <div className="slide-btn-group">
          <button className="slide-btn-restart" onClick={startGame}>
            🔄 重新打乱
          </button>
        </div>
      </div>
    </div>
  )
}

export default SlidingPuzzle
