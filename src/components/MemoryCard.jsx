import { useState, useCallback, useRef } from 'react'
import './MemoryCard.css'

/**
 * 记忆翻牌游戏 🃏
 * 橘猫主题风格
 * 翻开两张卡片，找到配对的 emoji
 */

// 8对 emoji（共16张卡片，4x4 网格）
const EMOJIS = ['🐱', '🐕', '🦊', '🐼', '🐸', '🦋', '🌸', '🍊']

/** 洗牌 */
const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 创建卡片数据 */
const createCards = () => {
  const pairs = [...EMOJIS, ...EMOJIS] // 每个 emoji 出现2次
  return shuffle(pairs).map((emoji, i) => ({
    id: i, emoji, flipped: false, matched: false,
  }))
}

const MemoryCard = () => {
  const [phase, setPhase] = useState('start')
  const [cards, setCards] = useState([])
  const [moves, setMoves] = useState(0)
  const [matches, setMatches] = useState(0)
  const [bestMoves, setBestMoves] = useState(() =>
    parseInt(localStorage.getItem('memory_best') || '0', 10)
  )
  // 选中的卡片
  const selectedRef = useRef([])
  const lockRef = useRef(false)

  /** 开始游戏 */
  const startGame = useCallback(() => {
    setCards(createCards())
    setMoves(0)
    setMatches(0)
    selectedRef.current = []
    lockRef.current = false
    setPhase('playing')
  }, [])

  /** 点击卡片 */
  const handleCardClick = useCallback((id) => {
    if (lockRef.current) { return }
    const idx = cards.findIndex(c => c.id === id)
    if (idx === -1 || cards[idx].flipped || cards[idx].matched) { return }

    const newCards = cards.map(c => c.id === id ? { ...c, flipped: true } : c)
    setCards(newCards)
    selectedRef.current.push(idx)

    if (selectedRef.current.length === 2) {
      setMoves(m => m + 1)
      const [i1, i2] = selectedRef.current
      if (newCards[i1].emoji === newCards[i2].emoji) {
        // 配对成功
        const matched = newCards.map((c, i) =>
          (i === i1 || i === i2) ? { ...c, matched: true } : c
        )
        setCards(matched)
        selectedRef.current = []
        const newMatches = matches + 1
        setMatches(newMatches)
        // 检查是否全部配对
        if (newMatches === EMOJIS.length) {
          const totalMoves = moves + 1 // 当前这步
          const best = bestMoves === 0 ? totalMoves : Math.min(bestMoves, totalMoves)
          setBestMoves(best)
          localStorage.setItem('memory_best', String(best))
          setTimeout(() => setPhase('won'), 500)
        }
      } else {
        // 配对失败，延迟翻回
        lockRef.current = true
        setTimeout(() => {
          setCards(prev => prev.map((c, i) =>
            (i === i1 || i === i2) ? { ...c, flipped: false } : c
          ))
          selectedRef.current = []
          lockRef.current = false
        }, 800)
      }
    }
  }, [cards, matches, moves, bestMoves])

  // ==================== 渲染：开始界面 ====================
  if (phase === 'start') {
    return (
      <div className="memory-container">
        <div className="memory-panel">
          <div className="game-icon">🃏</div>
          <h1 className="game-title">记忆翻牌</h1>
          <p className="game-desc">
            翻开卡片找到配对的 emoji！<br />
            记住位置，用最少步数全部配对！
          </p>
          <button className="memory-start-btn" onClick={() => startGame()}>
            <span>▶️</span><span>开始游戏</span>
          </button>
        </div>
      </div>
    )
  }

  // ==================== 渲染：胜利界面 ====================
  if (phase === 'won') {
    return (
      <div className="memory-container">
        <div className="memory-panel">
          <div className="game-icon">🎉</div>
          <h2 className="game-title">全部配对！</h2>
          <div className="memory-over-stats">
            <div className="stat-card">
              <div className="stat-label">步数</div>
              <div className="stat-num">{moves}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">最少步数</div>
              <div className="stat-num">{bestMoves}</div>
            </div>
          </div>
          <button className="memory-start-btn" onClick={() => startGame()}>
            <span>🔄</span><span>再来一局</span>
          </button>
        </div>
      </div>
    )
  }

  // ==================== 渲染：游戏中 ====================
  return (
    <div className="memory-container">
      <div className="memory-board">
        <div className="memory-status">
          <div className="memory-stat">
            <span>👆</span><span>步数</span>
            <span className="stat-value">{moves}</span>
          </div>
          <div className="memory-stat">
            <span>✅</span><span>配对</span>
            <span className="stat-value">{matches}/{EMOJIS.length}</span>
          </div>
        </div>

        <div className="memory-grid">
          {cards.map(card => (
            <div
              key={card.id}
              className={`memory-card${card.flipped ? ' flipped' : ''}${card.matched ? ' matched' : ''}`}
              onClick={() => handleCardClick(card.id)}
            >
              <div className="memory-card-inner">
                <div className="memory-card-front">❓</div>
                <div className="memory-card-back">{card.emoji}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="memory-btn-group">
          <button className="memory-btn-restart" onClick={() => startGame()}>
            🔄 重新开始
          </button>
        </div>
      </div>
    </div>
  )
}

export default MemoryCard
