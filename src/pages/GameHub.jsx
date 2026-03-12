import { useState } from 'react'
import YujieGame from '../components/YujieGame'
import YujieAIGame from '../components/YujieAIGame'
import './GameHub.css'

/**
 * 游戏集合页面 🎮
 * 展示所有可用的小游戏入口
 * 
 * 功能说明:
 * - 展示多个小游戏的入口
 * - 每个游戏以卡片形式展示
 * - 点击卡片可以进入对应的游戏
 * - 支持后续添加更多游戏
 */
function GameHub() {
  // 游戏列表状态 - 后续可以在这里添加新游戏
  const [games] = useState([
    {
      id: 'yujie-game',
      name: '雨姐的心动时刻',
      icon: '💕',
      description: '东北风情恋爱模拟游戏，体验与雨姐的浪漫故事！',
      status: 'active',
      color: '#FF9F45',
      component: 'YujieGame'
    },
    {
      id: 'yujie-ai-game',
      name: 'AI攻略：东北雨姐',
      icon: '🤖💕',
      description: '扮演从外国归来的黑人小哥，用AI对话攻略雨姐的心！',
      status: 'active',
      color: '#FF8C1A',
      component: 'YujieAIGame'
    },
    {
      id: 'game-3',
      name: '敬请期待',
      icon: '🎲',
      description: '更多精彩游戏即将上线...',
      status: 'coming-soon',
      color: '#FFB366'
    },
    {
      id: 'game-4',
      name: '敬请期待',
      icon: '🎪',
      description: '更多精彩游戏即将上线...',
      status: 'coming-soon',
      color: '#FFC999'
    }
  ])

  // 当前选中的游戏
  const [selectedGame, setSelectedGame] = useState(null)

  /**
   * 处理游戏卡片点击
   * @param {Object} game - 游戏对象
   */
  const handleGameClick = (game) => {
    if (game.status === 'coming-soon') {
      // 如果是即将上线的游戏,显示提示
      alert('🎮 这个游戏正在开发中,敬请期待!')
      return
    }
    // 后续可以在这里添加游戏启动逻辑
    setSelectedGame(game)
  }

  /**
   * 返回游戏列表
   */
  const handleBackToList = () => {
    setSelectedGame(null)
  }

  return (
    <div className="game-hub-container">
      {/* 页面头部 */}
      <header className="game-hub-header">
        <div className="header-content">
          <h1 className="hub-title">
            <span className="title-icon">🎮</span>
            游戏中心
            <span className="title-icon">🎮</span>
          </h1>
          <p className="hub-subtitle">🎉 来玩点好玩的小游戏吧!</p>

        </div>
      </header>

      {/* 主内容区域 */}
      <main className="game-hub-main">
        {!selectedGame ? (
          // 游戏列表视图
          <div className="games-grid">
            <div className="grid-header">
              <h2>🎯 选择你想玩的游戏</h2>
              <p className="game-count">当前共有 <strong>{games.length}</strong> 个游戏位</p>
            </div>

            <div className="game-cards">
              {games.map((game) => (
                <div
                  key={game.id}
                  className={`game-card ${game.status === 'coming-soon' ? 'coming-soon' : ''}`}
                  onClick={() => handleGameClick(game)}
                  style={{ '--card-color': game.color }}
                >
                  <div className="card-inner">
                    <div className="card-icon">{game.icon}</div>
                    <h3 className="card-title">{game.name}</h3>
                    <p className="card-description">{game.description}</p>
                    
                    {game.status === 'coming-soon' ? (
                      <div className="card-status">
                        <span className="status-badge">即将上线</span>
                      </div>
                    ) : (
                      <div className="card-action">
                        <button className="play-button">
                          <span>开始游戏</span>
                          <span className="button-icon">▶️</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 卡片装饰效果 */}
                  <div className="card-shine"></div>
                </div>
              ))}
            </div>

            {/* 添加游戏提示卡片 */}
            <div className="add-game-hint">
              <div className="hint-icon">💡</div>
              <h3>想添加新游戏?</h3>
              <p>在 <code>GameHub.jsx</code> 的 <code>games</code> 数组中添加新游戏配置即可!</p>
              <div className="hint-example">
                <pre>{`{
  id: 'my-game',
  name: '我的游戏',
  icon: '🎯',
  description: '游戏描述',
  status: 'active',
  color: '#FF6B6B'
}`}</pre>
              </div>
            </div>
          </div>
        ) : (
          // 游戏详情/游戏界面视图
          <div className="game-detail">
            <button className="back-button" onClick={handleBackToList}>
              <span>← 返回游戏列表</span>
            </button>
            
            <div className="game-container">
              {/* 根据游戏ID加载对应的游戏组件 */}
              {selectedGame.id === 'yujie-game' && <YujieGame />}
              {selectedGame.id === 'yujie-ai-game' && <YujieAIGame />}
              {selectedGame.id !== 'yujie-game' && selectedGame.id !== 'yujie-ai-game' && (
                <>
                  <h2>{selectedGame.icon} {selectedGame.name}</h2>
                  <p>游戏内容区域 - 在这里加载具体的游戏组件</p>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default GameHub
