import { useState } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Page0 from './pages/F1'
import Page1 from './pages/F2'
import Page2 from './pages/F3'
import Page3 from './pages/F4'
import Page4 from './pages/F6'
import Page5 from './pages/F7'
import Page6 from './pages/F7'

export default function App() {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-900/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-bold text-white">Pharma PIL PoC</span>
          <button
            onClick={() => setNavOpen(!navOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-white"
          >
            {navOpen ? '✕' : '☰'}
          </button>
          <div className="hidden md:flex items-center gap-1">
          <Link to="/" className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-white/10 transition-colors text-zinc-300 hover:text-white">Authentication & Authoriz…</Link>
          <Link to="/f2" className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-white/10 transition-colors text-zinc-300 hover:text-white">Document Upload & Classif…</Link>
          <Link to="/f3" className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-white/10 transition-colors text-zinc-300 hover:text-white">Market Configuration & Do…</Link>
          <Link to="/f4" className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-white/10 transition-colors text-zinc-300 hover:text-white">Document Extraction Pipel…</Link>
          <Link to="/f6" className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-white/10 transition-colors text-zinc-300 hover:text-white">PIL Draft Creation - New …</Link>
          <Link to="/f7" className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-white/10 transition-colors text-zinc-300 hover:text-white">PIL Variation Workflow</Link>
          <Link to="/f7" className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-white/10 transition-colors text-zinc-300 hover:text-white">PIL Variation Workflow</Link>
          </div>
        </div>
        {navOpen && (
          <div className="md:hidden px-4 pb-3 flex flex-col gap-1">
          <Link to="/" className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-white/10 transition-colors text-zinc-300 hover:text-white">Authentication & Authoriz…</Link>
          <Link to="/f2" className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-white/10 transition-colors text-zinc-300 hover:text-white">Document Upload & Classif…</Link>
          <Link to="/f3" className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-white/10 transition-colors text-zinc-300 hover:text-white">Market Configuration & Do…</Link>
          <Link to="/f4" className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-white/10 transition-colors text-zinc-300 hover:text-white">Document Extraction Pipel…</Link>
          <Link to="/f6" className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-white/10 transition-colors text-zinc-300 hover:text-white">PIL Draft Creation - New …</Link>
          <Link to="/f7" className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-white/10 transition-colors text-zinc-300 hover:text-white">PIL Variation Workflow</Link>
          <Link to="/f7" className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-white/10 transition-colors text-zinc-300 hover:text-white">PIL Variation Workflow</Link>
          </div>
        )}
      </nav>

      {/* Pages */}
      <main>
        <Routes>
        <Route path="/" element={<Page0 />} />
        <Route path="/f2" element={<Page1 />} />
        <Route path="/f3" element={<Page2 />} />
        <Route path="/f4" element={<Page3 />} />
        <Route path="/f6" element={<Page4 />} />
        <Route path="/f7" element={<Page5 />} />
        <Route path="/f7" element={<Page6 />} />
        </Routes>
      </main>
    </div>
  )
}
