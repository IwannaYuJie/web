import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './YujieGame.css'
import gameData from '../data/yujieGameData'
import gameEvents from '../data/yujieGameEvents'
import {
  HUB,
  NIGHT,
  applyEffects,
  checkCondition,
  getActForDay,
  getNextScheduledEvent,
  getRecommendedRoutes,
  getWishProgress,
  initialStats,
  loadGallery,
  morningEventForDay,
  pickPortrait,
  pickStageSprite,
  routeEventId,
  shouldRenderStage,
  summarizeChoice
} from '../data/yujieGameEngine'

const {
  characters,
  scenes,
  items,
  routes,
  endings,
  wishGuides,
  TOTAL_DAYS,
  ACTIONS_PER_DAY,
  ALERT_GAME_OVER,
  GALLERY_KEY
} = gameData

const SAVE_KEY = 'yujie_save_v2'

/**
 * 校验存档数据完整性与形状，防止坏档导致页面崩溃
 */
const validateSaveData = (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return null
  }
  const { stats, mode, currentEventId, dialogueIndex, wishId } = data

  if (mode !== 'event' && mode !== 'hub') {
    return null
  }

  const targetEvent = gameEvents[currentEventId]
  if (!targetEvent) {
    return null
  }

  if (!Number.isInteger(dialogueIndex) || dialogueIndex < 0) {
    return null
  }

  // 校验 dialogueIndex 是否在当前事件可用行范围内（无台词仅选项的事件允许 0）
  const totalLines =
    (targetEvent.narration ? 1 : 0) + (Array.isArray(targetEvent.dialogue) ? targetEvent.dialogue.length : 0)
  if (totalLines === 0) {
    if (dialogueIndex !== 0) {
      return null
    }
  } else if (dialogueIndex >= totalLines) {
    return null
  }

  if (!stats || typeof stats !== 'object' || Array.isArray(stats)) {
    return null
  }

  const numFields = ['day', 'actionPoints', 'affection', 'laokuaiAlert', 'money', 'gooseCount']
  for (const field of numFields) {
    if (typeof stats[field] !== 'number' || !Number.isFinite(stats[field])) {
      return null
    }
  }

  // day: 1..TOTAL_DAYS 整数；actionPoints: 0..ACTIONS_PER_DAY 整数
  if (!Number.isInteger(stats.day) || stats.day < 1 || stats.day > TOTAL_DAYS) {
    return null
  }
  if (!Number.isInteger(stats.actionPoints) || stats.actionPoints < 0 || stats.actionPoints > ACTIONS_PER_DAY) {
    return null
  }

  // flags/routes 必须是非 null 且非数组的对象，items 必须为数组
  if (
    !Array.isArray(stats.items) ||
    !stats.flags ||
    typeof stats.flags !== 'object' ||
    Array.isArray(stats.flags) ||
    !stats.routes ||
    typeof stats.routes !== 'object' ||
    Array.isArray(stats.routes)
  ) {
    return null
  }

  const validWishId = typeof wishId === 'string' && wishGuides[wishId] ? wishId : null

  return {
    stats: {
      ...initialStats(),
      ...stats,
      flags: { ...stats.flags },
      routes: { ...stats.routes },
      items: [...stats.items]
    },
    mode,
    currentEventId,
    dialogueIndex,
    wishId: validWishId
  }
}

const loadSavedGame = () => {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw)
    return validateSaveData(parsed)
  } catch {
    return null
  }
}

const removeSaveData = () => {
  try {
    localStorage.removeItem(SAVE_KEY)
  } catch {
    // 静默降级
  }
}

/**
 * 雨姐的心动时刻 - 重制版 v2.3
 * 序章线性 → 自由行动hub → 日期强制事件 → 终章多结局
 */
