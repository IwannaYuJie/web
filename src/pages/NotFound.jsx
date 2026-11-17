import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Cloud, Mountains, Seal } from '../components/xian/Ornaments'
import { setDocumentMeta } from '../utils/documentMeta'
import { prefetchRoute } from '../utils/routePrefetch'
import './NotFound.css'

export default function NotFound() {
  useEffect(() => {
    setDocumentMeta({
      title: '迷途 · 云深不知处 (404) | 橘猫小窝',
      description: '云深雾重，此路径下未见卷轴，请返回山门或前往藏经阁。',
    })
  }, [])

  return (
    <section className="x404">
      <Mountains className="x404-mountains" pavilion />
      <div className="wrap x404-inner">
        <Cloud size={92} />
        <div className="x404-badge rise" style={{ '--i': 0 }}>
          <Seal text="迷途" size={52} />
          <span className="latin x404-code">404</span>
        </div>
        <h1 className="brush x404-title rise" style={{ '--i': 1 }}>
          迷途 · 云深不知处
        </h1>
        <p className="x404-desc elegant rise" style={{ '--i': 2 }}>
          云深雾重，此处并无石阶径路。<br />
          或许所寻卷轴已迁往他处，或误入了尚未开山辟地的幽谷。
        </p>

        <div className="x404-actions rise" style={{ '--i': 3 }}>
          <Link
            to="/"
            className="btn"
            onMouseEnter={() => prefetchRoute('/')}
          >
            返回山门 <span className="arr">→</span>
          </Link>
          <Link
            to="/archive"
            className="btn ghost"
            onMouseEnter={() => prefetchRoute('/archive')}
          >
            翻检藏经阁
          </Link>
          <Link
            to="/toolbox"
            className="btn ghost"
            onMouseEnter={() => prefetchRoute('/toolbox')}
          >
            法宝阁
          </Link>
          <Link
            to="/games"
            className="btn ghost"
            onMouseEnter={() => prefetchRoute('/games')}
          >
            游仙境
          </Link>
        </div>
      </div>
    </section>
  )
}
