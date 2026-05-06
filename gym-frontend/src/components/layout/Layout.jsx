import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout({ title, children }) {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header title={title} />
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }} className="fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}
