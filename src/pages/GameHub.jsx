import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageHeader from '../components/xian/PageHeader'
import { Seal } from '../components/xian/Ornaments'
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

const GAMES = [
  { id: 'snake-game', glyph: '蛇', name: '贪吃蛇', icon: '🐍', description: '控制橘蛇吃苹果，别撞墙也别咬到自己，看能拉到多长。', best: '最长 38', status: 'active', color: '#FF9F45' },
  { id: 'tetris-game', glyph: '方', name: '俄罗斯方块', icon: '🧱', description: '经典方块消除，摆好落点凑满整行，看能撑到多少分。', best: '最高 9900', status: 'active', color: 'var(--berry)' },
  { id: 'game-2048', glyph: '数', name: '2048', icon: '🔢', description: '数字块两两合并，看能不能凑出 2048。', best: '最高 12480', status: 'active', color: 'var(--sun)' },
  { id: 'minesweeper', glyph: '雷', name: '扫雷', icon: '💣', description: '经典扫雷，靠数字推雷，也靠一点运气。', best: '最快 41s', status: 'active', color: 'var(--vi)' },
  { id: 'memory-card', glyph: '忆', name: '记忆翻牌', icon: '🃏', description: '翻牌记位置，看最少几步能全部配上对。', best: '最少 18 步', status: 'active', color: 'var(--mint)' },
  { id: 'breakout', glyph: '砖', name: '打砖块', icon: '🏓', description: '移动挡板反弹小球，把上面的砖块全敲碎。', best: '通关 3 关', status: 'active', color: 'var(--o)' },
  { id: 'sliding-puzzle', glyph: '道', name: '数字华容道', icon: '🧩', description: '把打乱的数字块滑回原位，步数越少越好。', best: '最少步数', status: 'active', color: '#8D6E63' },
  { id: 'whack-a-mole', glyph: '鼠', name: '打地鼠', icon: '🔨', description: '30 秒，谁冒头就砸谁，纯拼手速。', best: '最高 56', status: 'active', color: '#4CAF50' },
  { id: 'flappy-cat', glyph: '飞', name: '飞天橘猫', icon: '🐱', description: '控制小胖橘在猫爬架之间穿来穿去，顺手捡小鱼干。', best: '最高 32', status: 'active', color: '#FF9800' },
  { id: 'super-cat', glyph: '跃', name: '超级橘猫', icon: '🍄', description: '马里奥式横版闯关，顶砖、踩怪、跳坑，摸到终点旗就算赢。', best: '通关', status: 'active', color: '#E53935' },
  { id: 'gobang', glyph: '弈', name: '智能五子棋', icon: '🌌', description: '霓虹风五子棋，对手是内置 AI，不太好赢。', best: '无纪录', status: 'active', color: '#3B82F6' },
  { id: 'stacker', glyph: '叠', name: '炫彩叠叠乐', icon: '🧱', description: '把滑动的楼层对齐叠上去，歪出来的部分会被切掉，越叠越窄。', best: '无纪录', status: 'active', color: '#10B981' },
  { id: 'yujie-game', glyph: '缘', name: '雨姐的心动时刻', icon: '💕', description: 'v2.4 Galgame：13天、6条支线、14种结局；养成雨姐的相处性格，也能攻略老蒯知己/情愫线。', best: '结局图鉴', status: 'active', color: '#EC4899' },
]

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
  const [selectedGameId, setSelectedGameId] = useState(() => resolveValidGameId(initialGameId))

  useEffect(() => {
    setSelectedGameId(resolveValidGameId(initialGameId))
  }, [initialGameId])

  const selectedGame = useMemo(() => GAMES.find((g) => g.id === selectedGameId) || null, [selectedGameId])
  const ActiveGame = selectedGame ? GAME_COMPONENTS[selectedGame.id] : null

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
