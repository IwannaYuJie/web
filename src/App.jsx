import { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'

const Home = lazy(() => import('./pages/Home'))
const ArticleDetail = lazy(() => import('./pages/ArticleDetail'))

const AIChat = lazy(() => import('./pages/AIChat'))
const ArticleManager = lazy(() => import('./pages/ArticleManager'))
const GameHub = lazy(() => import('./pages/GameHub'))

const Toolbox = lazy(() => import('./pages/Toolbox'))
const SpriteSheetToGif = lazy(() => import('./pages/tools/SpriteSheetToGif'))

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

            <Route path="/secret-chat" element={<AIChat />} />
            <Route path="/admin/articles" element={<ArticleManager />} />
            <Route path="/games" element={<GameHub />} />
            <Route path="/toolbox" element={<Toolbox />} />
            <Route path="/toolbox/sprite-sheet-to-gif" element={<SpriteSheetToGif />} />
          </Routes>
        </Suspense>
      </Layout>
    </Router>
  )
}

export default App
