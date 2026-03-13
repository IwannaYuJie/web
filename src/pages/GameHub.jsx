import { Suspense, lazy, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import './GameHub.css'

const GAME_COMPONENTS = {
  'yujie-game': lazy(() => import('../components/YujieGame')),
  'yujie-ai-game': lazy(() => import('../components/YujieAIGame')),
  'snake-game': lazy(() => import('../components/SnakeGame')),
  'tetris-game': lazy(() => import('../components/TetrisGame')),
  'game-2048': lazy(() => import('../components/Game2048')),
  minesweeper: lazy(() => import('../components/Minesweeper')),
  'memory-card': lazy(() => import('../components/MemoryCard')),
  breakout: lazy(() => import('../components/Breakout')),
}

const GAMES = [
  {
    id: 'yujie-game',
    name: '雨姐的心动时刻',
    icon: '💕',
    description: '东北风情恋爱模拟游戏，体验与雨姐的浪漫故事！',
    status: 'active',
    color: '#FF9F45',
  },
  {
    id: 'yujie-ai-game',
    name: 'AI攻略：东北雨姐',
    icon: '🤖💕',
    description: '扮演从外国归来的黑人小哥，用AI对话攻略雨姐的心！',
    status: 'active',
    color: '#FF8C1A',
  },
  {
    id: 'snake-game',
    name: '贪吃蛇',
    icon: '🐍',
    description: '经典贪吃蛇！控制小蛇吃掉食物不断成长，小心别撞墙哦～',
    status: 'active',
    color: '#6BCB77',
  },
  {
    id: 'tetris-game',
    name: '俄罗斯方块',
    icon: '🧱',
    description: '经典中的经典！消除整行方块获得分数，挑战你的最高记录！',
    status: 'active',
    color: '#4D96FF',
  },
  {
    id: 'game-2048',
    name: '2048',
    icon: '🔢',
    description: '滑动数字方块，合并相同数字，目标拼出2048！',
    status: 'active',
    color: '#FFD93D',
  },
  {
    id: 'minesweeper',
    name: '扫雷',
    icon: '💣',
    description: '经典Windows扫雷！9×9棋盘，找出所有地雷！',
    status: 'active',
    color: '#764ba2',
  },
  {
    id: 'memory-card',
    name: '记忆翻牌',
    icon: '🃏',
    description: '翻开卡片找到配对的emoji，挑战记忆力！',
    status: 'active',
    color: '#4ECDC4',
  },
  {
    id: 'breakout',
    name: '打砖块',
    icon: '🏓',
    description: '移动挡板反弹小球，击碎所有砖块通关！',
    status: 'active',
    color: '#FF6B6B',
  },
]

function GameLoader() {
  return (
    <div className="game-loader glass">
      <div className="loader-icon">🎮</div>
      <p>游戏加载中...</p>
    </div>
  )
}

function GameHub() {
  const [selectedGameId, setSelectedGameId] = useState(null)
  const activeGames = useMemo(() => GAMES.filter((game) => game.status === 'active'), [])
  const spotlightGames = useMemo(() => activeGames.slice(0, 4), [activeGames])
  const selectedGame = useMemo(
    () => GAMES.find((game) => game.id === selectedGameId) || null,
    [selectedGameId],
  )
  const ActiveGame = selectedGame ? GAME_COMPONENTS[selectedGame.id] : null

  const handleGameClick = (game) => {
    if (game.status === 'coming-soon') {
      alert('🎮 这个游戏正在开发中,敬请期待!')
      return
    }

    setSelectedGameId(game.id)
  }

  const handleBackToList = () => {
    setSelectedGameId(null)
  }

  return (
    <div className="game-hub-container">
      <div className="game-hub-ambient game-hub-ambient-one"></div>
      <div className="game-hub-ambient game-hub-ambient-two"></div>

      <div className="container game-hub-shell">
        <header className="game-hub-hero glass">
          <div className="hero-copy">
            <div className="hero-meta-row">
              <span className="hero-badge">😺 橘猫游乐场</span>
              <Link to="/" className="hero-home-link">← 返回首页</Link>
            </div>

            <h1 className="hub-title">小游戏中心</h1>
            <p className="hub-subtitle">
              把站内小游戏收进和首页一致的暖橙视觉里，想放松时随手开一局，切换起来也还是同一个站点。
            </p>

            <div className="hero-actions">
              <a href="#game-library" className="btn btn-primary">开始挑选</a>
              {selectedGame ? (
                <button type="button" className="btn btn-secondary" onClick={handleBackToList}>
                  返回列表
                </button>
              ) : (
                <span className="hero-inline-note">当前开放 {activeGames.length} 款可直接游玩的小游戏</span>
              )}
            </div>

            <div className="hero-pills">
              <span className="hero-pill">暖橙配色</span>
              <span className="hero-pill">玻璃卡片</span>
              <span className="hero-pill">即点即玩</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-avatar-frame">
              <img src="/images/cat-avatar.png" alt="橘猫头像" className="hero-avatar" />
            </div>

            <div className="hero-orbits">
              {spotlightGames.map((game, index) => (
                <div key={game.id} className={`hero-orbit-chip hero-orbit-chip-${index + 1}`}>
                  <span className="orbit-icon">{game.icon}</span>
                  <span className="orbit-label">{game.name}</span>
                </div>
              ))}
            </div>
          </div>
        </header>



        <main className="game-hub-main" id="game-library">
          {!selectedGame ? (
            <>
              <div className="grid-header">
                <div>
                  <span className="section-kicker">精选小游戏</span>
                  <h2>选一款，马上开玩</h2>
                </div>
                <p className="game-count">
                  当前开放 <strong>{activeGames.length}</strong> 款小游戏，更多内容会继续补充。
                </p>
              </div>

              <div className="game-library-layout">
                <div className="game-cards">
                  {GAMES.map((game) => (
                    <button
                      type="button"
                      key={game.id}
                      className={`game-card ${game.status === 'coming-soon' ? 'coming-soon' : ''}`}
                      onClick={() => handleGameClick(game)}
                      style={{ '--card-color': game.color }}
                    >
                      <div className="card-accent" aria-hidden="true"></div>
                      <div className="card-header">
                        <span className="card-badge">
                          {game.status === 'coming-soon' ? '即将上线' : '即点即玩'}
                        </span>
                        <span className="card-dot" aria-hidden="true"></span>
                      </div>

                      <div className="card-icon-shell">
                        <span className="card-icon">{game.icon}</span>
                      </div>

                      <h3 className="card-title">{game.name}</h3>
                      <p className="card-description">{game.description}</p>

                      <div className="card-footer">
                        <span className="card-note">
                          {game.status === 'coming-soon' ? '正在整理中' : '进入游戏'}
                        </span>
                        <span className="card-arrow" aria-hidden="true">→</span>
                      </div>

                      <div className="card-shine" aria-hidden="true"></div>
                    </button>
                  ))}
                </div>

                <aside className="games-aside">


                  <section className="aside-card glass">
                    <span className="aside-kicker">推荐开局</span>
                    <div className="aside-picks">
                      {spotlightGames.map((game) => (
                        <button
                          type="button"
                          key={`pick-${game.id}`}
                          className="pick-item"
                          onClick={() => handleGameClick(game)}
                        >
                          <span className="pick-icon">{game.icon}</span>
                          <span className="pick-text">{game.name}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                </aside>
              </div>
            </>
          ) : (
            <section className="game-detail">
              <div className="game-detail-intro glass">
                <button type="button" className="back-button" onClick={handleBackToList}>
                  ← 返回游戏列表
                </button>

                <div className="detail-copy">
                  <span className="detail-kicker">当前游戏</span>
                  <h2>{selectedGame.icon} {selectedGame.name}</h2>
                  <p>{selectedGame.description}</p>
                </div>

                <div className="detail-badges">
                  <span className="detail-badge">暖橙主题壳层</span>
                  <span className="detail-badge">即点即玩</span>
                </div>
              </div>

              <div className="game-container">
                {ActiveGame ? (
                  <Suspense fallback={<GameLoader />}>
                    <ActiveGame onExit={handleBackToList} />
                  </Suspense>
                ) : (
                  <div className="game-loader glass">
                    <div className="loader-icon">{selectedGame.icon}</div>
                    <p>{selectedGame.name} 正在准备中...</p>
                  </div>
                )}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

export default GameHub
