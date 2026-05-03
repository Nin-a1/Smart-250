import { useState, useEffect, useRef } from 'react'
import {
  Box, VStack, HStack, Text, Heading,
  Button, Badge, Spinner, Grid,
} from '@chakra-ui/react'
import { useNavigate, useParams } from 'react-router-dom'
import { toaster } from '../lib/toaster'
import { verifyResolution } from '../lib/gemini'
import { sendEmail } from '../lib/email'
import { getIssueById, updateIssue } from '../lib/storage'
import { extractGpsFromFile } from '../lib/exif'
import { Issue } from '../types'

const sevColor: Record<string, string> = { low: 'green', medium: 'orange', high: 'red' }

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

    // Start EXIF extraction and compression in parallel
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

    // Process GPS from EXIF
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
      // No EXIF GPS in photo — fall back to manual GPS
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

  // Only allow verification if location is confirmed within range
  const locationOk =
    gpsStatus === 'match' ||
    gpsStatus === 'no_original'

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
            await sendEmail({
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
    <Box textAlign="center" py={20}>
      <Text color="gray.400">Issue not found</Text>
      <Button mt={4} onClick={() => navigate('/agent/dashboard')}>Back to dashboard</Button>
    </Box>
  )

  return (
    <Box maxW="680px" mx="auto" py={10} px={6}>
      <VStack gap={7} align="stretch">

        <Button variant="ghost" size="sm" color="gray.500" alignSelf="start"
          onClick={() => navigate('/agent/dashboard')}>
          ← Back to dashboard
        </Button>

        <VStack align="start" gap={1}>
          <HStack gap={2}>
            <Text fontSize="xl">🔧</Text>
            <Heading fontSize="xl" fontWeight="800" color="gray.800">Resolve Issue</Heading>
          </HStack>
          <Text fontSize="sm" color="gray.500">
            Upload a photo taken at the fixed location. GPS is read from the photo automatically — you must be within 300m of the original site.
          </Text>
        </VStack>

        {/* Original issue */}
        <Box bg="orange.50" border="1px solid" borderColor="orange.200" borderRadius="xl" p={5}>
          <Text fontSize="xs" fontWeight="700" color="orange.600"
            textTransform="uppercase" letterSpacing="wider" mb={4}>
            Original Report
          </Text>
          <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr' }} gap={4}>
            <VStack align="start" gap={2}>
              <Text fontWeight="700" fontSize="sm" color="gray.800">{issue.title}</Text>
              <Text fontSize="xs" color="gray.500" lineHeight="tall">{issue.description}</Text>
              <Text fontSize="xs" color="gray.500">📍 {issue.location}</Text>
              <Text fontSize="xs" color="gray.500">👤 {issue.reporterName} · {issue.reporterPhone}</Text>
              <HStack gap={2}>
                <Badge colorPalette={sevColor[issue.severity]} variant="subtle" fontSize="10px" textTransform="capitalize">
                  {issue.severity}
                </Badge>
                <Badge colorPalette="blue" variant="subtle" fontSize="10px" textTransform="capitalize">
                  {issue.issueType}
                </Badge>
              </HStack>
            </VStack>
            <Box>
              <Text fontSize="xs" color="gray.400" mb={1}>Before photo</Text>
              <img src={issue.photoUrl || issue.photoBase64} alt="before"
                style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 8 }} />
            </Box>
          </Grid>
        </Box>

        {/* Step 1 — After photo */}
        <Box>
          <HStack gap={2} mb={2}>
            <Box w="20px" h="20px" borderRadius="full" bg="brand.600"
              display="flex" alignItems="center" justifyContent="center">
              <Text fontSize="xs" color="white" fontWeight="800">1</Text>
            </Box>
            <Text fontWeight="600" fontSize="sm" color="gray.700">
              Upload proof-of-fix photo{' '}
              <Text as="span" color="red.400">*</Text>
            </Text>
          </HStack>

          <Box
            border="2px dashed"
            borderColor={afterPhoto ? 'green.400' : 'gray.200'}
            borderRadius="xl" p={6} textAlign="center" cursor="pointer"
            bg={afterPhoto ? 'green.50' : 'gray.50'}
            _hover={{ borderColor: 'green.400', bg: 'green.50' }}
            transition="all 0.2s"
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept="image/*"
              style={{ display: 'none' }} onChange={handlePhoto} />
            {gpsStatus === 'reading_exif' ? (
              <VStack gap={2}>
                <Spinner size="md" color="brand.600" />
                <Text fontSize="sm" color="brand.600" fontWeight="600">Reading GPS from photo…</Text>
              </VStack>
            ) : afterPhoto ? (
              <VStack gap={3}>
                <img src={afterPhoto} alt="after"
                  style={{ maxHeight: 200, borderRadius: 10, objectFit: 'cover', maxWidth: '100%' }} />
                <Text fontSize="sm" color="green.600" fontWeight="600">
                  ✓ After photo ready — tap to change
                </Text>
              </VStack>
            ) : (
              <VStack gap={2}>
                <Text fontSize="3xl">📸</Text>
                <Text fontSize="sm" color="gray.500">Tap to upload the fixed photo</Text>
                <Text fontSize="xs" color="gray.400">GPS is read automatically from the image</Text>
              </VStack>
            )}
          </Box>
        </Box>

        {/* Step 2 — Location verification */}
        <Box>
          <HStack gap={2} mb={3}>
            <Box w="20px" h="20px" borderRadius="full"
              bg={gpsStatus === 'match' ? 'green.500' : gpsStatus === 'mismatch' ? 'red.500' : 'brand.600'}
              display="flex" alignItems="center" justifyContent="center">
              <Text fontSize="xs" color="white" fontWeight="800">2</Text>
            </Box>
            <Text fontWeight="600" fontSize="sm" color="gray.700">Location verification</Text>
          </HStack>

          {gpsStatus === 'no_original' && (
            <Box bg="gray.50" border="1px solid" borderColor="gray.200" borderRadius="xl" p={4}>
              <Text fontSize="sm" color="gray.500">
                ⚠️ The original report had no GPS coordinates — location check skipped.
              </Text>
            </Box>
          )}

          {(gpsStatus === 'idle' || gpsStatus === 'capturing') && afterPhoto && (
            <Box>
              <Box bg="yellow.50" border="1px solid" borderColor="yellow.200" borderRadius="xl" p={4} mb={3}>
                <Text fontSize="sm" color="yellow.800">
                  📷 No GPS found in the photo. Please capture your location manually to prove you are at the scene.
                </Text>
              </Box>
              <Button
                onClick={captureGps}
                disabled={gpsStatus === 'capturing'}
                variant="outline" borderColor="brand.400" color="brand.700"
                _hover={{ bg: 'brand.50' }} w="full" h="52px"
              >
                {gpsStatus === 'capturing'
                  ? <HStack gap={2}><Spinner size="sm" /><Text>Getting your location…</Text></HStack>
                  : '📍 Capture My Location Manually'}
              </Button>
            </Box>
          )}

          {(gpsStatus === 'match' || gpsStatus === 'mismatch') && (
            <Box
              bg={gpsStatus === 'match' ? 'green.50' : 'red.50'}
              border="1px solid"
              borderColor={gpsStatus === 'match' ? 'green.200' : 'red.200'}
              borderRadius="xl" p={4}
            >
              <HStack gap={3}>
                <Text fontSize="2xl">{gpsStatus === 'match' ? '✅' : '🚫'}</Text>
                <VStack align="start" gap={0}>
                  <Text fontWeight="700" fontSize="sm"
                    color={gpsStatus === 'match' ? 'green.700' : 'red.700'}>
                    {gpsStatus === 'match'
                      ? `Location confirmed — ${distanceM}m from the reported site`
                      : `Too far — ${distanceM}m from the reported site (max 300m)`}
                  </Text>
                  <Text fontSize="xs" color={gpsStatus === 'match' ? 'green.600' : 'red.600'}>
                    {gpsSource === 'exif' ? 'GPS read from photo metadata' : 'GPS captured manually'}
                    {gpsStatus === 'mismatch' && ' · You must be at the scene to resolve this issue'}
                  </Text>
                </VStack>
              </HStack>
              {gpsStatus === 'mismatch' && (
                <Button mt={3} size="sm" variant="ghost" color="red.600"
                  onClick={() => {
                    setGpsStatus('idle'); setAgentGps(null)
                    setDistanceM(null); setAfterPhoto(null); setGpsSource(null)
                  }}>
                  Upload a different photo
                </Button>
              )}
            </Box>
          )}
        </Box>

        {/* AI verdict */}
        {verdict && (
          <Box
            bg={verdict.resolved ? 'green.50' : 'red.50'}
            border="1px solid"
            borderColor={verdict.resolved ? 'green.200' : 'red.200'}
            borderRadius="xl" p={6}
          >
            <HStack gap={3} mb={3}>
              <Text fontSize="2xl">{verdict.resolved ? '✅' : '❌'}</Text>
              <VStack align="start" gap={0}>
                <Text fontWeight="800" fontSize="md"
                  color={verdict.resolved ? 'green.700' : 'red.700'}>
                  {verdict.resolved ? 'Issue confirmed resolved' : 'Resolution not confirmed'}
                </Text>
                <Text fontSize="sm" color={verdict.resolved ? 'green.600' : 'red.600'}>
                  AI confidence: {verdict.confidence}%
                </Text>
              </VStack>
            </HStack>
            <Text fontSize="sm" color="gray.600" lineHeight="tall">{verdict.reasoning}</Text>
            {verdict.resolved && (
              <Box mt={4} bg="green.100" borderRadius="lg" p={3}>
                <Text fontSize="xs" color="green.800" fontWeight="600">
                  Dashboard updated ·{' '}
                  {issue.reporterEmail
                    ? 'Reporter notified by email'
                    : 'Reporter phone on record: ' + issue.reporterPhone}
                </Text>
              </Box>
            )}
          </Box>
        )}

        {/* Progress */}
        {loading && (
          <Box bg="brand.50" border="1px solid" borderColor="brand.200" borderRadius="xl" p={4}>
            <HStack gap={3}>
              <Spinner size="sm" color="brand.600" />
              <Text fontSize="sm" fontWeight="600" color="brand.700">{stepMsg}</Text>
            </HStack>
          </Box>
        )}

        {/* Action buttons */}
        {!verdict && (
          <Box>
            {afterPhoto && !locationOk && gpsStatus !== 'reading_exif' && gpsStatus !== 'capturing' && gpsStatus !== 'idle' && (
              <Box bg="red.50" border="1px solid" borderColor="red.200" borderRadius="lg" p={3} mb={3}>
                <Text fontSize="sm" color="red.700" fontWeight="600" textAlign="center">
                  🚫 You must be within 300m of the original issue location to resolve it.
                </Text>
              </Box>
            )}
            <Button
              size="lg" bg="brand.600" color="white"
              _hover={{ bg: 'brand.700' }} fontWeight="800"
              onClick={handleVerify}
              disabled={loading || !canVerify}
              h="56px" w="full"
            >
              {loading
                ? <HStack gap={2}><Spinner size="sm" /><Text>Verifying…</Text></HStack>
                : '🤖 Verify Resolution with AI →'}
            </Button>
          </Box>
        )}

        {verdict && (
          <Grid templateColumns="1fr 1fr" gap={3}>
            {!verdict.resolved && (
              <Button variant="outline" borderColor="brand.400"
                color="brand.700" _hover={{ bg: 'brand.50' }}
                onClick={() => { setVerdict(null); setAfterPhoto(null); setGpsStatus('idle'); setGpsSource(null) }}>
                Try again
              </Button>
            )}
            <Button bg="brand.600" color="white" _hover={{ bg: 'brand.700' }}
              gridColumn={verdict.resolved ? '1 / -1' : 'auto'}
              onClick={() => navigate('/agent/dashboard')}>
              Back to dashboard
            </Button>
          </Grid>
        )}
      </VStack>
    </Box>
  )
}
