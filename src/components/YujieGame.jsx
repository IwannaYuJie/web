import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './YujieGame.css'
import gameData from '../data/yujieGameData'
import gameEvents from '../data/yujieGameEvents'
import {
  HUB,
  NIGHT,
  applyEffects,
  buildHistoryEntry,
  checkCondition,
  getActForDay,
  getNextScheduledEvent,
  getRecommendedRoutes,
  getRelationshipStages,
  getRouteLockHint,
  getRouteMaxStage,
  getSpecialRouteEvent,
  getWishProgress,
  initialStats,
  loadGallery,
  migrateStats,
  morningEventForDay,
  nightEventForStats,
  pickPortrait,
  pickStageSprite,
  resolveChoiceOutcome,
  routeEventId,
  shouldInsertWarning,
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
  ALERT_GAME_OVER,
  GALLERY_KEY
} = gameData

const SAVE_KEY = 'yujie_save_v2'

// 首周目心愿生活化描述与建议映射（防剧透，禁止精确数字/门槛/幕数变量）
const NATURAL_WISH_HINTS = {
  casual: {
    desc: '随心体验乡野生活，随性闲逛与唠嗑，不求功利。',
    tip: '放平心态，多和院里大伙儿走动走动，顺其自然。'
  },
  romance_pure: {
    desc: '读懂雨姐雷厉风行下的温柔与疲惫，成为她最信赖的知心人。',
    tip: '多去上房帮衬雨姐，在关键时刻给予体谅与温暖。'
  },
  romance_overlord: {
    desc: '与风风火火的霸气雨姐并肩同行，领略她独当一面的豪迈气魄。',
    tip: '在上房与日常相处中展现坦诚与魄力，支持她的决策。'
  },
  soulmate_laokuai: {
    desc: '与老蒯促膝长谈，读懂他的默默付出与隐忍智慧，做互诉心事的知己。',
    tip: '多去后院和老蒯搭把手、唠唠嗑，保持坦荡与边界感。'
  },
  laokuai_romance: {
    desc: '在朝夕相伴中抚平老蒯心头的落寞，悄然滋生跨越知己的真挚情愫。',
    tip: '经常去后院陪伴老蒯，在他需要安慰时给予最真诚的关照。'
  },
  career: {
    desc: '深度参与短视频与电商农产品运营，让东北农产好物走出大山。',
    tip: '多往直播棚与粉条厂使劲，用心把关品质与流程。'
  },
  rich: {
    desc: '勤恳劳作打工，精打细算积累本金，在乡间实现财富充裕。',
    tip: '勤去粉条厂打工赚钱，每一笔花销都仔细权衡。'
  },
  goose_hero: {
    desc: '收服院中霸王大鹅，从互相试探到心意相通，成为山庄鹅王。',
    tip: '多往大鹅林子里走走，摸清这只傲娇大鹅的脾气。'
  }
}

