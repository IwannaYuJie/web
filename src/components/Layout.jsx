import Navbar from './Navbar'
import Footer from './Footer'
import Ticker from './Ticker'
import './Layout.css'

export default function Layout({ children }) {
  return (
    <div className="app-layout app js">
      <Ticker />
      <Navbar />
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  )
}
