import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import { getIssues, clearAllIssues } from '../lib/storage'
import IssueMap from '../components/IssueMap'
import { Issue, IssueStatus } from '../types'

const SEV_BAR: Record<string, string> = { low: '#16a34a', medium: '#d97706', high: '#dc2626' }
const SEV_CLS: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-orange-100 text-orange-700',
  high: 'bg-red-100 text-red-700',
}
const TYPE_CLS = 'bg-purple-100 text-purple-700'

function IssueCard({ issue }: { issue: Issue }) {
  const resolved = issue.status === 'resolved'
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] hover:border-gray-200 hover:-translate-y-0.5 transition-all duration-200 relative">
      <div className="h-[3px]" style={{ background: SEV_BAR[issue.severity] }} />
      {(issue.photoUrl || issue.photoBase64) && (
        <div className="h-40 overflow-hidden bg-gray-100">
          <img
            src={issue.photoUrl || issue.photoBase64} alt="issue"
            className="w-full h-full object-cover block"
          />
        </div>
      )}
      <div className="p-5 flex flex-col gap-3">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <span className="text-[10px] font-mono font-semibold text-gray-400 tracking-wider">{issue.id}</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${resolved ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
            {resolved ? '✓ Resolved' : '● Open'}
          </span>
        </div>
        <p className="font-bold text-sm text-gray-900 leading-snug">{issue.title}</p>
        <p className="text-xs text-gray-500 leading-[1.6]" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {issue.description}
        </p>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">📍</span>
            <span className="text-xs text-gray-500 truncate">{issue.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">🏛️</span>
            <span className="text-xs text-gray-500 truncate">{issue.institution}</span>
          </div>
        </div>
        <div className="flex justify-between items-center pt-1 border-t border-gray-50">
          <div className="flex gap-1.5">
            <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full capitalize ${SEV_CLS[issue.severity]}`}>{issue.severity}</span>
            <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full capitalize ${TYPE_CLS}`}>{issue.issueType}</span>
          </div>
          <span className="text-[10px] text-gray-400">
            {new Date(issue.createdAt).toLocaleDateString('en-RW', { day: 'numeric', month: 'short' })}
          </span>
        </div>
        {resolved && issue.resolutionConfidence && (
          <div className="bg-green-50 rounded-lg px-3 py-2">
            <p className="text-xs text-green-700 font-semibold">🤖 AI confidence: {issue.resolutionConfidence}%</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [issues, setIssues] = useState<Issue[]>([])
  const [filter, setFilter] = useState<IssueStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
  const [clearing, setClearing] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => {
    if (isFirebaseConfigured) {
      const q = query(collection(db, 'issues'), orderBy('createdAt', 'desc'))
      return onSnapshot(q, snap => setIssues(snap.docs.map(d => d.data() as Issue)))
    } else {
      getIssues().then(setIssues)
      const t = setInterval(() => getIssues().then(setIssues), 5000)
      return () => clearInterval(t)
    }
  }, [])

  const open     = issues.filter(i => i.status !== 'resolved').length
  const resolved = issues.filter(i => i.status === 'resolved').length

  const visible = issues
    .filter(i => filter === 'all' || i.status === filter)
    .filter(i => {
      if (!search) return true
      const q = search.toLowerCase()
      return i.title.toLowerCase().includes(q) || i.location.toLowerCase().includes(q) || i.issueType.toLowerCase().includes(q)
    })

  const filterBtns: { key: IssueStatus | 'all'; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'resolved', label: 'Resolved' },
  ]

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1200px] mx-auto py-10 px-6 flex flex-col gap-8">

        {/* Header */}
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Live Issue Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">All reported civic issues in Kigali · updates in real-time</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className={`px-4 py-2 text-sm border rounded-lg transition-colors ${
                confirmClear
                  ? 'border-red-400 text-red-600 bg-red-50'
                  : 'border-gray-200 text-gray-500 bg-white hover:border-red-300 hover:text-red-600 hover:bg-red-50'
              }`}
              disabled={clearing}
              onClick={async () => {
                if (!confirmClear) { setConfirmClear(true); setTimeout(() => setConfirmClear(false), 4000); return }
                setClearing(true); setConfirmClear(false)
                try { await clearAllIssues(); setIssues([]) } finally { setClearing(false) }
              }}
            >
              {clearing ? 'Clearing…' : confirmClear ? '⚠️ Confirm clear' : '🗑 Clear all'}
            </button>
            <button
              className="px-4 py-2 bg-brand-600 text-white text-sm font-bold rounded-lg hover:bg-brand-700 transition-colors"
              onClick={() => navigate('/report')}
            >
              + Report Issue
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Issues', value: issues.length, cls: 'text-gray-900', bg: 'bg-white' },
            { label: 'Open',         value: open,          cls: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Resolved',     value: resolved,      cls: 'text-green-600',  bg: 'bg-green-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-5 text-center border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.04)]`}>
              <p className={`text-3xl font-extrabold tracking-tight ${s.cls}`}>{s.value}</p>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {filterBtns.map(f => (
            <button
              key={f.key}
              className={`px-4 py-1.5 text-sm border rounded-full transition-colors font-medium ${
                filter === f.key
                  ? 'bg-brand-600 text-white border-brand-600 font-bold'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-brand-400 hover:text-brand-600'
              }`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
          <input
            placeholder="Search issues…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-[240px] px-4 py-1.5 text-sm border border-gray-200 rounded-full bg-white outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-colors"
          />
          {/* View toggle */}
          <div className="ml-auto flex items-center gap-0.5 bg-gray-200 rounded-full p-[3px]">
            {(['grid', 'map'] as const).map(v => (
              <button
                key={v}
                className={`px-3 h-[26px] text-xs rounded-full transition-all font-medium ${
                  viewMode === v
                    ? 'bg-white text-gray-800 shadow-sm font-semibold'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setViewMode(v)}
              >
                {v === 'grid' ? '▦ Grid' : '🗺 Map'}
              </button>
            ))}
          </div>
        </div>

        {/* Map */}
        {viewMode === 'map' && <IssueMap issues={visible} height="500px" />}

        {/* Grid */}
        {viewMode === 'grid' && (
          visible.length === 0 ? (
            <div className="bg-white rounded-2xl p-20 text-center border border-gray-100">
              <p className="text-4xl mb-4">📭</p>
              <p className="font-bold text-gray-700 text-lg mb-1">No issues found</p>
              <p className="text-gray-400 text-sm mb-6">
                {issues.length === 0 ? 'Be the first to report an issue in Kigali.' : 'Try a different filter or search term.'}
              </p>
              {issues.length === 0 && (
                <button
                  className="px-6 py-2.5 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition-colors"
                  onClick={() => navigate('/report')}
                >
                  Report the first issue →
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visible.map(issue => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
