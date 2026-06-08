import { Suspense, lazy, useMemo, useState } from 'react'

const GAME_COMPONENTS = {
  'snake-game': lazy(() => import('../components/SnakeGame')),
  'tetris-game': lazy(() => import('../components/TetrisGame')),
  'game-2048': lazy(() => import('../components/Game2048')),
  minesweeper: lazy(() => import('../components/Minesweeper')),
  'memory-card': lazy(() => import('../components/MemoryCard')),
  breakout: lazy(() => import('../components/Breakout')),
  'sliding-puzzle': lazy(() => import('../components/SlidingPuzzle')),
  'whack-a-mole': lazy(() => import('../components/WhackAMole')),
}

const GAMES = [
  { id: 'snake-game', name: '贪吃蛇', icon: '🐍', description: '经典贪吃蛇，吃豆变长别撞墙。', best: '最长 38', status: 'active', k: 'k1' },
  { id: 'tetris-game', name: '俄罗斯方块', icon: '🧱', description: '旋转下落消除整行得分。', best: '最高 9900', status: 'active', k: 'k3' },
  { id: 'game-2048', name: '2048', icon: '🔢', description: '滑动数字方块，合并相同数字，目标拼出 2048。', best: '最高 12480', status: 'active', k: 'k1' },
  { id: 'minesweeper', name: '扫雷', icon: '💣', description: '推理雷区位置，安全翻开格子。', best: '最快 41s', status: 'active', k: 'k4' },
  { id: 'memory-card', name: '记忆翻牌', icon: '🃏', description: '翻牌配对，考验你的记忆力。', best: '最少 18 步', status: 'active', k: 'k3' },
  { id: 'breakout', name: '打砖块', icon: '🏓', description: '移动挡板反弹小球，击碎所有砖块通关。', best: '通关 3 关', status: 'active', k: 'k2' },
  { id: 'sliding-puzzle', name: '数字华容道', icon: '🧩', description: '滑动数字方块，把 1-15 按顺序复原。', best: '最少步数', status: 'active', k: 'k4' },
  { id: 'whack-a-mole', name: '打地鼠', icon: '🔨', description: '30 秒限时！抓住每只冒头的地鼠。', best: '最高 56', status: 'active', k: 'k2' },
]

function PageHead({ emoji, title, sub }) {
  return (
    <div style={{ padding: '34px 0 24px' }}>
      <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 900, fontSize: 'clamp(40px,7vw,72px)', lineHeight: 1, letterSpacing: '-.02em' }}>
        {emoji} {title}
      </h1>
      {sub && <p style={{ fontSize: 16, color: 'var(--ink-soft)', marginTop: 12, fontWeight: 500 }}>{sub}</p>}
    </div>
  )
}

function GameLoader({ icon = '🎮', label = '游戏加载中…' }) {
  return (
    <div className="panel" style={{ textAlign: 'center', padding: 48 }}>
      <div className="animate-bounce" style={{ fontSize: 44 }}>{icon}</div>
      <p style={{ marginTop: 12, color: 'var(--ink-soft)' }}>{label}</p>
    </div>
  )
}

function GameHub() {
  const [selectedGameId, setSelectedGameId] = useState(null)
  const selectedGame = useMemo(() => GAMES.find(g => g.id === selectedGameId) || null, [selectedGameId])
  const ActiveGame = selectedGame ? GAME_COMPONENTS[selectedGame.id] : null

  const handleGameClick = (game) => {
    if (game.status !== 'active') {
      window.alert('🎮 这个游戏正在开发中，敬请期待！')
      return
    }
    setSelectedGameId(game.id)
  }

  const handleBackToList = () => setSelectedGameId(null)

  if (selectedGame) {
    return (
      <div className="wrap" style={{ maxWidth: 1100, paddingBottom: 48 }}>
        <button onClick={handleBackToList} className="sticker" style={{ margin: '20px 0' }}>
          ← 返回游戏列表
        </button>

        <div className="panel" style={{ padding: 28, background: `var(--${selectedGame.k}-bg)`, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ fontSize: 50 }}>{selectedGame.icon}</div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <span className="cat-chip" style={{ color: 'var(--ink)' }}>当前游戏</span>
              <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 900, fontSize: 30, margin: '8px 0 6px' }}>{selectedGame.name}</h2>
              <p style={{ color: 'var(--ink-soft)', fontWeight: 500 }}>{selectedGame.description}</p>
            </div>
            <span className="sticker">🏆 {selectedGame.best}</span>
          </div>
        </div>

        <div className="panel" style={{ padding: 20, background: 'var(--paper)' }}>
          {ActiveGame ? (
            <Suspense fallback={<GameLoader icon={selectedGame.icon} label={`${selectedGame.name} 正在准备中…`} />}>
              <ActiveGame onExit={handleBackToList} />
            </Suspense>
          ) : (
            <GameLoader icon={selectedGame.icon} label={`${selectedGame.name} 正在准备中…`} />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="wrap" style={{ maxWidth: 1000, paddingBottom: 48 }}>
      <PageHead emoji="🎮" title="小游戏中心" sub="休息区 · 用前端写的小玩法，点开即玩" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {GAMES.map(g => (
          <article
            key={g.id}
            className={`ec ${g.k}`}
            onClick={() => handleGameClick(g)}
            style={{ padding: 24, display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 40 }}>{g.icon}</div>
              <span style={{ fontFamily: 'var(--disp)', fontSize: 11.5, fontWeight: 700, opacity: 0.6 }}>
                🏆 {g.best}
              </span>
            </div>
            <h3 style={{ fontSize: 22, margin: '12px 0 6px' }}>{g.name}</h3>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-soft)', flex: 1 }}>{g.description}</p>
            <button
              type="button"
              className="btn"
              onClick={(e) => { e.stopPropagation(); handleGameClick(g) }}
              style={{ marginTop: 14, width: '100%', justifyContent: 'center' }}
            >
              ▶ 开始游戏
            </button>
          </article>
        ))}
      </div>
    </div>
  )
}

export default GameHub
