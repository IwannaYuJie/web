import { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'

const Home = lazy(() => import('./pages/Home'))
const ArticleDetail = lazy(() => import('./pages/ArticleDetail'))
const Archive = lazy(() => import('./pages/Archive'))
const Tags = lazy(() => import('./pages/Tags'))
const About = lazy(() => import('./pages/About'))

const ArticleManager = lazy(() => import('./pages/ArticleManager'))
const GameHub = lazy(() => import('./pages/GameHub'))

const Toolbox = lazy(() => import('./pages/Toolbox'))
const SpriteSheetToGif = lazy(() => import('./pages/tools/SpriteSheetToGif'))
const JsonFormatter = lazy(() => import('./pages/tools/JsonFormatter'))
const TimestampConverter = lazy(() => import('./pages/tools/TimestampConverter'))
const Base64Tool = lazy(() => import('./pages/tools/Base64Tool'))
const ColorConverter = lazy(() => import('./pages/tools/ColorConverter'))
const TextCounter = lazy(() => import('./pages/tools/TextCounter'))
const PasswordGenerator = lazy(() => import('./pages/tools/PasswordGenerator'))

function PageLoader() {
  return (
    <div className="container flex-center min-h-[60vh]">
      <div className="text-center animate-bounce">
        <div className="text-6xl mb-4">🐱</div>
        <h2 className="text-xl font-bold text-primary">页面加载中...</h2>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Layout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/article/:id" element={<ArticleDetail />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/tags" element={<Tags />} />
            <Route path="/about" element={<About />} />

            <Route path="/admin/articles" element={<ArticleManager />} />
            <Route path="/games" element={<GameHub />} />
            <Route path="/toolbox" element={<Toolbox />} />
            <Route path="/toolbox/sprite-sheet-to-gif" element={<SpriteSheetToGif />} />
            <Route path="/toolbox/json-formatter" element={<JsonFormatter />} />
            <Route path="/toolbox/timestamp" element={<TimestampConverter />} />
            <Route path="/toolbox/base64" element={<Base64Tool />} />
            <Route path="/toolbox/color" element={<ColorConverter />} />
            <Route path="/toolbox/text-counter" element={<TextCounter />} />
            <Route path="/toolbox/password" element={<PasswordGenerator />} />
          </Routes>
        </Suspense>
      </Layout>
    </Router>
  )
}

export default App
