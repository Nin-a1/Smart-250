import { useEffect, useState } from 'react'
import {
  Box, VStack, HStack, Text, Heading,
  Button, Badge, Grid,
} from '@chakra-ui/react'
import { useNavigate, useParams } from 'react-router-dom'
import { getIssueById } from '../lib/storage'
import { Issue } from '../types'

const sevColor: Record<string, string> = { low: 'green', medium: 'orange', high: 'red' }

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
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null

  return (
    <Box maxW="720px" mx="auto" py={12} px={6}>
      <VStack gap={8} align="stretch">

        {/* Success banner */}
        <Box
          bg="green.50" border="2px solid" borderColor="green.300"
          borderRadius="2xl" p={8} textAlign="center"
        >
          <Text fontSize="5xl" mb={3}>✅</Text>
          <Heading fontSize="2xl" fontWeight="800" color="green.700" mb={1}>
            Issue Successfully Resolved!
          </Heading>
          <Text fontSize="sm" color="green.600">
            AI has verified the fix. The dashboard and reporter have been updated.
          </Text>
          {resolvedDate && (
            <Text fontSize="xs" color="green.500" mt={2}>
              Resolved on {resolvedDate}
            </Text>
          )}
        </Box>

        {/* Issue summary */}
        <Box bg="white" border="1px solid" borderColor="gray.100" borderRadius="xl" p={6}>
          <Text fontSize="xs" fontWeight="700" color="gray.400"
            textTransform="uppercase" letterSpacing="wider" mb={4}>
            Issue Summary
          </Text>
          <VStack align="start" gap={2}>
            <HStack gap={2} flexWrap="wrap">
              <Text fontSize="xs" fontFamily="mono" color="gray.400">{issue.id}</Text>
              <Badge colorPalette={sevColor[issue.severity]} variant="subtle"
                fontSize="10px" textTransform="capitalize">{issue.severity}</Badge>
              <Badge colorPalette="blue" variant="subtle" fontSize="10px"
                textTransform="capitalize">{issue.issueType}</Badge>
              <Badge colorPalette="green" variant="subtle" fontSize="10px">Resolved</Badge>
            </HStack>
            <Text fontWeight="700" fontSize="md" color="gray.800">{issue.title}</Text>
            <Text fontSize="sm" color="gray.500" lineHeight="tall">{issue.description}</Text>
            <Text fontSize="sm" color="gray.500">📍 {issue.location}</Text>
            <Text fontSize="sm" color="gray.500">
              👤 Reported by {issue.reporterName} · {issue.reporterPhone}
            </Text>
            <Text fontSize="sm" color="gray.500">🏛️ {issue.institution}</Text>
          </VStack>
        </Box>

        {/* Before / After photos */}
        <Box>
          <Text fontSize="xs" fontWeight="700" color="gray.400"
            textTransform="uppercase" letterSpacing="wider" mb={4}>
            Before & After
          </Text>
          <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr' }} gap={4}>
            <Box>
              <HStack mb={2} gap={2}>
                <Box w={2} h={2} borderRadius="full" bg="red.400" />
                <Text fontSize="xs" fontWeight="600" color="gray.500">Before — original report</Text>
              </HStack>
              <Box borderRadius="xl" overflow="hidden" border="1px solid" borderColor="red.100">
                <img
                  src={issue.photoUrl || issue.photoBase64}
                  alt="before"
                  style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
                />
              </Box>
            </Box>
            <Box>
              <HStack mb={2} gap={2}>
                <Box w={2} h={2} borderRadius="full" bg="green.400" />
                <Text fontSize="xs" fontWeight="600" color="gray.500">After — fix submitted</Text>
              </HStack>
              <Box borderRadius="xl" overflow="hidden" border="1px solid" borderColor="green.100">
                {(issue.resolutionPhotoUrl || issue.resolutionPhotoBase64) ? (
                  <img
                    src={issue.resolutionPhotoUrl || issue.resolutionPhotoBase64}
                    alt="after"
                    style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <Box h="200px" bg="green.50" display="flex" alignItems="center"
                    justifyContent="center">
                    <Text fontSize="sm" color="green.400">Photo uploading…</Text>
                  </Box>
                )}
              </Box>
            </Box>
          </Grid>
        </Box>

        {/* AI verification result */}
        {(issue.resolutionReasoning || issue.resolutionConfidence) && (
          <Box bg="gray.50" border="1px solid" borderColor="gray.200" borderRadius="xl" p={5}>
            <HStack justify="space-between" mb={3}>
              <HStack gap={2}>
                <Text fontSize="lg">🤖</Text>
                <Text fontWeight="700" fontSize="sm" color="gray.700">AI Verification Result</Text>
              </HStack>
              {issue.resolutionConfidence && (
                <Box bg="green.100" borderRadius="lg" px={3} py={1}>
                  <Text fontWeight="800" color="green.700" fontSize="sm">
                    {issue.resolutionConfidence}% confident
                  </Text>
                </Box>
              )}
            </HStack>
            {issue.resolutionReasoning && (
              <Text fontSize="sm" color="gray.600" lineHeight="tall">
                {issue.resolutionReasoning}
              </Text>
            )}
          </Box>
        )}

        {/* Reporter notification status */}
        <Box
          bg={issue.reporterEmail ? 'blue.50' : 'gray.50'}
          border="1px solid"
          borderColor={issue.reporterEmail ? 'blue.200' : 'gray.200'}
          borderRadius="xl" p={4}
        >
          <HStack gap={3}>
            <Text fontSize="xl">{issue.reporterEmail ? '📧' : '📞'}</Text>
            <VStack align="start" gap={0}>
              <Text fontWeight="600" fontSize="sm"
                color={issue.reporterEmail ? 'blue.700' : 'gray.600'}>
                {issue.reporterEmail
                  ? `Reporter notified by email — ${issue.reporterEmail}`
                  : 'No email provided — contact by phone'}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {issue.reporterEmail
                  ? 'A resolution confirmation email was sent automatically.'
                  : `Phone on record: ${issue.reporterPhone}`}
              </Text>
            </VStack>
          </HStack>
        </Box>

        {/* Actions */}
        <Grid templateColumns="1fr 1fr" gap={3}>
          <Button
            variant="outline" borderColor="brand.400" color="brand.700"
            _hover={{ bg: 'brand.50' }} fontWeight="700"
            onClick={() => navigate('/agent/dashboard')}
          >
            ← Back to Dashboard
          </Button>
          <Button
            bg="brand.600" color="white" _hover={{ bg: 'brand.700' }} fontWeight="700"
            onClick={() => navigate('/dashboard')}
          >
            View Live Dashboard →
          </Button>
        </Grid>

      </VStack>
    </Box>
  )
}
