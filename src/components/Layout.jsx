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
      <Navbar />
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  )
}
