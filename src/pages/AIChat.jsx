import React, { useState, useRef, useEffect } from 'react'

/**
 * AI对话组件
 * 支持多种AI模型的实时对话功能
 * 使用七牛云AI推理API
 */
function AIChat() {
  // 模型配置 - 按系列分类
  const modelCategories = {
    'Claude系列': [
      { id: 'claude-3.5-haiku', name: 'Claude 3.5 Haiku', inputPrice: 1.44, outputPrice: 7.2 },
      { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', inputPrice: 5.4, outputPrice: 27 },
      { id: 'claude-3.7-sonnet', name: 'Claude 3.7 Sonnet', inputPrice: 5.4, outputPrice: 27 },
      { id: 'claude-4.0-opus', name: 'Claude 4.0 Opus', inputPrice: 27, outputPrice: 135 },
      { id: 'claude-4.0-sonnet', name: 'Claude 4.0 Sonnet', inputPrice: 5.4, outputPrice: 27 },
      { id: 'claude-4.1-opus', name: 'Claude 4.1 Opus', inputPrice: 27, outputPrice: 135 },
      { id: 'claude-4.5-haiku', name: 'Claude 4.5 Haiku', inputPrice: 1.8, outputPrice: 9 },
      { id: 'claude-4.5-sonnet', name: 'Claude 4.5 Sonnet', inputPrice: 5.4, outputPrice: 27 },
    ],
    'DeepSeek系列': [
      { id: 'deepseek-v3-1-terminus-thinking', name: 'DeepSeek V3.1 Terminus Thinking', inputPrice: 1, outputPrice: 3 },
      { id: 'deepseek-v3-1-terminus', name: 'DeepSeek V3.1 Terminus', inputPrice: 1, outputPrice: 3 },
      { id: 'deepseek-v3-2-exp-thinking', name: 'DeepSeek V3.2 Exp Thinking', inputPrice: 0.5, outputPrice: 0.75 },
      { id: 'deepseek-v3-2-exp', name: 'DeepSeek V3.2 Exp', inputPrice: 0.5, outputPrice: 0.75 },
      { id: 'deepseek-r1-32b', name: 'DeepSeek R1 32B', inputPrice: 0.37, outputPrice: 1.5 },
      { id: 'deepseek-r1', name: 'DeepSeek R1', inputPrice: 1, outputPrice: 4 },
      { id: 'deepseek-v3', name: 'DeepSeek V3', inputPrice: 0.5, outputPrice: 2 },
    ],
    'Doubao系列': [
      { id: 'doubao-1.5-pro-32k', name: 'Doubao 1.5 Pro 32K', inputPrice: 0.2, outputPrice: 0.5 },
      { id: 'doubao-1.5-thinking-pro', name: 'Doubao 1.5 Thinking Pro', inputPrice: 1, outputPrice: 4 },
      { id: 'doubao-1.5-vision-pro', name: 'Doubao 1.5 Vision Pro', inputPrice: 0.75, outputPrice: 2.25 },
    ],
    'Gemini系列': [
      { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', inputPrice: 0.13, outputPrice: 0.54 },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', inputPrice: 0.27, outputPrice: 1.08 },
      { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', inputPrice: 0.18, outputPrice: 0.72 },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', inputPrice: 0.54, outputPrice: 4.5 },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', inputPrice: 4.5, outputPrice: 27 },
    ],
    'GLM系列': [
      { id: 'glm-4.5-air', name: 'GLM 4.5 Air', inputPrice: 0.5, outputPrice: 2 },
      { id: 'glm-4.5', name: 'GLM 4.5', inputPrice: 1, outputPrice: 4 },
    ],
    'GPT系列': [
      { id: 'gpt-oss-120b', name: 'GPT OSS 120B', inputPrice: 0.27, outputPrice: 1.35 },
      { id: 'gpt-oss-20b', name: 'GPT OSS 20B', inputPrice: 0.18, outputPrice: 0.9 },
    ],
    'Kimi系列': [
      { id: 'kimi-k2', name: 'Kimi K2', inputPrice: 1, outputPrice: 4 },
    ],
    'Moonshot系列': [
      { id: 'moonshot-kimi-k2-0905', name: 'Moonshot Kimi K2 0905', inputPrice: 1, outputPrice: 4 },
    ],
    'OpenAI系列': [
      { id: 'openai-gpt-5', name: 'OpenAI GPT-5', inputPrice: 2.25, outputPrice: 18 },
    ],
    'Qwen系列': [
      { id: 'qwen-max-2025-01-25', name: 'Qwen Max 2025-01-25', inputPrice: 0.6, outputPrice: 2.4 },
      { id: 'qwen-turbo', name: 'Qwen Turbo', inputPrice: 0.08, outputPrice: 0.15 },
      { id: 'qwen-vl-max-2025-01-25', name: 'Qwen VL Max 2025-01-25', inputPrice: 0.75, outputPrice: 2.25 },
      { id: 'qwen2-72b-instruct', name: 'Qwen2 72B Instruct', inputPrice: 1, outputPrice: 3 },
      { id: 'qwen2-vl-72b-instruct', name: 'Qwen2 VL 72B Instruct', inputPrice: 4, outputPrice: 12 },
      { id: 'qwen2.5-72b-instruct', name: 'Qwen2.5 72B Instruct', inputPrice: 0.5, outputPrice: 1.25 },
      { id: 'qwen2.5-vl-7b-instruct', name: 'Qwen2.5 VL 7B Instruct', inputPrice: 4, outputPrice: 12 },
      { id: 'qwen3-235b-a22b-instruct-2507', name: 'Qwen3 235B A22B Instruct 2507', inputPrice: 0.5, outputPrice: 2 },
      { id: 'qwen3-235b-a22b-thinking-2507', name: 'Qwen3 235B A22B Thinking 2507', inputPrice: 0.5, outputPrice: 5 },
      { id: 'qwen3-235b-a22b', name: 'Qwen3 235B A22B', inputPrice: 0.5, outputPrice: 2 },
      { id: 'qwen3-30b-a3b-think', name: 'Qwen3 30B A3B Think', inputPrice: 1.87, outputPrice: 0.18 },
      { id: 'qwen3-30b-a3b', name: 'Qwen3 30B A3B', inputPrice: 0.18, outputPrice: 0.75 },
      { id: 'qwen3-32b-think', name: 'Qwen3 32B Think', inputPrice: 5, outputPrice: 0.5 },
      { id: 'qwen3-32b', name: 'Qwen3 32B', inputPrice: 0.5, outputPrice: 2 },
      { id: 'qwen3-coder-480b-a35b-instruct', name: 'Qwen3 Coder 480B A35B Instruct', inputPrice: 1.5, outputPrice: 6 },
      { id: 'qwen3-max-preview', name: 'Qwen3 Max Preview', inputPrice: 1.5, outputPrice: 6 },
      { id: 'qwen3-max', name: 'Qwen3 Max', inputPrice: 1.5, outputPrice: 6 },
    ],
    'QWQ系列': [
      { id: 'qwq-32b', name: 'QWQ 32B', inputPrice: 0.5, outputPrice: 1.5 },
    ],
    'X.AI系列': [
      { id: 'x-ai-grok-4-fast', name: 'X.AI Grok 4 Fast', inputPrice: 0.36, outputPrice: 0.9 },
      { id: 'x-ai-grok-code-fast-1', name: 'X.AI Grok Code Fast 1', inputPrice: 0.36, outputPrice: 2.7 },
    ],
    'Z.AI系列': [
      { id: 'z-ai-glm-4.6', name: 'Z.AI GLM 4.6', inputPrice: 1.8, outputPrice: 3.15 },
    ],
  }

  // 状态管理
  const [selectedCategory, setSelectedCategory] = useState('DeepSeek系列')
  const [selectedModel, setSelectedModel] = useState('deepseek-v3')
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(true)
  const [error, setError] = useState(null)
  const [totalTokens, setTotalTokens] = useState(0)
  const messagesEndRef = useRef(null)

  // API配置 - 使用本地代理保护API Key
  const API_ENDPOINT = '/api/ai-chat'

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  /**
   * 发送消息到AI
   */
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString('zh-CN')
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    setError(null)

    try {
      if (isStreaming) {
        // 流式调用
        await streamChat([...messages, userMessage])
      } else {
        // 非流式调用
        await normalChat([...messages, userMessage])
      }
    } catch (err) {
      setError(err.message || '发送消息失败，请重试')
      console.error('Chat error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 流式对话
   */
  const streamChat = async (chatMessages) => {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: chatMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        stream: true,
        max_tokens: 4096
      })
    })

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let assistantMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString('zh-CN')
    }

    // 添加空的助手消息
    setMessages(prev => [...prev, assistantMessage])

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim() !== '')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                assistantMessage.content += content
                // 更新消息
                setMessages(prev => {
                  const newMessages = [...prev]
                  newMessages[newMessages.length - 1] = { ...assistantMessage }
                  return newMessages
                })
              }
            } catch (e) {
              console.error('Parse error:', e)
            }
          }
        }
      }
    } catch (err) {
      throw new Error('流式传输中断')
    }
  }

  /**
   * 非流式对话
   */
  const normalChat = async (chatMessages) => {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: chatMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        stream: false,
        max_tokens: 4096
      })
    })

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`)
    }

    const data = await response.json()
    const assistantMessage = {
      role: 'assistant',
      content: data.choices[0].message.content,
      timestamp: new Date().toLocaleTimeString('zh-CN')
    }

    setMessages(prev => [...prev, assistantMessage])
    
    // 更新token统计
    if (data.usage) {
      setTotalTokens(prev => prev + data.usage.total_tokens)
    }
  }

  /**
   * 清空对话
   */
  const clearChat = () => {
    setMessages([])
    setTotalTokens(0)
    setError(null)
  }

  /**
   * 切换模型
   */
  const handleModelChange = (modelId) => {
    setSelectedModel(modelId)
    // 可选：清空对话历史
    // clearChat()
  }

  /**
   * 处理回车发送
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // 获取当前选中的模型信息
  const getCurrentModel = () => {
    for (const category in modelCategories) {
      const model = modelCategories[category].find(m => m.id === selectedModel)
      if (model) return model
    }
    return null
  }

  const currentModel = getCurrentModel()

  return (
    <div className="ai-chat-container">
      {/* 页面标题 */}
      <header className="page-header">
        <h1>🤖 AI智能对话</h1>
        <p>与多种先进AI模型进行实时对话交流</p>
      </header>

      <div className="chat-layout">
        {/* 左侧：模型选择面板 */}
        <aside className="model-panel">
          <div className="model-panel-header">
            <h3>🎯 选择模型</h3>
            <div className="stream-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={isStreaming}
                  onChange={(e) => setIsStreaming(e.target.checked)}
                />
                <span>流式输出</span>
              </label>
            </div>
          </div>

          {/* 模型分类 */}
          <div className="model-categories">
            {Object.keys(modelCategories).map(category => (
              <div key={category} className="model-category">
                <button
                  className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                  <span className="model-count">{modelCategories[category].length}</span>
                </button>
                
                {selectedCategory === category && (
                  <div className="model-list">
                    {modelCategories[category].map(model => (
                      <div
                        key={model.id}
                        className={`model-item ${selectedModel === model.id ? 'selected' : ''}`}
                        onClick={() => handleModelChange(model.id)}
                      >
                        <div className="model-name">{model.name}</div>
                        <div className="model-price">
                          <span className="price-label">输入:</span>
                          <span className="price-value">${model.inputPrice}</span>
                          <span className="price-label">输出:</span>
                          <span className="price-value">${model.outputPrice}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 当前模型信息 */}
          {currentModel && (
            <div className="current-model-info">
              <h4>当前模型</h4>
              <div className="model-detail">
                <p className="model-name">{currentModel.name}</p>
                <p className="model-id">{selectedModel}</p>
                <div className="model-pricing">
                  <span>💰 输入: ${currentModel.inputPrice}/M tokens</span>
                  <span>💰 输出: ${currentModel.outputPrice}/M tokens</span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* 右侧：对话区域 */}
        <main className="chat-main">
          {/* 对话历史 */}
          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💬</div>
                <h3>开始你的AI对话之旅</h3>
                <p>选择一个模型，输入你的问题，开始对话吧！</p>
                <div className="example-prompts">
                  <button onClick={() => setInputMessage('请介绍一下你自己')}>
                    👋 介绍一下你自己
                  </button>
                  <button onClick={() => setInputMessage('用Python写一个快速排序算法')}>
                    💻 写一个快速排序
                  </button>
                  <button onClick={() => setInputMessage('解释一下什么是机器学习')}>
                    🧠 什么是机器学习
                  </button>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, index) => (
                  <div key={index} className={`message ${msg.role}`}>
                    <div className="message-avatar">
                      {msg.role === 'user' ? '👤' : '🤖'}
                    </div>
                    <div className="message-content">
                      <div className="message-header">
                        <span className="message-role">
                          {msg.role === 'user' ? '你' : currentModel?.name || 'AI'}
                        </span>
                        <span className="message-time">{msg.timestamp}</span>
                      </div>
                      <div className="message-text">
                        {msg.content || '思考中...'}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="error-banner">
              ⚠️ {error}
            </div>
          )}

          {/* 输入区域 */}
          <div className="input-area">
            <div className="input-wrapper">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入你的问题... (Shift+Enter换行，Enter发送)"
                disabled={isLoading}
                rows={3}
              />
              <div className="input-actions">
                <button
                  className="clear-btn"
                  onClick={clearChat}
                  disabled={messages.length === 0}
                  title="清空对话"
                >
                  🗑️ 清空
                </button>
                <button
                  className="send-btn"
                  onClick={sendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                >
                  {isLoading ? '⏳ 发送中...' : '📤 发送'}
                </button>
              </div>
            </div>
            
            {/* 统计信息 */}
            <div className="chat-stats">
              <span>💬 消息数: {messages.length}</span>
              {totalTokens > 0 && <span>🎯 总Token: {totalTokens.toLocaleString()}</span>}
              <span>🔄 模式: {isStreaming ? '流式' : '标准'}</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AIChat
