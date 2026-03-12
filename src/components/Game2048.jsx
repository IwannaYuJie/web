import { useState, useEffect, useCallback } from 'react'
import './Game2048.css'

/**
 * 2048 数字滑块游戏 🔢
 * 橘猫主题风格
 * 操作：方向键滑动，合并相同数字，目标达到 2048
 */

const SIZE = 4 // 4x4 网格

/** 创建空网格 */
const emptyGrid = () => Array.from({ length: SIZE }, () => Array(SIZE).fill(0))

/** 在空位随机放一个 2 或 4 */
const addRandom = (grid) => {
  const g = grid.map(r => [...r])
  const empty = []
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (g[r][c] === 0) { empty.push([r, c]) }
    }
  }
  if (empty.length === 0) { return g }
  const [row, col] = empty[Math.floor(Math.random() * empty.length)]
  g[row][col] = Math.random() < 0.9 ? 2 : 4
  return g
}

/** 向左滑动一行（核心合并逻辑） */
const slideRow = (row) => {
  let arr = row.filter(v => v !== 0) // 去零
  let score = 0
  // 相邻合并
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2
      score += arr[i]
      arr.splice(i + 1, 1)
    }
  }
  // 补零
  while (arr.length < SIZE) { arr.push(0) }
  return { result: arr, score }
}

/** 旋转网格（用于统一处理四个方向） */
const rotateGrid = (grid) => {
  const g = emptyGrid()
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      g[c][SIZE - 1 - r] = grid[r][c]
    }
  }
  return g
}

/** 检查是否还有可移动的步 */
const canMove = (grid) => {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) { return true }
      if (c < SIZE - 1 && grid[r][c] === grid[r][c + 1]) { return true }
      if (r < SIZE - 1 && grid[r][c] === grid[r + 1][c]) { return true }
    }
  }
  return false
}

const Game2048 = () => {
  const [phase, setPhase] = useState('start')
  const [grid, setGrid] = useState(emptyGrid)
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(() =>
    parseInt(localStorage.getItem('g2048_best') || '0', 10)
  )

  /** 开始游戏 */
  const startGame = useCallback(() => {
    let g = emptyGrid()
    g = addRandom(addRandom(g))
    setGrid(g)
    setScore(0)
    setPhase('playing')
  }, [])

  /** 执行一次移动（方向: 0左 1下 2右 3上，对应旋转次数） */
  const move = useCallback((dir) => {
    let g = grid.map(r => [...r])
    // 将所有方向统一旋转成"向左"处理
    for (let i = 0; i < dir; i++) { g = rotateGrid(g) }
    let moved = false
    let gained = 0
    const newG = g.map(row => {
      const { result, score: s } = slideRow(row)
      gained += s
      if (row.some((v, i) => v !== result[i])) { moved = true }
      return result
    })
    if (!moved) { return } // 没有移动则不操作
    // 旋转回来
    let final = newG
    for (let i = 0; i < (4 - dir) % 4; i++) { final = rotateGrid(final) }
    // 添加新方块
    final = addRandom(final)
    const newScore = score + gained
    setGrid(final)
    setScore(newScore)
    // 更新最高分
    if (newScore > bestScore) {
      setBestScore(newScore)
      localStorage.setItem('g2048_best', String(newScore))
    }
    // 检查是否游戏结束
    if (!canMove(final)) {
      setTimeout(() => setPhase('over'), 300)
    }
  }, [grid, score, bestScore])

  /** 键盘控制 */
  useEffect(() => {
    if (phase !== 'playing') { return }
    const handleKey = (e) => {
      switch (e.key) {
        case 'ArrowUp': e.preventDefault(); move(3); break
        case 'ArrowRight': e.preventDefault(); move(2); break
        case 'ArrowDown': e.preventDefault(); move(1); break
        case 'ArrowLeft': e.preventDefault(); move(0); break
        default: break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [phase, move])

  /** 触摸滑动支持 */
  useEffect(() => {
    if (phase !== 'playing') { return }
    let startX = 0, startY = 0
    const onStart = (e) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY }
    const onEnd = (e) => {
      const dx = e.changedTouches[0].clientX - startX
      const dy = e.changedTouches[0].clientY - startY
      if (Math.abs(dx) < 30 && Math.abs(dy) < 30) { return }
      if (Math.abs(dx) > Math.abs(dy)) {
        move(dx > 0 ? 2 : 0) // 右:2 左:0
      } else {
        move(dy > 0 ? 1 : 3) // 下:1 上:3
      }
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend', onEnd)
    return () => { window.removeEventListener('touchstart', onStart); window.removeEventListener('touchend', onEnd) }
  }, [phase, move])

  // ==================== 渲染：开始界面 ====================
  if (phase === 'start') {
    return (
      <div className="game2048-container">
        <div className="game2048-panel">
          <div className="game-icon">🔢</div>
          <h1 className="game-title">2048</h1>
          <p className="game-desc">
            滑动数字方块，合并相同数字！<br />
            目标：拼出 2048！
          </p>
          <button className="game2048-start-btn" onClick={() => startGame()}>
            <span>▶️</span><span>开始游戏</span>
          </button>
        </div>
      </div>
    )
  }

  // ==================== 渲染：结束界面 ====================
  if (phase === 'over') {
    return (
      <div className="game2048-container">
        <div className="game2048-panel">
          <div className="game-icon">🎉</div>
          <h2 className="game-title">游戏结束</h2>
          <div className="game2048-over-scores">
            <div className="score-card">
              <div className="score-label">得分</div>
              <div className="score-num">{score}</div>
            </div>
            <div className="score-card">
              <div className="score-label">最高</div>
              <div className="score-num">{bestScore}</div>
            </div>
          </div>
          <button className="game2048-start-btn" onClick={() => startGame()}>
            <span>🔄</span><span>再来一局</span>
          </button>
        </div>
      </div>
    )
  }

  // ==================== 渲染：游戏中 ====================
  return (
    <div className="game2048-container">
      <div className="game2048-board">
        <div className="game2048-status">
          <div className="game2048-stat">
            <div className="stat-label">🏆 得分</div>
            <div className="stat-value">{score}</div>
          </div>
          <div className="game2048-stat">
            <div className="stat-label">⭐ 最高</div>
            <div className="stat-value">{bestScore}</div>
          </div>
        </div>

        <div className="game2048-grid">
          {grid.flat().map((val, i) => (
            <div
              key={i}
              className={`game2048-cell${val ? ' pop' : ''}`}
              data-value={val || ''}
            >
              {val || ''}
            </div>
          ))}
        </div>

        <div className="game2048-btn-group">
          <button className="game2048-btn game2048-btn-restart" onClick={() => startGame()}>
            🔄 重新开始
          </button>
        </div>
        <div className="game2048-swipe-hint">👆 滑动屏幕或使用方向键操作</div>
      </div>
    </div>
  )
}

export default Game2048
