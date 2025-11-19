import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import ArticleDetail from './pages/ArticleDetail'
import ImageGenerator from './pages/ImageGenerator'
import AIChat from './pages/AIChat'
import ArticleManager from './pages/ArticleManager'
import GameHub from './pages/GameHub'
import SeedreamStudio from './pages/SeedreamStudio'

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/article/:id" element={<ArticleDetail />} />
          <Route path="/image-generator" element={<ImageGenerator />} />
          <Route path="/ai-chat" element={<AIChat />} />
          <Route path="/admin/articles" element={<ArticleManager />} />
          <Route path="/secret-games" element={<GameHub />} />
          <Route path="/secret-seedream" element={<SeedreamStudio />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App

