import { Link, useLocation, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isActive = (to: string) => pathname === to || (to !== '/' && pathname.startsWith(to))

  return (
    <nav className="bg-white border-b border-gray-100 px-6 py-3 sticky top-0 z-50 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="max-w-[1200px] mx-auto flex items-center">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <span className="bg-brand-600 text-white rounded-[8px] px-2 py-1 text-[11px] font-extrabold tracking-wide">
            SKA
          </span>
          <span className="text-sm font-bold text-gray-900 tracking-tight">
            Smart Kigali Alert
          </span>
        </Link>

        <div className="flex items-center gap-1 ml-auto">
          <button
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/dashboard')
                ? 'text-brand-600 bg-brand-50 font-semibold'
                : 'text-gray-600 hover:text-brand-600 hover:bg-brand-50'
            }`}
            onClick={() => navigate('/dashboard')}
          >
            Live Dashboard
          </button>
          <button
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/agent')
                ? 'text-brand-600 bg-brand-50 font-semibold'
                : 'text-gray-600 hover:text-brand-600 hover:bg-brand-50'
            }`}
            onClick={() => navigate('/agent/login')}
          >
            Agent Portal
          </button>
          <button
            className="ml-1 px-5 py-1.5 bg-brand-600 text-white text-sm font-bold rounded-full hover:bg-brand-700 transition-all hover:-translate-y-px"
            onClick={() => navigate('/report')}
          >
            Report Issue
          </button>
        </div>
      </div>
    </nav>
  )
}
