import { useCallback, useEffect, useRef, useState } from 'react'
import './DeepSeekChatPanel.css'

const STORAGE_KEY = 'deepseek_api_key'
const OPTIONS_STORAGE_KEY = 'deepseek_chat_options'
const API_URL = 'https://api.deepseek.com/chat/completions'

const MODELS = [
  { id: 'deepseek-v4-flash', label: 'V4 Flash ⚡' },
  { id: 'deepseek-v4-pro', label: 'V4 Pro 🧠' },
]

const OPTION_TABS = [
  { id: 'model', label: '模型' },
  { id: 'sampling', label: '采样' },
  { id: 'output', label: '输出' },
]

const DEFAULT_OPTIONS = {
  model: MODELS[0].id,
  thinking: false,
  reasoningEffort: 'high',
  systemPrompt: '',
  temperature: 0,
  topP: 0,
  maxTokens: 4096,
  presencePenalty: 0,
  frequencyPenalty: 0,
  responseFormat: 'text',
  stopSequences: '',
  includeUsage: true,
  logprobs: false,
  topLogprobs: 0,
}

function loadOptions() {
  try {
    const stored = JSON.parse(localStorage.getItem(OPTIONS_STORAGE_KEY) || '{}')
    return { ...DEFAULT_OPTIONS, ...stored }
  } catch {
    return DEFAULT_OPTIONS
  }
}

