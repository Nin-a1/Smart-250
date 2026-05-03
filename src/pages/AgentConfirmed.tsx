import { useEffect, useState } from 'react'
import { Box, VStack, HStack, Text, Heading, Button, Badge, Grid } from '@chakra-ui/react'
import { useNavigate, useParams } from 'react-router-dom'
import { getIssueById } from '../lib/storage'
import { Issue } from '../types'

const SEV: Record<string, string> = { low: 'green', medium: 'orange', high: 'red' }

export default function AgentConfirmed() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [issue, setIssue] = useState<Issue | null>(null)

  useEffect(() => {
    if (id) getIssueById(id).then(setIssue)
  }, [id])

  if (!issue) return (
    <Box textAlign="center" py={20}>
      <Text color="gray.400">Loading…</Text>
    </Box>
  )

  const resolvedDate = issue.resolvedAt
    ? new Date(issue.resolvedAt).toLocaleDateString('en-RW', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : null

  return (
    <Box bg="gray.50" minH="100vh" py={12} px={6}>
      <Box maxW="720px" mx="auto">
        <VStack gap={6} align="stretch">

          {/* Success banner */}
          <Box
            bg="white" borderRadius="2xl" p={10} textAlign="center"
            border="1px solid" borderColor="green.100"
            shadow="0 4px 20px rgba(22,163,74,0.1)"
          >
            <Box
              w="72px" h="72px" bg="green.100" borderRadius="full"
              display="flex" alignItems="center" justifyContent="center" mx="auto" mb={5}
            >
              <Text fontSize="3xl">✅</Text>
            </Box>
            <Heading fontSize="2xl" fontWeight="800" color="gray.900" mb={2} letterSpacing="-0.02em">
              Issue Successfully Resolved!
            </Heading>
            <Text fontSize="sm" color="gray.500" mb={3} lineHeight="1.7">
              AI has verified the fix. The dashboard and reporter have been updated.
            </Text>
            {resolvedDate && (
              <Box bg="green.50" borderRadius="lg" px={4} py={2} display="inline-flex">
                <Text fontSize="xs" color="green.700" fontWeight="600">Resolved on {resolvedDate}</Text>
              </Box>
            )}
          </Box>

          {/* Issue summary */}
          <Box bg="white" borderRadius="xl" overflow="hidden" border="1px solid" borderColor="gray.100" shadow="0 1px 4px rgba(0,0,0,0.04)">
            <Box h="3px" bg={issue.severity === 'high' ? '#dc2626' : issue.severity === 'medium' ? '#d97706' : '#16a34a'} />
            <Box p={6}>
              <Text fontSize="xs" fontWeight="700" color="gray.400" textTransform="uppercase" letterSpacing="0.08em" mb={4}>
                Issue Summary
              </Text>
              <HStack gap={2} flexWrap="wrap" mb={3}>
                <Text fontSize="10px" fontFamily="mono" fontWeight="600" color="gray.400">{issue.id}</Text>
                <Badge colorPalette={SEV[issue.severity]} variant="subtle" borderRadius="full" textTransform="capitalize" fontSize="10px">{issue.severity}</Badge>
                <Badge colorPalette="blue" variant="subtle" borderRadius="full" textTransform="capitalize" fontSize="10px">{issue.issueType}</Badge>
                <Badge colorPalette="green" variant="subtle" borderRadius="full" fontSize="10px">✓ Resolved</Badge>
              </HStack>
              <Text fontWeight="700" fontSize="md" color="gray.900" mb={2}>{issue.title}</Text>
              <Text fontSize="sm" color="gray.500" lineHeight="1.7" mb={3}>{issue.description}</Text>
              <VStack align="start" gap={1}>
                <Text fontSize="xs" color="gray.500">📍 {issue.location}</Text>
                <Text fontSize="xs" color="gray.500">👤 {issue.reporterName} · {issue.reporterPhone}</Text>
                <Text fontSize="xs" color="gray.500">🏛️ {issue.institution}</Text>
              </VStack>
            </Box>
          </Box>

          {/* Before / After */}
          <Box bg="white" borderRadius="xl" p={6} border="1px solid" borderColor="gray.100" shadow="0 1px 4px rgba(0,0,0,0.04)">
            <Text fontSize="xs" fontWeight="700" color="gray.400" textTransform="uppercase" letterSpacing="0.08em" mb={5}>
              Before & After
            </Text>
            <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr' }} gap={4}>
              {[
                { label: 'Before — original report', color: '#dc2626', bg: 'red.50', border: 'red.100', src: issue.photoUrl || issue.photoBase64 },
                { label: 'After — fix submitted', color: '#16a34a', bg: 'green.50', border: 'green.100', src: issue.resolutionPhotoUrl || issue.resolutionPhotoBase64 },
              ].map(p => (
                <Box key={p.label}>
                  <HStack mb={2} gap={2}>
                    <Box w="8px" h="8px" borderRadius="full" bg={p.color} />
                    <Text fontSize="xs" fontWeight="600" color="gray.500">{p.label}</Text>
                  </HStack>
                  <Box borderRadius="xl" overflow="hidden" border="1px solid" borderColor={p.border} h="180px" bg={p.bg}>
                    {p.src ? (
                      <img src={p.src} alt={p.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <Box h="full" display="flex" alignItems="center" justifyContent="center">
                        <Text fontSize="sm" color="gray.400">Uploading…</Text>
                      </Box>
                    )}
                  </Box>
                </Box>
              ))}
            </Grid>
          </Box>

          {/* AI verdict */}
          {(issue.resolutionReasoning || issue.resolutionConfidence) && (
            <Box bg="white" borderRadius="xl" p={6} border="1px solid" borderColor="gray.100" shadow="0 1px 4px rgba(0,0,0,0.04)">
              <HStack justify="space-between" mb={4}>
                <HStack gap={2}>
                  <Text fontSize="lg">🤖</Text>
                  <Text fontWeight="700" fontSize="sm" color="gray.700">AI Verification</Text>
                </HStack>
                {issue.resolutionConfidence && (
                  <Box bg="green.100" borderRadius="full" px={4} py={1}>
                    <Text fontWeight="800" color="green.700" fontSize="sm">{issue.resolutionConfidence}% confident</Text>
                  </Box>
                )}
              </HStack>
              {issue.resolutionReasoning && (
                <Text fontSize="sm" color="gray.600" lineHeight="1.7">{issue.resolutionReasoning}</Text>
              )}
            </Box>
          )}

          {/* Reporter */}
          <Box
            bg={issue.reporterEmail ? 'blue.50' : 'gray.50'}
            borderRadius="xl" p={5}
            border="1px solid" borderColor={issue.reporterEmail ? 'blue.100' : 'gray.100'}
          >
            <HStack gap={3}>
              <Text fontSize="xl">{issue.reporterEmail ? '📧' : '📞'}</Text>
              <VStack align="start" gap={0.5}>
                <Text fontWeight="600" fontSize="sm" color={issue.reporterEmail ? 'blue.700' : 'gray.700'}>
                  {issue.reporterEmail ? `Reporter notified — ${issue.reporterEmail}` : 'No email provided'}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {issue.reporterEmail ? 'Resolution confirmation email sent.' : `Contact by phone: ${issue.reporterPhone}`}
                </Text>
              </VStack>
            </HStack>
          </Box>

          {/* Actions */}
          <Grid templateColumns="1fr 1fr" gap={3}>
            <Button
              variant="outline" borderColor="gray.200" color="gray.700" borderRadius="lg" fontWeight="600"
              _hover={{ bg: 'gray.50', borderColor: 'gray.300' }}
              onClick={() => navigate('/agent/dashboard')}
            >
              ← Back to Dashboard
            </Button>
            <Button
              bg="brand.600" color="white" fontWeight="700" borderRadius="lg"
              _hover={{ bg: 'brand.700' }}
              onClick={() => navigate('/dashboard')}
            >
              Live Dashboard →
            </Button>
          </Grid>
        </VStack>
      </Box>
    </Box>
  )
}
