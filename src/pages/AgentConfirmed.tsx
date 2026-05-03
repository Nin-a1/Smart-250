import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getIssueById } from '../lib/storage'
import { Issue } from '../types'

const SEV_CLS: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-orange-100 text-orange-700',
  high: 'bg-red-100 text-red-700',
}
const SEV_BAR: Record<string, string> = {
  low: '#16a34a', medium: '#d97706', high: '#dc2626',
}

export default function AgentConfirmed() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [issue, setIssue] = useState<Issue | null>(null)

  useEffect(() => {
    if (id) getIssueById(id).then(setIssue)
  }, [id])

  if (!issue) return (
    <div className="text-center py-20">
      <p className="text-gray-400">Loading…</p>
    </div>
  )

  const resolvedDate = issue.resolvedAt
    ? new Date(issue.resolvedAt).toLocaleDateString('en-RW', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : null

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-6">
      <div className="max-w-[720px] mx-auto flex flex-col gap-6">

        {/* Success banner */}
        <div className="bg-white rounded-2xl p-10 text-center border border-green-100 shadow-[0_4px_20px_rgba(22,163,74,0.1)]">
          <div className="w-[72px] h-[72px] bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <span className="text-3xl">✅</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2 tracking-tight">Issue Successfully Resolved!</h1>
          <p className="text-sm text-gray-500 mb-3 leading-[1.7]">
            AI has verified the fix. The dashboard and reporter have been updated.
          </p>
          {resolvedDate && (
            <div className="inline-flex bg-green-50 rounded-lg px-4 py-2">
              <p className="text-xs text-green-700 font-semibold">Resolved on {resolvedDate}</p>
            </div>
          )}
        </div>

        {/* Issue summary */}
        <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <div className="h-[3px]" style={{ background: SEV_BAR[issue.severity] }} />
          <div className="p-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Issue Summary</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="text-[10px] font-mono font-semibold text-gray-400">{issue.id}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${SEV_CLS[issue.severity]}`}>{issue.severity}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 capitalize">{issue.issueType}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">✓ Resolved</span>
            </div>
            <p className="font-bold text-base text-gray-900 mb-2">{issue.title}</p>
            <p className="text-sm text-gray-500 leading-[1.7] mb-3">{issue.description}</p>
            <div className="flex flex-col gap-1">
              <p className="text-xs text-gray-500">📍 {issue.location}</p>
              <p className="text-xs text-gray-500">👤 {issue.reporterName} · {issue.reporterPhone}</p>
              <p className="text-xs text-gray-500">🏛️ {issue.institution}</p>
            </div>
          </div>
        </div>

        {/* Before / After */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Before & After</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Before — original report', dotColor: '#dc2626', bg: 'bg-red-50', border: 'border-red-100', src: issue.photoUrl || issue.photoBase64 },
              { label: 'After — fix submitted',    dotColor: '#16a34a', bg: 'bg-green-50', border: 'border-green-100', src: issue.resolutionPhotoUrl || issue.resolutionPhotoBase64 },
            ].map(p => (
              <div key={p.label}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.dotColor }} />
                  <p className="text-xs font-semibold text-gray-500">{p.label}</p>
                </div>
                <div className={`rounded-xl overflow-hidden border ${p.border} ${p.bg} h-[180px]`}>
                  {p.src ? (
                    <img src={p.src} alt={p.label} className="w-full h-full object-cover block" />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-sm text-gray-400">Uploading…</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI verdict */}
        {(issue.resolutionReasoning || issue.resolutionConfidence) && (
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <p className="font-bold text-sm text-gray-700">AI Verification</p>
              </div>
              {issue.resolutionConfidence && (
                <div className="bg-green-100 rounded-full px-4 py-1">
                  <p className="font-extrabold text-green-700 text-sm">{issue.resolutionConfidence}% confident</p>
                </div>
              )}
            </div>
            {issue.resolutionReasoning && (
              <p className="text-sm text-gray-600 leading-[1.7]">{issue.resolutionReasoning}</p>
            )}
          </div>
        )}

        {/* Reporter */}
        <div className={`rounded-xl p-5 border ${issue.reporterEmail ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
          <div className="flex gap-3 items-start">
            <span className="text-xl">{issue.reporterEmail ? '📧' : '📞'}</span>
            <div>
              <p className={`font-semibold text-sm ${issue.reporterEmail ? 'text-blue-700' : 'text-gray-700'}`}>
                {issue.reporterEmail ? `Reporter notified — ${issue.reporterEmail}` : 'No email provided'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {issue.reporterEmail ? 'Resolution confirmation email sent.' : `Contact by phone: ${issue.reporterPhone}`}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            className="py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
            onClick={() => navigate('/agent/dashboard')}
          >
            ← Back to Dashboard
          </button>
          <button
            className="py-2.5 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition-colors"
            onClick={() => navigate('/dashboard')}
          >
            Live Dashboard →
          </button>
        </div>
      </div>
    </div>
  )
}