function numberOr(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function maybeNumberParam(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed !== 0 ? parsed : undefined
}

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
  const [options, setOptions] = useState(() => loadOptions())
  const [systemPromptDraft, setSystemPromptDraft] = useState(() => loadOptions().systemPrompt)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [activeSettingsTab, setActiveSettingsTab] = useState(OPTION_TABS[0].id)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    localStorage.setItem(OPTIONS_STORAGE_KEY, JSON.stringify(options))
  }, [options])

  const updateOption = (key, value) => {
    setOptions(prev => ({ ...prev, [key]: value }))
  }

  const resetOptions = () => {
    setOptions(DEFAULT_OPTIONS)
    setSystemPromptDraft(DEFAULT_OPTIONS.systemPrompt)
  }

  const saveSystemPrompt = () => {
    updateOption('systemPrompt', systemPromptDraft.trim())
  }

  const clearSystemPrompt = () => {
    setSystemPromptDraft('')
    updateOption('systemPrompt', '')
  }

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
    const assistantDraft = { content: '', reasoning: '' }
    let assistantFrame = null
    const flushAssistant = () => {
      assistantFrame = null
      setMessages(prev => {
        const updated = [...prev]
        if (updated[assistantIdx]?.role !== 'assistant') {
          return prev
        }
        const msg = { ...updated[assistantIdx] }
        msg.content = assistantDraft.content
        msg.reasoning = assistantDraft.reasoning
        updated[assistantIdx] = msg
        return updated
      })
    }
    const scheduleAssistantFlush = () => {
      if (assistantFrame === null) {
        assistantFrame = window.requestAnimationFrame(flushAssistant)
      }
    }
    const cancelPendingAssistantFlush = () => {
      if (assistantFrame !== null) {
        window.cancelAnimationFrame(assistantFrame)
        assistantFrame = null
      }
    }

    try {
      const stop = options.stopSequences
        .split('\n')
        .map(item => item.trim())
        .filter(Boolean)
        .slice(0, 16)
      const requestMessages = history.map(m => ({ role: m.role, content: m.content }))

      if (options.systemPrompt.trim()) {
        requestMessages.unshift({ role: 'system', content: options.systemPrompt.trim() })
      }

      const body = {
        model: options.model,
        messages: requestMessages,
        stream: true,
        max_tokens: Math.min(64000, Math.max(1, Math.round(numberOr(options.maxTokens, 4096)))),
        response_format: { type: options.responseFormat },
        thinking: options.thinking ? { type: 'enabled' } : { type: 'disabled' },
        ...(maybeNumberParam(options.temperature) !== undefined
          ? { temperature: maybeNumberParam(options.temperature) }
          : {}),
        ...(maybeNumberParam(options.topP) !== undefined ? { top_p: maybeNumberParam(options.topP) } : {}),
        ...(maybeNumberParam(options.presencePenalty) !== undefined
          ? { presence_penalty: maybeNumberParam(options.presencePenalty) }
          : {}),
        ...(maybeNumberParam(options.frequencyPenalty) !== undefined
          ? { frequency_penalty: maybeNumberParam(options.frequencyPenalty) }
          : {}),
        ...(options.thinking ? { reasoning_effort: options.reasoningEffort } : {}),
        ...(options.includeUsage ? { stream_options: { include_usage: true } } : {}),
        ...(stop.length ? { stop: stop.length === 1 ? stop[0] : stop } : {}),
        ...(options.logprobs
          ? {
            logprobs: true,
            ...(numberOr(options.topLogprobs, 0) > 0
              ? { top_logprobs: Math.min(20, Math.round(numberOr(options.topLogprobs, 0))) }
              : {}),
          }
          : {}),
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
            if (delta.content) {
              assistantDraft.content += delta.content
            }
            if (delta.reasoning_content) {
              assistantDraft.reasoning += delta.reasoning_content
            }
            if (delta.content || delta.reasoning_content) {
              scheduleAssistantFlush()
            }
          } catch {
            // ignore malformed SSE chunks
          }
        }
      }
      cancelPendingAssistantFlush()
      flushAssistant()
    } catch (e) {
      if (e.name !== 'AbortError') {
        cancelPendingAssistantFlush()
        const hasPartialAssistant = Boolean(assistantDraft.content || assistantDraft.reasoning)
        if (hasPartialAssistant) {
          flushAssistant()
        }
        setError(e.message || '请求失败，请检查 API Key 或网络连接')
        setMessages(prev => {
          const updated = [...prev]
          const last = updated[assistantIdx]
          if (!hasPartialAssistant && last?.role === 'assistant' && !last.content && !last.reasoning) {
            updated.splice(assistantIdx, 1)
          }
          return updated
        })
      } else {
        cancelPendingAssistantFlush()
      }
    } finally {
      setLoading(false)
    }
  }, [input, loading, savedKey, messages, options])

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
  const selectedModel = MODELS.find(item => item.id === options.model)

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
          {selectedModel?.label}
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

      <div className="ds-toolbar">
        <button
          type="button"
          onClick={() => setSettingsOpen(open => !open)}
          className="ds-settings-trigger"
        >
          ⚙️ 参数设置
          <span>{settingsOpen ? '▲' : '▼'}</span>
        </button>
        <div className="ds-param-summary">
          <span>{options.thinking ? '深度思考' : '普通模式'}</span>
          <span>temp {options.temperature || '默认'}</span>
          <span>max {options.maxTokens}</span>
        </div>
      </div>

      {settingsOpen && (
        <div className="ds-settings-popover">
          <div className="ds-settings-head">
            <div>
              <strong>请求参数</strong>
              <p>统一管理 DeepSeek Chat Completion 参数</p>
            </div>
            <div className="ds-settings-head-actions">
              <button type="button" onClick={resetOptions}>恢复默认</button>
              <button type="button" onClick={() => setSettingsOpen(false)}>关闭</button>
            </div>
          </div>

          <div className="ds-settings-tabs">
            {OPTION_TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                className={activeSettingsTab === tab.id ? 'active' : ''}
                onClick={() => setActiveSettingsTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeSettingsTab === 'model' && (
            <div className="ds-settings-grid">
              <label className="ds-field ds-field-wide">
                <span>模型</span>
                <select
                  value={options.model}
                  onChange={e => updateOption('model', e.target.value)}
                >
                  {MODELS.map(item => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </select>
              </label>

              <label className="ds-check-field">
                <input
                  type="checkbox"
                  checked={options.thinking}
                  onChange={e => updateOption('thinking', e.target.checked)}
                />
                <span>启用 thinking</span>
              </label>

              <label className="ds-field">
                <span>reasoning_effort</span>
                <select
                  value={options.reasoningEffort}
                  onChange={e => updateOption('reasoningEffort', e.target.value)}
                  disabled={!options.thinking}
                >
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
              </label>

              <label className="ds-field ds-field-wide">
                <span>system prompt（点保存后生效）</span>
                <textarea
                  rows={3}
                  value={systemPromptDraft}
                  onChange={e => setSystemPromptDraft(e.target.value)}
                  placeholder="例如：你是一个简洁、准确的中文助手。"
                />
                <div className="ds-field-actions">
                  <button type="button" onClick={saveSystemPrompt}>保存 system prompt</button>
                  <button type="button" onClick={clearSystemPrompt}>清空</button>
                  {options.systemPrompt && <span>已保存 {options.systemPrompt.length} 字</span>}
                </div>
              </label>
            </div>
          )}

          {activeSettingsTab === 'sampling' && (
            <div className="ds-settings-grid">
              <label className="ds-field">
                <span>temperature: {options.temperature || '默认'}</span>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={options.temperature}
                  onChange={e => updateOption('temperature', Number(e.target.value))}
                />
              </label>

              <label className="ds-field">
                <span>top_p: {options.topP || '默认'}</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={options.topP}
                  onChange={e => updateOption('topP', Number(e.target.value))}
                />
              </label>

              <label className="ds-field">
                <span>presence_penalty: {options.presencePenalty || '默认'}</span>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="0.1"
                  value={options.presencePenalty}
                  onChange={e => updateOption('presencePenalty', Number(e.target.value))}
                />
              </label>

              <label className="ds-field">
                <span>frequency_penalty: {options.frequencyPenalty || '默认'}</span>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="0.1"
                  value={options.frequencyPenalty}
                  onChange={e => updateOption('frequencyPenalty', Number(e.target.value))}
                />
              </label>
            </div>
          )}

          {activeSettingsTab === 'output' && (
            <div className="ds-settings-grid">
              <label className="ds-field">
                <span>max_tokens</span>
                <input
                  type="number"
                  min="1"
                  max="64000"
                  value={options.maxTokens}
                  onChange={e => updateOption('maxTokens', e.target.value)}
                />
              </label>

              <label className="ds-field">
                <span>response_format</span>
                <select
                  value={options.responseFormat}
                  onChange={e => updateOption('responseFormat', e.target.value)}
                >
                  <option value="text">text</option>
                  <option value="json_object">json_object</option>
                </select>
              </label>

              <label className="ds-check-field">
                <input
                  type="checkbox"
                  checked={options.includeUsage}
                  onChange={e => updateOption('includeUsage', e.target.checked)}
                />
                <span>stream_options.include_usage</span>
              </label>

              <label className="ds-check-field">
                <input
                  type="checkbox"
                  checked={options.logprobs}
                  onChange={e => updateOption('logprobs', e.target.checked)}
                />
                <span>返回 logprobs</span>
              </label>

              <label className="ds-field">
                <span>top_logprobs</span>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={options.topLogprobs}
                  onChange={e => updateOption('topLogprobs', e.target.value)}
                  disabled={!options.logprobs}
                />
              </label>

              <label className="ds-field ds-field-wide">
                <span>stop（每行一个，最多 16 个）</span>
                <textarea
                  rows={3}
                  value={options.stopSequences}
                  onChange={e => updateOption('stopSequences', e.target.value)}
                  placeholder="例如：\n###\n用户："
                />
              </label>
            </div>
          )}
        </div>
      )}

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
