import { useNavigate } from 'react-router-dom'

const steps = [
  { icon: '📸', n: '01', title: 'Snap & Report', desc: 'Upload a photo of any urban issue. No account needed — just your name and phone.' },
  { icon: '🤖', n: '02', title: 'AI Analyzes', desc: 'Groq AI identifies the problem type, severity, and the right institution to contact.' },
  { icon: '📧', n: '03', title: 'Auto-Alert', desc: 'A formal report email is sent instantly to the responsible Kigali authority.' },
  { icon: '✅', n: '04', title: 'Verified Fix', desc: 'City agents upload proof. AI compares before & after photos to confirm resolution.' },
]

const stats = [
  { value: 'AI-Powered', label: 'Issue detection & routing' },
  { value: 'Real-time', label: 'Institution alerts' },
  { value: '300 m GPS', label: 'On-site verification' },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="bg-gray-50">

      {/* Hero */}
      <div
        className="relative overflow-hidden py-20 md:py-32 px-6"
        style={{ background: 'linear-gradient(135deg, #073B2F 0%, #0F6E56 55%, #2EA682 100%)' }}
      >
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -top-36 -right-36 w-[420px] h-[420px] rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -top-[70px] -right-[70px] w-[280px] h-[280px] rounded-full border border-white/15" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-[350px] h-[350px] rounded-full border border-white/10" />

        <div className="relative max-w-[680px] mx-auto text-center flex flex-col items-center gap-7">
          <div className="inline-flex bg-white/20 rounded-full px-5 py-1.5">
            <span className="text-xs font-bold text-brand-100 tracking-widest">
              🇷🇼&nbsp; CIVIC TECH · KIGALI, RWANDA
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-[1.1] tracking-tight">
            See a problem in Kigali?{' '}
            <span className="text-brand-200">Report it in 30 seconds.</span>
          </h1>

          <p className="text-base md:text-lg text-brand-100 max-w-[500px] leading-[1.75]">
            AI identifies the issue, alerts the right authority, and follows up every Friday
            until it's fixed — all automatically.
          </p>

          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <button
              className="px-8 py-3 bg-white text-brand-700 text-base font-extrabold rounded-full shadow-lg hover:bg-brand-50 hover:-translate-y-0.5 hover:shadow-xl transition-all"
              onClick={() => navigate('/report')}
            >
              📸 Report an Issue
            </button>
            <button
              className="px-8 py-3 border border-white/40 text-white text-base font-semibold rounded-full hover:bg-white/10 hover:border-white transition-all"
              onClick={() => navigate('/dashboard')}
            >
              View Live Dashboard →
            </button>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="bg-brand-700 py-5 px-6">
        <div className="max-w-[800px] mx-auto flex flex-wrap justify-center gap-8 md:gap-24">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <p className="text-base font-extrabold text-white">{s.value}</p>
              <p className="text-xs text-brand-200 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="py-24 px-6 bg-white">
        <div className="max-w-[1100px] mx-auto flex flex-col gap-16">
          <div className="text-center flex flex-col gap-3">
            <p className="text-xs font-bold text-brand-600 tracking-[0.1em] uppercase">How it works</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
              From photo to resolution — fully automated
            </h2>
            <p className="text-gray-500 text-base max-w-[480px] mx-auto leading-[1.7]">
              Four steps, zero manual routing. The right institution is alerted within seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map(s => (
              <div
                key={s.title}
                className="bg-white p-7 rounded-xl h-full border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(15,110,86,0.1)] hover:border-brand-200 hover:-translate-y-1 transition-all duration-200"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-start w-full">
                    <span className="text-2xl">{s.icon}</span>
                    <span className="text-xs font-extrabold text-gray-200 font-mono">{s.n}</span>
                  </div>
                  <div>
                    <p className="font-bold text-base text-gray-900 mb-2">{s.title}</p>
                    <p className="text-sm text-gray-500 leading-[1.75]">{s.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Entry points */}
      <div className="py-24 px-6 bg-gray-50">
        <div className="max-w-[820px] mx-auto flex flex-col gap-10">
          <div className="text-center flex flex-col gap-2">
            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">Who are you?</h2>
            <p className="text-gray-500">Choose your entry point.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Citizen */}
            <div
              className="bg-white p-8 rounded-2xl border-[1.5px] border-brand-200 shadow-[0_2px_12px_rgba(15,110,86,0.08)] hover:shadow-[0_8px_28px_rgba(15,110,86,0.15)] hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col gap-5"
              onClick={() => navigate('/report')}
            >
              <div className="bg-brand-50 p-3 rounded-xl w-fit">
                <span className="text-2xl">👤</span>
              </div>
              <div>
                <p className="font-extrabold text-lg text-gray-900 mb-1">I spotted an issue</p>
                <p className="text-sm text-gray-500 leading-[1.75]">
                  Upload a photo, share your location. AI handles identification, routing and follow-up.
                </p>
              </div>
              <button className="w-full py-2.5 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition-colors">
                Report an Issue →
              </button>
            </div>

            {/* Agent */}
            <div
              className="bg-white p-8 rounded-2xl border-[1.5px] border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] hover:border-gray-300 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col gap-5"
              onClick={() => navigate('/agent/login')}
            >
              <div className="bg-gray-100 p-3 rounded-xl w-fit">
                <span className="text-2xl">🏛️</span>
              </div>
              <div>
                <p className="font-extrabold text-lg text-gray-900 mb-1">I am a city agent</p>
                <p className="text-sm text-gray-500 leading-[1.75]">
                  Log in to your institution's portal, manage issues, and upload resolution proof.
                </p>
              </div>
              <button className="w-full py-2.5 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors">
                Agent Portal →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-brand-900 py-8 px-6 text-center">
        <p className="text-sm font-semibold text-brand-300 mb-1">Smart Kigali Alert</p>
        <p className="text-xs text-brand-700">Built for the SMART-250 Hackathon · Kigali, Rwanda · 2026</p>
      </div>
    </div>
  )
}
