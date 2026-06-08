import { useMemo, useState } from 'react'
import ToolHero from './ToolHero'

function countStats(text) {
  const chars = [...text].length
  const charsNoSpace = [...text.replace(/\s/g, '')].length
  const bytes = new Blob([text]).size
  const lines = text === '' ? 0 : text.split(/\r\n|\r|\n/).length
  const words = (text.trim().match(/[\wÀ-￿]+/g) || []).length
  const cjk = (text.match(/[一-鿿぀-ヿ가-힯]/g) || []).length
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length
  const readingMinutes = Math.max(1, Math.ceil((words + cjk / 2) / 250))
  return { chars, charsNoSpace, bytes, lines, words, cjk, paragraphs, readingMinutes }
}

function TextCounter() {
  const [text, setText] = useState('')
  const stats = useMemo(() => countStats(text), [text])

  const items = [
    ['总字数', stats.chars],
    ['总字数（不要空格）', stats.charsNoSpace],
    ['字节 (UTF-8)', stats.bytes],
    ['英文/数字单词', stats.words],
    ['中日韩文字', stats.cjk],
    ['一共几行', stats.lines],
    ['段落', stats.paragraphs],
    ['大概要读', `${stats.readingMinutes} 分钟`],
  ]

  return (
    <div className="container pb-12 animate-fade-in">
      <ToolHero
        emoji="🔤"
        tag="文本工具"
        title="文本统计"
        desc="贴段文字，帮你数数有多少个字、中英文字符、占多少字节、还要读多久。"
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-primary">输入文本</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setText('')}
                className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
              >全部清空</button>
              <button
                onClick={async () => setText(await navigator.clipboard.readText().catch(() => ''))}
                className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
              >贴剪贴板</button>
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="把文本贴到这里…"
            className="w-full h-96 p-3 rounded-xl border-2 border-[var(--border-color)] bg-white/80 text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <div className="card">
          <h3 className="font-bold text-primary mb-3">统计结果</h3>
          <div className="rounded-xl bg-white/60 border border-[var(--border-color)] divide-y divide-[var(--border-color)]">
            {items.map(([label, value]) => (
              <div key={label} className="flex justify-between px-3 py-2 text-sm">
                <span className="text-text-secondary">{label}</span>
                <span className="font-mono font-bold text-text-color">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TextCounter
