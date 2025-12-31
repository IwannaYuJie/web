import { useState, useRef } from 'react'
import './YujieGame.css'
import gameData from '../data/yujieGameData'
import gameEvents from '../data/yujieGameEvents'

/**
 * 雨姐的心动时刻 - 重制版核心引擎
 *
 * 这是一个基于状态机的Galgame引擎
 * 包含：剧情播放、选项分支、好感度系统、结局判定
 */
const YujieGame = () => {
  // ==================== 状态定义 ====================

  // 游戏阶段: 'start' | 'playing' | 'ending'
  const [gamePhase, setGamePhase] = useState('start')

  // 玩家属性
  const [stats, setStats] = useState({
    affection: 0,      // 雨姐好感度
    laokuaiAlert: 0,   // 老蒯警觉度
    day: 1,            // 当前天数
    money: 100,        // 初始资金
    items: []          // 物品栏
  })

  // 当前剧情状态
  const [currentEventId, setCurrentEventId] = useState('event_arrival')
  const [dialogueIndex, setDialogueIndex] = useState(0)
  const [_history, setHistory] = useState([]) // 记录选择历史 (unused but for future)

  // 结局数据
  const [endingId, setEndingId] = useState(null)

  // 自动滚动到底部的ref
  const dialogueRef = useRef(null)

  // ==================== 核心逻辑 ====================

  // 开始新游戏
  const startNewGame = () => {
    setStats({
      affection: 0,
      laokuaiAlert: 0,
      day: 1,
      money: 100,
      items: []
    })
    setCurrentEventId('event_arrival')
    setDialogueIndex(0)
    setHistory([])
    setGamePhase('playing')
  }

  // 获取当前事件数据
  const currentEvent = gameEvents[currentEventId] || {
    title: '未知错误',
    scene: 'farmhouse',
    narration: '发生了一个错误，剧情丢失了...',
    dialogue: [],
    choices: []
  }

  // 处理点击继续剧情
  const handleContinue = () => {
    if (!currentEvent.dialogue) {return}

    if (dialogueIndex < currentEvent.dialogue.length - 1) {
      setDialogueIndex(prev => prev + 1)
    }
    // 如果对话结束，显示选项（如果有）
    // 注意：这里不需要做额外操作，渲染层会根据 dialogueIndex 判断是否显示选项
  }

  // 处理选项选择
  const handleChoice = (choice) => {
    // 1. 更新属性
    if (choice.effects) {
      setStats(prev => ({
        ...prev,
        affection: prev.affection + (choice.effects.affection || 0),
        laokuaiAlert: prev.laokuaiAlert + (choice.effects.laokuaiAlert || 0),
        money: prev.money + (choice.effects.money || 0)
      }))
    }

    // 2. 记录历史
    setHistory(prev => [...prev, choice.id])

    // 3. 转移到下一个事件
    if (choice.next) {
      // 检查是否是结局
      if (gameData.endings[choice.next]) {
        triggerEnding(choice.next)
      } else if (gameEvents[choice.next]) {
        setCurrentEventId(choice.next)
        setDialogueIndex(0)
      } else {
        // 如果找不到下一个事件，回到开始或提示
        console.warn('Next event not found:', choice.next)
        // 临时处理：如果没有后续，进入默认结局
        triggerEnding('normalEnding')
      }
    }
  }

  // 检查选项条件
  const checkCondition = (condition) => {
    if (!condition) {return true}

    if (condition.minAffection && stats.affection < condition.minAffection) {return false}
    if (condition.maxAffection && stats.affection > condition.maxAffection) {return false}
    if (condition.minAlert && stats.laokuaiAlert < condition.minAlert) {return false}
    if (condition.maxAlert && stats.laokuaiAlert > condition.maxAlert) {return false}
    if (condition.hasItem && !stats.items.includes(condition.hasItem)) {return false}
    // 检查是否拥有所有物品 (用于隐藏结局)
    if (condition.hasAllItems) {
       // 简单检查数量，假设至少收集4个核心物品
       if (stats.items.length < 4) {return false}
    }

    return true
  }

  // 触发结局
  const triggerEnding = (id) => {
    setEndingId(id)
    setGamePhase('ending')
  }

  // 获取角色图片 (预留，未来扩展用)
  const _getCharacterImage = (charId) => {
    const char = gameData.characters[charId]
    return char ? `/images/${char.avatar}` : null
  }

  // 获取场景图片
  const getSceneImage = (sceneId) => {
    const scene = gameData.scenes[sceneId]
    return scene ? `/images/${scene.background}` : null
  }

  // ==================== 渲染组件 ====================

  // 1. 开始界面
  if (gamePhase === 'start') {
    return (
      <div className="yujie-game-container">
        <div className="game-start-screen">
          <div className="start-screen-content">
            <h1 className="game-title">
              <span className="title-icon">💕</span>
              雨姐的心动时刻
              <span className="title-icon">🐕</span>
            </h1>
            <div className="game-cover">
              {/* 这里可以放封面图，暂时用颜色代替 */}
              <div style={{width: '100%', height: '100%', background: '#FF9F45', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', color: 'white'}}>
                GAME COVER
              </div>
            </div>
            <p className="game-description">
              一段跨越国界与文化的奇妙缘分。<br/>
              你要扮演杰克，在东北农家乐中，<br/>
              用真诚（和干活）打动雨姐的心！
            </p>
            <button className="start-button" onClick={startNewGame}>
              <span className="button-icon">▶️</span>
              <span>开始这段缘分</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 3. 结局界面
  if (gamePhase === 'ending') {
    const ending = gameData.endings[endingId] || gameData.endings.normalEnding
    return (
      <div className="yujie-game-container">
        <div className="game-ending-screen">
          <div className="ending-content">
            <h2 className="ending-title">{ending.name}</h2>
            <div className="ending-image">
              <div style={{width: '100%', height: '100%', background: '#667eea', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'}}>
                ENDING CG
              </div>
            </div>
            <div className="ending-text">
              <p>{ending.text}</p>
            </div>

            <div className="ending-stats">
              <div className="stat-item">
                <span className="stat-label">最终好感度</span>
                <span className="stat-value">{stats.affection}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">老蒯警觉度</span>
                <span className="stat-value">{stats.laokuaiAlert}</span>
              </div>
            </div>

            <button className="restart-button" onClick={() => setGamePhase('start')}>
              🔄 重新开始
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 2. 游戏主界面 (Playing)
  const currentDialogue = currentEvent.dialogue ? currentEvent.dialogue[dialogueIndex] : null

  // 如果对话还没完，或者当前是最后一句且还没有显示选项，则显示继续
  // 如果对话完了，就显示选项
  const showChoices = dialogueIndex >= (currentEvent.dialogue?.length || 0) - 1

  // 当前正在说话的角色
  const speaker = currentDialogue ? gameData.characters[currentDialogue.character] : null

  return (
    <div className="yujie-game-container">
      {/* 顶部状态栏 */}
      <div className="game-status-bar">
        <div className="status-item">
          <span className="status-icon">📅</span>
          <span>第 {stats.day} 天</span>
        </div>
        <div className="status-item">
          <span className="status-icon">❤️</span>
          <span>雨姐好感度</span>
          <div className="status-bar">
            <div
              className="status-fill affection"
              style={{width: `${Math.min(stats.affection, 100)}%`}}
            ></div>
          </div>
        </div>
        <div className="status-item">
          <span className="status-icon">👀</span>
          <span>老蒯警觉度</span>
          <div className="status-bar">
            <div
              className="status-fill alert"
              style={{width: `${Math.min(stats.laokuaiAlert, 100)}%`}}
            ></div>
          </div>
        </div>
      </div>

      {/* 游戏主舞台 */}
      <div className="game-main-area">
        {/* 背景层 */}
        <div
          className="scene-background"
          style={{
            backgroundImage: getSceneImage(currentEvent.scene) ? `url(${getSceneImage(currentEvent.scene)})` : 'none',
            backgroundColor: '#333' // Fallback
          }}
        ></div>

        {/* 遮罩层 (让文字更清晰) */}
        <div className="scene-overlay"></div>

        {/* 场景名称 */}
        <div className="scene-name">
          📍 {gameData.scenes[currentEvent.scene]?.name || '未知地点'}
        </div>

        {/* 角色层 */}
        {speaker && speaker.id !== 'jack' && ( // 杰克通常不显示在屏幕上，除非是CG
          <div className="character-area">
            <div className="character-sprite">
              {/* 暂时使用占位符，实际应加载 speaker.avatar */}
               <img
                src={`/images/${speaker.avatar}`}
                alt={speaker.name}
                className="character-image"
                onError={(e) => {e.target.style.display='none'}} //如果图片不存在隐藏
              />
            </div>
          </div>
        )}

        {/* 旁白/剧情描述 (如果当前没有对话，或者刚进入场景) */}
        {(!currentDialogue && currentEvent.narration) && (
          <div className="narration-box">
            {currentEvent.narration}
          </div>
        )}

        {/* 对话框 */}
        <div className="dialogue-box" ref={dialogueRef}>
          {currentDialogue ? (
            <>
              <div className="dialogue-header">
                <div className="character-avatar">
                  {/* 头像 */}
                  <img
                    src={`/images/${speaker?.avatar}`}
                    alt={speaker?.name}
                    onError={(e) => {e.target.src = 'https://placehold.co/60x60?text=?'}}
                  />
                </div>
                <span className="character-name">{speaker?.name || '???'}</span>
              </div>
              <div className="dialogue-text">
                {currentDialogue.text}
              </div>

              {/* 继续按钮 (如果不是最后一句，或者还没显示选项) */}
              {!showChoices ? (
                <div className="dialogue-continue" onClick={handleContinue}>
                  <span>点击继续</span>
                  <span className="continue-icon">▼</span>
                </div>
              ) : (
                // 如果是最后一句，且需要显示选项
                <div className="choices-container">
                   <div className="choices-title">做出你的选择：</div>
                   {currentEvent.choices && currentEvent.choices
                     .filter(choice => checkCondition(choice.condition))
                     .map((choice, idx) => (
                     <button
                      key={choice.id}
                      className="choice-button"
                      onClick={() => handleChoice(choice)}
                    >
                      <span className="choice-number">{idx + 1}</span>
                      <span className="choice-text">{choice.text}</span>
                      {/* 调试模式下显示效果，正式版可隐藏 */}
                      {/*
                      <div className="choice-effects">
                        {choice.effects?.affection > 0 && <span className="effect-positive">好感+{choice.effects.affection}</span>}
                      </div>
                      */}
                    </button>
                   ))}
                </div>
              )}
            </>
          ) : (
             // 没有对话时（只有旁白），直接显示选项或下一步
             <div className="choices-container">
                {currentEvent.choices && currentEvent.choices
                  .filter(choice => checkCondition(choice.condition))
                  .map((choice, idx) => (
                   <button
                    key={choice.id}
                    className="choice-button"
                    onClick={() => handleChoice(choice)}
                  >
                    <span className="choice-number">{idx + 1}</span>
                    <span className="choice-text">{choice.text}</span>
                  </button>
                 ))}
             </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default YujieGame
