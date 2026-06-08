import { useMemo, useState } from 'react'
import ToolHero from './ToolHero'

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  bytes.forEach((b) => { bin += String.fromCharCode(b) })
  return btoa(bin)
}

function base64ToUtf8(b64) {
  const bin = atob(b64.replace(/\s/g, ''))
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) {bytes[i] = bin.charCodeAt(i)}
  return new TextDecoder().decode(bytes)
}

function Base64Tool() {
  const [mode, setMode] = useState('encode')
  const [input, setInput] = useState('')
  const [urlSafe, setUrlSafe] = useState(false)
  const [copied, setCopied] = useState(false)
  const [fileResult, setFileResult] = useState(null)

  const result = useMemo(() => {
    if (!input) {return { ok: true, output: '' }}
    try {
      if (mode === 'encode') {
        let out = utf8ToBase64(input)
        if (urlSafe) {out = out.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}
        return { ok: true, output: out }
      }
      let src = input.trim()
      if (urlSafe) {
        src = src.replace(/-/g, '+').replace(/_/g, '/')
        const pad = src.length % 4
        if (pad) {src += '='.repeat(4 - pad)}
      }
      return { ok: true, output: base64ToUtf8(src) }
    } catch (e) {
      return { ok: false, output: '', error: e.message }
    }
  }, [input, mode, urlSafe])

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) {return}
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      const base64 = String(dataUrl).split(',')[1] || ''
      setFileResult({ name: file.name, size: file.size, type: file.type, dataUrl, base64 })
    }
    reader.readAsDataURL(file)
  }

  const handleCopy = async (text) => {
    if (!text) {return}
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="container pb-12 animate-fade-in">
      <ToolHero
        emoji="🔐"
        tag="编码工具"
        title="Base64 编解码"
        desc="文本和文件转成 Base64，或者转回来。支持 URL-safe 模式，文件不传服务器。"
      />

      <div className="card mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="inline-flex rounded-full overflow-hidden border-2 border-[var(--border-color)]">
            {['encode', 'decode'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-2 text-sm font-bold ${mode === m ? 'bg-primary text-white' : 'bg-white text-text-secondary'}`}
              >
                {m === 'encode' ? '编码' : '解码'}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input type="checkbox" checked={urlSafe} onChange={(e) => setUrlSafe(e.target.checked)} />
            URL-safe (Base64URL)
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-text-secondary mb-2">{mode === 'encode' ? '原文' : 'Base64'}</div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
              className="w-full h-56 p-3 rounded-xl border-2 border-[var(--border-color)] bg-white/80 font-mono text-sm focus:outline-none focus:border-primary"
              placeholder={mode === 'encode' ? '把原文写在这里…' : '把 Base64 贴在这里…'}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-text-secondary">{mode === 'encode' ? 'Base64' : '原文'}</div>
              <button
                onClick={() => handleCopy(result.output)}
                disabled={!result.output}
                className="text-xs px-3 py-1 rounded-full bg-primary text-white hover:bg-primary-hover disabled:opacity-40"
              >
                {copied ? '✓ 已复制' : '复制结果'}
              </button>
            </div>
            {result.ok ? (
              <pre className="w-full h-56 overflow-auto p-3 rounded-xl border-2 border-[var(--border-color)] bg-white/80 font-mono text-sm whitespace-pre-wrap break-all">
                {result.output || <span className="text-text-secondary">结果会显示在这~</span>}
              </pre>
            ) : (
              <div className="w-full h-56 p-3 rounded-xl border-2 border-red-300 bg-red-50/60 text-red-700 text-sm font-mono">
                {result.error}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-bold text-primary mb-3">📎 文件 → Base64 / Data URL</h3>
        <label className="block border-2 border-dashed border-[var(--border-color)] rounded-xl p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5">
          <input type="file" onChange={handleFile} className="hidden" />
          <div className="text-3xl mb-1">📤</div>
          <div className="text-sm text-text-secondary">点这里选文件（支持图片、文本什么的）</div>
        </label>

        {fileResult && (
          <div className="mt-4 space-y-3">
            <div className="text-sm text-text-secondary">
              <span className="font-mono text-text-color">{fileResult.name}</span>
              <span className="ml-2">{fileResult.type || '(unknown)'} · {fileResult.size} B</span>
            </div>

            {fileResult.type.startsWith('image/') && (
              <img
                src={fileResult.dataUrl}
                alt={fileResult.name}
                className="max-h-48 rounded-lg border border-[var(--border-color)]"
              />
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(fileResult.base64)}
                className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
              >
                复制 Base64
              </button>
              <button
                onClick={() => handleCopy(fileResult.dataUrl)}
                className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
              >
                复制 Data URL
              </button>
            </div>

            <textarea
              readOnly
              value={fileResult.base64}
              className="w-full h-32 p-3 rounded-xl border border-[var(--border-color)] bg-white/60 font-mono text-xs"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default Base64Tool
