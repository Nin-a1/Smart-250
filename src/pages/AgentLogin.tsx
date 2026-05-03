import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toaster } from '../lib/toaster'

const INSTITUTIONS = [
  { name: 'Rwanda Transport Development Agency', code: 'RTDA',      passcode: 'rtda2026'  },
  { name: 'City of Kigali — Sanitation',         code: 'COK_SAN',   passcode: 'san2026'   },
  { name: 'Rwanda Energy Group (REG / EUCL)',     code: 'REG',       passcode: 'reg2026'   },
  { name: 'Water and Sanitation Corp (WASAC)',    code: 'WASAC',     passcode: 'wasac2026' },
  { name: 'City of Kigali — Urban Planning',      code: 'COK_URBAN', passcode: 'urban2026' },
]

export default function AgentLogin() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<typeof INSTITUTIONS[0] | null>(null)
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')

  const login = () => {
    if (!selected)                      { setError('Select your institution first'); return }
    if (passcode !== selected.passcode) { setError('Incorrect passcode');            return }
    localStorage.setItem('ska_agent', JSON.stringify({
      institution: selected.name,
      code:        selected.code,
      loggedInAt:  new Date().toISOString(),
    }))
    toaster.create({ title: `Welcome, ${selected.name.split(' ')[0]} team`, type: 'success' })
    navigate('/agent/dashboard')
  }

  return (
    <div className="bg-gray-50 min-h-screen py-16 px-6">
      <div className="max-w-[480px] mx-auto flex flex-col gap-8">

        {/* Header */}
        <div className="text-center flex flex-col items-center gap-3">
          <div className="w-14 h-14 bg-brand-600 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🏛️</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Agent Portal</h1>
          <p className="text-sm text-gray-500 leading-[1.7]">
            Log in to manage and resolve issues assigned to your institution.
          </p>
        </div>

        {/* Institution picker */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <p className="font-bold text-sm text-gray-700 mb-3">Select your institution</p>
          <div className="flex flex-col gap-2">
            {INSTITUTIONS.map(inst => (
              <div
                key={inst.code}
                className={`px-4 py-3 rounded-lg border-[1.5px] cursor-pointer transition-all ${
                  selected?.code === inst.code
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-100 bg-gray-50 hover:border-brand-300 hover:bg-brand-50'
                }`}
                onClick={() => { setSelected(inst); setError('') }}
              >
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${selected?.code === inst.code ? 'font-bold text-brand-700' : 'font-medium text-gray-700'}`}>
                    {inst.name}
                  </span>
                  {selected?.code === inst.code && (
                    <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Passcode */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <p className="font-bold text-sm text-gray-700 mb-3">Passcode</p>
          <input
            type="password"
            placeholder="Enter your institution passcode"
            value={passcode}
            onChange={e => { setPasscode(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && login()}
            className={`w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-colors ${
              error ? 'border-red-300' : 'border-gray-200'
            }`}
          />
          {error && <p className="text-xs text-red-500 mt-2 font-medium">{error}</p>}

          {/* Demo hints */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Demo passcodes</p>
            <div className="flex flex-col gap-1.5">
              {INSTITUTIONS.map(inst => (
                <div key={inst.code} className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 flex-1 truncate mr-2">
                    {inst.name.split('—')[0].split('(')[0].trim()}
                  </span>
                  <button
                    className="text-xs font-mono font-bold text-brand-600 hover:text-brand-800 flex-shrink-0 transition-colors"
                    onClick={() => { setSelected(inst); setPasscode(inst.passcode); setError('') }}
                  >
                    {inst.passcode}
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-2">Click any passcode to auto-fill</p>
          </div>
        </div>

        <button
          className="h-[52px] w-full bg-brand-600 text-white font-extrabold rounded-xl hover:bg-brand-700 hover:-translate-y-px hover:shadow-lg transition-all"
          onClick={login}
        >
          Log in to Agent Portal →
        </button>
      </div>
    </div>
  )
}
