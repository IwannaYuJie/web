// React 17+ JSX 自动导入
import Navbar from './Navbar'
import Footer from './Footer'
import './Layout.css'

/**
 * 全局布局组件
 * 包含顶部导航栏和底部页脚
 */
export default function Layout({ children }) {
  return (
    <div className="app-layout">
      {/* 装饰性背景环境光斑 (Ambient Blobs) */}
      <div className="ambient-blob ambient-blob-1" aria-hidden="true" />
      <div className="ambient-blob ambient-blob-2" aria-hidden="true" />
      <div className="ambient-blob ambient-blob-3" aria-hidden="true" />

      <Navbar />
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  )
}
