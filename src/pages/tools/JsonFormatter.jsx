import { useMemo, useState } from 'react'
import ToolHero from './ToolHero'

const SAMPLE = `{"name":"橘猫","tags":["cute","warm"],"stats":{"level":3,"hp":120}}`

function JsonFormatter() {
  const [input, setInput] = useState(SAMPLE)
  const [indent, setIndent] = useState(2)
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => {
    if (!input.trim()) {
      return { ok: true, output: '', error: null, size: 0 }
    }
    try {
      const parsed = JSON.parse(input)
      const output = JSON.stringify(parsed, null, indent)
      return { ok: true, output, error: null, size: new Blob([output]).size }
    } catch (e) {
      return { ok: false, output: '', error: e.message, size: 0 }
    }
  }, [input, indent])

  const minified = useMemo(() => {
    try {
      return JSON.stringify(JSON.parse(input))
    } catch {
      return ''
    }
  }, [input])

  const handleCopy = async (text) => {
    if (!text) {return}
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="container pb-12 animate-fade-in">
      <ToolHero
        emoji="🧾"
        tag="开发工具"
        title="JSON 格式化 / 校验"
        desc="粘贴 JSON 文本，自动校验、缩进美化、压缩。所有处理都在浏览器内完成。"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-primary">📥 输入</h3>
            <div className="flex gap-2">
              <button className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                onClick={() => setInput(SAMPLE)}>示例</button>
              <button className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                onClick={() => setInput('')}>清空</button>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            className="w-full h-80 p-3 rounded-xl border-2 border-[var(--border-color)] bg-white/80 font-mono text-sm focus:outline-none focus:border-primary"
            placeholder="在这里粘贴 JSON…"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
            <label className="flex items-center gap-2">
              <span>缩进</span>
              <select
                value={indent}
                onChange={(e) => setIndent(Number(e.target.value))}
                className="px-2 py-1 rounded-md border border-[var(--border-color)] bg-white"
              >
                <option value={2}>2 空格</option>
                <option value={4}>4 空格</option>
                <option value={0}>压缩</option>
              </select>
            </label>
            <span className="ml-auto">
              {result.ok
                ? <span className="text-green-600 font-bold">✓ 合法 JSON</span>
                : <span className="text-red-600 font-bold">✗ 解析失败</span>}
            </span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-primary">📤 输出</h3>
            <div className="flex gap-2">
              <button
                disabled={!result.output}
                onClick={() => handleCopy(result.output)}
                className="text-xs px-3 py-1 rounded-full bg-primary text-white hover:bg-primary-hover disabled:opacity-40"
              >
                {copied ? '✓ 已复制' : '复制结果'}
              </button>
              <button
                disabled={!minified}
                onClick={() => handleCopy(minified)}
                className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-40"
              >
                复制压缩版
              </button>
            </div>
          </div>

          {result.ok ? (
            <pre className="w-full h-80 overflow-auto p-3 rounded-xl border-2 border-[var(--border-color)] bg-white/80 font-mono text-sm whitespace-pre-wrap break-all">
              {result.output || <span className="text-text-secondary">输入合法 JSON 后，会显示在这里。</span>}
            </pre>
          ) : (
            <div className="w-full h-80 p-3 rounded-xl border-2 border-red-300 bg-red-50/60 text-red-700 text-sm font-mono whitespace-pre-wrap">
              {result.error}
            </div>
          )}

          {result.ok && result.output && (
            <div className="mt-3 text-sm text-text-secondary flex justify-between">
              <span>字节数: {result.size}</span>
              <span>压缩后: {new Blob([minified]).size} B</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default JsonFormatter
