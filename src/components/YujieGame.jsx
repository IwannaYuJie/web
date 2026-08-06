import { useEffect, useRef, useState } from 'react'
import './YujieGame.css'
import gameData from '../data/yujieGameData'
import gameEvents from '../data/yujieGameEvents'
import {
  HUB,
  NIGHT,
  applyEffects,
  checkCondition,
  initialStats,
  loadGallery,
  morningEventForDay,
  routeEventId,
  summarizeChoice
} from '../data/yujieGameEngine'

const { characters, scenes, items, routes, endings, TOTAL_DAYS, ACTIONS_PER_DAY, ALERT_GAME_OVER, GALLERY_KEY } =
  gameData

/**
 * 雨姐的心动时刻 - 重制版
 * 序章线性 → 自由行动hub → 日期强制事件 → 终章多结局
 */
const YujieGame = ({ onExit }) => {
  const [gamePhase, setGamePhase] = useState('start') // start | playing | ending
  const [stats, setStats] = useState(initialStats)
  const [mode, setMode] = useState('event') // event | hub
  const [currentEventId, setCurrentEventId] = useState('pro_arrive')
  const [dialogueIndex, setDialogueIndex] = useState(0)
  const [endingId, setEndingId] = useState(null)
  const [toast, setToast] = useState(null) // { parts: [], key }
  const [gallery, setGallery] = useState(loadGallery)
  const dialogueRef = useRef(null)
  const toastTimer = useRef(null)

  // 飘字自动消失
  useEffect(() => {
    if (!toast) {
      return
    }
    toastTimer.current = setTimeout(() => setToast(null), 1800)
    return () => clearTimeout(toastTimer.current)
  }, [toast])

  // ==================== 流程控制 ====================

  const gotoEvent = (id) => {
    setCurrentEventId(id)
    setDialogueIndex(0)
    setMode('event')
  }

  // 进入下一天：重置行动点，命中日期事件则强制插入，否则回地图
  const advanceDay = (currentStats) => {
    const nextDay = currentStats.day + 1
    const newStats = { ...currentStats, day: nextDay, actionPoints: ACTIONS_PER_DAY }
    setStats(newStats)
    const morningEvent = morningEventForDay(nextDay, newStats.flags)
    if (morningEvent) {
      gotoEvent(morningEvent)
    } else {
      setMode('hub')
    }
  }

  const triggerEnding = (id) => {
    const unlocked = loadGallery()
    if (!unlocked.includes(id)) {
      unlocked.push(id)
      try {
        localStorage.setItem(GALLERY_KEY, JSON.stringify(unlocked))
      } catch {
        // localStorage 不可用时静默跳过
      }
    }
    setGallery(unlocked)
    setEndingId(id)
    setGamePhase('ending')
  }

  const startNewGame = () => {
    setStats(initialStats())
    setEndingId(null)
    setToast(null)
    setGamePhase('playing')
    gotoEvent('pro_arrive')
  }

  // 选项选择
  const handleChoice = (choice) => {
    const newStats = applyEffects(stats, choice)
    setStats(newStats)
    const parts = summarizeChoice(choice)
    if (parts.length) {
      setToast({ parts, key: Date.now() })
    }

    const next = choice.next

    // 警觉度爆表 → 强制被赶走（优先级高于普通跳转）
    if (newStats.laokuaiAlert >= ALERT_GAME_OVER && !endings[next]) {
      triggerEnding('ending_kicked')
      return
    }

    if (next === HUB) {
      if (newStats.actionPoints > 0) {
        setMode('hub')
      } else {
        gotoEvent('night_rest')
      }
    } else if (next === NIGHT) {
      advanceDay(newStats)
    } else if (endings[next]) {
      triggerEnding(next)
    } else if (gameEvents[next]) {
      gotoEvent(next)
    } else {
      console.warn('未知跳转目标:', next)
      triggerEnding('ending_bye')
    }
  }

  // 点击继续对话
  const handleContinue = (totalLines) => {
    if (dialogueIndex < totalLines - 1) {
      setDialogueIndex((prev) => prev + 1)
    }
  }

  // hub 中选择地点
  const handleRouteSelect = (routeId) => {
    const eventId = routeEventId(routeId, stats.routes[routeId] || 0)
    if (!eventId || !gameEvents[eventId]) {
      console.warn('支线事件缺失:', routeId)
      return
    }
    setStats((prev) => ({ ...prev, actionPoints: Math.max(0, prev.actionPoints - 1) }))
    gotoEvent(eventId)
  }

  // ==================== 渲染辅助 ====================

  const exitButton = onExit ? (
    <button type="button" className="game-exit-button" onClick={onExit}>
      ← 返回游戏列表
    </button>
  ) : null

  const renderAvatar = (charId, className) => {
    const char = characters[charId]
    if (!char) {
      return null
    }
    if (char.avatar) {
      return (
        <img
          src={`/images/${char.avatar}`}
          alt={char.name}
          className={className}
          onError={(e) => {
            e.target.style.display = 'none'
          }}
        />
      )
    }
    return <span className={`${className} emoji-avatar`}>{char.emoji}</span>
  }

  // 场景背景样式：图片叠在渐变上，图挂了渐变兜底
  const sceneStyle = (event) => {
    const scene = scenes[event?.scene] || scenes.yard
    const gradient = scene.gradient || scenes.yard.gradient
    const img = event?.cg || scene.image
    if (img) {
      return { backgroundImage: `url(/images/${img}), ${gradient}` }
    }
    return { backgroundImage: gradient }
  }

  // ==================== 开始界面 ====================
  if (gamePhase === 'start') {
    const total = Object.keys(endings).length
    return (
      <div className="yujie-game-container">
        {exitButton}
        <div className="game-start-screen">
          <div className="start-screen-content">
            <h1 className="game-title">
              <span className="title-icon">💕</span>
              雨姐的心动时刻
              <span className="title-icon">🪿</span>
            </h1>
            <div className="game-cover">
              <img
                src="/images/yujie/cover.jpg"
                alt="雨姐的心动时刻"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            </div>
            <p className="game-description">
              十三天东北农家乐，每天2点行动点自由分配。
              <br />
              六条支线、九个结局——追雨姐、拜把子、当大厨、带大鹅，
              <br />
              甚至……卖一单不该卖的粉条。结局图鉴等你集齐！
            </p>
            <button type="button" className="start-button" onClick={startNewGame}>
              <span className="button-icon">▶️</span>
              <span>开始这段缘分</span>
            </button>

            <div className="gallery-block">
              <div className="gallery-title">🏆 结局图鉴 {gallery.length}/{total}</div>
              <div className="gallery-grid">
                {Object.values(endings).map((ending) => {
                  const unlocked = gallery.includes(ending.id)
                  return (
                    <div
                      key={ending.id}
                      className={`gallery-item ${unlocked ? 'unlocked' : 'locked'}`}
                      title={unlocked ? ending.text : ending.hint}
                    >
                      <span className="gallery-icon">{unlocked ? ending.icon : '🔒'}</span>
                      <span className="gallery-name">{unlocked ? ending.name : '？？？'}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ==================== 结局界面 ====================
  if (gamePhase === 'ending') {
    const ending = endings[endingId] || endings.ending_bye
    const total = Object.keys(endings).length
    return (
      <div className="yujie-game-container">
        {exitButton}
        <div className="game-ending-screen">
          <div className="ending-content">
            <h2 className="ending-title">
              {ending.icon} {ending.name}
            </h2>
            <div className="ending-image">
              <img
                src={`/images/${ending.image}`}
                alt={ending.name}
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
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
              <div className="stat-item">
                <span className="stat-label">鹅王之证</span>
                <span className="stat-value">🪿×{stats.gooseCount}</span>
              </div>
            </div>

            <div className="ending-gallery-note">
              🏆 结局图鉴：{gallery.length}/{total}
            </div>

            <button type="button" className="restart-button" onClick={() => setGamePhase('start')}>
              🔄 再来一局
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ==================== 游戏主界面 ====================
  const currentEvent = gameEvents[currentEventId] || {
    title: '未知错误',
    scene: 'yard',
    narration: '发生了一个错误，剧情丢失了……',
    dialogue: [],
    choices: []
  }

  // 把旁白折叠成第一行，用统一步进器推进
  const lines = [
    ...(currentEvent.narration ? [{ character: '__narrator', text: currentEvent.narration }] : []),
    ...(currentEvent.dialogue || [])
  ]
  const currentLine = lines[dialogueIndex] || null
  const isLastLine = dialogueIndex >= lines.length - 1
  const speaker =
    currentLine && currentLine.character !== '__narrator' ? characters[currentLine.character] : null
  const visibleChoices = (currentEvent.choices || []).filter((c) => checkCondition(c.condition, stats))

  return (
    <div className="yujie-game-container">
      {exitButton}
      {/* 顶部状态栏 */}
      <div className="game-status-bar">
        <div className="status-item">
          <span className="status-icon">📅</span>
          <span>
            第 {stats.day}/{TOTAL_DAYS} 天
          </span>
        </div>
        <div className="status-item">
          <span className="status-icon">⚡</span>
          <span>行动点 ×{stats.actionPoints}</span>
        </div>
        <div className="status-item">
          <span className="status-icon">❤️</span>
          <div className="status-bar">
            <div
              className="status-fill affection"
              style={{ width: `${Math.min(stats.affection, 100)}%` }}
            ></div>
          </div>
          <span className="status-num">{stats.affection}</span>
        </div>
        <div className="status-item">
          <span className="status-icon">👀</span>
          <div className="status-bar">
            <div
              className="status-fill alert"
              style={{ width: `${Math.min(stats.laokuaiAlert, 100)}%` }}
            ></div>
          </div>
          <span className="status-num">{stats.laokuaiAlert}</span>
        </div>
        <div className="status-item">
          <span className="status-icon">💰</span>
          <span>{stats.money}元</span>
        </div>
      </div>

      {/* 物品栏 */}
      {stats.items.length > 0 && (
        <div className="game-inventory-bar">
          <span className="inventory-label">🎒</span>
          {stats.items.map((itemId) => {
            const item = items[itemId]
            return item ? (
              <span key={itemId} className="inventory-chip" title={item.description}>
                {item.emoji} {item.name}
              </span>
            ) : null
          })}
        </div>
      )}

      {/* 游戏主舞台 */}
      <div className="game-main-area">
        <div className="scene-background" style={sceneStyle(currentEvent)}></div>
        <div className="scene-overlay"></div>

        <div className="scene-name">
          📍 {currentEvent.title || scenes[currentEvent.scene]?.name || '未知地点'}
        </div>

        {/* 效果飘字 */}
        {toast && (
          <div className="effect-toast" key={toast.key}>
            {toast.parts.map((part) => (
              <span key={part} className="effect-toast-item">
                {part}
              </span>
            ))}
          </div>
        )}

        {/* 角色立绘 */}
        {mode === 'event' && speaker && speaker.id !== 'jack' && (
          <div className="character-area">
            <div className="character-sprite">
              {speaker.avatar ? (
                <img
                  src={`/images/${speaker.avatar}`}
                  alt={speaker.name}
                  className="character-image"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              ) : (
                <span className="character-emoji">{speaker.emoji}</span>
              )}
            </div>
          </div>
        )}

        {/* 自由行动地图 */}
        {mode === 'hub' && (
          <div className="hub-panel">
            <div className="hub-title">
              🗺️ 第 {stats.day} 天 · 今天去哪儿？（⚡×{stats.actionPoints}）
            </div>
            <div className="hub-grid">
              {Object.values(routes).map((route) => {
                const stage = stats.routes[route.id] || 0
                const completed = stage >= gameData.MAX_ROUTE_STAGE
                const usable = !completed || route.repeatable
                return (
                  <button
                    type="button"
                    key={route.id}
                    className={`hub-card ${usable ? '' : 'disabled'}`}
                    disabled={!usable}
                    onClick={() => handleRouteSelect(route.id)}
                  >
                    <span className="hub-card-icon">{route.icon}</span>
                    <span className="hub-card-name">{route.name}</span>
                    <span className="hub-card-desc">
                      {completed && route.repeatable ? route.repeatText : route.description}
                    </span>
                    <span className="hub-card-progress">
                      {completed
                        ? route.repeatable
                          ? '🔁 可反复打工'
                          : '✅ 已走完'
                        : `剧情 ${'●'.repeat(stage)}${'○'.repeat(gameData.MAX_ROUTE_STAGE - stage)}`}
                    </span>
                  </button>
                )
              })}
              <button
                type="button"
                className="hub-card sleep-card"
                onClick={() => gotoEvent('night_rest')}
              >
                <span className="hub-card-icon">😴</span>
                <span className="hub-card-name">回屋睡觉</span>
                <span className="hub-card-desc">跳过今天，直接进入明天</span>
                <span className="hub-card-progress">💤 休息</span>
              </button>
            </div>
          </div>
        )}

        {/* 对话/旁白/选项 */}
        {mode === 'event' && (
          <div className="dialogue-box" ref={dialogueRef}>
            {currentLine ? (
              currentLine.character === '__narrator' ? (
                <>
                  <div className="narration-text">{currentLine.text}</div>
                  {!isLastLine ? (
                    <div className="dialogue-continue" onClick={() => handleContinue(lines.length)}>
                      <span>点击继续</span>
                      <span className="continue-icon">▼</span>
                    </div>
                  ) : (
                    <ChoiceList choices={visibleChoices} onPick={handleChoice} />
                  )}
                </>
              ) : (
                <>
                  <div className="dialogue-header">
                    <div className="character-avatar">
                      {renderAvatar(currentLine.character, 'avatar-img')}
                    </div>
                    <span className="character-name">{speaker?.name || '???'}</span>
                  </div>
                  <div className="dialogue-text">{currentLine.text}</div>
                  {!isLastLine ? (
                    <div className="dialogue-continue" onClick={() => handleContinue(lines.length)}>
                      <span>点击继续</span>
                      <span className="continue-icon">▼</span>
                    </div>
                  ) : (
                    <ChoiceList choices={visibleChoices} onPick={handleChoice} />
                  )}
                </>
              )
            ) : (
              <ChoiceList choices={visibleChoices} onPick={handleChoice} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// 选项列表（无可用选项时兜底推进，避免死局）
const ChoiceList = ({ choices, onPick }) => {
  if (!choices.length) {
    return (
      <div className="choices-container">
        <button
          type="button"
          className="choice-button"
          onClick={() => onPick({ id: 'fallback', next: 'NIGHT' })}
        >
          <span className="choice-number">→</span>
          <span className="choice-text">（无可选项）先回屋休息</span>
        </button>
      </div>
    )
  }
  return (
    <div className="choices-container">
      <div className="choices-title">做出你的选择：</div>
      {choices.map((choice, idx) => (
        <button
          type="button"
          key={choice.id}
          className="choice-button"
          onClick={() => onPick(choice)}
        >
          <span className="choice-number">{idx + 1}</span>
          <span className="choice-text">{choice.text}</span>
        </button>
      ))}
    </div>
  )
}

export default YujieGame
