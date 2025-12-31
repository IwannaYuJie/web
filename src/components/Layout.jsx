// React 17+ JSX 自动导入
import Navbar from './Navbar'
import Footer from './Footer'
import { useLocation } from 'react-router-dom'
import './Layout.css'

export default function Layout({ children }) {
  const location = useLocation()
  // Hide header/footer for specific "secret" pages
  const hideNavAndFooter = location.pathname === '/secret-games' || location.pathname === '/secret-seedream'

  return (
    <div className="app-layout">
      {!hideNavAndFooter && <Navbar />}
      <main className="main-content">
        {children}
      </main>
      {!hideNavAndFooter && <Footer />}
    </div>
  )
}
