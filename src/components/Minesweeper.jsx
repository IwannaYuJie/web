import { useState, useCallback } from 'react'
import './Minesweeper.css'

/**
 * 扫雷游戏 💣
 * 橘猫主题风格
 * 左键揭开，右键/插旗按钮 标记地雷
 */

const ROWS = 9
const COLS = 9
const MINES = 10

const createEmptyBoard = () => Array.from({ length: ROWS }, () =>
  Array.from({ length: COLS }, () => ({
    mine: false, revealed: false, flagged: false, num: 0,
  }))
)

/** 创建棋盘 */
const createBoard = (firstR, firstC) => {
  const board = createEmptyBoard()
  // 布雷（避开第一次点击位置）
  let placed = 0
  while (placed < MINES) {
    const r = Math.floor(Math.random() * ROWS)
    const c = Math.floor(Math.random() * COLS)
    if (board[r][c].mine) { continue }
    if (Math.abs(r - firstR) <= 1 && Math.abs(c - firstC) <= 1) { continue }
    board[r][c].mine = true
    placed++
  }
  // 计算数字
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c].mine) { continue }
      let cnt = 0
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc].mine) { cnt++ }
        }
      }
      board[r][c].num = cnt
    }
  }
  return board
}

const Minesweeper = () => {
  const [phase, setPhase] = useState('start') // 'start'|'playing'|'won'|'lost'
  const [board, setBoard] = useState([])
  const [flagMode, setFlagMode] = useState(false)
  const [minesLeft, setMinesLeft] = useState(MINES)
  const [firstClick, setFirstClick] = useState(true)

  /** 开始游戏 */
  const startGame = useCallback(() => {
    setBoard(createEmptyBoard())
    setFlagMode(false)
    setMinesLeft(MINES)
    setFirstClick(true)
    setPhase('playing')
  }, [])

  /** 揭开格子（递归展开空白区域） */
  const reveal = useCallback((brd, r, c) => {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) { return }
    if (brd[r][c].revealed || brd[r][c].flagged) { return }
    brd[r][c].revealed = true
    // 如果是空白格（num=0），递归揭开周围
    if (brd[r][c].num === 0 && !brd[r][c].mine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          reveal(brd, r + dr, c + dc)
        }
      }
    }
  }, [])

  /** 检查胜利 */
  const checkWin = useCallback((brd) => {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!brd[r][c].mine && !brd[r][c].revealed) { return false }
      }
    }
    return true
  }, [])

  /** 切换旗子 */
  const toggleFlag = useCallback((r, c) => {
    if (phase !== 'playing') { return }
    let brd
    if (firstClick) {
      brd = createBoard(r, c)
      setFirstClick(false)
    } else {
      brd = board.map(row => row.map(cell => ({ ...cell })))
    }
    const cell = brd[r][c]
    if (cell.revealed) { return }
    cell.flagged = !cell.flagged
    setBoard(brd)
    setMinesLeft(prev => cell.flagged ? prev - 1 : prev + 1)
  }, [phase, firstClick, board])

  /** 处理点击 */
  const handleClick = useCallback((r, c) => {
    if (phase !== 'playing') { return }
    // 插旗模式
    if (flagMode) {
      toggleFlag(r, c)
      return
    }
    let brd
    if (firstClick) {
      // 首次点击才生成棋盘
      brd = createBoard(r, c)
      setFirstClick(false)
    } else {
      brd = board.map(row => row.map(cell => ({ ...cell })))
    }
    const cell = brd[r][c]
    if (cell.revealed || cell.flagged) { return }
    if (cell.mine) {
      // 踩雷！揭开所有地雷
      brd.forEach(row => row.forEach(cl => { if (cl.mine) { cl.revealed = true } }))
      setBoard(brd)
      setPhase('lost')
      return
    }
    reveal(brd, r, c)
    setBoard(brd)
    if (checkWin(brd)) { setPhase('won') }
  }, [phase, flagMode, firstClick, board, toggleFlag, reveal, checkWin])

  // ==================== 渲染：开始界面 ====================
  if (phase === 'start') {
    return (
      <div className="minesweeper-container">
        <div className="minesweeper-panel">
          <div className="game-icon">💣</div>
          <h1 className="game-title">扫雷</h1>
          <p className="game-desc">
            找出所有地雷！左键揭开格子，<br />
            右键或开启🚩模式标记地雷。<br />
            9×9 棋盘，共 {MINES} 颗雷～
          </p>
          <button className="minesweeper-start-btn" onClick={() => startGame()}>
            <span>▶️</span><span>开始游戏</span>
          </button>
        </div>
      </div>
    )
  }

  // ==================== 渲染：结束界面 ====================
  if (phase === 'won' || phase === 'lost') {
    return (
      <div className="minesweeper-container">
        <div className="minesweeper-panel">
          <div className="game-icon">{phase === 'won' ? '🎉' : '💥'}</div>
          <h2 className="game-title">{phase === 'won' ? '你赢了！' : '踩雷了！'}</h2>
          <p className="minesweeper-result">
            {phase === 'won' ? '恭喜你成功排除了所有地雷！' : '很遗憾，触发了一颗地雷...'}
          </p>
          <button className="minesweeper-start-btn" onClick={() => startGame()}>
            <span>🔄</span><span>再来一局</span>
          </button>
        </div>
      </div>
    )
  }

  // ==================== 渲染：游戏中 ====================
  return (
    <div className="minesweeper-container">
      <div className="minesweeper-board">
        <div className="minesweeper-status">
          <div className="minesweeper-stat">
            <span>💣</span><span>剩余</span>
            <span className="stat-value">{minesLeft}</span>
          </div>
          <div className="minesweeper-stat">
            <span>🚩</span><span>模式</span>
            <span className="stat-value">{flagMode ? '开' : '关'}</span>
          </div>
        </div>

        <div
          className="minesweeper-grid"
          style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
        >
          {board.map((row, r) =>
            row.map((cell, c) => {
              let cls = 'ms-cell'
              let content = ''
              if (cell.revealed) {
                if (cell.mine) {
                  cls += ' revealed mine'
                  content = '💣'
                } else {
                  cls += ' revealed'
                  content = cell.num > 0 ? cell.num : ''
                }
              } else if (cell.flagged) {
                cls += ' hidden flagged'
                content = '🚩'
              } else {
                cls += ' hidden'
              }
              return (
                <button
                  key={`${r}-${c}`}
                  className={cls}
                  data-num={cell.revealed && !cell.mine ? cell.num : ''}
                  onClick={() => handleClick(r, c)}
                  onContextMenu={(e) => { e.preventDefault(); toggleFlag(r, c) }}
                >
                  {content}
                </button>
              )
            })
          )}
        </div>

        <div className="minesweeper-btn-group">
          <button
            className={`minesweeper-btn minesweeper-btn-flag ${flagMode ? 'active' : ''}`}
            onClick={() => setFlagMode(f => !f)}
          >
            🚩 {flagMode ? '插旗中' : '插旗模式'}
          </button>
          <button className="minesweeper-btn minesweeper-btn-restart" onClick={() => startGame()}>
            🔄 重新开始
          </button>
        </div>
      </div>
    </div>
  )
}

export default Minesweeper
