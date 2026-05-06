import { useState, useCallback, useEffect, useRef } from 'react'
import './WhackAMole.css'

/**
 * 打地鼠 🔨
 * 30 秒内尽量多地敲中地鼠，不要敲到橘猫！
 */

const HOLES = 9
const GAME_TIME = 30
const MOLE_LIFETIME = 900
const SPAWN_INTERVAL = 700
const CAT_PROB = 0.18

const WhackAMole = () => {
  const [phase, setPhase] = useState('start')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [holes, setHoles] = useState(() => Array(HOLES).fill(null))
  const [bestScore, setBestScore] = useState(() =>
    parseInt(localStorage.getItem('whack_best') || '0', 10),
  )
  const [hitFx, setHitFx] = useState({ idx: -1, kind: '', key: 0 })
  const tickRef = useRef(null)
  const spawnRef = useRef(null)
  const expireRefs = useRef({})

  const clearTimers = useCallback(() => {
    clearInterval(tickRef.current)
    clearInterval(spawnRef.current)
    Object.values(expireRefs.current).forEach((id) => clearTimeout(id))
    expireRefs.current = {}
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  const spawnMole = useCallback(() => {
    setHoles((prev) => {
      const empties = []
      prev.forEach((v, i) => {
        if (!v) empties.push(i)
      })
      if (empties.length === 0) return prev
      const idx = empties[Math.floor(Math.random() * empties.length)]
      const kind = Math.random() < CAT_PROB ? 'cat' : 'mole'
      const next = prev.slice()
      next[idx] = { kind, id: Date.now() + Math.random() }
      // 自动消失
      expireRefs.current[idx] = setTimeout(() => {
        setHoles((cur) => {
          const c = cur.slice()
          if (c[idx] && c[idx].id === next[idx].id) c[idx] = null
          return c
        })
        delete expireRefs.current[idx]
      }, MOLE_LIFETIME)
      return next
    })
  }, [])

  const startGame = useCallback(() => {
    clearTimers()
    setScore(0)
    setTimeLeft(GAME_TIME)
    setHoles(Array(HOLES).fill(null))
    setHitFx({ idx: -1, kind: '', key: 0 })
    setPhase('playing')
  }, [clearTimers])

  useEffect(() => {
    if (phase !== 'playing') return undefined
    tickRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(tickRef.current)
          clearInterval(spawnRef.current)
          Object.values(expireRefs.current).forEach((id) => clearTimeout(id))
          expireRefs.current = {}
          setHoles(Array(HOLES).fill(null))
          setPhase('over')
          return 0
        }
        return t - 1
      })
    }, 1000)
    spawnRef.current = setInterval(spawnMole, SPAWN_INTERVAL)
    spawnMole()
    return () => {
      clearInterval(tickRef.current)
      clearInterval(spawnRef.current)
    }
  }, [phase, spawnMole])

  useEffect(() => {
    if (phase === 'over') {
      setBestScore((prev) => {
        const best = Math.max(prev, score)
        localStorage.setItem('whack_best', String(best))
        return best
      })
    }
  }, [phase, score])

  const handleHoleClick = useCallback(
    (idx) => {
      if (phase !== 'playing') return
      const target = holes[idx]
      if (!target) return

      if (expireRefs.current[idx]) {
        clearTimeout(expireRefs.current[idx])
        delete expireRefs.current[idx]
      }
      setHoles((prev) => {
        const next = prev.slice()
        next[idx] = null
        return next
      })

      if (target.kind === 'mole') {
        setScore((s) => s + 1)
        setHitFx({ idx, kind: 'mole', key: Date.now() })
      } else {
        setScore((s) => Math.max(0, s - 2))
        setHitFx({ idx, kind: 'cat', key: Date.now() })
      }
    },
    [phase, holes],
  )

  if (phase === 'start') {
    return (
      <div className="whack-container">
        <div className="whack-panel">
          <div className="game-icon">🔨</div>
          <h1 className="game-title">打地鼠</h1>
          <p className="game-desc">
            30 秒内尽量多地敲中地鼠 🐹<br />
            小心橘猫 🐱 ！敲到要扣 2 分哦
          </p>
          <button className="whack-start-btn" onClick={startGame}>
            <span>▶️</span><span>开始游戏</span>
          </button>
          {bestScore > 0 && (
            <div className="whack-best-line">最高分：{bestScore}</div>
          )}
        </div>
      </div>
    )
  }

  if (phase === 'over') {
    return (
      <div className="whack-container">
        <div className="whack-panel">
          <div className="game-icon">🏆</div>
          <h2 className="game-title">时间到！</h2>
          <div className="whack-over-stats">
            <div className="stat-card">
              <div className="stat-label">本局得分</div>
              <div className="stat-num">{score}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">最高分</div>
              <div className="stat-num">{bestScore}</div>
            </div>
          </div>
          <button className="whack-start-btn" onClick={startGame}>
            <span>🔄</span><span>再来一局</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="whack-container">
      <div className="whack-board">
        <div className="whack-status">
          <div className="whack-stat">
            <span>⭐</span><span>得分</span>
            <span className="stat-value">{score}</span>
          </div>
          <div className="whack-stat">
            <span>⏱️</span><span>剩余</span>
            <span className="stat-value">{timeLeft}s</span>
          </div>
        </div>

        <div className="whack-grid">
          {holes.map((hole, idx) => (
            <button
              type="button"
              key={idx}
              className="whack-hole"
              onClick={() => handleHoleClick(idx)}
            >
              <div className="hole-pit"></div>
              {hole && (
                <span
                  key={hole.id}
                  className={`hole-target ${hole.kind === 'cat' ? 'cat' : 'mole'}`}
                >
                  {hole.kind === 'cat' ? '🐱' : '🐹'}
                </span>
              )}
              {hitFx.idx === idx && (
                <span
                  key={hitFx.key}
                  className={`hit-fx ${hitFx.kind === 'cat' ? 'bad' : 'good'}`}
                >
                  {hitFx.kind === 'cat' ? '-2' : '+1'}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="whack-btn-group">
          <button className="whack-btn-restart" onClick={startGame}>
            🔄 重新开始
          </button>
        </div>
      </div>
    </div>
  )
}

export default WhackAMole
