import { Suspense, lazy, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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
  { id: 'snake-game', name: '贪吃蛇', icon: '🐍', description: '控制橘蛇吃苹果，别撞墙也别咬到自己，看能拉到多长。', best: '最长 38', status: 'active', color: '#FF9F45' },
  { id: 'tetris-game', name: '俄罗斯方块', icon: '🧱', description: '经典方块消除，摆好落点凑满整行，看能撑到多少分。', best: '最高 9900', status: 'active', color: 'var(--berry)' },
  { id: 'game-2048', name: '2048', icon: '🔢', description: '数字块两两合并，看能不能凑出 2048。', best: '最高 12480', status: 'active', color: 'var(--sun)' },
  { id: 'minesweeper', name: '扫雷', icon: '💣', description: '经典扫雷，靠数字推雷，也靠一点运气。', best: '最快 41s', status: 'active', color: 'var(--vi)' },
  { id: 'memory-card', name: '记忆翻牌', icon: '🃏', description: '翻牌记位置，看最少几步能全部配上对。', best: '最少 18 步', status: 'active', color: 'var(--mint)' },
  { id: 'breakout', name: '打砖块', icon: '🏓', description: '移动挡板反弹小球，把上面的砖块全敲碎。', best: '通关 3 关', status: 'active', color: 'var(--o)' },
  { id: 'sliding-puzzle', name: '数字华容道', icon: '🧩', description: '把打乱的数字块滑回原位，步数越少越好。', best: '最少步数', status: 'active', color: '#8D6E63' },
  { id: 'whack-a-mole', name: '打地鼠', icon: '🔨', description: '30 秒，谁冒头就砸谁，纯拼手速。', best: '最高 56', status: 'active', color: '#4CAF50' },
  { id: 'flappy-cat', name: '飞天橘猫', icon: '🐱', description: '控制小胖橘在猫爬架之间穿来穿去，顺手捡小鱼干。', best: '最高 32', status: 'active', color: '#FF9800' },
  { id: 'super-cat', name: '超级橘猫', icon: '🍄', description: '马里奥式横版闯关，顶砖、踩怪、跳坑，摸到终点旗就算赢。', best: '通关', status: 'active', color: '#E53935' },
  { id: 'gobang', name: '智能五子棋', icon: '🌌', description: '霓虹风五子棋，对手是内置 AI，不太好赢。', best: '无纪录', status: 'active', color: '#3B82F6' },
  { id: 'stacker', name: '炫彩叠叠乐', icon: '🧱', description: '把滑动的楼层对齐叠上去，歪出来的部分会被切掉，越叠越窄。', best: '无纪录', status: 'active', color: '#10B981' },
  { id: 'yujie-game', name: '雨姐的心动时刻', icon: '💕', description: '重制版 Galgame：13 天自由行动、6 条支线、9 个结局收集，看你在东北农家乐活出哪种人生。', best: '结局图鉴', status: 'active', color: '#EC4899' },
]

function GameLoader({ icon = '🎮', label = '游戏加载中…' }) {
  return (
    <div className="game-loader">
      <div className="loader-icon animate-bounce">{icon}</div>
      <p style={{ marginTop: 12, color: 'var(--text-secondary)' }}>{label}</p>
    </div>
  )
}

