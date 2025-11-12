import { useState, useEffect } from 'react'
import { characters, scenes, items, endings, chapters } from '../data/yujieGameData'
import { gameEvents } from '../data/yujieGameEvents'
import './YujieGame.css'

/**
 * 《雨姐的心动时刻》游戏主组件
 * 
 * 游戏机制：
 * - 好感度系统（0-100）
 * - 老蒯警觉度系统（0-100）
 * - 多结局系统
 * - 物品收集系统
 * - 时间推进系统
 */
function YujieGame() {
  // 游戏状态
  const [gameState, setGameState] = useState({
    day: 1,
    affection: 0, // 雨姐好感度
    laokuaiAlert: 0, // 老蒯警觉度
    inventory: [], // 物品栏
    currentEvent: 'event_arrival', // 当前事件
    currentChapter: 0, // 当前章节
    gameStarted: false,
    gameEnded: false,
    ending: null,
    history: [] // 选择历史
  })

  // 当前事件数据
  const [currentEventData, setCurrentEventData] = useState(null)
  const [dialogueIndex, setDialogueIndex] = useState(0)
  const [showChoices, setShowChoices] = useState(false)

  // 加载当前事件
  useEffect(() => {
    if (gameState.currentEvent && gameEvents[gameState.currentEvent]) {
      setCurrentEventData(gameEvents[gameState.currentEvent])
      setDialogueIndex(0)
      setShowChoices(false)
    }
  }, [gameState.currentEvent])

  /**
   * 开始游戏
   */
  const startGame = () => {
    setGameState({
      ...gameState,
      gameStarted: true,
      currentEvent: 'event_arrival'
    })
  }

  /**
   * 继续对话
   */
  const continueDialogue = () => {
    if (!currentEventData) return

    if (dialogueIndex < currentEventData.dialogue.length - 1) {
      setDialogueIndex(dialogueIndex + 1)
    } else {
      setShowChoices(true)
    }
  }

  /**
   * 处理选择
   * @param {Object} choice - 选择对象
   */
  const handleChoice = (choice) => {
    // 应用效果
    let newAffection = gameState.affection + (choice.effects.affection || 0)
    let newAlert = gameState.laokuaiAlert + (choice.effects.laokuaiAlert || 0)
    
    // 限制范围
    newAffection = Math.max(0, Math.min(100, newAffection))
    newAlert = Math.max(0, Math.min(100, newAlert))

    // 获取物品
    let newInventory = [...gameState.inventory]
    if (choice.getItem) {
      newInventory.push(choice.getItem)
    }

    // 记录历史
    const newHistory = [...gameState.history, {
      event: currentEventData.id,
      choice: choice.id,
      day: gameState.day
    }]

    // 检查是否触发坏结局
    if (newAlert >= 80) {
      setGameState({
        ...gameState,
        affection: newAffection,
        laokuaiAlert: newAlert,
        inventory: newInventory,
        history: newHistory,
        gameEnded: true,
        ending: 'badEnding'
      })
      return
    }

    // 更新状态并进入下一个事件
    setGameState({
      ...gameState,
      affection: newAffection,
      laokuaiAlert: newAlert,
      inventory: newInventory,
      history: newHistory,
      currentEvent: choice.next
    })
  }

  /**
   * 推进到下一章
   */
  const nextChapter = () => {
    const nextChapterIndex = gameState.currentChapter + 1
    
    if (nextChapterIndex >= chapters.length) {
      // 游戏结束，判断结局
      const ending = determineEnding()
      setGameState({
        ...gameState,
        gameEnded: true,
        ending: ending
      })
    } else {
      const nextChapter = chapters[nextChapterIndex]
      setGameState({
        ...gameState,
        currentChapter: nextChapterIndex,
        day: nextChapter.day,
        currentEvent: nextChapter.events[0]
      })
    }
  }

  /**
   * 判断结局
   * @returns {string} 结局ID
   */
  const determineEnding = () => {
    const { affection, laokuaiAlert, inventory, day } = gameState
    
    // 隐藏结局
    if (affection >= 95 && laokuaiAlert <= 20 && inventory.length >= 4 && day >= 40) {
      return 'secretEnding'
    }
    
    // 真爱结局
    if (affection >= 90 && laokuaiAlert <= 30 && day >= 30) {
      return 'trueEnding'
    }
    
    // 坏结局
    if (laokuaiAlert >= 80) {
      return 'badEnding'
    }
    
    // 好友结局
    if (affection >= 60 && affection < 90) {
      return 'goodEnding'
    }
    
    // 平淡结局
    return 'normalEnding'
  }

  /**
   * 重新开始游戏
   */
  const restartGame = () => {
    setGameState({
      day: 1,
      affection: 0,
      laokuaiAlert: 0,
      inventory: [],
      currentEvent: 'event_arrival',
      currentChapter: 0,
      gameStarted: false,
      gameEnded: false,
      ending: null,
      history: []
    })
  }

  // 渲染开始界面
  if (!gameState.gameStarted) {
    return (
      <div className="yujie-game-container">
        <div className="game-start-screen">
          <div className="start-screen-content">
            <h1 className="game-title">
              <span className="title-icon">💕</span>
              雨姐的心动时刻
              <span className="title-icon">💕</span>
            </h1>
            <div className="game-cover">
              <img src="/images/game_cover_yujie.jpg" alt="游戏封面" className="cover-image" />
              {/* 预留封面图片位置 */}
            </div>
            <p className="game-description">
              一个外国黑人小伙来到东北，<br />
              在雨姐的农家乐展开了一段奇妙的故事...<br />
              你的选择将决定故事的走向！
            </p>
            <div className="game-features">
              <div className="feature-item">
                <span className="feature-icon">❤️</span>
                <span>好感度系统</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎭</span>
                <span>多结局设计</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎒</span>
                <span>物品收集</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📅</span>
                <span>时间推进</span>
              </div>
            </div>
            <button className="start-button" onClick={startGame}>
              <span>开始游戏</span>
              <span className="button-icon">▶️</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 渲染结局界面
  if (gameState.gameEnded && gameState.ending) {
    const endingData = endings[gameState.ending]
    
    return (
      <div className="yujie-game-container">
        <div className="game-ending-screen">
          <div className="ending-content">
            <h2 className="ending-title">{endingData.name}</h2>
            <div className="ending-image">
              <img src={`/images/${endingData.image}`} alt={endingData.name} />
              {/* 预留结局图片位置 */}
            </div>
            <p className="ending-description">{endingData.description}</p>
            <div className="ending-text">
              <p>{endingData.text}</p>
            </div>
            <div className="ending-stats">
              <div className="stat-item">
                <span className="stat-label">雨姐好感度：</span>
                <span className="stat-value">{gameState.affection}/100</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">老蒯警觉度：</span>
                <span className="stat-value">{gameState.laokuaiAlert}/100</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">收集物品：</span>
                <span className="stat-value">{gameState.inventory.length}个</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">游戏天数：</span>
                <span className="stat-value">{gameState.day}天</span>
              </div>
            </div>
            <button className="restart-button" onClick={restartGame}>
              <span>重新开始</span>
              <span className="button-icon">🔄</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 渲染游戏主界面
  if (!currentEventData) {
    return <div className="loading">加载中...</div>
  }

  const currentScene = scenes[currentEventData.scene]
  const currentDialogue = currentEventData.dialogue[dialogueIndex]
  const currentCharacter = currentDialogue ? characters[currentDialogue.character] : null

  return (
    <div className="yujie-game-container">
      {/* 游戏状态栏 */}
      <div className="game-status-bar">
        <div className="status-item">
          <span className="status-icon">📅</span>
          <span>第 {gameState.day} 天</span>
        </div>
        <div className="status-item">
          <span className="status-icon">❤️</span>
          <span>好感度: {gameState.affection}/100</span>
          <div className="status-bar">
            <div className="status-fill affection" style={{ width: `${gameState.affection}%` }}></div>
          </div>
        </div>
        <div className="status-item">
          <span className="status-icon">⚠️</span>
          <span>警觉度: {gameState.laokuaiAlert}/100</span>
          <div className="status-bar">
            <div className="status-fill alert" style={{ width: `${gameState.laokuaiAlert}%` }}></div>
          </div>
        </div>
        <div className="status-item">
          <span className="status-icon">🎒</span>
          <span>物品: {gameState.inventory.length}</span>
        </div>
      </div>

      {/* 游戏主界面 */}
      <div className="game-main-area">
        {/* 场景背景 */}
        <div className="scene-background" style={{ backgroundImage: `url(/images/${currentScene.background})` }}>
          {/* 预留场景背景图片位置 */}
          <div className="scene-overlay"></div>
          <div className="scene-name">{currentScene.name}</div>
        </div>

        {/* 角色立绘区域 */}
        <div className="character-area">
          {currentCharacter && (
            <div className="character-sprite">
              <img 
                src={`/images/${currentCharacter.avatar}`} 
                alt={currentCharacter.name}
                className="character-image"
              />
              {/* 预留角色立绘图片位置 */}
            </div>
          )}
        </div>

        {/* 对话框 */}
        <div className="dialogue-box">
          {currentDialogue && (
            <>
              <div className="dialogue-header">
                <div className="character-avatar">
                  <img src={`/images/${currentDialogue.avatar}`} alt={currentCharacter.name} />
                  {/* 预留角色头像图片位置 */}
                </div>
                <div className="character-name">{currentCharacter.name}</div>
              </div>
              <div className="dialogue-text">
                <p>{currentDialogue.text}</p>
              </div>
              {!showChoices && (
                <div className="dialogue-continue" onClick={continueDialogue}>
                  <span>点击继续</span>
                  <span className="continue-icon">▼</span>
                </div>
              )}
            </>
          )}

          {/* 选择分支 */}
          {showChoices && currentEventData.choices && (
            <div className="choices-container">
              <div className="choices-title">请选择：</div>
              {currentEventData.choices.map((choice, index) => (
                <button
                  key={choice.id}
                  className="choice-button"
                  onClick={() => handleChoice(choice)}
                >
                  <span className="choice-number">{index + 1}</span>
                  <span className="choice-text">{choice.text}</span>
                  {choice.effects && (
                    <span className="choice-effects">
                      {choice.effects.affection > 0 && <span className="effect-positive">❤️+{choice.effects.affection}</span>}
                      {choice.effects.affection < 0 && <span className="effect-negative">❤️{choice.effects.affection}</span>}
                      {choice.effects.laokuaiAlert > 0 && <span className="effect-negative">⚠️+{choice.effects.laokuaiAlert}</span>}
                      {choice.effects.laokuaiAlert < 0 && <span className="effect-positive">⚠️{choice.effects.laokuaiAlert}</span>}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 旁白文本 */}
        {currentEventData.narration && dialogueIndex === 0 && (
          <div className="narration-box">
            <p>{currentEventData.narration}</p>
          </div>
        )}
      </div>

      {/* 游戏菜单按钮 */}
      <div className="game-menu-buttons">
        <button className="menu-button" onClick={restartGame}>
          <span>🔄</span>
          <span>重新开始</span>
        </button>
      </div>
    </div>
  )
}

export default YujieGame
