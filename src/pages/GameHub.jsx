import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../components/xian/PageHeader'
import { Seal } from '../components/xian/Ornaments'
import { GAMES } from '../data/games'
import { setDocumentMeta } from '../utils/documentMeta'
import './GameHub.css'

const GAME_COMPONENTS = {
  'snake-game': lazy(() => import('../components/SnakeGame')),
  'tetris-game': lazy(() => import('../components/TetrisGame')),
  'game-2048': lazy(() => import('../components/Game2048')),
  minesweeper: lazy(() => import('../components/Minesweeper')),
  'memory-card': lazy(() => import('../components/MemoryCard')),
  breakout: lazy(() => import('../components/Breakout')),
  'sliding-puzzle': lazy(() => import('../components/SlidingPuzzle')),
  'whack-a-mole': lazy(() => import('../components/WhackAMole')),
  'flappy-cat': lazy(() => import('../components/FlappyCat')),
  'super-cat': lazy(() => import('../components/SuperCat')),
  gobang: lazy(() => import('../components/Gobang')),
  stacker: lazy(() => import('../components/Stacker')),
  'yujie-game': lazy(() => import('../components/YujieGame')),
}

const PICKS = ['super-cat', 'flappy-cat', 'gobang', 'yujie-game']

function GameLoader({ label = '正在开启…' }) {
  return (
    <div className="state"><div className="loading-bar" />{label}</div>
  )
}

function resolveValidGameId(id) {
  if (!id) {
    return null
  }
  const matched = GAMES.find((g) => g.id === id && g.status === 'active')
  return matched ? matched.id : null
}

function GameHub({ initialGameId = null }) {
  const navigate = useNavigate()
  const { gameId } = useParams()
  const targetGameId = initialGameId || gameId || null
  const [selectedGameId, setSelectedGameId] = useState(() => resolveValidGameId(targetGameId))

  useEffect(() => {
    setSelectedGameId(resolveValidGameId(targetGameId))
  }, [targetGameId])

  const selectedGame = useMemo(() => GAMES.find((g) => g.id === selectedGameId) || null, [selectedGameId])
  const ActiveGame = selectedGame ? GAME_COMPONENTS[selectedGame.id] : null

  useEffect(() => {
    if (selectedGame) {
      setDocumentMeta({
        title: `${selectedGame.name} · 游仙境 | 橘猫小窝`,
        description: selectedGame.description,
      })
    }
  }, [selectedGame])

  const handleGameClick = (game) => {
    if (!game) {
      return
    }
    if (game.status !== 'active') {
      window.alert('这个还没做完，再等等')
      return
    }
    if (game.id === 'yujie-game') {
      navigate('/games/yujie')
      return
    }
    setSelectedGameId(game.id)
    navigate(`/games/${game.id}`)
  }

  const handleBackToList = () => {
    setSelectedGameId(null)
    navigate('/games')
  }

  if (selectedGame) {
    return (
      <div className="wrap xg-detail">
        <header className="xg-detail-head">
          <button type="button" onClick={handleBackToList} className="link-arrow xg-back">← 换一局</button>
          <div className="xg-detail-title">
            <Seal text={selectedGame.glyph} size={52} />
            <div>
              <h1 className="brush">{selectedGame.name}</h1>
              <p>{selectedGame.description}</p>
            </div>
            <span className="xg-best elegant">纪录 · {selectedGame.best}</span>
          </div>
        </header>

        <div className="game-container">
          {ActiveGame ? (
            <Suspense fallback={<GameLoader label={`${selectedGame.name} 开启中…`} />}>
              <ActiveGame onExit={handleBackToList} />
            </Suspense>
          ) : (
            <GameLoader label={`${selectedGame.name} 开启中…`} />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="xg">
      <PageHeader
        title="游仙境"
        plain="小游戏"
        seal="游戏"
        sub={`写不动文章的时候，就来这儿消磨片刻。纯前端单机，点开即玩，共 ${GAMES.length} 局。`}
      >
        <div className="xg-picks">
          <span className="elegant">近来常玩</span>
          {PICKS.map(id => {
            const game = GAMES.find(g => g.id === id)
            return (
              <button key={id} type="button" className="chip" onClick={() => handleGameClick(game)}>{game.name}</button>
            )
          })}
        </div>
      </PageHeader>

      <div className="wrap">
        <div className="xg-grid">
          {GAMES.map((game, i) => (
            <button
              key={game.id}
              type="button"
              className="xg-card rise"
              onClick={() => handleGameClick(game)}
              style={{ '--game': game.color, '--i': Math.min(i, 10) }}
            >
              <span className="xg-card-glow" aria-hidden="true" />
              <Seal text={game.glyph} size={46} className="xg-card-seal" />
              <h3>{game.name}</h3>
              <p>{game.description}</p>
              <span className="xg-card-foot">
                <span className="elegant">纪录 · {game.best}</span>
                <span className="xg-card-play">入局 →</span>
              </span>
            </button>
          ))}
        </div>

        <p className="xg-note elegant">
          最高分只存在你自己的浏览器里，清了缓存纪录便随风而去。适度游戏益脑，沉迷伤身；玩累了，不妨回山门读篇文章。
        </p>
        <div className="xg-back-home"><Link to="/" className="link-arrow">← 回山门</Link></div>
      </div>
    </div>
  )
}

export default GameHub
