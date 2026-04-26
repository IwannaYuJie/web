import { useCallback, useEffect, useRef, useState } from 'react'
import './DeepSeekChatPanel.css'

const STORAGE_KEY = 'deepseek_api_key'
const API_URL = 'https://api.deepseek.com/chat/completions'
const MAX_TOKENS = 4096

const MODELS = [
  { id: 'deepseek-v4-flash', label: 'V4 Flash ⚡' },
  { id: 'deepseek-v4-pro', label: 'V4 Pro 🧠' },
]

function ReasoningBlock({ text }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="ds-reasoning">
      <button className="ds-reasoning-toggle" onClick={() => setOpen(o => !o)}>
        🧠 推理过程 {open ? '▲' : '▼'}
      </button>
      {open && <div className="ds-reasoning-body">{text}</div>}
    </div>
  )
}

function DeepSeekChatPanel() {
  const [savedKey, setSavedKey] = useState(() => localStorage.getItem(STORAGE_KEY) || '')
  const [inputKey, setInputKey] = useState(() => localStorage.getItem(STORAGE_KEY) || '')
  const [model, setModel] = useState(MODELS[0].id)
  const [thinking, setThinking] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const saveKey = () => {
    const trimmed = inputKey.trim()
    localStorage.setItem(STORAGE_KEY, trimmed)
    setSavedKey(trimmed)
    setError('')
  }

  const clearKey = () => {
    localStorage.removeItem(STORAGE_KEY)
    setInputKey('')
    setSavedKey('')
    setError('')
  }

  const send = useCallback(async () => {
    if (!input.trim() || loading) {
      return
    }
    if (!savedKey) {
      setError('请先输入并保存 API Key')
      return
    }

    const userMsg = { role: 'user', content: input.trim() }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setLoading(true)
    setError('')

    const assistantIdx = history.length
    setMessages(prev => [...prev, { role: 'assistant', content: '', reasoning: '' }])

    abortRef.current = new AbortController()

    try {
      const body = {
        model,
        messages: history.map(m => ({ role: m.role, content: m.content })),
        stream: true,
        max_tokens: MAX_TOKENS,
        thinking: thinking ? { type: 'enabled' } : { type: 'disabled' },
        ...(thinking ? { reasoning_effort: 'high' } : {}),
      }

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${savedKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`API 错误 ${res.status}: ${errText}`)
      }

      if (!res.body) {
        throw new Error('浏览器没有收到可读取的流式响应')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let finished = false

      while (!finished) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) {
            continue
          }
          const data = line.slice(6).trim()
          if (data === '[DONE]') {
            finished = true
            break
          }
          try {
            const json = JSON.parse(data)
            const delta = json.choices?.[0]?.delta
            if (!delta) {
              continue
            }
            setMessages(prev => {
              const updated = [...prev]
              const msg = { ...updated[assistantIdx] }
              if (delta.content) {
                msg.content += delta.content
              }
              if (delta.reasoning_content) {
                msg.reasoning = (msg.reasoning || '') + delta.reasoning_content
              }
              updated[assistantIdx] = msg
              return updated
            })
          } catch {
            // ignore malformed SSE chunks
          }
        }
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        setError(e.message || '请求失败，请检查 API Key 或网络连接')
        setMessages(prev => {
          const updated = [...prev]
          const last = updated[assistantIdx]
          if (last?.role === 'assistant' && !last.content && !last.reasoning) {
            updated.splice(assistantIdx, 1)
          }
          return updated
        })
      }
    } finally {
      setLoading(false)
    }
  }, [input, loading, savedKey, messages, model, thinking])

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const clear = () => {
    abortRef.current?.abort()
    setMessages([])
    setError('')
    setLoading(false)
  }

  const showTyping =
    loading &&
    messages.length > 0 &&
    messages[messages.length - 1]?.role === 'assistant' &&
    !messages[messages.length - 1]?.content

  return (
    <div className="glass ds-panel p-6 rounded-2xl flex flex-col gap-4">
      {/* Header */}
      <div className="ds-panel-header">
        <div>
          <div className="ds-eyebrow">DeepSeek API Console</div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-primary">
            <span>🤖</span> DeepSeek 对话
          </h2>
          <p>填入自己的 Key，就能在首页直接调用 DeepSeek V4。</p>
        </div>
        <div className="ds-live-badge">
          <span></span>
          流式输出
        </div>
      </div>

      {/* API Key */}
      <div className="ds-key-row">
        <input
          type="password"
          placeholder="输入 DeepSeek API Key..."
          value={inputKey}
          onChange={e => setInputKey(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              saveKey()
            }
          }}
          className="ds-key-input"
        />
        <button onClick={saveKey} className="btn btn-primary">
          💾 保存
        </button>
      </div>

      <div className="ds-key-meta">
        {savedKey ? (
          <>
            <span>✅ 已保存 Key（末四位：…{savedKey.slice(-4)}）</span>
            <button onClick={clearKey} type="button">清除</button>
          </>
        ) : (
          <span>Key 只保存在当前浏览器 localStorage，不会提交到本站后端。</span>
        )}
      </div>

      {/* Settings */}
      <div className="ds-settings-row">
        <div className="ds-model-select-wrapper">
          {MODELS.map(m => (
            <button
              key={m.id}
              onClick={() => setModel(m.id)}
              className={`ds-model-btn${model === m.id ? ' ds-model-active' : ''}`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setThinking(t => !t)}
          className={`ds-thinking-toggle${thinking ? ' ds-thinking-on' : ''}`}
          title="开启后请求包含 thinking 参数"
        >
          💭 深度思考 {thinking ? '开' : '关'}
        </button>
      </div>

      {/* Messages */}
      <div className="ds-messages">
        {messages.length === 0 && (
          <div className="ds-empty">
            <span className="text-4xl">🐱</span>
            <p>输入问题，让橘猫帮你问问 DeepSeek～</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`ds-msg ds-msg-${msg.role}`}>
            {msg.role === 'user' ? (
              <div className="ds-bubble ds-bubble-user">{msg.content}</div>
            ) : (
              <div className="ds-bubble ds-bubble-assistant">
                {msg.reasoning ? <ReasoningBlock text={msg.reasoning} /> : null}
                <div className="ds-content whitespace-pre-wrap">{msg.content}</div>
              </div>
            )}
          </div>
        ))}
        {showTyping && (
          <div className="ds-typing">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && <div className="ds-error">⚠️ {error}</div>}

      {/* Input */}
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="输入消息…（Enter 发送，Shift+Enter 换行）"
        rows={2}
        className="ds-textarea"
        disabled={loading}
      />

      <div className="ds-actions">
        <button onClick={clear} className="btn btn-secondary" title="清空对话">
          🗑️ 清空
        </button>
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="btn btn-primary"
        >
          {loading ? '⏳ 生成中…' : '发送 ➤'}
        </button>
      </div>
    </div>
  )
}

export default DeepSeekChatPanel
