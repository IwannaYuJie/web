import { useState } from 'react'
import { CAT_QUOTES } from '../../constants/home'

function HomeQuoteCard() {
  const [quote, setQuote] = useState(null)
  const [quoteLoading, setQuoteLoading] = useState(false)

  const fetchRandomQuote = async () => {
    setQuoteLoading(true)

    if (Math.random() > 0.5) {
      window.setTimeout(() => {
        const catQuote = CAT_QUOTES[Math.floor(Math.random() * CAT_QUOTES.length)]
        setQuote({ content: catQuote.text, author: catQuote.author })
        setQuoteLoading(false)
      }, 500)
      return
    }

    try {
      const response = await fetch('https://api.quotable.io/random')
      if (!response.ok) { throw new Error('Failed') }
      const data = await response.json()
      setQuote(data)
    } catch {
      const catQuote = CAT_QUOTES[Math.floor(Math.random() * CAT_QUOTES.length)]
      setQuote({ content: catQuote.text, author: catQuote.author })
    } finally {
      setQuoteLoading(false)
    }
  }

  return (
    <div className="glass p-6 rounded-2xl relative overflow-hidden">
      <div className="absolute -right-4 -top-4 text-9xl text-primary/5 opacity-20 select-none">”</div>
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span>🐾</span> 每日智慧
      </h2>
      <div className="mb-6 min-h-[100px] flex flex-col justify-center">
        {quote ? (
          <blockquote className="italic text-text-secondary">
            &ldquo;{quote.content}&rdquo;
            <footer className="text-right mt-2 text-sm font-bold not-italic text-primary">— {quote.author}</footer>
          </blockquote>
        ) : (
          <div className="text-center text-text-light text-sm">点击下方按钮获取灵感...</div>
        )}
      </div>
      <button
        onClick={fetchRandomQuote}
        disabled={quoteLoading}
        className="w-full btn btn-secondary justify-center"
      >
        {quoteLoading ? '🤔 思考中...' : '🎲 获取灵感'}
      </button>
    </div>
  )
}

export default HomeQuoteCard
