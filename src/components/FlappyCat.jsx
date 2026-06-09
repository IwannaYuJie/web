import { useState, useEffect, useRef, useCallback } from 'react'
import './FlappyCat.css'

/**
 * 飞天橘猫小游戏 🐱🎈
 *
 * 玩法：点击或按空格键控制橘猫飞翔，躲避猫爬架障碍物，收集小鱼得分！
 */

const CANVAS_WIDTH = 400
const CANVAS_HEIGHT = 480
const GRAVITY = 0.35
const JUMP_FORCE = -6.8
const PIPE_SPEED = 2.2
const PIPE_SPAWN_RATE = 110 // 每几帧生成一个柱子
const PIPE_GAP = 125 // 柱子通道宽度
const MIN_PIPE_HEIGHT = 50
const FISH_SPAWN_CHANCE = 0.5 // 生成柱子时，中间有鱼的概率

const FlappyCat = ({ onExit }) => {
  const [phase, setPhase] = useState('start') // 'start' | 'playing' | 'over'
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('flappy_cat_best') || '0', 10)
  })

  const canvasRef = useRef(null)
  const timerRef = useRef(null)

  // 游戏核心状态（使用 ref 存储避免重渲染开销与闭包问题）
  const stateRef = useRef({
    catY: 200,
    catV: 0,
    catAngle: 0,
    pipes: [],
    fish: [],
    particles: [],
    clouds: [],
    score: 0,
    frameCount: 0,
    isDead: false,
  })

  // 初始化云朵
  const initClouds = () => {
    const clouds = []
    for (let i = 0; i < 4; i++) {
      clouds.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * 150 + 20,
        speed: Math.random() * 0.3 + 0.1,
        scale: Math.random() * 0.6 + 0.5,
      })
    }
    return clouds
  }

  // 开始/重新开始游戏
  const startGame = useCallback(() => {
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current)
    }

    stateRef.current = {
      catY: 200,
      catV: 0,
      catAngle: 0,
      pipes: [
        {
          x: CANVAS_WIDTH + 100,
          topHeight: 120,
          bottomHeight: CANVAS_HEIGHT - 120 - PIPE_GAP,
          width: 54,
          passed: false,
        },
      ],
      fish: [
        {
          x: CANVAS_WIDTH + 100 + 27,
          y: 120 + PIPE_GAP / 2,
          collected: false,
          pulse: 0,
        },
      ],
      particles: [],
      clouds: initClouds(),
      score: 0,
      frameCount: 0,
      isDead: false,
    }

    setScore(0)
    setPhase('playing')
  }, [])

  // 橘猫跳跃
  const jump = useCallback(() => {
    if (phase !== 'playing' || stateRef.current.isDead) {
      return
    }
    stateRef.current.catV = JUMP_FORCE
    // 每次起飞喷射点粒子
    const state = stateRef.current
    for (let i = 0; i < 4; i++) {
      state.particles.push({
        x: 100 - 15,
        y: state.catY + 5,
        vx: -Math.random() * 2 - 1,
        vy: Math.random() * 2 - 1,
        color: '#FFF8F0', // 猫毛/烟雾白色
        alpha: 0.8,
        size: Math.random() * 4 + 3,
        life: 25,
      })
    }
  }, [phase])

  // 处理输入
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault()
        if (phase === 'start') {
          startGame()
        } else if (phase === 'over') {
          startGame()
        } else {
          jump()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phase, startGame, jump])

  // ==================== 绘制与计算核心逻辑 ====================

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    const ctx = canvas.getContext('2d')
    const state = stateRef.current

    state.frameCount++

    // 1. 物理更新 (只在未死亡时更新大物理)
    if (!state.isDead) {
      state.catV += GRAVITY
      state.catY += state.catV
      state.catAngle = Math.min(Math.PI / 4, Math.max(-Math.PI / 8, state.catV * 0.08))

      // 边缘碰撞测试
      if (state.catY < 15) {
        state.catY = 15
        state.catV = 0
      }
      if (state.catY > CANVAS_HEIGHT - 20) {
        handleGameOver()
      }
    } else {
      // 死亡坠落物理
      state.catV += GRAVITY
      state.catY += state.catV
      state.catAngle = Math.PI / 2 // 直线下落
      if (state.catY > CANVAS_HEIGHT - 20) {
        state.catY = CANVAS_HEIGHT - 20
        setPhase('over')
        return // 停止循环
      }
    }

    // 2. 更新背景云朵
    state.clouds.forEach((c) => {
      c.x -= c.speed
      if (c.x < -100) {
        c.x = CANVAS_WIDTH + 50
        c.y = Math.random() * 150 + 20
      }
    })

    // 3. 更新障碍物与金币鱼
    if (!state.isDead) {
      // 每隔一定帧数生成新柱子
      if (state.frameCount % PIPE_SPAWN_RATE === 0) {
        const topHeight = Math.random() * (CANVAS_HEIGHT - PIPE_GAP - MIN_PIPE_HEIGHT * 2) + MIN_PIPE_HEIGHT
        const bottomHeight = CANVAS_HEIGHT - topHeight - PIPE_GAP
        state.pipes.push({
          x: CANVAS_WIDTH,
          topHeight,
          bottomHeight,
          width: 54,
          passed: false,
        })

        // 概率生成鱼 🐟
        if (Math.random() < FISH_SPAWN_CHANCE) {
          state.fish.push({
            x: CANVAS_WIDTH + 27,
            y: topHeight + PIPE_GAP / 2,
            collected: false,
            pulse: 0,
          })
        }
      }

      // 移动并过滤出屏幕的柱子和鱼
      state.pipes.forEach((p) => {
        p.x -= PIPE_SPEED

        // 碰撞检测 - 柱子
        const catRadius = 13
        const catX = 100
        if (catX + catRadius > p.x && catX - catRadius < p.x + p.width) {
          if (state.catY - catRadius < p.topHeight || state.catY + catRadius > CANVAS_HEIGHT - p.bottomHeight) {
            handleGameOver()
          }
        }

        // 计分判定
        if (!p.passed && p.x + p.width / 2 < 100) {
          p.passed = true
          state.score += 1
          setScore(state.score)
        }
      })

      state.pipes = state.pipes.filter((p) => p.x > -100)

      state.fish.forEach((f) => {
        f.x -= PIPE_SPEED
        f.pulse += 0.15

        // 碰撞检测 - 鱼
        if (!f.collected) {
          const dx = f.x - 100
          const dy = f.y - state.catY
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 22) {
            f.collected = true
            state.score += 2 // 吃鱼得 2 分！
            setScore(state.score)
            // 爆发闪光粒子
            for (let i = 0; i < 12; i++) {
              const ang = Math.random() * Math.PI * 2
              const spd = Math.random() * 3 + 2
              state.particles.push({
                x: f.x,
                y: f.y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                color: '#FFD700', // 金黄色星星
                alpha: 1.0,
                size: Math.random() * 4 + 2,
                life: 30,
              })
            }
          }
        }
      })

      state.fish = state.fish.filter((f) => f.x > -100 && !f.collected)
    }

    // 4. 更新粒子效果
    state.particles.forEach((p) => {
      p.x += p.vx
      p.y += p.vy
      p.alpha -= 1.1 / p.life // 渐隐
      p.life--
    })
    state.particles = state.particles.filter((p) => p.life > 0 && p.alpha > 0)

    // ==================== 开始绘制画布 ====================
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // 绘制天空背景 - 随分数升级背景颜色
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
    if (state.score < 10) {
      // 白天：明朗淡蓝
      grad.addColorStop(0, '#B3E5FC')
      grad.addColorStop(0.6, '#E1F5FE')
      grad.addColorStop(1, '#FFF8F0')
    } else if (state.score < 25) {
      // 黄昏：温暖红橙
      grad.addColorStop(0, '#FFE082')
      grad.addColorStop(0.5, '#FFAB91')
      grad.addColorStop(1, '#D1C4E9')
    } else {
      // 夜空：梦幻星河
      grad.addColorStop(0, '#1A237E')
      grad.addColorStop(0.6, '#311B92')
      grad.addColorStop(1, '#4A148C')
    }
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // 绘制星星（夜晚模式）
    if (state.score >= 25) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
      for (let i = 0; i < 15; i++) {
        const x = (Math.sin(i * 1234.56) * 0.5 + 0.5) * CANVAS_WIDTH
        const y = (Math.cos(i * 9876.54) * 0.5 + 0.5) * 200
        const sz = (Math.sin(state.frameCount * 0.05 + i) * 0.5 + 0.5) * 1.5 + 0.5
        ctx.fillRect(x, y, sz, sz)
      }
    }

    // 绘制白云
    ctx.fillStyle = state.score >= 25 ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.75)'
    state.clouds.forEach((c) => {
      ctx.beginPath()
      ctx.arc(c.x, c.y, 25 * c.scale, 0, Math.PI * 2)
      ctx.arc(c.x + 20 * c.scale, c.y - 10 * c.scale, 20 * c.scale, 0, Math.PI * 2)
      ctx.arc(c.x - 20 * c.scale, c.y - 5 * c.scale, 18 * c.scale, 0, Math.PI * 2)
      ctx.arc(c.x + 35 * c.scale, c.y + 5 * c.scale, 15 * c.scale, 0, Math.PI * 2)
      ctx.closePath()
      ctx.fill()
    })

    // 绘制背景草地/山脊
    ctx.fillStyle = state.score >= 25 ? '#1E352F' : '#81C784' // 夜间草地深沉
    ctx.beginPath()
    ctx.moveTo(0, CANVAS_HEIGHT)
    ctx.quadraticCurveTo(100, CANVAS_HEIGHT - 35, 250, CANVAS_HEIGHT - 15)
    ctx.quadraticCurveTo(340, CANVAS_HEIGHT - 5, CANVAS_WIDTH, CANVAS_HEIGHT - 25)
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = state.score >= 25 ? '#122520' : '#4CAF50'
    ctx.beginPath()
    ctx.moveTo(0, CANVAS_HEIGHT)
    ctx.quadraticCurveTo(80, CANVAS_HEIGHT - 15, 180, CANVAS_HEIGHT - 22)
    ctx.quadraticCurveTo(290, CANVAS_HEIGHT - 30, CANVAS_WIDTH, CANVAS_HEIGHT - 12)
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT)
    ctx.closePath()
    ctx.fill()

    // 绘制金币鱼 🐟
    state.fish.forEach((f) => {
      ctx.save()
      ctx.translate(f.x, f.y)
      // 呼吸缩放
      const scale = 1 + Math.sin(f.pulse) * 0.1
      ctx.scale(scale, scale)

      // 鱼身底板描边
      ctx.fillStyle = '#FFE082' // 金鱼
      ctx.strokeStyle = '#1E1813'
      ctx.lineWidth = 1.5

      // 画一条卡通小金鱼
      ctx.beginPath()
      // 身体
      ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      // 尾巴
      ctx.beginPath()
      ctx.moveTo(-8, 0)
      ctx.lineTo(-14, -6)
      ctx.lineTo(-12, 0)
      ctx.lineTo(-14, 6)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      // 眼睛
      ctx.fillStyle = '#1E1813'
      ctx.beginPath()
      ctx.arc(5, -2, 1.2, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    })

    // 绘制障碍物（猫爬架柱子）
    state.pipes.forEach((p) => {
      // 画柱子描边和底色
      ctx.fillStyle = '#D7CCC8' // 麻绳米黄色
      ctx.strokeStyle = '#1E1813'
      ctx.lineWidth = 2.5

      // 上柱子
      ctx.fillRect(p.x, 0, p.width, p.topHeight)
      ctx.strokeRect(p.x, -5, p.width, p.topHeight + 5)
      // 上柱头（猫爬架托盘）
      ctx.fillStyle = '#A1887F' // 绒布咖色
      ctx.fillRect(p.x - 4, p.topHeight - 16, p.width + 8, 16)
      ctx.strokeRect(p.x - 4, p.topHeight - 16, p.width + 8, 16)

      // 下柱子
      ctx.fillStyle = '#D7CCC8'
      ctx.fillRect(p.x, CANVAS_HEIGHT - p.bottomHeight, p.width, p.bottomHeight)
      ctx.strokeRect(p.x, CANVAS_HEIGHT - p.bottomHeight, p.width, p.bottomHeight + 5)
      // 下柱头
      ctx.fillStyle = '#A1887F'
      ctx.fillRect(p.x - 4, CANVAS_HEIGHT - p.bottomHeight, p.width + 8, 16)
      ctx.strokeRect(p.x - 4, CANVAS_HEIGHT - p.bottomHeight, p.width + 8, 16)

      // 给爬架画点横纹（麻绳缠绕感）
      ctx.strokeStyle = 'rgba(30, 24, 19, 0.15)'
      ctx.lineWidth = 1
      for (let y = 10; y < p.topHeight - 20; y += 8) {
        ctx.beginPath()
        ctx.moveTo(p.x + 3, y)
        ctx.lineTo(p.x + p.width - 3, y)
        ctx.stroke()
      }
      for (let y = CANVAS_HEIGHT - p.bottomHeight + 24; y < CANVAS_HEIGHT - 10; y += 8) {
        ctx.beginPath()
        ctx.moveTo(p.x + 3, y)
        ctx.lineTo(p.x + p.width - 3, y)
        ctx.stroke()
      }
    })

    // 绘制粒子
    state.particles.forEach((p) => {
      ctx.save()
      ctx.globalAlpha = p.alpha
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })

    // 绘制橘猫
    drawCat(ctx, state.catY, state.catAngle)

    // 注册下一帧
    timerRef.current = requestAnimationFrame(gameLoop)
  }, [])

  // 绘制橘猫矢量图
  const drawCat = (ctx, y, angle) => {
    ctx.save()
    ctx.translate(100, y)
    ctx.rotate(angle)

    // 猫的腿（画在身体后面）
    ctx.fillStyle = '#E65100' // 深橘色爪子
    ctx.beginPath()
    ctx.ellipse(-8, 11, 4, 6, Math.PI / 6, 0, Math.PI * 2)
    ctx.ellipse(8, 11, 4, 6, -Math.PI / 6, 0, Math.PI * 2)
    ctx.fill()

    // 身体 (胖嘟嘟的橘色椭圆)
    ctx.fillStyle = '#FF9800' // 明亮橘
    ctx.beginPath()
    ctx.ellipse(0, 0, 19, 15, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#1E1813'
    ctx.lineWidth = 2
    ctx.stroke()

    // 白肚皮
    ctx.fillStyle = '#FFF8F0'
    ctx.beginPath()
    ctx.ellipse(0, 4, 11, 8, 0, 0, Math.PI * 2)
    ctx.fill()

    // 耳朵
    ctx.fillStyle = '#FF9800'
    // 左耳
    ctx.beginPath()
    ctx.moveTo(-11, -10)
    ctx.lineTo(-2, -16)
    ctx.lineTo(-6, -6)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    // 耳朵内侧粉色
    ctx.fillStyle = '#FFCDD2'
    ctx.beginPath()
    ctx.moveTo(-9, -9)
    ctx.lineTo(-4, -13)
    ctx.lineTo(-6, -7)
    ctx.closePath()
    ctx.fill()

    // 右耳
    ctx.fillStyle = '#FF9800'
    ctx.beginPath()
    ctx.moveTo(6, -6)
    ctx.lineTo(11, -16)
    ctx.lineTo(14, -10)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    // 右耳内侧粉色
    ctx.fillStyle = '#FFCDD2'
    ctx.beginPath()
    ctx.moveTo(8, -7)
    ctx.lineTo(11, -13)
    ctx.lineTo(12, -9)
    ctx.closePath()
    ctx.fill()

    // 猫尾巴
    ctx.strokeStyle = '#FF9800'
    ctx.lineWidth = 5.5
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(-16, 2)
    ctx.quadraticCurveTo(-26, -5, -23, -13)
    ctx.stroke()
    // 尾巴描边
    ctx.strokeStyle = '#1E1813'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(-16, 2)
    ctx.quadraticCurveTo(-26, -5, -23, -13)
    ctx.stroke()
    // 尾巴尖白颜色
    ctx.fillStyle = '#FFF8F0'
    ctx.beginPath()
    ctx.arc(-23, -13, 2.5, 0, Math.PI * 2)
    ctx.fill()

    // 面部表情
    ctx.fillStyle = '#1E1813'

    if (stateRef.current.isDead) {
      // 死亡状态 (XX眼)
      ctx.lineWidth = 1.5
      ctx.strokeStyle = '#1E1813'
      // 左眼X
      ctx.beginPath()
      ctx.moveTo(4, -3); ctx.lineTo(8, 0)
      ctx.moveTo(8, -3); ctx.lineTo(4, 0)
      ctx.stroke()
      // 右眼X
      ctx.beginPath()
      ctx.moveTo(11, -3); ctx.lineTo(15, 0)
      ctx.moveTo(15, -3); ctx.lineTo(11, 0)
      ctx.stroke()
    } else {
      // 正常可爱眼睛 (眯眯眼曲线)
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.strokeStyle = '#1E1813'
      ctx.beginPath()
      ctx.arc(6, -2, 1.5, Math.PI, 0) // 左弧线眼
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(14, -2, 1.5, Math.PI, 0) // 右弧线眼
      ctx.stroke()
    }

    // 红腮红
    ctx.fillStyle = 'rgba(255, 107, 107, 0.45)'
    ctx.beginPath()
    ctx.arc(4, 1.5, 2.5, 0, Math.PI * 2)
    ctx.arc(16, 1.5, 2.5, 0, Math.PI * 2)
    ctx.fill()

    // 猫鼻子 (粉色倒三角)
    ctx.fillStyle = '#FF8A80'
    ctx.beginPath()
    ctx.moveTo(9, 1)
    ctx.lineTo(11, 1)
    ctx.lineTo(10, 2.2)
    ctx.closePath()
    ctx.fill()

    // 猫胡须
    ctx.strokeStyle = 'rgba(30, 24, 19, 0.45)'
    ctx.lineWidth = 1
    // 左胡须
    ctx.beginPath(); ctx.moveTo(2, 1); ctx.lineTo(-4, 0); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(2, 2.5); ctx.lineTo(-5, 3.5); ctx.stroke()
    // 右胡须
    ctx.beginPath(); ctx.moveTo(18, 1); ctx.lineTo(24, 0); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(18, 2.5); ctx.lineTo(25, 3.5); ctx.stroke()

    ctx.restore()
  }

  // 游戏失败处理
  const handleGameOver = () => {
    const state = stateRef.current
    if (state.isDead) {
      return
    }
    state.isDead = true
    state.catV = -4 // 撞击后弹飞下落

    // 产生大量橘色和灰色猫毛碰撞粒子
    for (let i = 0; i < 20; i++) {
      const spd = Math.random() * 4 + 1
      const ang = Math.random() * Math.PI * 2
      state.particles.push({
        x: 100,
        y: state.catY,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        color: Math.random() > 0.4 ? '#FF9800' : '#8D6E63',
        alpha: 1.0,
        size: Math.random() * 4 + 2,
        life: 40,
      })
    }

    // 更新最高记录
    const finalScore = state.score
    const best = Math.max(finalScore, parseInt(localStorage.getItem('flappy_cat_best') || '0', 10))
    localStorage.setItem('flappy_cat_best', String(best))
    setBestScore(best)
  }

  // 启动循环
  useEffect(() => {
    if (phase === 'playing') {
      timerRef.current = requestAnimationFrame(gameLoop)
    }
    return () => {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current)
      }
    }
  }, [phase, gameLoop])

  // ==================== 渲染函数 ====================

  // 1. 开始屏幕
  if (phase === 'start') {
    return (
      <div className="flappy-game-container">
        <div className="flappy-screen">
          <div className="game-icon">🐱</div>
          <h1 className="game-title">飞天橘猫</h1>
          <p className="game-desc">
            控制沉甸甸的超重橘猫开启它的小鱼干飞天大冒险！<br />
            穿越各种猫爬架，收集金黄色的美味鱼干 🐟 得双倍分数哦～
          </p>
          <div className="flappy-controls-info">
            <h4>🎮 操作说明</h4>
            <div className="control-row">
              <span>按键盘</span>
              <span className="control-key">空格</span>
              <span>/</span>
              <span className="control-key">↑</span>
              <span>键 或</span>
              <span className="control-key">点击屏幕</span>
              <span>控制跳跃</span>
            </div>
          </div>
          <button className="flappy-btn" onClick={startGame}>
            <span>▶️</span>
            <span>放飞橘猫</span>
          </button>
        </div>
      </div>
    )
  }

  // 2. 游戏结束屏幕
  if (phase === 'over') {
    return (
      <div className="flappy-game-container">
        <div className="flappy-screen">
          <div className="game-icon">😿</div>
          <h1 className="game-title">橘猫飞不动了</h1>
          <p className="game-desc">橘猫撞到了猫爬架，沉重地摔到了地上...</p>
          <div className="flappy-scores">
            <div className="flappy-score-card">
              <div className="score-label">本次得分</div>
              <div className="score-num">{score}</div>
            </div>
            <div className="flappy-score-card best">
              <div className="score-label">最高纪录</div>
              <div className="score-num">{bestScore}</div>
            </div>
          </div>
          <div className="flappy-btn-group" style={{ justifyContent: 'center' }}>
            <button className="flappy-btn" onClick={startGame}>
              <span>🔄</span>
              <span>再飞一次</span>
            </button>
            {onExit && (
              <button className="flappy-btn flappy-btn-secondary" onClick={onExit}>
                <span>←</span>
                <span>返回列表</span>
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 3. 游戏界面
  return (
    <div className="flappy-game-container">
      <div className="flappy-game-board">
        {/* 顶部得分状态 */}
        <div className="flappy-status-bar">
          <div className="flappy-stat">
            <span>🐟 得分:</span>
            <span className="stat-value">{score}</span>
          </div>
          <div className="flappy-stat">
            <span>🏆 最高:</span>
            <span className="stat-value">{bestScore}</span>
          </div>
        </div>

        {/* 画布 */}
        <div className="flappy-canvas-wrap" onClick={jump}>
          <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
        </div>

        <div className="flappy-mobile-hint">点击画面即可扑腾翅膀起飞 🪶</div>

        {/* 控制组 */}
        <div className="flappy-btn-group">
          <button className="flappy-btn flappy-btn-secondary" onClick={startGame}>
            🔄 重来
          </button>
          {onExit && (
            <button className="flappy-btn flappy-btn-secondary" onClick={onExit}>
              ← 返回
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default FlappyCat
