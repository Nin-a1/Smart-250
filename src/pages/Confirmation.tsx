import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getIssueById } from '../lib/storage'
import IssueMap from '../components/IssueMap'
import { Issue } from '../types'

const SEV_CLS: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-orange-100 text-orange-700',
  high: 'bg-red-100 text-red-700',
}
const SEV_BAR: Record<string, string> = {
  low: '#16a34a', medium: '#d97706', high: '#dc2626',
}

export default function Confirmation() {
  const navigate = useNavigate()
  const { issueId } = useParams()
  const [issue, setIssue] = useState<Issue | null>(null)

  useEffect(() => {
    if (issueId) getIssueById(issueId).then(setIssue)
  }, [issueId])

  if (!issue) return (
    <div className="max-w-[560px] mx-auto py-20 px-6 text-center">
      <p className="text-5xl mb-4">✅</p>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Report submitted!</h1>
      <p className="text-gray-500 mb-8">Your issue has been recorded and the institution alerted.</p>
      <button
        className="px-6 py-2.5 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition-colors"
        onClick={() => navigate('/dashboard')}
      >
        View Dashboard →
      </button>
    </div>
  )

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-6">
      <div className="max-w-[680px] mx-auto flex flex-col gap-6">

        {/* Success banner */}
        <div className="bg-white rounded-2xl p-10 text-center border border-green-100 shadow-[0_4px_20px_rgba(22,163,74,0.1)]">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <span className="text-2xl">✅</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2 tracking-tight">Report submitted!</h1>
          <p className="text-sm text-gray-500 mb-3 leading-[1.7]">
            Your issue has been recorded and the responsible institution has been alerted automatically.
          </p>
          <div className="inline-flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-2">
            <span className="text-xs text-gray-400">Reference:</span>
            <span className="text-xs font-mono font-bold text-brand-600">{issue.id}</span>
          </div>
        </div>

        {/* Issue detected */}
        <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <div className="h-0.5" style={{ background: SEV_BAR[issue.severity] }} />
          <div className="p-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Issue Detected by AI</p>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`text-xs font-semibold px-3 py-0.5 rounded-full capitalize ${SEV_CLS[issue.severity]}`}>
                {issue.severity} severity
              </span>
              <span className="text-xs font-semibold px-3 py-0.5 rounded-full bg-blue-100 text-blue-700 capitalize">
                {issue.issueType}
              </span>
            </div>
            <p className="font-bold text-gray-900 text-base mb-2">{issue.title}</p>
            <p className="text-sm text-gray-500 leading-[1.7] mb-3">{issue.description}</p>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">📍</span>
              <span className="text-xs text-gray-500">{issue.location}</span>
            </div>
          </div>
        </div>

        {/* AI routing */}
        <div className="bg-brand-50 rounded-xl p-6 border border-brand-100">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-lg">🤖</span>
            <p className="text-xs font-bold text-brand-700 uppercase tracking-widest">AI Routing Decision</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold text-brand-600">Institution alerted</p>
              <p className="font-bold text-sm text-gray-900">{issue.institution}</p>
              <p className="text-xs text-gray-500">{issue.institutionEmail}</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold text-brand-600">Alert email</p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${issue.emailSent ? 'bg-green-400' : 'bg-orange-400'}`} />
                <span className={`text-sm font-semibold ${issue.emailSent ? 'text-green-700' : 'text-orange-700'}`}>
                  {issue.emailSent ? 'Delivered ✓' : 'Pending'}
                </span>
              </div>
            </div>
          </div>
          {issue.institutionReason && (
            <div className="mt-5 pt-5 border-t border-brand-200">
              <p className="text-xs font-semibold text-brand-600 mb-2">Why this institution?</p>
              <p className="text-sm text-gray-700 leading-[1.7]">{issue.institutionReason}</p>
            </div>
          )}
        </div>

        {/* Map */}
        {issue.lat !== undefined && issue.lon !== undefined && (
          <div className="bg-white rounded-xl overflow-hidden border border-gray-100">
            <div className="px-5 pt-5 pb-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Reported Location</p>
            </div>
            <IssueMap issues={[issue]} height="220px" />
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            className="py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
            onClick={() => navigate('/report')}
          >
            Report another
          </button>
          <button
            className="py-2.5 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition-colors"
            onClick={() => navigate('/dashboard')}
          >
            View Dashboard →
          </button>
        </div>
      </div>
    </div>
  )
}
