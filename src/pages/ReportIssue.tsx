import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toaster } from '../lib/toaster'
import { analyzeIssue, generateEmailBody } from '../lib/gemini'
import { sendEmail, sendReporterConfirmation } from '../lib/email'
import { saveIssue, generateId } from '../lib/storage'
import { reverseGeocode } from '../lib/geocoding'
import { extractGpsFromFile } from '../lib/exif'
import { Issue } from '../types'

const STEPS = [
  '',
  'Uploading photo…',
  'AI analyzing the image…',
  'Routing to responsible institution…',
  'Sending alert email…',
  'Saving report…',
]

export default function ReportIssue() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({ name: '', phone: '', email: '', location: '' })
  const [gps, setGps] = useState<{ lat: number; lon: number } | null>(null)
  const [gpsSource, setGpsSource] = useState<'exif' | 'manual' | null>(null)
  const [photo, setPhoto] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(0)

  const set = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    extractGpsFromFile(file).then(async coords => {
      if (coords) {
        setGps(coords)
        setGpsSource('exif')
        setForm(f => ({ ...f, location: `${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)}` }))
        toaster.create({ title: '📍 Location read from photo', type: 'success' })
        try {
          const geo = await reverseGeocode(coords.lat, coords.lon)
          if (geo) setForm(f => ({ ...f, location: geo.address }))
        } catch { /* non-fatal */ }
      }
    })

    const reader = new FileReader()
    reader.onloadend = () => {
      const img = new Image()
      img.onload = () => {
        const MAX = 1024
        const scale = Math.min(1, MAX / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        setPhoto(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  const getGPS = () => {
    navigator.geolocation?.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lon } = pos.coords
        setGps({ lat, lon })
        setGpsSource('manual')
        setForm(f => ({ ...f, location: `${lat.toFixed(5)}, ${lon.toFixed(5)}` }))
        toaster.create({ title: '📍 Location captured', type: 'success' })
        try {
          const geo = await reverseGeocode(lat, lon)
          if (geo) setForm(f => ({ ...f, location: geo.address }))
        } catch { /* non-fatal */ }
      },
      () => toaster.create({ title: 'GPS unavailable', type: 'error' }),
    )
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim())     e.name = 'Your name is required'
    if (!form.phone.trim())    e.phone = 'Phone number is required'
    if (!form.location.trim()) e.location = 'Location is required'
    if (!photo)                e.photo = 'Please upload a photo'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      setStep(1)
      setStep(2)
      const analysis = await analyzeIssue(photo!, form.location)

      if (!analysis.isRealIssue) {
        toaster.create({
          title: 'Image not recognized as a civic issue',
          description: 'Please upload a clear photo of an actual urban problem (pothole, waste, flooding, broken streetlight, etc.).',
          type: 'error',
          duration: 8000,
        })
        return
      }

      const issue: Issue = {
        id: generateId(),
        reporterName: form.name,
        reporterPhone: form.phone,
        reporterEmail: form.email,
        location: form.location,
        photoBase64: photo!,
        ...analysis,
        status: 'open',
        emailSent: false,
        createdAt: new Date().toISOString(),
        ...(gps ?? {}),
      }
      setStep(3)
      setStep(4)
      try {
        const body = await generateEmailBody(issue)
        await sendEmail({
          toEmail: issue.institutionEmail, toName: issue.institution,
          issueId: issue.id, issueTitle: issue.title,
          location: issue.location, severity: issue.severity,
          reporterName: issue.reporterName, reporterPhone: issue.reporterPhone,
          body,
        })
        issue.emailSent = true
      } catch {
        toaster.create({ title: 'Email could not send', description: 'Issue saved anyway.', type: 'warning' })
      }
      setStep(5)
      await saveIssue(issue)
      if (issue.reporterEmail) {
        sendReporterConfirmation(
          issue.reporterEmail, issue.reporterName, issue.id,
          issue.title, issue.location, issue.severity,
          issue.institution, issue.reporterPhone,
        ).catch(err => console.warn('[email] reporter confirmation failed:', err))
      }
      navigate(`/confirmation/${issue.id}`)
    } catch (err) {
      console.error('[ReportIssue]', err)
      const msg =
        err instanceof Error
          ? err.name === 'AbortError'
            ? 'AI request timed out — check your connection and try again.'
            : err.message
          : 'Unknown error — please try again.'
      toaster.create({ title: 'Submission failed', description: msg, type: 'error', duration: 8000 })
    } finally {
      setLoading(false)
      setStep(0)
    }
  }

  const inputCls = (field: string) =>
    `w-full px-3 py-2 border rounded-lg text-sm bg-white transition-colors outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 ${
      errors[field] ? 'border-red-400' : 'border-gray-200'
    }`

  return (
    <div className="max-w-[620px] mx-auto py-10 px-6">
      <div className="flex flex-col gap-7">

        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">📸</span>
            <h1 className="text-2xl font-extrabold text-gray-800">Report an Issue</h1>
          </div>
          <p className="text-sm text-gray-500">AI identifies the problem and alerts the right institution automatically.</p>
        </div>

        {/* Photo */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Photo of the issue <span className="text-red-400">*</span>
          </label>
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              errors.photo ? 'border-red-300' : photo ? 'border-brand-400 bg-brand-50' : 'border-gray-200 bg-gray-50 hover:border-brand-400 hover:bg-brand-50'
            }`}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            {photo ? (
              <div className="flex flex-col items-center gap-3">
                <img src={photo} alt="preview" className="max-h-48 rounded-lg object-cover max-w-full" />
                <p className="text-sm text-brand-600 font-semibold">✓ Photo ready — tap to change</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <span className="text-4xl">📷</span>
                <p className="text-sm text-gray-500">Tap to upload or take a photo</p>
                <p className="text-xs text-gray-400">Location is read automatically from the photo</p>
              </div>
            )}
          </div>
          {errors.photo && <p className="text-xs text-red-500 mt-1">{errors.photo}</p>}
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Location <span className="text-red-400">*</span>
          </label>
          <div className="flex gap-2">
            <input
              className={inputCls('location')}
              placeholder="e.g. KN 5 Rd, near Convention Centre"
              value={form.location}
              onChange={set('location')}
            />
            <button
              onClick={getGPS}
              className="flex-shrink-0 px-4 py-2 border border-brand-400 text-brand-600 text-sm font-medium rounded-lg hover:bg-brand-50 transition-colors"
            >
              📍 GPS
            </button>
          </div>
          {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
          {gps && (
            <p className="text-xs text-brand-600 mt-1">
              {gpsSource === 'exif'
                ? '✓ Exact location extracted from photo metadata'
                : '✓ GPS coords saved · map pin will appear on dashboard'}
            </p>
          )}
        </div>

        {/* Name + Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your name <span className="text-red-400">*</span>
            </label>
            <input className={inputCls('name')} placeholder="Full name" value={form.name} onChange={set('name')} />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone <span className="text-red-400">*</span>
            </label>
            <input className={inputCls('phone')} placeholder="+250 7XX XXX XXX" value={form.phone} onChange={set('phone')} />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Email <span className="text-gray-400 font-normal">(optional — get notified when resolved)</span>
          </label>
          <input
            type="email"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
            placeholder="your@email.com"
            value={form.email}
            onChange={set('email')}
          />
        </div>

        {/* Progress */}
        {loading && (
          <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-brand-700">{STEPS[step]}</p>
                <p className="text-xs text-brand-500">Step {step} of {STEPS.length - 1}</p>
              </div>
            </div>
          </div>
        )}

        <button
          className="h-14 w-full bg-brand-600 text-white font-extrabold text-base rounded-lg hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing…
            </>
          ) : 'Submit Report →'}
        </button>

        <p className="text-xs text-gray-400 text-center">
          Groq AI identifies the issue and contacts the responsible Kigali institution.
        </p>
      </div>
    </div>
  )
}
