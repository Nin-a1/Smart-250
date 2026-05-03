import { useState, useRef } from 'react'
import {
  Box, VStack, HStack, Text, Heading,
  Button, Input, Grid, GridItem, Spinner,
} from '@chakra-ui/react'
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

    // Extract GPS from EXIF before canvas strips it
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

    // Compress image via canvas (strips EXIF — GPS already extracted above)
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
          toEmail:       issue.institutionEmail,
          toName:        issue.institution,
          issueId:       issue.id,
          issueTitle:    issue.title,
          location:      issue.location,
          severity:      issue.severity,
          reporterName:  issue.reporterName,
          reporterPhone: issue.reporterPhone,
          body,
        })
        issue.emailSent = true
      } catch {
        toaster.create({
          title: 'Email could not send',
          description: 'Issue saved anyway.',
          type: 'warning',
        })
      }

      setStep(5)
      await saveIssue(issue)

      // Notify the reporter that their submission was received
      if (issue.reporterEmail) {
        sendReporterConfirmation(
          issue.reporterEmail,
          issue.reporterName,
          issue.id,
          issue.title,
          issue.location,
          issue.severity,
          issue.institution,
          issue.reporterPhone,
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

  const border = (field: string) => errors[field] ? 'red.400' : 'gray.200'

  return (
    <Box maxW="620px" mx="auto" py={10} px={6}>
      <VStack gap={7} align="stretch">

        <VStack align="start" gap={1}>
          <HStack gap={2}>
            <Text fontSize="2xl">📸</Text>
            <Heading fontSize="2xl" fontWeight="800" color="gray.800">Report an Issue</Heading>
          </HStack>
          <Text color="gray.500" fontSize="sm">
            AI identifies the problem and alerts the right institution automatically.
          </Text>
        </VStack>

        {/* Photo */}
        <Box>
          <Text fontWeight="600" fontSize="sm" mb={2} color="gray.700">
            Photo of the issue <Text as="span" color="red.400">*</Text>
          </Text>
          <Box
            border="2px dashed"
            borderColor={errors.photo ? 'red.300' : photo ? 'brand.400' : 'gray.200'}
            borderRadius="xl" p={6} textAlign="center" cursor="pointer"
            bg={photo ? 'brand.50' : 'gray.50'}
            _hover={{ borderColor: 'brand.400', bg: 'brand.50' }}
            transition="all 0.2s"
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept="image/*"
              style={{ display: 'none' }} onChange={handlePhoto} />
            {photo ? (
              <VStack gap={3}>
                <img src={photo} alt="preview"
                  style={{ maxHeight: 200, borderRadius: 10, objectFit: 'cover', maxWidth: '100%' }} />
                <Text fontSize="sm" color="brand.600" fontWeight="600">
                  ✓ Photo ready — tap to change
                </Text>
              </VStack>
            ) : (
              <VStack gap={2}>
                <Text fontSize="3xl">📷</Text>
                <Text fontSize="sm" color="gray.500">Tap to upload or take a photo</Text>
                <Text fontSize="xs" color="gray.400">Location is read automatically from the photo</Text>
              </VStack>
            )}
          </Box>
          {errors.photo && <Text fontSize="xs" color="red.500" mt={1}>{errors.photo}</Text>}
        </Box>

        {/* Location */}
        <Box>
          <Text fontWeight="600" fontSize="sm" mb={2} color="gray.700">
            Location <Text as="span" color="red.400">*</Text>
          </Text>
          <HStack>
            <Input
              placeholder="e.g. KN 5 Rd, near Convention Centre"
              value={form.location} onChange={set('location')}
              borderColor={border('location')}
              _focusVisible={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #0F6E56' }}
              flex={1}
            />
            <Button
              onClick={getGPS} flexShrink={0}
              variant="outline" borderColor="brand.400"
              color="brand.600" _hover={{ bg: 'brand.50' }}
              size="sm" px={4}
            >
              📍 GPS
            </Button>
          </HStack>
          {errors.location && <Text fontSize="xs" color="red.500" mt={1}>{errors.location}</Text>}
          {gps && (
            <Text fontSize="xs" color="brand.600" mt={1}>
              {gpsSource === 'exif'
                ? '✓ Exact location extracted from photo metadata'
                : '✓ GPS coords saved · map pin will appear on dashboard'}
            </Text>
          )}
        </Box>

        {/* Name + Phone */}
        <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr' }} gap={4}>
          <GridItem>
            <Text fontWeight="600" fontSize="sm" mb={2} color="gray.700">
              Your name <Text as="span" color="red.400">*</Text>
            </Text>
            <Input placeholder="Full name" value={form.name} onChange={set('name')}
              borderColor={border('name')}
              _focusVisible={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #0F6E56' }} />
            {errors.name && <Text fontSize="xs" color="red.500" mt={1}>{errors.name}</Text>}
          </GridItem>
          <GridItem>
            <Text fontWeight="600" fontSize="sm" mb={2} color="gray.700">
              Phone <Text as="span" color="red.400">*</Text>
            </Text>
            <Input placeholder="+250 7XX XXX XXX" value={form.phone} onChange={set('phone')}
              borderColor={border('phone')}
              _focusVisible={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #0F6E56' }} />
            {errors.phone && <Text fontSize="xs" color="red.500" mt={1}>{errors.phone}</Text>}
          </GridItem>
        </Grid>

        {/* Email */}
        <Box>
          <Text fontWeight="600" fontSize="sm" mb={2} color="gray.700">
            Email{' '}
            <Text as="span" color="gray.400" fontWeight="400">(optional — get notified when resolved)</Text>
          </Text>
          <Input type="email" placeholder="your@email.com"
            value={form.email} onChange={set('email')}
            borderColor="gray.200"
            _focusVisible={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #0F6E56' }} />
        </Box>

        {/* Progress */}
        {loading && (
          <Box bg="brand.50" border="1px solid" borderColor="brand.200" borderRadius="xl" p={4}>
            <HStack gap={3}>
              <Spinner size="sm" color="brand.600" />
              <VStack align="start" gap={0}>
                <Text fontSize="sm" fontWeight="600" color="brand.700">{STEPS[step]}</Text>
                <Text fontSize="xs" color="brand.500">Step {step} of {STEPS.length - 1}</Text>
              </VStack>
            </HStack>
          </Box>
        )}

        <Button
          size="lg" bg="brand.600" color="white"
          _hover={{ bg: 'brand.700' }} fontWeight="800"
          onClick={handleSubmit} disabled={loading} h="56px" fontSize="md"
        >
          {loading
            ? <HStack gap={2}><Spinner size="sm" /><Text>Processing…</Text></HStack>
            : 'Submit Report →'}
        </Button>

        <Text fontSize="xs" color="gray.400" textAlign="center">
          Groq AI identifies the issue and contacts the responsible Kigali institution.
        </Text>
      </VStack>
    </Box>
  )
}