const YujieGameInner = ({ onExit }) => {
  const [gamePhase, setGamePhase] = useState('start') // start | playing | ending
  const [stats, setStats] = useState(initialStats)
  const [mode, setMode] = useState('event') // event | hub
  const [currentEventId, setCurrentEventId] = useState('pro_arrive')
  const [dialogueIndex, setDialogueIndex] = useState(0)
  const [wishId, setWishId] = useState(null)
  const [showSleepConfirm, setShowSleepConfirm] = useState(false)
  const [endingId, setEndingId] = useState(null)
  const [toast, setToast] = useState(null) // { parts: [], key }
  const [gallery, setGallery] = useState(loadGallery)
  const [hasSave, setHasSave] = useState(() => Boolean(loadSavedGame()))
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false
    }
    return window.matchMedia('(max-width: 768px)').matches
  })

  const containerRef = useRef(null)
  const dialogueRef = useRef(null)
  const toastTimer = useRef(null)

  // 监听移动端媒体查询
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return
    }
    const mq = window.matchMedia('(max-width: 768px)')
    const handler = (e) => setIsMobile(e.matches)
    if (mq.addEventListener) {
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
    mq.addListener(handler)
    return () => mq.removeListener(handler)
  }, [])

  // 测量对话框实际高度并注入 CSS 变量，确保立绘避开对话区
  useEffect(() => {
    const rootEl = containerRef.current
    const targetEl = dialogueRef.current
    if (!rootEl) {
      return
    }

    if (!targetEl || mode !== 'event') {
      rootEl.style.setProperty('--dialogue-height', '220px')
      return
    }

    const updateHeight = (h) => {
      const clamped = Math.max(120, Math.min(Math.round(h), 500))
      rootEl.style.setProperty('--dialogue-height', `${clamped}px`)
    }

    updateHeight(targetEl.offsetHeight || 220)

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const borderBox = entry.borderBoxSize
          if (borderBox && borderBox[0]) {
            updateHeight(borderBox[0].blockSize)
          } else if (entry.contentRect) {
            updateHeight(entry.contentRect.height)
          }
        }
      })
      observer.observe(targetEl)
      return () => observer.disconnect()
    }
  }, [mode, dialogueIndex, currentEventId])

  // 每次进入 start 阶段时重新刷新存档存在状态
  useEffect(() => {
    if (gamePhase === 'start') {
      setHasSave(Boolean(loadSavedGame()))
    }
  }, [gamePhase])

  // playing 阶段自动存档
  useEffect(() => {
    if (gamePhase !== 'playing') {
      return
    }
    try {
      const payload = {
        stats,
        mode,
        currentEventId,
        dialogueIndex,
        wishId,
        timestamp: Date.now()
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload))
    } catch {
      // localStorage 不可用时静默降级
    }
  }, [gamePhase, stats, mode, currentEventId, dialogueIndex, wishId])

  // 飘字自动消失
  useEffect(() => {
    if (!toast) {
      return
    }
    toastTimer.current = setTimeout(() => setToast(null), 1800)
    return () => clearTimeout(toastTimer.current)
  }, [toast])

  // 轻量资源预加载（当前/下一可能事件 CG/背景与关键角色）
  useEffect(() => {
    if (gamePhase !== 'playing') {
      return
    }
    const preloadUrls = new Set()

    const addImg = (file) => {
      if (file && typeof file === 'string') {
        preloadUrls.add(`/images/${file}`)
      }
    }

    const currentEv = gameEvents[currentEventId]
    if (currentEv) {
      if (currentEv.cg) {
        addImg(currentEv.cg)
      }
      if (currentEv.scene && scenes[currentEv.scene]?.image) {
        addImg(scenes[currentEv.scene].image)
      }
      if (Array.isArray(currentEv.choices)) {
        currentEv.choices.forEach((c) => {
          const nextEv = gameEvents[c.next]
          if (nextEv) {
            if (nextEv.cg) {
              addImg(nextEv.cg)
            }
            if (nextEv.scene && scenes[nextEv.scene]?.image) {
              addImg(scenes[nextEv.scene].image)
            }
          }
        })
      }
    }

    preloadUrls.forEach((url) => {
      const img = new Image()
      img.src = url
    })
  }, [gamePhase, currentEventId])

  // ==================== 流程控制 ====================

  const gotoEvent = (id) => {
    setShowSleepConfirm(false)
    setCurrentEventId(id)
    setDialogueIndex(0)
    setMode('event')
  }

  // 进入下一天：重置行动点，命中日期事件则强制插入，否则回地图
  const advanceDay = (currentStats) => {
    setShowSleepConfirm(false)
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
    setShowSleepConfirm(false)
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
    removeSaveData()
    setHasSave(false)
  }

  const startNewGame = () => {
    removeSaveData()
    setStats(initialStats())
    setEndingId(null)
    setToast(null)
    setWishId(null)
    setShowSleepConfirm(false)
    setCurrentEventId('pro_arrive')
    setDialogueIndex(0)
    setMode('event')
    setGamePhase('playing')
  }

  const resumeSavedGame = () => {
    const saved = loadSavedGame()
    if (!saved) {
      startNewGame()
      return
    }
    setStats(saved.stats)
    setMode(saved.mode)
    setCurrentEventId(saved.currentEventId)
    setDialogueIndex(saved.dialogueIndex)
    setWishId(saved.wishId)
    setShowSleepConfirm(false)
    setEndingId(null)
    setToast(null)
    setGamePhase('playing')
  }

  const handleSaveAndReturnToTitle = () => {
    try {
      const payload = {
        stats,
        mode,
        currentEventId,
        dialogueIndex,
        wishId,
        timestamp: Date.now()
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload))
      setHasSave(true)
    } catch {
      // 静默降级
    }
    setGamePhase('start')
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

  const handleWishChange = (newWishId) => {
    if (wishGuides[newWishId]) {
      setWishId(newWishId)
      try {
        const payload = {
          stats,
          mode,
          currentEventId,
          dialogueIndex,
          wishId: newWishId,
          timestamp: Date.now()
        }
        localStorage.setItem(SAVE_KEY, JSON.stringify(payload))
      } catch {
        // 静默降级
      }
    }
  }

  const handleSleepClick = () => {
    if (stats.actionPoints > 0) {
      setShowSleepConfirm(true)
    } else {
      gotoEvent('night_rest')
    }
  }

  // ==================== 渲染辅助 ====================

  const renderAvatar = (charId, className, seed, expression) => {
    const char = characters[charId]
    if (!char) {
      return null
    }
    const img = pickPortrait(char, seed || charId, expression, 'avatar')
    if (img) {
      return (
        <img
          src={`/images/${img}`}
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

  // 场景背景：scene 图横版铺满（cover）；CG 竖版图 contain 完整显示+模糊垫底；图挂了渐变兜底
  const sceneLayers = (event) => {
    const scene = scenes[event?.scene] || scenes.yard
    const img = event?.cg || scene.image
    return {
      gradient: scene.gradient || scenes.yard.gradient,
      imgUrl: img ? `/images/${img}` : null,
      isCg: Boolean(event?.cg)
    }
  }

  // ==================== 开始界面 ====================
  if (gamePhase === 'start') {
    const total = Object.keys(endings).length
    return (
      <div className="yujie-game-container" ref={containerRef}>
        <div className="game-start-screen">
          <div className="start-screen-content">
            <div className="start-nav-bar">
              {onExit && (
                <button type="button" className="start-exit-button" onClick={onExit}>
                  ← 返回游戏列表
                </button>
              )}
            </div>
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
              甚至……卖一单不该卖的粉条。结局图鉴等你集齐！（v2.3）
            </p>

            <div className="start-actions">
              {hasSave ? (
                <>
                  <button type="button" className="start-button resume-button" onClick={resumeSavedGame}>
                    <span className="button-icon">⏯️</span>
                    <span>继续上次旅程</span>
                  </button>
                  <button type="button" className="start-button secondary-start-button" onClick={startNewGame}>
                    <span className="button-icon">🔄</span>
                    <span>重新开始</span>
                  </button>
                </>
              ) : (
                <button type="button" className="start-button" onClick={startNewGame}>
                  <span className="button-icon">▶️</span>
                  <span>开始这段缘分</span>
                </button>
              )}
            </div>

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
      <div className="yujie-game-container" ref={containerRef}>
        <div className="game-ending-screen">
          <div className="ending-content">
            <div className="ending-nav-bar">
              {onExit && (
                <button type="button" className="start-exit-button" onClick={onExit}>
                  ← 返回游戏列表
                </button>
              )}
            </div>
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

            <div className="ending-actions">
              <button type="button" className="restart-button" onClick={() => setGamePhase('start')}>
                🔄 回到标题
              </button>
            </div>
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
  const isNarrator = !currentLine || currentLine.character === '__narrator'
  const speaker = isNarrator ? null : characters[currentLine.character]

  // 分离 pose 与 expression，向前扫描最近的状态
  const stateOf = (charId) => {
    let expression = null
    let pose = null
    for (let i = dialogueIndex; i >= 0; i--) {
      const line = lines[i]
      if (line && line.character === charId) {
        if (!expression && line.expression) {
          expression = line.expression
        }
        if (!pose && line.pose) {
          pose = line.pose
        }
        if (expression && pose) {
          break
        }
      }
    }
    return { expression, pose }
  }

  // 舞台角色挑选与移动端简化
  const allSpeakerIds = []
  for (const line of lines) {
    if (line.character !== '__narrator' && !allSpeakerIds.includes(line.character)) {
      allSpeakerIds.push(line.character)
    }
  }

  let stageIds = []
  if (isMobile) {
    if (!isNarrator && currentLine?.character) {
      stageIds = [currentLine.character]
    } else {
      stageIds = allSpeakerIds.slice(0, 2)
    }
  } else {
    stageIds = allSpeakerIds.slice(0, 3)
  }

  const positionOf = (idx, total) => {
    if (total === 1) {
      return 'center'
    }
    if (total === 2) {
      return idx === 0 ? 'left' : 'right'
    }
    return ['left', 'center', 'right'][idx]
  }

  // 旅程指引与建议计算
  const currentAct = getActForDay(stats.day)
  const nextScheduled = getNextScheduledEvent(stats.day)
  const recommendedRoutes = wishId ? getRecommendedRoutes(wishId) : []
  const wishProgress = wishId ? getWishProgress(wishId, stats) : null

  // 特殊日程与 HUD AP 文本计算
  const isSpecialSchedule = mode !== 'hub' && Boolean(currentEvent.specialSchedule)
  let scheduleIcon = '⚡'
  let scheduleText = `行动点 ×${stats.actionPoints}`
  if (isSpecialSchedule) {
    if (currentEventId === 'night_rest') {
      scheduleIcon = '🌙'
      scheduleText = '歇息中'
    } else if (currentEventId === 'ev_final') {
      scheduleIcon = '⭐'
      scheduleText = '终章抉择'
    } else {
      scheduleIcon = '⭐'
      scheduleText = `特别日程：${currentEvent.title || '特别日程'}`
    }
  }

  // HUB 模式使用专属 yard 场景，避免残留前一事件场景与标题
  const activeSceneEvent = mode === 'hub' ? { scene: 'yard' } : currentEvent

  return (
    <div className="yujie-game-container" ref={containerRef}>
      {/* 顶部综合导航与状态栏 */}
      <header className="game-status-bar">
        <div className="status-nav-group">
          {onExit && (
            <button
              type="button"
              className="in-game-nav-btn exit-btn"
              onClick={onExit}
              title="返回博客游戏列表"
            >
              ← 游戏列表
            </button>
          )}
          <button
            type="button"
            className="in-game-nav-btn save-title-btn"
            onClick={handleSaveAndReturnToTitle}
            title="保存进度并返回游戏主标题"
          >
            💾 保存并回标题
          </button>
        </div>

        <div className="status-metrics-group">
          <div className="status-item day-item">
            <span className="status-icon">📅</span>
            <span className="status-text">
              第 {stats.day}/{TOTAL_DAYS} 天
            </span>
          </div>

          <div className="status-item ap-item">
            <span className="status-icon">{scheduleIcon}</span>
            <span className="status-text">{scheduleText}</span>
          </div>

          <div className="status-item gauge-item" title={`雨姐好感度: ${stats.affection}/100`}>
            <span className="status-icon">❤️</span>
            <div className="status-bar">
              <div
                className="status-fill affection"
                style={{ width: `${Math.min(stats.affection, 100)}%` }}
              ></div>
            </div>
            <span className="status-num">{stats.affection}</span>
          </div>
          <div className="status-item gauge-item" title={`老蒯警觉度: ${stats.laokuaiAlert}/100 (达到${ALERT_GAME_OVER}危险)`}>
            <span className="status-icon">👀</span>
            <div className="status-bar">
              <div
                className="status-fill alert"
                style={{ width: `${Math.min(stats.laokuaiAlert, 100)}%` }}
              ></div>
            </div>
            <span className="status-num">{stats.laokuaiAlert}</span>
          </div>
          <div className="status-item money-item">
            <span className="status-icon">💰</span>
            <span className="status-text">{stats.money}元</span>
          </div>
        </div>
      </header>

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
      <main className="game-main-area">
        {/* 背景层：渐变兜底；CG 竖版 contain+模糊垫底；场景横版 cover 铺满 */}
        {(() => {
          const layers = sceneLayers(activeSceneEvent)
          return (
            <>
              <div
                className="scene-background"
                style={{ backgroundImage: layers.gradient }}
              ></div>
              {layers.imgUrl &&
                (layers.isCg ? (
                  <>
                    <div
                      className="scene-background-blur"
                      style={{ backgroundImage: `url(${layers.imgUrl})` }}
                    ></div>
                    <div
                      className="scene-background-main"
                      style={{ backgroundImage: `url(${layers.imgUrl})` }}
                    ></div>
                  </>
                ) : (
                  <div
                    className="scene-background-cover"
                    style={{ backgroundImage: `url(${layers.imgUrl})` }}
                  ></div>
                ))}
            </>
          )
        })()}
        <div className="scene-overlay"></div>

        <div className="scene-name">
          📍 {mode === 'hub' ? '雨姐小院 · 自由行动' : (currentEvent.title || scenes[currentEvent.scene]?.name || '未知地点')}
        </div>

        {/* 效果飘字（无障碍 live region） */}
        <div aria-live="polite" aria-atomic="true" className="toast-live-region">
          {toast && (
            <div className="effect-toast" key={toast.key}>
              {toast.parts.map((part) => (
                <span key={part} className="effect-toast-item">
                  {part}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Galgame 舞台：CG 事件隐藏；普通事件立绘按 pose+expression 选图 */}
        {mode === 'event' && shouldRenderStage(currentEvent) && (
          <div className="stage-layer">
            {stageIds.map((cid, idx) => {
              const char = characters[cid]
              if (!char) {
                return null
              }
              const { expression, pose } = stateOf(cid)
              const img = pickStageSprite(char, `${currentEventId}:${cid}:${idx}`, pose, expression)
              const pos = positionOf(idx, stageIds.length)
              const roleState = isNarrator
                ? 'narrator-view'
                : currentLine && currentLine.character === cid
                ? 'active'
                : 'dim'

              return (
                <div key={cid} className={`stage-sprite ${pos} ${roleState}`}>
                  {img ? (
                    <img
                      src={`/images/${img}`}
                      alt={char.name}
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  ) : (
                    <span className="character-emoji">{char.emoji}</span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* 自由行动地图 */}
        {mode === 'hub' && (
          <div className="hub-panel">
            {/* 首次进入或未选愿望时的内联选择器 */}
            {!wishId ? (
              <section className="hub-wish-prompt" aria-labelledby="wish-prompt-title">
                <h3 id="wish-prompt-title" className="wish-prompt-title">
                  ✨ 确立你的东北之旅心愿（可随时调整）
                </h3>
                <div className="wish-prompt-grid">
                  {Object.values(wishGuides).map((guide) => (
                    <button
                      type="button"
                      key={guide.id}
                      className="wish-prompt-btn"
                      onClick={() => handleWishChange(guide.id)}
                    >
                      <strong className="wish-prompt-name">{guide.title}</strong>
                      <span className="wish-prompt-desc">{guide.description}</span>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {/* 旅程指引条 */}
            <div className="hub-journey-guide">
              <div className="guide-top-line">
                <span className="guide-act-pill">
                  {currentAct ? `第${currentAct.id.replace('act_', '')}幕 · ${currentAct.title}` : '自由行动'}
                </span>
                <span className="guide-wish-pill">
                  心愿：{wishGuides[wishId]?.title || '随性农家时光'}
                </span>
                {nextScheduled && (
                  <span className="guide-next-event">
                    ⏳ 下个固定事件：第 {nextScheduled.day} 天「{nextScheduled.name}」
                    （还剩 {Math.max(0, nextScheduled.day - stats.day)} 天）
                  </span>
                )}
              </div>
              <div className="guide-suggestion">
                💡 今日建议：
                {wishGuides[wishId]
                  ? wishGuides[wishId].description
                  : '自由分配体力，多与院里众人互动，结下深厚羁绊。'}
              </div>
            </div>

            {/* 内联可折叠旅途手记 */}
            <details className="hub-notes-details">
              <summary className="hub-notes-summary">
                <span>📖 旅途手记与心愿进度</span>
                <span className="summary-indicator">▼</span>
              </summary>
              <div className="hub-notes-content">
                <div className="notes-wish-switcher">
                  <label htmlFor="wish-select" className="wish-switcher-label">
                    切换目标心愿：
                  </label>
                  <select
                    id="wish-select"
                    className="wish-select"
                    value={wishId || 'casual'}
                    onChange={(e) => handleWishChange(e.target.value)}
                  >
                    {Object.values(wishGuides).map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title}
                      </option>
                    ))}
                  </select>
                </div>

                {wishProgress && wishProgress.requirements.length > 0 ? (
                  <div className="notes-requirements">
                    <div className="requirements-title">当前心愿达成条件：</div>
                    <ul className="requirements-list">
                      {wishProgress.requirements.map((req) => (
                        <li key={req.key} className={`req-item ${req.met ? 'met' : 'pending'}`}>
                          <span className="req-icon">{req.met ? '✅' : '⏳'}</span>
                          <span className="req-label">{req.label}：</span>
                          <span className="req-value">
                            {typeof req.target === 'boolean'
                              ? req.met
                                ? '已完成'
                                : '未达成'
                              : `${req.current} / 目标 ${req.target}`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="notes-empty-wish">随性农家时光无需硬性条件，尽情享受体验！</div>
                )}

                <div className="notes-routes-progress">
                  <div className="routes-progress-title">六大支线进度概览：</div>
                  <div className="routes-progress-grid">
                    {Object.values(routes).map((r) => {
                      const stage = stats.routes[r.id] || 0
                      const percent = Math.min(100, Math.round((stage / gameData.MAX_ROUTE_STAGE) * 100))
                      return (
                        <div key={r.id} className="route-progress-cell">
                          <span className="cell-icon">{r.icon}</span>
                          <span className="cell-name">{r.name}</span>
                          <progress className="cell-bar" max="3" value={stage} aria-label={`${r.name} 进度`}>
                            {percent}%
                          </progress>
                          <span className="cell-count">{stage}/3</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </details>

            <div className="hub-title">
              🗺️ 第 {stats.day} 天 · 今天去哪儿？（⚡×{stats.actionPoints}）
            </div>

            <div className="hub-grid">
              {Object.values(routes).map((route) => {
                const stage = stats.routes[route.id] || 0
                const completed = stage >= gameData.MAX_ROUTE_STAGE
                const usable = !completed || route.repeatable
                // 已完成的非重复路线不再显示推荐边框/徽章
                const isRecommended = !completed && recommendedRoutes.includes(route.id)

                let descText = route.description
                if (completed) {
                  if (route.repeatable) {
                    descText = route.repeatText
                  } else if (wishId === 'streamer' && route.id === 'market') {
                    if (stats.day < 6) {
                      descText = '技巧已掌握，等第6天赶集守住口碑'
                    } else if (stats.day < 9) {
                      descText = '口碑抉择做完后，第9天可提出直播'
                    } else if (stats.day < 12) {
                      descText = '直播方向已定，第12天盛宴见真章'
                    } else {
                      descText = '路线已完成，盛宴与结局会回响'
                    }
                  } else {
                    descText = '路线已完成，关键日程会记住这段经历'
                  }
                }

                return (
                  <button
                    type="button"
                    key={route.id}
                    className={`hub-card ${usable ? '' : 'disabled'} ${isRecommended ? 'recommended-route' : ''}`}
                    disabled={!usable}
                    onClick={() => handleRouteSelect(route.id)}
                  >
                    {isRecommended && <span className="recommended-badge">🌟 推荐</span>}
                    <span className="hub-card-icon">{route.icon}</span>
                    <span className="hub-card-name">{route.name}</span>
                    <span className="hub-card-desc">{descText}</span>
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

              {/* 回屋睡觉卡片：AP 剩余时同卡内确认，不直接跳过，不用弹窗 */}
              <div className="hub-card sleep-card">
                {!showSleepConfirm ? (
                  <button
                    type="button"
                    className="sleep-card-btn"
                    onClick={handleSleepClick}
                  >
                    <span className="hub-card-icon">😴</span>
                    <span className="hub-card-name">回屋睡觉</span>
                    <span className="hub-card-desc">
                      {stats.actionPoints > 0 ? '提早休息并跨入下一天' : '跳过今天，直接进入明天'}
                    </span>
                    <span className="hub-card-progress">💤 休息</span>
                  </button>
                ) : (
                  <div className="sleep-confirm-area">
                    <p className="sleep-confirm-text">
                      还剩 <strong>{stats.actionPoints}</strong> 点体力，确定要提前休息吗？
                    </p>
                    <div className="sleep-confirm-actions">
                      <button
                        type="button"
                        className="sleep-action-btn confirm"
                        onClick={() => gotoEvent('night_rest')}
                      >
                        确认休息
                      </button>
                      <button
                        type="button"
                        className="sleep-action-btn cancel"
                        onClick={() => setShowSleepConfirm(false)}
                      >
                        继续行动
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
                    <button
                      type="button"
                      className="dialogue-continue-button"
                      onClick={() => handleContinue(lines.length)}
                    >
                      <span>点击继续</span>
                      <span className="continue-icon">▼</span>
                    </button>
                  ) : (
                    <ChoiceList choices={currentEvent.choices || []} stats={stats} onPick={handleChoice} />
                  )}
                </>
              ) : (
                <>
                  <div className="dialogue-header">
                    <div className="character-avatar">
                      {renderAvatar(
                        currentLine.character,
                        'avatar-img',
                        `${currentEventId}:${dialogueIndex}`,
                        currentLine.expression
                      )}
                    </div>
                    <span className="character-name">{speaker?.name || '???'}</span>
                  </div>
                  <div className="dialogue-text">{currentLine.text}</div>
                  {!isLastLine ? (
                    <button
                      type="button"
                      className="dialogue-continue-button"
                      onClick={() => handleContinue(lines.length)}
                    >
                      <span>点击继续</span>
                      <span className="continue-icon">▼</span>
                    </button>
                  ) : (
                    <ChoiceList choices={currentEvent.choices || []} stats={stats} onPick={handleChoice} />
                  )}
                </>
              )
            ) : (
              <ChoiceList choices={currentEvent.choices || []} stats={stats} onPick={handleChoice} />
            )}
          </div>
        )}
      </main>
    </div>
  )
}

// 选项列表（含锁定项支持与无可用选项兜底，支持 >=4 项紧凑排版类名）
const ChoiceList = ({ choices, stats, onPick }) => {
  // 过滤出可渲染项：条件满足的选项，或条件不满足但带 lockedHint 的锁定项；无 hint 且不满足的隐藏不泄密
  const renderableChoices = choices
    .map((choice) => {
      const unlocked = checkCondition(choice.condition, stats)
      const hasHint = Boolean(choice.lockedHint)
      return {
        ...choice,
        unlocked,
        visible: unlocked || hasHint
      }
    })
    .filter((c) => c.visible)

  if (!renderableChoices.length) {
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

  const isDense = renderableChoices.length >= 4

  return (
    <div className={`choices-container ${isDense ? 'choices-container-dense' : ''}`.trim()}>
      <div className="choices-title">做出你的选择：</div>
      {renderableChoices.map((choice, idx) => {
        if (!choice.unlocked) {
          return (
            <button
              type="button"
              key={choice.id}
              className="choice-button locked-choice"
              disabled
              aria-disabled="true"
            >
              <span className="choice-number">🔒</span>
              <div className="choice-text-group">
                <span className="choice-text locked">{choice.text}</span>
                <span className="choice-locked-hint">（{choice.lockedHint}）</span>
              </div>
            </button>
          )
        }

        return (
          <button
            type="button"
            key={choice.id}
            className="choice-button"
            onClick={() => onPick(choice)}
          >
            <span className="choice-number">{idx + 1}</span>
            <span className="choice-text">{choice.text}</span>
          </button>
        )
      })}
    </div>
  )
}

// 通过 Portal 挂到 body
const YujieGame = (props) => createPortal(<YujieGameInner {...props} />, document.body)

export default YujieGame