function GameHub() {
  const [selectedGameId, setSelectedGameId] = useState(null)
  const selectedGame = useMemo(() => GAMES.find(g => g.id === selectedGameId) || null, [selectedGameId])
  const ActiveGame = selectedGame ? GAME_COMPONENTS[selectedGame.id] : null

  const handleGameClick = (game) => {
    if (game.status !== 'active') {
      window.alert('这个还没做完，再等等')
      return
    }
    setSelectedGameId(game.id)
  }

  const handleBackToList = () => setSelectedGameId(null)

  if (selectedGame) {
    return (
      <div className="game-hub-container">
        <div className="wrap game-hub-shell">
          <div className="game-detail animate-fade-in">
            {/* 详情介绍条 */}
            <div className="game-detail-intro" style={{ background: `var(--paper-2)` }}>
              <button onClick={handleBackToList} className="back-button">
                <span>← 换个游戏玩</span>
              </button>
              <div className="detail-copy">
                <span className="detail-kicker">正在体验</span>
                <h2>{selectedGame.icon} {selectedGame.name}</h2>
                <p>{selectedGame.description}</p>
              </div>
              <div className="detail-badges">
                <span className="detail-badge">最高纪录: {selectedGame.best}</span>
              </div>
            </div>

            {/* 游戏实际运行面板 */}
            <div className="game-container">
              {ActiveGame ? (
                <Suspense fallback={<GameLoader icon={selectedGame.icon} label={`${selectedGame.name} 加载中…`} />}>
                  <ActiveGame onExit={handleBackToList} />
                </Suspense>
              ) : (
                <GameLoader icon={selectedGame.icon} label={`${selectedGame.name} 加载中…`} />
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="game-hub-container">
      {/* 模糊氛围发光圆盘 */}
      <div className="game-hub-ambient game-hub-ambient-one" />
      <div className="game-hub-ambient game-hub-ambient-two" />

      <div className="wrap game-hub-shell">
        {/* 顶部 Hero 宣传条 */}
        <section className="game-hub-hero panel dark animate-fade-in">
          <div className="hero-copy">
            <div className="hero-meta-row">
              <span className="hero-badge">橘猫小窝街机厅</span>
              <Link to="/" className="hero-home-link">← 回到博客主页</Link>
            </div>
            <h1 className="hub-title">经典小游戏</h1>
            <p className="hub-subtitle">
              练手做的一些网页小游戏，点开就玩。写不动博客的时候，就来这儿拖一会儿。目前攒了 <b>{GAMES.length}</b> 款。
            </p>
            <div className="hero-pills">
              <span className="hero-pill">像素街机</span>
              <span className="hero-pill">烧脑解密</span>
              <span className="hero-pill">东北特色</span>
            </div>
          </div>
          <div className="hero-visual hideSm">
            <div className="hero-avatar-frame">
              <img
                src="/images/game_mascot.png"
                alt="游戏橘猫"
                className="hero-avatar"
              />
            </div>
          </div>
        </section>

        {/* 统计概览面板 */}
        <div className="hub-overview animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="overview-card panel">
            <span className="overview-label">板块规模</span>
            <strong>{GAMES.length} 款小游戏</strong>
            <p>包含街机、棋牌、Galgame等类型</p>
          </div>
          <div className="overview-card panel">
            <span className="overview-label">引擎技术</span>
            <strong>Canvas + React</strong>
            <p>纯前端运行，流畅不发热</p>
          </div>
          <div className="overview-card panel">
            <span className="overview-label">更新节奏</span>
            <strong>持续上新</strong>
            <p>练手作品会陆续放进来</p>
          </div>
        </div>

        {/* 游戏库主体 */}
        <main className="game-hub-main animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="grid-header">
            <div>
              <h2>游戏库</h2>
              <p className="game-count">
                挑一个点开就玩，<strong>最高分</strong>存在你自己浏览器里。
              </p>
            </div>
          </div>

          <div className="game-library-layout">
            {/* 游戏卡片网格 */}
            <div className="game-cards">
              {GAMES.map((game) => (
                <button
                  key={game.id}
                  className="game-card"
                  onClick={() => handleGameClick(game)}
                  style={{ '--card-color': game.color }}
                >
                  <div className="card-accent" />
                  <div className="card-header">
                    <span className="card-badge">纪录: {game.best}</span>
                    <span className="card-dot" />
                  </div>
                  <div className="card-icon-shell">
                    <span className="card-icon">{game.icon}</span>
                  </div>
                  <h3 className="card-title">{game.name}</h3>
                  <p className="card-description">{game.description}</p>
                  <div className="card-footer">
                    <span className="card-note">▶ 玩一把</span>
                    <span className="card-arrow">→</span>
                  </div>
                  <div className="card-shine" />
                </button>
              ))}
            </div>

            {/* 侧边信息栏 */}
            <aside className="games-aside">
              <div className="aside-card panel">
                <span className="aside-kicker">友情提示</span>
                <h3>游戏防沉迷</h3>
                <ul className="aside-list" style={{ fontSize: '13.5px', lineHeight: 1.6 }}>
                  <li>游戏都是纯前端单机，最高分存在本地；清了浏览器缓存，纪录就没了。</li>
                  <li>适度游戏益脑，沉迷游戏伤身。玩累了可以顺便看篇博客。</li>
                </ul>
              </div>

              <div className="aside-card panel">
                <span className="aside-kicker">热门推荐</span>
                <h3>大伙都在玩</h3>
                <div className="aside-picks">
                  <div className="pick-item" onClick={() => handleGameClick(GAMES.find(g => g.id === 'super-cat'))}>
                    <div className="pick-icon">🍄</div>
                    <span className="pick-text">超级橘猫 (新)</span>
                  </div>
                  <div className="pick-item" onClick={() => handleGameClick(GAMES.find(g => g.id === 'flappy-cat'))}>
                    <div className="pick-icon">🐱</div>
                    <span className="pick-text">飞天橘猫</span>
                  </div>
                  <div className="pick-item" onClick={() => handleGameClick(GAMES.find(g => g.id === 'gobang'))}>
                    <div className="pick-icon">🌌</div>
                    <span className="pick-text">智能五子棋 (新)</span>
                  </div>
                  <div className="pick-item" onClick={() => handleGameClick(GAMES.find(g => g.id === 'yujie-game'))}>
                    <div className="pick-icon">💕</div>
                    <span className="pick-text">雨姐的心动时刻</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  )
}

export default GameHub
