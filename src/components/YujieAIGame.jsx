import React, { useState, useRef, useEffect } from 'react'
import './YujieAIGame.css'

/**
 * 东北雨姐AI攻略游戏 💕
 * 
 * 玩家角色：从外国归来的黑人小哥
 * 目标：通过对话提升雨姐的好感度到100
 * AI模型：gemini-2.5-flash (通过七牛云API)
 * 
 * 雨姐人物设定（基于真实资料）:
 * - 本名常小雨，辽宁本溪人
 * - 性格豪爽、直率、幽默、接地气
 * - 身高180+，力气大，能扛半扇猪肉健步如飞
 * - 标志动作：踹门、大声喊"佩斯点火"
 * - 口头禅：东北方言浓厚
 * - 特点：粗犷中带着细腻，外表强悍内心温柔
 * - 丈夫老蒯（白国辉）：导演系毕业，温柔型丈夫
 * - 家庭：有一儿一女，儿子退伍军人，女儿帮忙直播
 * - 爱好：做农活、东北美食、直播带货
 * - 经历：3岁丧父，9岁母亲改嫁，与爷爷奶奶长大
 */

function YujieAIGame() {
  // ===== 游戏状态管理 =====
  const [gameState, setGameState] = useState('intro') // intro, playing, ended
  const [endingType, setEndingType] = useState(null) // success, failure

  // ===== 好感度系统 =====
  const [affection, setAffection] = useState(20) // 初始好感度20

  // ===== 情绪系统 =====
  const [emotions, setEmotions] = useState({
    happiness: 50,    // 开心度 0-100
    curiosity: 30,    // 好奇度 0-100
    wariness: 40,     // 警惕度 0-100
    touched: 0        // 感动值 0-100
  })

  // ===== 对话系统 =====
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isAITyping, setIsAITyping] = useState(false)
  
  // ===== 游戏统计 =====
  const [turnCount, setTurnCount] = useState(0) // 对话回合数
  const [startTime, setStartTime] = useState(null)

  // 聊天容器引用
  const messagesEndRef = useRef(null)

  /**
   * 自动滚动到底部
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  /**
   * 开始游戏
   */
  const startGame = () => {
    setGameState('playing')
    setStartTime(Date.now())
    
    // 雨姐的开场白
    const openingMessage = {
      role: 'assistant',
      content: '哎呀妈呀！这谁家的黑小伙儿啊？大老远的跑咱东北来干啥？俺是雨姐，你叫啥名儿啊？（雨姐好奇地打量着你，眼神里带着一丝警惕和新鲜感）',
      timestamp: new Date().toLocaleTimeString('zh-CN'),
      affectionChange: 0,
      emotions: { ...emotions }
    }
    
    setMessages([openingMessage])
  }

  /**
   * 重新开始游戏
   */
  const restartGame = () => {
    setGameState('intro')
    setEndingType(null)
    setAffection(20)
    setEmotions({
      happiness: 50,
      curiosity: 30,
      wariness: 40,
      touched: 0
    })
    setMessages([])
    setInputText('')
    setTurnCount(0)
    setStartTime(null)
  }

  /**
   * 检查游戏是否结束
   */
  const checkGameEnd = (newAffection) => {
    if (newAffection >= 100) {
      setGameState('ended')
      setEndingType('success')
      return true
    } else if (newAffection <= 0) {
      setGameState('ended')
      setEndingType('failure')
      return true
    }
    return false
  }

  /**
   * 构建AI系统提示词（雨姐人设）
   */
  const buildSystemPrompt = () => {
    return `你现在要扮演"东北雨姐"（常小雨），一位来自辽宁本溪的东北女性。

【人物背景】
- 本名：常小雨，身高180+，力气极大
- 经历：3岁丧父，9岁母亲改嫁，与爷爷奶奶长大
- 家庭：已婚，丈夫白国辉（老蒯，温柔型），有一儿一女
- 职业：经营农家乐，做农活，偶尔直播带货

【性格特点】
- 豪爽直率、热情好客、接地气
- 外表粗犷强悍，内心细腻温柔
- 说话东北方言浓厚，口头禅："哎呀妈呀"、"干哈呢"、"整挺好"
- 标志动作：踹门开门、大声喊"佩斯点火"
- 做事雷厉风行，扛着半扇猪肉健步如飞

【对话对象】
你正在与一位从外国归来的黑人小哥对话。他是外来者，你会带着好奇、新鲜感，但也有一定警惕。

【当前好感度】${affection}/100
【当前情绪】开心:${emotions.happiness} 好奇:${emotions.curiosity} 警惕:${emotions.wariness} 感动:${emotions.touched}

【回复要求】
1. 必须使用东北方言，保持雨姐的说话风格
2. 根据好感度调整态度：
   - 0-30: 冷淡、警惕、不太搭理
   - 31-60: 普通友好、会聊几句
   - 61-85: 热情、开始信任、愿意分享
   - 86-100: 非常亲近、敞开心扉、极度信任
3. 回复要自然、接地气、有东北特色
4. 根据对方的话判断好感度变化和情绪变化

【输出格式】（严格JSON格式）
{
  "reply": "雨姐的回复内容（必须带东北方言）",
  "affectionChange": 数字（-10到+10之间，表示好感度变化）,
  "emotions": {
    "happiness": 数字（0-100）,
    "curiosity": 数字（0-100）,
    "wariness": 数字（0-100）,
    "touched": 数字（0-100）
  },
  "reasoning": "简短说明为什么这样变化"
}

请严格按照JSON格式输出，不要添加任何其他文字。`
  }

  /**
   * 发送玩家消息
   */
  const handleSendMessage = async () => {
    if (!inputText.trim() || isAITyping) return

    const userMessage = {
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date().toLocaleTimeString('zh-CN')
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsAITyping(true)
    setTurnCount(prev => prev + 1)

    try {
      // 调用七牛云AI API（gemini-2.5-flash）
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: buildSystemPrompt()
            },
            {
              role: 'user',
              content: userMessage.content
            }
          ],
          temperature: 0.8,
          max_tokens: 500
        })
      })

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`)
      }

      const data = await response.json()
      const aiReply = data.choices[0].message.content

      // 解析AI返回的JSON
      let parsedReply
      try {
        // 清理可能的markdown代码块标记
        const cleanedReply = aiReply.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        parsedReply = JSON.parse(cleanedReply)
      } catch (parseError) {
        console.error('AI回复解析失败:', aiReply)
        // 降级处理：使用原始回复
        parsedReply = {
          reply: aiReply,
          affectionChange: 0,
          emotions: { ...emotions },
          reasoning: '解析失败，使用原始回复'
        }
      }

      // 更新好感度
      const newAffection = Math.max(0, Math.min(100, affection + parsedReply.affectionChange))
      setAffection(newAffection)

      // 更新情绪
      if (parsedReply.emotions) {
        setEmotions(parsedReply.emotions)
      }

      // 添加AI回复消息
      const aiMessage = {
        role: 'assistant',
        content: parsedReply.reply,
        timestamp: new Date().toLocaleTimeString('zh-CN'),
        affectionChange: parsedReply.affectionChange,
        emotions: parsedReply.emotions || emotions,
        reasoning: parsedReply.reasoning
      }

      setMessages(prev => [...prev, aiMessage])
      setIsAITyping(false)

      // 检查游戏是否结束
      checkGameEnd(newAffection)

    } catch (error) {
      console.error('AI对话错误:', error)
      
      // 错误处理：添加错误提示消息
      const errorMessage = {
        role: 'system',
        content: `❌ AI连接失败：${error.message}。请检查网络或稍后重试。`,
        timestamp: new Date().toLocaleTimeString('zh-CN'),
        isError: true
      }
      
      setMessages(prev => [...prev, errorMessage])
      setIsAITyping(false)
    }
  }

  /**
   * 处理回车发送
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // ===== 渲染函数 =====

  /**
   * 渲染开场介绍
   */
  const renderIntro = () => (
    <div className="game-intro">
      <div className="intro-content">
        <h1 className="intro-title">
          <span className="title-emoji">💕</span>
          AI攻略：东北雨姐的心
          <span className="title-emoji">💕</span>
        </h1>
        
        <div className="character-intro">
          <div className="character-card">
            <div className="character-avatar">🧔🏿</div>
            <h3>你是谁？</h3>
            <p className="character-desc">
              一位从外国归来的黑人小哥<br/>
              充满异国风情，想要了解东北文化<br/>
              偶然间来到雨姐的村子...
            </p>
          </div>

          <div className="character-card yujie-card">
            <div className="character-avatar">👩🏻</div>
            <h3>东北雨姐</h3>
            <p className="character-desc">
              本名常小雨，辽宁本溪人<br/>
              身高180+，力大无穷，性格豪爽<br/>
              经营农家乐，热爱东北生活<br/>
              <strong>初始好感度：20/100</strong>
            </p>
          </div>
        </div>

        <div className="game-rules">
          <h3>🎮 游戏规则</h3>
          <ul>
            <li>🗣️ 通过对话与雨姐交流，了解她的喜好</li>
            <li>📈 你的每句话都会影响好感度（0-100）</li>
            <li>😊 注意雨姐的情绪变化（开心、好奇、警惕、感动）</li>
            <li>✅ 好感度达到100 = 成功攻略！</li>
            <li>❌ 好感度降到0 = 游戏失败...</li>
            <li>🤖 AI会根据雨姐真实性格做出反应</li>
          </ul>
        </div>

        <div className="yujie-traits">
          <h3>💡 雨姐性格特点</h3>
          <div className="traits-grid">
            <span className="trait-tag">豪爽直率</span>
            <span className="trait-tag">接地气</span>
            <span className="trait-tag">东北话浓厚</span>
            <span className="trait-tag">力气大</span>
            <span className="trait-tag">热情好客</span>
            <span className="trait-tag">外刚内柔</span>
            <span className="trait-tag">爱做农活</span>
            <span className="trait-tag">重视家庭</span>
          </div>
        </div>

        <button className="start-game-btn" onClick={startGame}>
          开始游戏 🚀
        </button>
      </div>
    </div>
  )

  /**
   * 渲染游戏进行界面
   */
  const renderGamePlaying = () => (
    <div className="game-playing">
      {/* 顶部状态栏 */}
      <div className="game-header">
        <div className="header-left">
          <h2 className="game-title">💬 与雨姐的对话</h2>
          <span className="turn-count">第 {turnCount} 回合</span>
        </div>
        <button className="quit-btn" onClick={() => {
          if (confirm('确定要退出游戏吗？进度将不会保存。')) {
            restartGame()
          }
        }}>
          退出游戏
        </button>
      </div>

      {/* 好感度和情绪面板 */}
      <div className="status-panel">
        {/* 好感度条 */}
        <div className="affection-section">
          <div className="affection-header">
            <span className="affection-label">💕 好感度</span>
            <span className="affection-value">{affection}/100</span>
          </div>
          <div className="affection-bar-container">
            <div 
              className="affection-bar" 
              style={{ 
                width: `${affection}%`,
                backgroundColor: affection >= 80 ? '#FF9F45' : affection >= 50 ? '#FFB366' : '#FFC999'
              }}
            />
          </div>
          <div className="affection-status">
            {affection >= 86 ? '❤️ 极度亲密' : 
             affection >= 61 ? '😊 热情友好' : 
             affection >= 31 ? '🙂 普通朋友' : 
             '😐 陌生冷淡'}
          </div>
        </div>

        {/* 情绪状态 */}
        <div className="emotions-section">
          <div className="emotion-item">
            <span className="emotion-icon">😊</span>
            <span className="emotion-name">开心</span>
            <div className="emotion-bar">
              <div className="emotion-fill" style={{ width: `${emotions.happiness}%` }} />
            </div>
            <span className="emotion-value">{emotions.happiness}</span>
          </div>
          <div className="emotion-item">
            <span className="emotion-icon">🤔</span>
            <span className="emotion-name">好奇</span>
            <div className="emotion-bar">
              <div className="emotion-fill" style={{ width: `${emotions.curiosity}%` }} />
            </div>
            <span className="emotion-value">{emotions.curiosity}</span>
          </div>
          <div className="emotion-item">
            <span className="emotion-icon">😤</span>
            <span className="emotion-name">警惕</span>
            <div className="emotion-bar">
              <div className="emotion-fill warning" style={{ width: `${emotions.wariness}%` }} />
            </div>
            <span className="emotion-value">{emotions.wariness}</span>
          </div>
          <div className="emotion-item">
            <span className="emotion-icon">🥺</span>
            <span className="emotion-name">感动</span>
            <div className="emotion-bar">
              <div className="emotion-fill touched" style={{ width: `${emotions.touched}%` }} />
            </div>
            <span className="emotion-value">{emotions.touched}</span>
          </div>
        </div>
      </div>

      {/* 对话区域 */}
      <div className="chat-container">
        <div className="messages-area">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`message ${msg.role} ${msg.isError ? 'error-message' : ''}`}
            >
              <div className="message-avatar">
                {msg.role === 'user' ? '🧔🏿' : msg.role === 'assistant' ? '👩🏻' : '⚙️'}
              </div>
              <div className="message-content">
                <div className="message-header">
                  <span className="message-sender">
                    {msg.role === 'user' ? '你' : msg.role === 'assistant' ? '雨姐' : '系统'}
                  </span>
                  <span className="message-time">{msg.timestamp}</span>
                </div>
                <div className="message-text">{msg.content}</div>
                {msg.affectionChange !== undefined && msg.affectionChange !== 0 && (
                  <div className="affection-change">
                    {msg.affectionChange > 0 ? '💗' : '💔'} 好感度 
                    {msg.affectionChange > 0 ? '+' : ''}{msg.affectionChange}
                  </div>
                )}
                {msg.reasoning && (
                  <div className="ai-reasoning">💭 {msg.reasoning}</div>
                )}
              </div>
            </div>
          ))}
          {isAITyping && (
            <div className="message assistant typing">
              <div className="message-avatar">👩🏻</div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="input-area">
          <textarea
            className="message-input"
            placeholder="输入你想对雨姐说的话..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isAITyping}
            rows={3}
          />
          <button 
            className="send-btn" 
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isAITyping}
          >
            {isAITyping ? '思考中...' : '发送 💬'}
          </button>
        </div>
      </div>
    </div>
  )

  /**
   * 渲染游戏结局
   */
  const renderGameEnding = () => {
    const playTime = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0
    const minutes = Math.floor(playTime / 60)
    const seconds = playTime % 60

    return (
      <div className="game-ending">
        <div className="ending-content">
          {endingType === 'success' ? (
            <>
              <div className="ending-icon success">🎉💕✨</div>
              <h1 className="ending-title success">攻略成功！</h1>
              <p className="ending-message">
                "哎呀妈呀，没想到你这黑小伙儿还挺有意思的！<br/>
                俺雨姐这辈子头一回遇到像你这样的人！<br/>
                以后常来俺这儿玩啊，姐给你整好吃的！"<br/>
                <br/>
                <strong>——雨姐眼里闪着光，脸上洋溢着真诚的笑容</strong>
              </p>
            </>
          ) : (
            <>
              <div className="ending-icon failure">😢💔</div>
              <h1 className="ending-title failure">攻略失败...</h1>
              <p className="ending-message">
                "得得得，你这人不行啊！<br/>
                跟俺不是一路的，你还是回你那儿去吧！<br/>
                俺雨姐忙着呢，没工夫搭理你！"<br/>
                <br/>
                <strong>——雨姐转身离开，没再回头...</strong>
              </p>
            </>
          )}

          <div className="ending-stats">
            <h3>🎮 游戏数据</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">最终好感度</span>
                <span className="stat-value">{affection}/100</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">对话回合</span>
                <span className="stat-value">{turnCount} 回合</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">游戏时长</span>
                <span className="stat-value">{minutes}分{seconds}秒</span>
              </div>
            </div>
          </div>

          <div className="ending-actions">
            <button className="retry-btn" onClick={restartGame}>
              再来一次 🔄
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="yujie-ai-game">
      {gameState === 'intro' && renderIntro()}
      {gameState === 'playing' && renderGamePlaying()}
      {gameState === 'ended' && renderGameEnding()}
    </div>
  )
}

export default YujieAIGame
