import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toaster } from '../lib/toaster'
import { getIssues, getOpenIssues } from '../lib/storage'
import { generateFridayReminder } from '../lib/gemini'
import { sendEmail } from '../lib/email'
import { Issue } from '../types'

const SEV_BAR: Record<string, string>   = { low: '#16a34a', medium: '#d97706', high: '#dc2626' }
const SEV_CLS: Record<string, string>   = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-orange-100 text-orange-700',
  high: 'bg-red-100 text-red-700',
}

export default function AgentDashboard() {
  const navigate = useNavigate()
  const [agent, setAgent] = useState<{ institution: string; code: string } | null>(null)
  const [issues, setIssues] = useState<Issue[]>([])
  const [fridayLoading, setFridayLoading] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('ska_agent')
    if (!saved) { navigate('/agent'); return }
    const a = JSON.parse(saved)
    setAgent(a)
    const keyword = a.institution.toLowerCase().split(' ')[0]
    getIssues().then(all => setIssues(all.filter(i => i.institution.toLowerCase().includes(keyword))))
  }, [])

  const logout = () => { localStorage.removeItem('ska_agent'); navigate('/agent') }

  const daysSince = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000)

  const simulateFriday = async () => {
    if (!agent) return
    const keyword = agent.institution.toLowerCase().split(' ')[0]
    const open = (await getOpenIssues()).filter(i => i.institution.toLowerCase().includes(keyword))
    if (open.length === 0) { toaster.create({ title: 'No open issues to remind about', type: 'info' }); return }
    setFridayLoading(true)
    try {
      const body = await generateFridayReminder(agent.institution, open)
      await sendEmail({
        toEmail: 'admin@kigalicity.gov.rw', toName: agent.institution,
        issueId: 'FRIDAY-REMINDER',
        issueTitle: `Friday Reminder — ${open.length} open issue(s)`,
        location: 'Kigali, Rwanda', severity: 'medium',
        reporterName: 'Smart Kigali Alert System', reporterPhone: '', body,
      })
      toaster.create({ title: `📅 Friday reminder sent for ${open.length} issue(s)`, type: 'success' })
    } catch {
      toaster.create({ title: 'Could not send reminder', type: 'error' })
    } finally {
      setFridayLoading(false)
    }
  }

  const open     = issues.filter(i => i.status !== 'resolved')
  const resolved = issues.filter(i => i.status === 'resolved')

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1100px] mx-auto py-10 px-6 flex flex-col gap-8">

        {/* Header */}
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-brand-600 text-white rounded-lg px-2 py-1 text-xs font-extrabold">AGENT</span>
              <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">{agent?.institution}</h1>
            </div>
            <p className="text-sm text-gray-500">Agent dashboard · manage your institution's issues</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-2 px-3 py-1.5 text-sm border border-orange-200 text-orange-600 bg-white rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-60"
              onClick={simulateFriday}
              disabled={fridayLoading}
            >
              {fridayLoading ? (
                <>
                  <div className="w-3 h-3 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                  Sending…
                </>
              ) : '📅 Friday Reminder'}
            </button>
            <button
              className="px-3 py-1.5 text-sm text-gray-500 rounded-lg hover:text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={logout}
            >
              Log out
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Assigned', value: issues.length, cls: 'text-gray-900',   bg: 'bg-white' },
            { label: 'Open',           value: open.length,   cls: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Resolved',       value: resolved.length, cls: 'text-green-600', bg: 'bg-green-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-5 text-center border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.04)]`}>
              <p className={`text-3xl font-extrabold tracking-tight ${s.cls}`}>{s.value}</p>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Open issues */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="font-bold text-lg text-gray-900">Open Issues</p>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-orange-100 text-orange-700">{open.length} pending</span>
          </div>

          {open.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-12 text-center">
              <p className="text-3xl mb-3">🎉</p>
              <p className="font-bold text-green-700 text-lg">All issues resolved!</p>
              <p className="text-sm text-green-600 mt-1">No pending issues for your institution.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {open.map(issue => (
                <div
                  key={issue.id}
                  className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:border-gray-200 transition-all duration-150"
                >
                  <div className="h-[3px]" style={{ background: SEV_BAR[issue.severity] }} />
                  <div className="p-5">
                    <div className="flex justify-between items-start flex-wrap gap-3">
                      <div className="flex gap-4 flex-1 items-start">
                        {(issue.photoUrl || issue.photoBase64) && (
                          <div className="flex-shrink-0 rounded-lg overflow-hidden w-20 h-16">
                            <img
                              src={issue.photoUrl || issue.photoBase64} alt="issue"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                          <div className="flex flex-wrap gap-1.5 items-center">
                            <span className="text-[10px] font-mono font-semibold text-gray-400">{issue.id}</span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${SEV_CLS[issue.severity]}`}>{issue.severity}</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">{daysSince(issue.createdAt)}d open</span>
                          </div>
                          <p className="font-bold text-sm text-gray-900">{issue.title}</p>
                          <p className="text-xs text-gray-500">📍 {issue.location}</p>
                          <p className="text-xs text-gray-400" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {issue.description}
                          </p>
                        </div>
                      </div>
                      <button
                        className="px-4 py-2 bg-brand-600 text-white text-sm font-bold rounded-lg hover:bg-brand-700 transition-colors flex-shrink-0"
                        onClick={() => navigate(`/agent/resolve/${issue.id}`)}
                      >
                        Resolve →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resolved history */}
        {resolved.length > 0 && (
          <div>
            <p className="font-bold text-lg text-gray-900 mb-4">Resolved Issues</p>
            <div className="flex flex-col gap-3">
              {resolved.map(issue => (
                <div
                  key={issue.id}
                  className="bg-white rounded-xl p-5 border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
                >
                  <div className="flex justify-between items-center flex-wrap gap-3">
                    <div className="flex gap-3 flex-1 min-w-0 items-center">
                      {(issue.resolutionPhotoUrl || issue.photoUrl || issue.photoBase64) && (
                        <div className="flex-shrink-0 rounded-lg overflow-hidden w-14 h-11 opacity-70">
                          <img
                            src={issue.resolutionPhotoUrl || issue.photoUrl || issue.photoBase64} alt="resolved"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex flex-col gap-0 min-w-0">
                        <div className="flex gap-2 items-center">
                          <span className="text-[10px] font-mono text-gray-400">{issue.id}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">✓ Resolved</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-700">{issue.title}</p>
                        <p className="text-xs text-gray-400">📍 {issue.location}</p>
                      </div>
                    </div>
                    {issue.resolutionConfidence && (
                      <div className="text-right">
                        <p className="text-xs text-gray-400">AI confidence</p>
                        <p className="font-extrabold text-green-600 text-xl tracking-tight">{issue.resolutionConfidence}%</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
