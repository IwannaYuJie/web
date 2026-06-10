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
  gobang: lazy(() => import('../components/Gobang')),
  stacker: lazy(() => import('../components/Stacker')),
  'yujie-game': lazy(() => import('../components/YujieGame')),
  'yujie-ai-game': lazy(() => import('../components/YujieAIGame')),
}

const GAMES = [
  { id: 'snake-game', name: '贪吃蛇', icon: '🐍', description: '控制橘蛇吞吃苹果，避开墙壁和身体，挑战极限长度！', best: '最长 38', status: 'active', color: '#FF9F45' },
  { id: 'tetris-game', name: '俄罗斯方块', icon: '🧱', description: '经典消除方块，控制下落方向进行整行消除以获得高分！', best: '最高 9900', status: 'active', color: 'var(--berry)' },
  { id: 'game-2048', name: '2048', icon: '🔢', description: '简单的数字滑动合并游戏，凑出传说中的 2048 棋片！', best: '最高 12480', status: 'active', color: 'var(--sun)' },
  { id: 'minesweeper', name: '扫雷', icon: '💣', description: '考验推理与运气的经典扫雷，利用数字逻辑推测出地雷！', best: '最快 41s', status: 'active', color: 'var(--vi)' },
  { id: 'memory-card', name: '记忆翻牌', icon: '🃏', description: '经典的卡牌翻转记忆测试，看看你最少几步能配对全部卡牌！', best: '最少 18 步', status: 'active', color: 'var(--mint)' },
  { id: 'breakout', name: '打砖块', icon: '🏓', description: '移动底盘板反弹小球，精准击碎悬挂在上空的五彩砖块！', best: '通关 3 关', status: 'active', color: 'var(--o)' },
  { id: 'sliding-puzzle', name: '数字华容道', icon: '🧩', description: '拖动零散的数字板块，用最少的步骤和最短的时间重归原位！', best: '最少步数', status: 'active', color: '#8D6E63' },
  { id: 'whack-a-mole', name: '打地鼠', icon: '🔨', description: '30 秒极速挑战！看准冒出头的地鼠砸下去，考验反射神经！', best: '最高 56', status: 'active', color: '#4CAF50' },
  { id: 'flappy-cat', name: '飞天橘猫', icon: '🐱', description: '控制小胖橘猫在猫爬架间穿梭，收集它最爱的小鱼干！', best: '最高 32', status: 'active', color: '#FF9800' },
  { id: 'gobang', name: '智能五子棋', icon: '🌌', description: '赛博霓虹风格，对战内置启发式极小化极大搜索智能 AI！', best: '无纪录', status: 'active', color: '#3B82F6' },
  { id: 'stacker', name: '炫彩叠叠乐', icon: '🧱', description: '动感十足的楼层对齐挑战，彩虹渐变高楼与错位残片切割物理！', best: '无纪录', status: 'active', color: '#10B981' },
  { id: 'yujie-game', name: '雨姐的心动时刻', icon: '💕', description: '东北农家乐Galgame模拟，化身杰克用真诚与汗水打动雨姐！', best: '真爱结局', status: 'active', color: '#EC4899' },
  { id: 'yujie-ai-game', name: 'AI攻略：东北雨姐', icon: '👩🏻', description: '与东北雨姐进行实时AI中文语音文本对话，征服豪爽的大嗓门！', best: '好感度 100', status: 'active', color: '#F43F5E' },
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
      window.alert('🎮 还在开发中，等等哈！')
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
                <span className="detail-badge">🏆 最高纪录: {selectedGame.best}</span>
              </div>
            </div>

            {/* 游戏实际运行面板 */}
            <div className="game-container">
              {ActiveGame ? (
                <Suspense fallback={<GameLoader icon={selectedGame.icon} label={`${selectedGame.name} 正在加载中，请稍后…`} />}>
                  <ActiveGame onExit={handleBackToList} />
                </Suspense>
              ) : (
                <GameLoader icon={selectedGame.icon} label={`${selectedGame.name} 正在加载中，请稍后…`} />
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
              <span className="hero-badge">🕹️ 橘猫小窝经典街机厅</span>
              <Link to="/" className="hero-home-link">← 回到博客主页</Link>
            </div>
            <h1 className="hub-title">经典小游戏</h1>
            <p className="hub-subtitle">
              练手做的一些网页小游戏，点开即玩。无论是消遣时光还是重温经典，这里都是完美的拖延博客写作的借口！已收集 <b>{GAMES.length}</b> 款高品质小游戏。
            </p>
            <div className="hero-pills">
              <span className="hero-pill">🎮 像素街机</span>
              <span className="hero-pill">🧠 烧脑解密</span>
              <span className="hero-pill">🤖 AI互动</span>
              <span className="hero-pill">👩🏻 东北特色</span>
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
            <span className="overview-label">趣味加倍</span>
            <strong>新增 3 个新游戏</strong>
            <p>集成雨姐特色大嗓门AI攻略</p>
          </div>
        </div>

        {/* 游戏库主体 */}
        <main className="game-hub-main animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="grid-header">
            <div>
              <h2>🎮 游戏库列表</h2>
              <p className="game-count">
                挑选一款心仪的游戏开始体验吧，所有游戏均支持本地 <strong>最高分记录</strong>！
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
                    <span className="card-badge">🏆 纪录: {game.best}</span>
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
                <span className="aside-kicker">💡 友情提示</span>
                <h3>游戏防沉迷</h3>
                <ul className="aside-list" style={{ fontSize: '13.5px', lineHeight: 1.6 }}>
                  <li>所有游戏均为纯前端单机，刷新网页会保存最高纪录，但清除浏览器缓存会导致记录归零哦！</li>
                  <li>《AI攻略雨姐》调用了后端的 AI 模型，如果提示网络连接失败，请检查您的科学上网配置。</li>
                  <li>适度游戏益脑，沉迷游戏伤身。玩累了记得看篇博客支持一下！</li>
                </ul>
              </div>

              <div className="aside-card panel">
                <span className="aside-kicker">🌟 热门推荐</span>
                <h3>大伙都在玩</h3>
                <div className="aside-picks">
                  <div className="pick-item" onClick={() => handleGameClick(GAMES.find(g => g.id === 'flappy-cat'))}>
                    <div className="pick-icon">🐱</div>
                    <span className="pick-text">飞天橘猫 (新)</span>
                  </div>
                  <div className="pick-item" onClick={() => handleGameClick(GAMES.find(g => g.id === 'gobang'))}>
                    <div className="pick-icon">🌌</div>
                    <span className="pick-text">智能五子棋 (新)</span>
                  </div>
                  <div className="pick-item" onClick={() => handleGameClick(GAMES.find(g => g.id === 'yujie-ai-game'))}>
                    <div className="pick-icon">👩🏻</div>
                    <span className="pick-text">AI攻略：东北雨姐</span>
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
