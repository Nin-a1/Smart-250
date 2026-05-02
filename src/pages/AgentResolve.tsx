import { useState, useEffect, useRef } from 'react'
import {
  Box, VStack, HStack, Text, Heading,
  Button, Badge, Spinner, Grid, GridItem,
} from '@chakra-ui/react'
import { useNavigate, useParams } from 'react-router-dom'
import { toaster } from '../lib/toaster'
import { verifyResolution } from '../lib/gemini'
import { sendEmail } from '../lib/email'
import { getIssueById, updateIssue } from '../lib/storage'
import { Issue } from '../types'

const sevColor: Record<string, string> = {
  low: 'green', medium: 'orange', high: 'red',
}

export default function AgentResolve() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [issue, setIssue] = useState<Issue | null>(null)
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [stepMsg, setStepMsg] = useState('')
  const [verdict, setVerdict] = useState<{
    resolved: boolean
    confidence: number
    reasoning: string
  } | null>(null)

  useEffect(() => {
    if (id) setIssue(getIssueById(id))
  }, [id])

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setAfterPhoto(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleVerify = async () => {
    if (!issue || !afterPhoto) {
      toaster.create({ title: 'Upload the after photo first', type: 'error' })
      return
    }
    setLoading(true)
    setVerdict(null)

    try {
      setStepMsg('AI comparing before and after photos…')
      const result = await verifyResolution(
        issue.photoBase64, afterPhoto, issue.title
      )
      setVerdict(result)

      if (result.resolved) {
        setStepMsg('Updating issue status…')
        updateIssue(issue.id, {
          status:                 'resolved',
          resolvedAt:             new Date().toISOString(),
          resolutionPhotoBase64:  afterPhoto,
          resolutionReasoning:    result.reasoning,
          resolutionConfidence:   result.confidence,
        })

        // Notify reporter if they provided an email
        if (issue.reporterEmail) {
          setStepMsg('Notifying reporter by email…')
          try {
            await sendEmail({
              toEmail:      issue.reporterEmail,
              toName:       issue.reporterName,
              issueId:      issue.id,
              issueTitle:   issue.title,
              location:     issue.location,
              severity:     issue.severity,
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
          } catch {
            // Non-fatal — reporter notification is best-effort
          }
        }
        toaster.create({ title: '✅ Issue resolved and verified!', type: 'success' })
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
      <Button mt={4} onClick={() => navigate('/agent/dashboard')}>
        Back to dashboard
      </Button>
    </Box>
  )

  return (
    <Box maxW="680px" mx="auto" py={10} px={6}>
      <VStack gap={7} align="stretch">

        <Button
          variant="ghost" size="sm" color="gray.500" alignSelf="start"
          onClick={() => navigate('/agent/dashboard')}
        >
          ← Back to dashboard
        </Button>

        <VStack align="start" gap={1}>
          <HStack gap={2}>
            <Text fontSize="xl">🔧</Text>
            <Heading fontSize="xl" fontWeight="800" color="gray.800">
              Resolve Issue
            </Heading>
          </HStack>
          <Text fontSize="sm" color="gray.500">
            Upload proof the issue is fixed. AI will verify by comparing both photos.
          </Text>
        </VStack>

        {/* Original issue */}
        <Box
          bg="orange.50" border="1px solid" borderColor="orange.200"
          borderRadius="xl" p={5}
        >
          <Text
            fontSize="xs" fontWeight="700" color="orange.600"
            textTransform="uppercase" letterSpacing="wider" mb={4}
          >
            Original Report
          </Text>
          <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr' }} gap={4}>
            <VStack align="start" gap={2}>
              <Text fontWeight="700" fontSize="sm" color="gray.800">
                {issue.title}
              </Text>
              <Text fontSize="xs" color="gray.500" lineHeight="tall">
                {issue.description}
              </Text>
              <Text fontSize="xs" color="gray.500">📍 {issue.location}</Text>
              <Text fontSize="xs" color="gray.500">
                👤 {issue.reporterName} · {issue.reporterPhone}
              </Text>
              <HStack gap={2}>
                <Badge
                  colorPalette={sevColor[issue.severity]}
                  variant="subtle" fontSize="10px" textTransform="capitalize"
                >
                  {issue.severity}
                </Badge>
                <Badge colorPalette="blue" variant="subtle" fontSize="10px" textTransform="capitalize">
                  {issue.issueType}
                </Badge>
              </HStack>
            </VStack>
            <Box>
              <Text fontSize="xs" color="gray.400" mb={1}>Before photo</Text>
              <img
                src={issue.photoBase64} alt="before"
                style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 8 }}
              />
            </Box>
          </Grid>
        </Box>

        {/* After photo upload */}
        <Box>
          <Text fontWeight="600" fontSize="sm" mb={2} color="gray.700">
            After photo — proof of fix{' '}
            <Text as="span" color="red.400">*</Text>
          </Text>
          <Box
            border="2px dashed"
            borderColor={afterPhoto ? 'green.400' : 'gray.200'}
            borderRadius="xl" p={6} textAlign="center" cursor="pointer"
            bg={afterPhoto ? 'green.50' : 'gray.50'}
            _hover={{ borderColor: 'green.400', bg: 'green.50' }}
            transition="all 0.2s"
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef} type="file" accept="image/*"
              style={{ display: 'none' }} onChange={handlePhoto}
            />
            {afterPhoto ? (
              <VStack gap={3}>
                <img
                  src={afterPhoto} alt="after"
                  style={{ maxHeight: 200, borderRadius: 10, objectFit: 'cover', maxWidth: '100%' }}
                />
                <Text fontSize="sm" color="green.600" fontWeight="600">
                  ✓ After photo ready — tap to change
                </Text>
              </VStack>
            ) : (
              <VStack gap={2}>
                <Text fontSize="3xl">📸</Text>
                <Text fontSize="sm" color="gray.500">
                  Tap to upload proof of resolution
                </Text>
                <Text fontSize="xs" color="gray.400">
                  Take it at the same location as the original
                </Text>
              </VStack>
            )}
          </Box>
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
              <Text fontSize="2xl">
                {verdict.resolved ? '✅' : '❌'}
              </Text>
              <VStack align="start" gap={0}>
                <Text
                  fontWeight="800" fontSize="md"
                  color={verdict.resolved ? 'green.700' : 'red.700'}
                >
                  {verdict.resolved
                    ? 'Issue confirmed resolved'
                    : 'Resolution not confirmed'}
                </Text>
                <Text
                  fontSize="sm"
                  color={verdict.resolved ? 'green.600' : 'red.600'}
                >
                  AI confidence: {verdict.confidence}%
                </Text>
              </VStack>
            </HStack>
            <Text fontSize="sm" color="gray.600" lineHeight="tall">
              {verdict.reasoning}
            </Text>
            {verdict.resolved && (
              <Box
                mt={4} bg={verdict.resolved ? 'green.100' : 'red.100'}
                borderRadius="lg" p={3}
              >
                <Text fontSize="xs" color="green.800" fontWeight="600">
                  Dashboard updated · {issue.reporterEmail ? 'Reporter notified by email' : 'Reporter phone on record: ' + issue.reporterPhone}
                </Text>
              </Box>
            )}
          </Box>
        )}

        {/* Progress */}
        {loading && (
          <Box
            bg="brand.50" border="1px solid" borderColor="brand.200"
            borderRadius="xl" p={4}
          >
            <HStack gap={3}>
              <Spinner size="sm" color="brand.600" />
              <Text fontSize="sm" fontWeight="600" color="brand.700">{stepMsg}</Text>
            </HStack>
          </Box>
        )}

        {/* Action buttons */}
        {!verdict && (
          <Button
            size="lg" bg="brand.600" color="white"
            _hover={{ bg: 'brand.700' }} fontWeight="800"
            onClick={handleVerify} disabled={loading || !afterPhoto} h="56px"
          >
            {loading
              ? <HStack gap={2}><Spinner size="sm" /><Text>Verifying…</Text></HStack>
              : '🤖 Verify Resolution with AI →'}
          </Button>
        )}

        {verdict && (
          <Grid templateColumns="1fr 1fr" gap={3}>
            {!verdict.resolved && (
              <GridItem>
                <Button
                  variant="outline" borderColor="brand.400"
                  color="brand.700" _hover={{ bg: 'brand.50' }}
                  onClick={() => { setVerdict(null); setAfterPhoto(null) }}
                  w="full"
                >
                  Try again
                </Button>
              </GridItem>
            )}
            <GridItem colSpan={verdict.resolved ? 2 : 1}>
              <Button
                bg="brand.600" color="white" _hover={{ bg: 'brand.700' }}
                onClick={() => navigate('/agent/dashboard')}
                w="full"
              >
                Back to dashboard
              </Button>
            </GridItem>
          </Grid>
        )}
      </VStack>
    </Box>
  )
}