// 剧情标志位的中文人类可读标签
const FLAG_LABELS = {
  talked_openly: '敞开心扉',
  helped_steaming: '帮衬蒸馒头',
  knows_yujie_past: '知晓雨姐过往',
  knows_laokuai_dream: '倾听老蒯心愿',
  fixed_light: '修好直播灯',
  fixed_towel: '洗晒毛巾',
  eaten_pot_together: '同吃铁锅炖',
  shared_secret: '互诉心声',
  livestream_ready: '备战大场直播',
  fentiao_mastered: '掌握漏粉手艺',
  goose_ally: '大鹅结为盟友',
  warned_boundary: '留心相处分寸',
  laokuai_comforted: '宽慰老蒯心绪'
}

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

  const migrated = migrateStats(stats)
  const validWishId = typeof wishId === 'string' && wishGuides[wishId] ? wishId : null

  return {
    stats: migrated,
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
 * 雨姐的心动时刻 - 重制版 v2.4
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
  const [exactJournal, setExactJournal] = useState(() => loadGallery().length > 0)
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

  // 每次进入 start 阶段时重新刷新存档存在状态与图鉴
  useEffect(() => {
    if (gamePhase === 'start') {
      setHasSave(Boolean(loadSavedGame()))
      setGallery(loadGallery())
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

  // 触发结局
  const triggerEnding = (id, finalStats = null) => {
    setShowSleepConfirm(false)
    removeSaveData()
    setHasSave(false)
    if (finalStats) {
      setStats(finalStats)
    }
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

  // 进入下一天：D12/D13 不分配 AP，其余固定 2 AP；天数不超过 13
  const advanceDay = (currentStats) => {
    setShowSleepConfirm(false)
    const nextDay = Math.min(TOTAL_DAYS, (currentStats.day || 1) + 1)
    const newAp = nextDay >= 12 ? 0 : 2
    const newStats = {
      ...currentStats,
      day: nextDay,
      actionPoints: newAp
    }
    setStats(newStats)
    const morningEvent = morningEventForDay(nextDay, newStats.flags)
    if (morningEvent) {
      gotoEvent(morningEvent)
    } else {
      setMode('hub')
    }
  }

  const startNewGame = () => {
    removeSaveData()
    const initial = initialStats()
    setExactJournal(loadGallery().length > 0)
    setStats(initial)
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
    setExactJournal(loadGallery().length > 0)
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

  // 选项选择：resolveChoiceOutcome 恰好一次，applyEffects，buildHistoryEntry，支持告警插曲
  const handleChoice = (choice) => {
    const resolvedChoice = resolveChoiceOutcome(choice, stats)
    let newStats = applyEffects(stats, resolvedChoice)
    const historyEntry = buildHistoryEntry(stats.day, resolvedChoice)
    newStats = {
      ...newStats,
      historyLog: [...(newStats.historyLog || []), historyEntry]
    }
    setStats(newStats)

    const parts = summarizeChoice(resolvedChoice)
    if (parts.length) {
      setToast({ parts, key: Date.now() })
    }

    // 警觉爆表立即逐出山门（强于普通跳转）
    if ((newStats.laokuaiAlert || 0) >= ALERT_GAME_OVER) {
      triggerEnding('ending_kicked', newStats)
      return
    }

    const next = resolvedChoice.next

    // 告警插曲判定：30..44 且未触发过，在回 HUB 前免费插入
    const handleReturnToHub = (targetStats) => {
      if (shouldInsertWarning(targetStats)) {
        gotoEvent('ev_warning')
        return
      }
      if (targetStats.actionPoints > 0) {
        setMode('hub')
      } else {
        const nightEvent = nightEventForStats(targetStats)
        gotoEvent(nightEvent)
      }
    }

    if (next === HUB) {
      handleReturnToHub(newStats)
    } else if (next === NIGHT) {
      advanceDay(newStats)
    } else if (endings[next]) {
      triggerEnding(next, newStats)
    } else if (gameEvents[next]) {
      gotoEvent(next)
    } else {
      console.warn('未知跳转目标:', next)
      triggerEnding('ending_bye', newStats)
    }
  }

  // 点击继续对话
  const handleContinue = (totalLines) => {
    if (dialogueIndex < totalLines - 1) {
      setDialogueIndex((prev) => prev + 1)
    }
  }

  // HUB 中选择地点
  const handleRouteSelect = (routeId) => {
    const specialEv = getSpecialRouteEvent(routeId, stats)
    if (specialEv && gameEvents[specialEv]) {
      setStats((prev) => ({
        ...prev,
        actionPoints: Math.max(0, (prev.actionPoints || 0) - 1)
      }))
      gotoEvent(specialEv)
      return
    }

    const currentStage = (stats.routes && stats.routes[routeId]) || 0
    const eventId = routeEventId(routeId, currentStage, stats)
    if (!eventId || !gameEvents[eventId]) {
      console.warn('支线事件缺失或未解锁:', routeId, eventId)
      return
    }
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
      const nightEvent = nightEventForStats(stats)
      gotoEvent(nightEvent)
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

  // 场景背景
  const sceneLayers = (event) => {
    const scene = scenes[event?.scene] || scenes.yard
    const img = event?.cg || scene.image
    return {
      gradient: scene.gradient || scenes.yard.gradient,
      imgUrl: img ? `/images/${img}` : null,
      isCg: Boolean(event?.cg)
    }
  }

  // 二周目账本效果解析
  const renderHistoryEffectChips = (effects) => {
    if (!effects || typeof effects !== 'object') {
      return null
    }
    const chips = []

    const numMap = [
      { key: 'affection', label: '雨姐羁绊' },
      { key: 'yujieSoftness', label: '性格倾向' },
      { key: 'laokuaiBond', label: '老蒯知己' },
      { key: 'laokuaiRomance', label: '老蒯情愫' },
      { key: 'laokuaiAlert', label: '老蒯戒备', invertTone: true },
      { key: 'integrity', label: '诚信' },
      { key: 'money', label: '金钱' },
      { key: 'actionPoints', label: '行动点' },
      { key: 'gooseCount', label: '大鹅互动' }
    ]

    numMap.forEach(({ key, label, invertTone }) => {
      const val = effects[key]
      if (typeof val === 'number' && val !== 0) {
        const sign = val > 0 ? `+${val}` : `${val}`
        const tone = (val > 0 && !invertTone) || (val < 0 && invertTone) ? 'positive' : 'negative'
        chips.push(
          <span key={key} className={`history-effect-chip ${tone}`}>
            {label} {sign}
          </span>
        )
      }
    })

    if (effects.addItem) {
      const it = items[effects.addItem]
      chips.push(
        <span key="add-item" className="history-effect-chip positive">
          获得 {it ? it.name : effects.addItem}
        </span>
      )
    }
    if (effects.removeItem) {
      const it = items[effects.removeItem]
      chips.push(
        <span key="rem-item" className="history-effect-chip negative">
          消耗 {it ? it.name : effects.removeItem}
        </span>
      )
    }
    if (Array.isArray(effects.addItems)) {
      effects.addItems.forEach((id, i) => {
        const it = items[id]
        chips.push(
          <span key={`adds-${i}`} className="history-effect-chip positive">
            获得 {it ? it.name : id}
          </span>
        )
      })
    }
    if (Array.isArray(effects.removeItems)) {
      effects.removeItems.forEach((id, i) => {
        const it = items[id]
        chips.push(
          <span key={`rems-${i}`} className="history-effect-chip negative">
            消耗 {it ? it.name : id}
          </span>
        )
      })
    }

    if (effects.setFlags) {
      const flags = Array.isArray(effects.setFlags) ? effects.setFlags : Object.keys(effects.setFlags)
      flags.forEach((f, idx) => {
        const flagName = typeof f === 'string' ? f : f?.key
        const label = FLAG_LABELS[flagName] || '剧情状态更新'
        chips.push(
          <span key={`flag-${idx}`} className="history-effect-chip neutral">
            {label}
          </span>
        )
      })
    }

    if (!chips.length) {
      return null
    }

    return <div className="history-effects">{chips}</div>
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
              十三天东北农家乐深度体验，每天 2 点行动点自由分配。
              <br />
              六条特色支线、雨姐性格养成、老蒯知己/情愫路线。
              <br />
              14种结局、雨姐性格养成、老蒯知己/情愫路线，生活化阶段词指引，图鉴等你集齐！（v2.4）
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
                      title={unlocked ? ending.text : (exactJournal ? ending.hint : '暂未解锁此结局')}
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
    const relStages = getRelationshipStages(stats)
    const gooseNaturalDesc =
      (stats.gooseCount || 0) >= 3 ? '莫逆之鹅' : (stats.gooseCount || 0) >= 1 ? '偶尔打照面' : '素不相识'

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
                <span className="stat-label">雨姐羁绊</span>
                <span className="stat-value">{relStages.yujieStage} · {relStages.yujiePersona}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">老蒯知己 / 情愫</span>
                <span className="stat-value">{relStages.laokuaiSoulmateStage} · {relStages.laokuaiRomanceStage}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">院落氛围</span>
                <span className="stat-value">{relStages.yardAtmosphere}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">大鹅往来</span>
                <span className="stat-value">{exactJournal ? `🪿×${stats.gooseCount || 0}` : gooseNaturalDesc}</span>
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

  // 舞台角色挑选
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

  // 关系阶段词与旅程指引
  const relStages = getRelationshipStages(stats)
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

  // HUB 模式使用专属 yard 场景
  const activeSceneEvent = mode === 'hub' ? { scene: 'yard' } : currentEvent

  // 阶段自然词映射
  const stageLabels = ['初识', '熟络', '深入', '交心', '定局']

  // 当前心愿的生活化提示
  const activeWishNatural = wishId ? NATURAL_WISH_HINTS[wishId] || NATURAL_WISH_HINTS.casual : NATURAL_WISH_HINTS.casual

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

          {/* 雨姐项：yujieStage + yujiePersona */}
          <div className="status-item relation-stage-item yujie-item" title="雨姐关系与性格阶段">
            <span className="status-icon">❤️</span>
            <span className="status-text">
              {relStages.yujieStage} · {relStages.yujiePersona}
            </span>
          </div>

          {/* 老蒯项：laokuaiSoulmateStage + laokuaiRomanceStage + yardAtmosphere */}
          <div className="status-item relation-stage-item laokuai-item" title="老蒯知己、情愫与小院氛围">
            <span className="status-icon">🥛</span>
            <span className="status-text">
              老蒯：{relStages.laokuaiSoulmateStage} · {relStages.laokuaiRomanceStage} · {relStages.yardAtmosphere}
            </span>
          </div>

          <div className="status-item money-item">
            <span className="status-icon">💰</span>
            <span className="status-text">{stats.money}元</span>
          </div>
        </div>
      </header>

      {/* 物品栏 */}
      {stats.items && stats.items.length > 0 && (
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
        {/* 背景层 */}
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

        {/* Galgame 舞台 */}
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
                  {Object.values(wishGuides).map((guide) => {
                    const natural = NATURAL_WISH_HINTS[guide.id] || NATURAL_WISH_HINTS.casual
                    return (
                      <button
                        type="button"
                        key={guide.id}
                        className="wish-prompt-btn"
                        onClick={() => handleWishChange(guide.id)}
                      >
                        <strong className="wish-prompt-name">{guide.title}</strong>
                        <span className="wish-prompt-desc">
                          {exactJournal ? guide.description : natural.desc}
                        </span>
                      </button>
                    )
                  })}
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
                {exactJournal
                  ? (wishGuides[wishId]?.description || '自由分配体力，多与院里众人互动，结下深厚羁绊。')
                  : activeWishNatural.tip}
              </div>
            </div>

            {/* 内联可折叠旅途手记 */}
            <details className="hub-notes-details">
              <summary className="hub-notes-summary">
                <span>📖 旅途手记与心愿进度</span>
                <span className="summary-indicator">▼</span>
              </summary>
              <div className="hub-notes-content">
                {/* 二周目精确核心数值面板 */}
                {exactJournal && (
                  <div className="exact-stats-panel">
                    <div className="exact-stat-chip">❤️ 雨姐羁绊: {stats.affection}</div>
                    <div className="exact-stat-chip">🌸 性格温柔倾向: {stats.yujieSoftness}</div>
                    <div className="exact-stat-chip">🥛 老蒯知己: {stats.laokuaiBond}</div>
                    <div className="exact-stat-chip">🌹 老蒯情愫: {stats.laokuaiRomance}</div>
                    <div className="exact-stat-chip">👀 老蒯戒备: {stats.laokuaiAlert}</div>
                    <div className="exact-stat-chip">🤝 诚信品质: {stats.integrity}</div>
                  </div>
                )}

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
                            {exactJournal
                              ? typeof req.target === 'boolean'
                                ? req.met
                                  ? '已达成'
                                  : '未达成'
                                : `${req.current} / 目标 ${req.target}`
                              : req.met
                              ? '已初具雏形'
                              : '尚需努力推进'}
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
                      const maxS = getRouteMaxStage(r.id)
                      const stage = (stats.routes && stats.routes[r.id]) || 0
                      const stageLabel = stage > 0 ? stageLabels[Math.min(stage - 1, stageLabels.length - 1)] : '初识'
                      const percent = Math.min(100, Math.round((stage / maxS) * 100))
                      return (
                        <div key={r.id} className="route-progress-cell">
                          <span className="cell-icon">{r.icon}</span>
                          <span className="cell-name">{r.name}</span>
                          <progress className="cell-bar" max={maxS} value={stage} aria-label={`${r.name} 进度`}>
                            {percent}%
                          </progress>
                          <span className="cell-count">
                            {exactJournal ? `${stage}/${maxS}` : stageLabel}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 历程回忆 */}
                {Array.isArray(stats.historyLog) && stats.historyLog.length > 0 && (
                  <div className="notes-history-section">
                    <div className="history-section-title">📜 旅途抉择回忆：</div>
                    <ul className="history-list">
                      {stats.historyLog.map((entry, hIdx) => (
                        <li key={`${entry.choiceId || 'choice'}-${hIdx}`} className="history-entry-item">
                          <div className="history-main-line">
                            <span className="history-day-tag">第{entry.day}天</span>
                            <span className="history-choice-text">「{entry.text}」</span>
                            {entry.feedback && entry.feedback.length > 0 && (
                              <span className="history-feedback-text">（{entry.feedback.join('；')}）</span>
                            )}
                          </div>
                          {exactJournal && renderHistoryEffectChips(entry.effects)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </details>

            <div className="hub-title">
              🗺️ 第 {stats.day} 天 · 今天去哪儿？（⚡×{stats.actionPoints}）
            </div>

            <div className="hub-grid">
              {Object.values(routes).map((route) => {
                const maxStage = getRouteMaxStage(route.id)
                const stage = (stats.routes && stats.routes[route.id]) || 0
                const specialEv = getSpecialRouteEvent(route.id, stats)
                const lockHint = getRouteLockHint(route.id, stage, stats)
                const completed = stage >= maxStage
                const usable = Boolean(specialEv) || (!completed && !lockHint) || (completed && route.repeatable)
                const isRecommended = !completed && recommendedRoutes.includes(route.id)

                let descText = route.description
                if (specialEv) {
                  descText = '⚡ 有特殊情境可触发'
                } else if (lockHint) {
                  descText = `🔒 ${lockHint}`
                } else if (completed) {
                  if (route.repeatable) {
                    descText = route.repeatText
                  } else {
                    descText = '路线已走完全部幕数，关键日程会记住这段经历'
                  }
                }

                const stageText = exactJournal
                  ? `${stage}/${maxStage}`
                  : stage === 0
                  ? '未踏足'
                  : stageLabels[Math.min(stage - 1, stageLabels.length - 1)]

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
                      {specialEv
                        ? '✨ 特殊插曲'
                        : completed
                        ? route.repeatable
                          ? '🔁 可反复打工'
                          : '✅ 已圆满'
                        : `阶段：${stageText}`}
                    </span>
                  </button>
                )
              })}

              {/* 回屋睡觉卡片 */}
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
                      {stats.actionPoints > 0 ? '提早休息并跨入下一天' : '今日事毕，安歇就寝'}
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
                        onClick={() => {
                          const nightEvent = nightEventForStats(stats)
                          gotoEvent(nightEvent)
                        }}
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
                    <ChoiceList
                      choices={currentEvent.choices || []}
                      stats={stats}
                      onPick={handleChoice}
                      onFallbackToTitle={() => setGamePhase('start')}
                    />
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
                    <ChoiceList
                      choices={currentEvent.choices || []}
                      stats={stats}
                      onPick={handleChoice}
                      onFallbackToTitle={() => setGamePhase('start')}
                    />
                  )}
                </>
              )
            ) : (
              <ChoiceList
                choices={currentEvent.choices || []}
                stats={stats}
                onPick={handleChoice}
                onFallbackToTitle={() => setGamePhase('start')}
              />
            )}
          </div>
        )}
      </main>
    </div>
  )
}

// 选项列表（选项按钮只显示文本/锁定提示，不显示数值风险标签）
const ChoiceList = ({ choices, stats, onPick, onFallbackToTitle }) => {
  const renderableChoices = (choices || [])
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
      <div className="choices-container choices-error-container">
        <div className="choice-error-msg">⚠️ 当前情境无可执行选项，剧情门禁校验异常。</div>
        <button
          type="button"
          className="choice-button error-fallback-button"
          onClick={onFallbackToTitle}
        >
          <span className="choice-number">↩</span>
          <span className="choice-text">安全保存并返回主标题</span>
        </button>
      </div>
    )
  }

  const isDense = renderableChoices.length >= 4

  return (
    <div className={`choices-container ${isDense ? 'choices-container-dense' : ''}`.trim()}>
      <div className="choices-title">做出你的抉择：</div>
      {renderableChoices.map((choice, idx) => {
        if (!choice.unlocked) {
          return (
            <button
              type="button"
              key={choice.id || `locked-${idx}`}
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
            key={choice.id || `choice-${idx}`}
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
