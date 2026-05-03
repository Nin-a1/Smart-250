import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toaster } from '../lib/toaster'
import { verifyResolution } from '../lib/gemini'
import { sendReporterEmail } from '../lib/email'
import { getIssueById, updateIssue } from '../lib/storage'
import { extractGpsFromFile } from '../lib/exif'
import { Issue } from '../types'

const SEV_CLS: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-orange-100 text-orange-700',
  high: 'bg-red-100 text-red-700',
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

type GpsStatus = 'idle' | 'reading_exif' | 'capturing' | 'match' | 'mismatch' | 'no_original'
type GpsSource = 'exif' | 'manual' | null

export default function AgentResolve() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [issue, setIssue] = useState<Issue | null>(null)
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null)
  const [agentGps, setAgentGps] = useState<{ lat: number; lon: number } | null>(null)
  const [distanceM, setDistanceM] = useState<number | null>(null)
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle')
  const [gpsSource, setGpsSource] = useState<GpsSource>(null)
  const [loading, setLoading] = useState(false)
  const [stepMsg, setStepMsg] = useState('')
  const [verdict, setVerdict] = useState<{
    resolved: boolean; confidence: number; reasoning: string
  } | null>(null)

  useEffect(() => {
    if (id) {
      getIssueById(id).then(loaded => {
        setIssue(loaded)
        if (loaded && loaded.lat === undefined) setGpsStatus('no_original')
      })
    }
  }, [id])

  const compressImage = (dataUrl: string): Promise<string> =>
    new Promise(resolve => {
      const img = new Image()
      img.onload = () => {
        const MAX = 1024
        const scale = Math.min(1, MAX / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = dataUrl
    })

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !issue) return
    setGpsStatus('reading_exif')
    const [compressed, exifCoords] = await Promise.all([
      new Promise<string>(resolve => {
        const reader = new FileReader()
        reader.onloadend = () => compressImage(reader.result as string).then(resolve)
        reader.readAsDataURL(file)
      }),
      extractGpsFromFile(file),
    ])
    setAfterPhoto(compressed)
    if (issue.lat === undefined || issue.lon === undefined) {
      setGpsStatus('no_original')
      return
    }
    if (exifCoords) {
      const dist = haversineMeters(issue.lat, issue.lon, exifCoords.lat, exifCoords.lon)
      setAgentGps({ lat: exifCoords.lat, lon: exifCoords.lon })
      setDistanceM(Math.round(dist))
      setGpsSource('exif')
      setGpsStatus(dist <= 300 ? 'match' : 'mismatch')
      if (dist > 300) {
        toaster.create({
          title: '⚠️ Photo not taken at the scene',
          description: `This photo was taken ${Math.round(dist)}m from the reported site. You must be within 300m to resolve the issue.`,
          type: 'warning',
          duration: 6000,
        })
      } else {
        toaster.create({ title: '✅ Location verified from photo', type: 'success' })
      }
    } else {
      setGpsStatus('idle')
      toaster.create({
        title: 'No GPS data in photo',
        description: 'Please use the button below to capture your location manually.',
        type: 'warning',
      })
    }
  }

  const captureGps = () => {
    if (!navigator.geolocation) {
      toaster.create({ title: 'GPS not available on this device', type: 'error' })
      return
    }
    setGpsStatus('capturing')
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lon } = pos.coords
        setAgentGps({ lat, lon })
        setGpsSource('manual')
        if (issue?.lat !== undefined && issue?.lon !== undefined) {
          const dist = haversineMeters(issue.lat, issue.lon, lat, lon)
          setDistanceM(Math.round(dist))
          setGpsStatus(dist <= 300 ? 'match' : 'mismatch')
        } else {
          setGpsStatus('no_original')
        }
        toaster.create({ title: '📍 Your location captured', type: 'success' })
      },
      () => {
        setGpsStatus('idle')
        toaster.create({ title: 'Could not get GPS — check permissions', type: 'error' })
      },
    )
  }

  const locationOk = gpsStatus === 'match' || gpsStatus === 'no_original'
  const canVerify = !!afterPhoto && locationOk

  const handleVerify = async () => {
    if (!issue || !afterPhoto) {
      toaster.create({ title: 'Upload the after photo first', type: 'error' })
      return
    }
    setLoading(true)
    setVerdict(null)
    try {
      setStepMsg('AI comparing before and after photos…')
      const beforeSrc = issue.photoUrl || issue.photoBase64
      const result = await verifyResolution(beforeSrc, afterPhoto, issue.title)
      setVerdict(result)
      if (result.resolved) {
        setStepMsg('Updating issue status…')
        await updateIssue(issue.id, {
          status: 'resolved',
          resolvedAt: new Date().toISOString(),
          resolutionPhotoBase64: afterPhoto,
          resolutionReasoning: result.reasoning,
          resolutionConfidence: result.confidence,
          ...(agentGps ?? {}),
        })
        if (issue.reporterEmail) {
          setStepMsg('Notifying reporter by email…')
          try {
            await sendReporterEmail({
              toEmail: issue.reporterEmail,
              toName: issue.reporterName,
              issueId: issue.id,
              issueTitle: issue.title,
              location: issue.location,
              severity: issue.severity,
              reporterName: issue.reporterName,
              reporterPhone: issue.reporterPhone,
              body:
                `Dear ${issue.reporterName},\n\n` +
                `Great news! The issue you reported (${issue.id}: "${issue.title}") ` +
                `at ${issue.location} has been resolved by ${issue.institution}.\n\n` +
                `AI verification confidence: ${result.confidence}%\n` +
                `Verified: ${result.reasoning}\n\n` +
                `Thank you for contributing to a better Kigali.\n\n` +
                `— Smart Kigali Alert`,
            })
          } catch { /* non-fatal */ }
        }
        toaster.create({ title: '✅ Issue resolved and verified!', type: 'success' })
        setTimeout(() => navigate(`/agent/confirmed/${issue.id}`), 800)
      } else {
        toaster.create({
          title: 'AI could not confirm resolution',
          description: result.reasoning,
          type: 'warning',
        })
      }
    } catch (err) {
      console.error(err)
      toaster.create({ title: 'Verification failed', type: 'error' })
    } finally {
      setLoading(false)
      setStepMsg('')
    }
  }

  if (!issue) return (
    <div className="text-center py-20">
      <p className="text-gray-400">Issue not found</p>
      <button className="mt-4 px-4 py-2 text-brand-600 hover:underline" onClick={() => navigate('/agent/dashboard')}>
        Back to dashboard
      </button>
    </div>
  )

  return (
    <div className="max-w-[680px] mx-auto py-10 px-6">
      <div className="flex flex-col gap-7">

        <button
          className="self-start text-sm text-gray-500 hover:text-gray-700 transition-colors"
          onClick={() => navigate('/agent/dashboard')}
        >
          ← Back to dashboard
        </button>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🔧</span>
            <h1 className="text-xl font-extrabold text-gray-800">Resolve Issue</h1>
          </div>
          <p className="text-sm text-gray-500">
            Upload a photo taken at the fixed location. GPS is read from the photo automatically — you must be within 300m of the original site.
          </p>
        </div>

        {/* Original issue */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
          <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-4">Original Report</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <p className="font-bold text-sm text-gray-800">{issue.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{issue.description}</p>
              <p className="text-xs text-gray-500">📍 {issue.location}</p>
              <p className="text-xs text-gray-500">👤 {issue.reporterName} · {issue.reporterPhone}</p>
              <div className="flex gap-2 flex-wrap">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${SEV_CLS[issue.severity]}`}>{issue.severity}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 capitalize">{issue.issueType}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Before photo</p>
              <img src={issue.photoUrl || issue.photoBase64} alt="before"
                className="w-full rounded-lg object-cover" style={{ height: 130 }} />
            </div>
          </div>
        </div>

        {/* Step 1 — After photo */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center">
              <span className="text-xs text-white font-extrabold">1</span>
            </div>
            <p className="font-semibold text-sm text-gray-700">
              Upload proof-of-fix photo <span className="text-red-400">*</span>
            </p>
          </div>
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              afterPhoto ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50 hover:border-green-400 hover:bg-green-50'
            }`}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            {gpsStatus === 'reading_exif' ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-brand-600 font-semibold">Reading GPS from photo…</p>
              </div>
            ) : afterPhoto ? (
              <div className="flex flex-col items-center gap-3">
                <img src={afterPhoto} alt="after" className="max-h-48 rounded-lg object-cover max-w-full" />
                <p className="text-sm text-green-600 font-semibold">✓ After photo ready — tap to change</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <span className="text-4xl">📸</span>
                <p className="text-sm text-gray-500">Tap to upload the fixed photo</p>
                <p className="text-xs text-gray-400">GPS is read automatically from the image</p>
              </div>
            )}
          </div>
        </div>

        {/* Step 2 — Location */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
              gpsStatus === 'match' ? 'bg-green-500' : gpsStatus === 'mismatch' ? 'bg-red-500' : 'bg-brand-600'
            }`}>
              <span className="text-xs text-white font-extrabold">2</span>
            </div>
            <p className="font-semibold text-sm text-gray-700">Location verification</p>
          </div>

          {gpsStatus === 'no_original' && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-500">⚠️ The original report had no GPS coordinates — location check skipped.</p>
            </div>
          )}

          {(gpsStatus === 'idle' || gpsStatus === 'capturing') && afterPhoto && (
            <div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-3">
                <p className="text-sm text-yellow-800">
                  📷 No GPS found in the photo. Please capture your location manually to prove you are at the scene.
                </p>
              </div>
              <button
                onClick={captureGps}
                disabled={gpsStatus === 'capturing'}
                className="w-full h-[52px] border border-brand-400 text-brand-700 font-semibold rounded-xl hover:bg-brand-50 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                {gpsStatus === 'capturing' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                    Getting your location…
                  </>
                ) : '📍 Capture My Location Manually'}
              </button>
            </div>
          )}

          {(gpsStatus === 'match' || gpsStatus === 'mismatch') && (
            <div className={`border rounded-xl p-4 ${gpsStatus === 'match' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex gap-3 items-start">
                <span className="text-2xl">{gpsStatus === 'match' ? '✅' : '🚫'}</span>
                <div>
                  <p className={`font-bold text-sm ${gpsStatus === 'match' ? 'text-green-700' : 'text-red-700'}`}>
                    {gpsStatus === 'match'
                      ? `Location confirmed — ${distanceM}m from the reported site`
                      : `Too far — ${distanceM}m from the reported site (max 300m)`}
                  </p>
                  <p className={`text-xs mt-0.5 ${gpsStatus === 'match' ? 'text-green-600' : 'text-red-600'}`}>
                    {gpsSource === 'exif' ? 'GPS read from photo metadata' : 'GPS captured manually'}
                    {gpsStatus === 'mismatch' && ' · You must be at the scene to resolve this issue'}
                  </p>
                </div>
              </div>
              {gpsStatus === 'mismatch' && (
                <button
                  className="mt-3 text-sm text-red-600 hover:underline"
                  onClick={() => { setGpsStatus('idle'); setAgentGps(null); setDistanceM(null); setAfterPhoto(null); setGpsSource(null) }}
                >
                  Upload a different photo
                </button>
              )}
            </div>
          )}
        </div>

        {/* AI verdict */}
        {verdict && (
          <div className={`border rounded-xl p-6 ${verdict.resolved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex gap-3 items-start mb-3">
              <span className="text-2xl">{verdict.resolved ? '✅' : '❌'}</span>
              <div>
                <p className={`font-extrabold text-base ${verdict.resolved ? 'text-green-700' : 'text-red-700'}`}>
                  {verdict.resolved ? 'Issue confirmed resolved' : 'Resolution not confirmed'}
                </p>
                <p className={`text-sm ${verdict.resolved ? 'text-green-600' : 'text-red-600'}`}>
                  AI confidence: {verdict.confidence}%
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{verdict.reasoning}</p>
            {verdict.resolved && (
              <div className="mt-4 bg-green-100 rounded-lg p-3">
                <p className="text-xs text-green-800 font-semibold">
                  Dashboard updated ·{' '}
                  {issue.reporterEmail
                    ? 'Reporter notified by email'
                    : 'Reporter phone on record: ' + issue.reporterPhone}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Progress */}
        {loading && (
          <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <p className="text-sm font-semibold text-brand-700">{stepMsg}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        {!verdict && (
          <div>
            {afterPhoto && !locationOk && gpsStatus !== 'reading_exif' && gpsStatus !== 'capturing' && gpsStatus !== 'idle' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-red-700 font-semibold text-center">
                  🚫 You must be within 300m of the original issue location to resolve it.
                </p>
              </div>
            )}
            <button
              className="h-14 w-full bg-brand-600 text-white font-extrabold rounded-lg hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              onClick={handleVerify}
              disabled={loading || !canVerify}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying…
                </>
              ) : '🤖 Verify Resolution with AI →'}
            </button>
          </div>
        )}

        {verdict && (
          <div className="grid grid-cols-2 gap-3">
            {!verdict.resolved && (
              <button
                className="py-2.5 border border-brand-400 text-brand-700 font-semibold rounded-lg hover:bg-brand-50 transition-colors"
                onClick={() => { setVerdict(null); setAfterPhoto(null); setGpsStatus('idle'); setGpsSource(null) }}
              >
                Try again
              </button>
            )}
            <button
              className={`py-2.5 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition-colors ${verdict.resolved ? 'col-span-2' : ''}`}
              onClick={() => navigate('/agent/dashboard')}
            >
              Back to dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
