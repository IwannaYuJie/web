import { useState, useRef, useEffect } from 'react'

/**
 * AI对话组件
 * 支持多种AI模型的实时对话功能
 * 使用七牛云AI推理API
 */
function AIChat() {
  // 单一模型列表，保持与后端允许的模型 ID 一致，避免目录嵌套造成额外选择步骤
  const aiModels = [
    {
      id: 'gemini-3.0-pro-preview',
      name: 'Gemini 3.0 Pro Preview',
      desc: 'Gemini 新版多模态旗舰（预览版）',
      inputPrice: '待定',
      outputPrice: '待定'
    },
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      desc: '面对复杂推理与多轮对话的主力模型',
      inputPrice: '待定',
      outputPrice: '待定'
    },
    {
      id: 'openai/gpt-5',
      name: 'OpenAI GPT-5',
      desc: 'OpenAI 最新通用模型，综合表现强',
      inputPrice: '待定',
      outputPrice: '待定'
    },
    {
      id: 'claude-4.5-sonnet',
      name: 'Claude 4.5 Sonnet',
      desc: 'Anthropic 最新旗舰，擅长代码与写作',
      inputPrice: '待定',
      outputPrice: '待定'
    },
    {
      id: 'deepseek/deepseek-v3.2-exp-thinking',
      name: 'DeepSeek V3.2 EXP Thinking',
      desc: 'DeepSeek 思维链升级款，推理细腻',
      inputPrice: '待定',
      outputPrice: '待定'
    }
  ]

  // 状态管理
  const [selectedModel, setSelectedModel] = useState(aiModels[0].id)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(true)
  const [error, setError] = useState(null)
  const [totalTokens, setTotalTokens] = useState(0)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // 移动端侧边栏状态
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
    if (!inputMessage.trim() || isLoading) {return}

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
        await streamChat([...messages, userMessage])
      } else {
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: selectedModel,
        messages: chatMessages.map(msg => ({ role: msg.role, content: msg.content })),
        stream: true,
        max_tokens: 4096
      })
    })

    if (!response.ok) {throw new Error(`API请求失败: ${response.status}`)}

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    const assistantMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString('zh-CN')
    }

    setMessages(prev => [...prev, assistantMessage])

    try {
      let reading = true
      while (reading) {
        const { done, value } = await reader.read()
        if (done) {
          reading = false
          break
        }

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim() !== '')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {continue}
            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                assistantMessage.content += content
                setMessages(prev => {
                  const newMessages = [...prev]
                  newMessages[newMessages.length - 1] = { ...assistantMessage }
                  return newMessages
                })
              }
            } catch (e) { console.error('Parse error:', e) }
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: selectedModel,
        messages: chatMessages.map(msg => ({ role: msg.role, content: msg.content })),
        stream: false,
        max_tokens: 4096
      })
    })

    if (!response.ok) {throw new Error(`API请求失败: ${response.status}`)}

    const data = await response.json()
    const assistantMessage = {
      role: 'assistant',
      content: data.choices[0].message.content,
      timestamp: new Date().toLocaleTimeString('zh-CN')
    }

    setMessages(prev => [...prev, assistantMessage])
    if (data.usage) {setTotalTokens(prev => prev + data.usage.total_tokens)}
  }

  const clearChat = () => {
    setMessages([])
    setTotalTokens(0)
    setError(null)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const currentModel = aiModels.find(m => m.id === selectedModel)

  return (
    <div className="container h-[calc(100vh-80px)] flex flex-col md:flex-row gap-6 pb-6 animate-fade-in">
      {/* Mobile Toggle */}
      <button
        className="md:hidden btn btn-secondary w-full mb-2"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? '❌ 关闭模型列表' : '🤖 选择模型'}
      </button>

      {/* Sidebar - Model Selection */}
      <aside className={`
        fixed inset-0 z-50 bg-bg-color/95 backdrop-blur-xl p-6 transition-transform duration-300 transform
        md:relative md:translate-x-0 md:w-80 md:bg-transparent md:backdrop-blur-none md:p-0 md:flex md:flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="glass h-full rounded-2xl flex flex-col overflow-hidden border border-white/20 shadow-xl">
          <div className="p-4 border-b border-white/10 bg-gradient-to-r from-primary/10 to-transparent">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <span>🎯</span> 模型控制台
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
             {/* Model List */}
             <div className="space-y-2">
               <label className="text-xs font-bold text-text-light uppercase tracking-wider">可用模型</label>
               {aiModels.map(model => (
                 <div
                   key={model.id}
                   onClick={() => {
                     setSelectedModel(model.id)
                     setIsSidebarOpen(false)
                   }}
                   className={`
                     p-3 rounded-xl cursor-pointer border transition-all
                     ${selectedModel === model.id
                       ? 'bg-primary/10 border-primary shadow-sm'
                       : 'bg-white/30 border-transparent hover:bg-white/60 hover:border-primary/30'}
                   `}
                 >
                   <div className="flex justify-between items-start mb-1">
                     <span className={`font-bold ${selectedModel === model.id ? 'text-primary' : 'text-text-color'}`}>
                       {model.name}
                     </span>
                     <span className="text-[10px] uppercase tracking-wide text-text-secondary bg-white/50 px-2 py-0.5 rounded-full">
                       {model.id}
                     </span>
                   </div>
                   <p className="text-xs text-text-light line-clamp-2 mb-2">{model.desc}</p>
                   <div className="flex gap-2 text-[10px] text-text-secondary bg-white/40 p-1.5 rounded-lg">
                     <span>输入 ${model.inputPrice || '—'}</span>
                     <span className="opacity-30">|</span>
                     <span>输出 ${model.outputPrice || '—'}</span>
                   </div>
                 </div>
               ))}
             </div>
          </div>

          <div className="p-4 border-t border-white/10 bg-white/30">
            <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-white/40 rounded-lg transition-colors">
              <span className="text-sm font-medium">⚡ 流式输出</span>
              <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isStreaming ? 'bg-primary' : 'bg-gray-300'}`}
                   onClick={(e) => {
                     e.preventDefault()
                     setIsStreaming(!isStreaming)
                   }}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isStreaming ? 'translate-x-4' : ''}`} />
              </div>
            </label>
          </div>
        </div>
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col glass rounded-2xl overflow-hidden shadow-xl border border-white/20 relative">

        {/* Header */}
        <div className="p-4 border-b border-white/10 bg-white/30 backdrop-blur-md flex justify-between items-center z-10">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xl shadow-lg">
                🤖
              </div>
              <div>
                <h2 className="font-bold text-text-color">{currentModel?.name}</h2>
                <div className="text-xs text-primary flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  在线
                </div>
              </div>
           </div>
           <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 bg-white/50 rounded-md text-text-secondary hidden sm:block">
                 消耗 Tokens: {totalTokens}
              </span>
              <button
                onClick={clearChat}
                className="p-2 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                title="清空对话"
              >
                🗑️
              </button>
           </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
           {messages.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                <div className="text-6xl mb-4 animate-bounce">💬</div>
                <h3 className="text-xl font-bold mb-2">开始新的对话</h3>
                <p className="text-sm max-w-xs">选择一个模型，问我任何问题，比如代码生成、创意写作或知识问答。</p>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg px-4">
                  {['👋 介绍一下你自己', '💻 写一个快速排序', '🧠 什么是机器学习', '🎨 给我讲个故事'].map(hint => (
                    <button
                      key={hint}
                      onClick={() => setInputMessage(hint)}
                      className="p-3 bg-white/40 hover:bg-white/80 rounded-xl text-sm text-left transition-all border border-transparent hover:border-primary/30 hover:shadow-sm"
                    >
                      {hint}
                    </button>
                  ))}
                </div>
             </div>
           ) : (
             messages.map((msg, idx) => (
               <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-slide-up`}>
                 <div className={`
                   w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm
                   ${msg.role === 'user' ? 'bg-secondary text-white' : 'bg-white text-primary border border-primary/20'}
                 `}>
                   {msg.role === 'user' ? '👤' : '🤖'}
                 </div>

                 <div className={`flex flex-col gap-1 max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 text-xs text-text-light px-1">
                      <span>{msg.role === 'user' ? '你' : currentModel?.name}</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <div className={`
                      p-4 rounded-2xl shadow-sm leading-relaxed break-words text-sm md:text-base
                      ${msg.role === 'user'
                        ? 'bg-gradient-to-br from-primary to-primary-hover text-white rounded-tr-none'
                        : 'bg-white text-text-color rounded-tl-none border border-border-color'}
                    `}>
                      <div className="whitespace-pre-wrap font-sans">
                        {msg.content || <span className="animate-pulse">Thinking...</span>}
                      </div>
                    </div>
                 </div>
               </div>
             ))
           )}
           <div ref={messagesEndRef} />
        </div>

        {/* Error Banner */}
        {error && (
           <div className="absolute bottom-[80px] left-4 right-4 bg-red-100 text-red-600 px-4 py-2 rounded-lg border border-red-200 shadow-lg flex items-center gap-2 animate-fade-in z-20">
             <span>⚠️</span>
             <span className="text-sm flex-1">{error}</span>
             <button onClick={() => setError(null)} className="text-xs font-bold hover:underline">关闭</button>
           </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-white/60 backdrop-blur-md border-t border-white/20">
           <div className="relative max-w-4xl mx-auto">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入你的问题... (Shift+Enter 换行)"
                className="w-full pl-4 pr-24 py-4 rounded-2xl border border-white/50 bg-white/80 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none shadow-inner transition-all text-text-color"
                rows={1}
                style={{ minHeight: '60px', maxHeight: '150px' }}
                disabled={isLoading}
              />
              <div className="absolute right-2 bottom-2.5 flex gap-2">
                 <button
                   onClick={sendMessage}
                   disabled={isLoading || !inputMessage.trim()}
                   className={`
                     p-2.5 rounded-xl flex items-center justify-center transition-all
                     ${isLoading || !inputMessage.trim()
                       ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                       : 'bg-primary text-white shadow-md hover:bg-primary-hover hover:scale-105 active:scale-95'}
                   `}
                 >
                   {isLoading ? (
                     <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   ) : (
                     <span className="font-bold text-sm">发送</span>
                   )}
                 </button>
              </div>
           </div>
           <div className="text-center mt-2 text-[10px] text-text-light">
             AI生成内容仅供参考，请注意甄别
           </div>
        </div>

      </main>
    </div>
  )
}

export default AIChat

