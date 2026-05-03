import { useEffect, useState } from 'react'
import { Box, VStack, HStack, Text, Heading, Button, Badge, Grid } from '@chakra-ui/react'
import { useNavigate, useParams } from 'react-router-dom'
import { getIssueById } from '../lib/storage'
import IssueMap from '../components/IssueMap'
import { Issue } from '../types'

const SEV: Record<string, string> = { low: 'green', medium: 'orange', high: 'red' }

export default function Confirmation() {
  const navigate = useNavigate()
  const { issueId } = useParams()
  const [issue, setIssue] = useState<Issue | null>(null)

  useEffect(() => {
    if (issueId) getIssueById(issueId).then(setIssue)
  }, [issueId])

  if (!issue) return (
    <Box maxW="560px" mx="auto" py={20} px={6} textAlign="center">
      <Text fontSize="5xl" mb={4}>✅</Text>
      <Heading fontSize="2xl" fontWeight="800" color="gray.900" mb={2}>Report submitted!</Heading>
      <Text color="gray.500" mb={8}>Your issue has been recorded and the institution alerted.</Text>
      <Button bg="brand.600" color="white" _hover={{ bg: 'brand.700' }} borderRadius="lg"
        onClick={() => navigate('/dashboard')}>View Dashboard →</Button>
    </Box>
  )

  return (
    <Box bg="gray.50" minH="100vh" py={12} px={6}>
      <Box maxW="680px" mx="auto">
        <VStack gap={6} align="stretch">

          {/* Success banner */}
          <Box
            bg="white" borderRadius="2xl" p={10} textAlign="center"
            border="1px solid" borderColor="green.100"
            shadow="0 4px 20px rgba(22,163,74,0.1)"
          >
            <Box
              w="64px" h="64px" bg="green.100" borderRadius="full"
              display="flex" alignItems="center" justifyContent="center"
              mx="auto" mb={5}
            >
              <Text fontSize="2xl">✅</Text>
            </Box>
            <Heading fontSize="2xl" fontWeight="800" color="gray.900" mb={2} letterSpacing="-0.02em">
              Report submitted!
            </Heading>
            <Text color="gray.500" fontSize="sm" mb={3} lineHeight="1.7">
              Your issue has been recorded and the responsible institution has been alerted automatically.
            </Text>
            <Box
              bg="gray.50" borderRadius="lg" px={4} py={2}
              display="inline-flex" alignItems="center" gap={2}
            >
              <Text fontSize="xs" color="gray.400">Reference:</Text>
              <Text fontSize="xs" fontFamily="mono" fontWeight="700" color="brand.600">{issue.id}</Text>
            </Box>
          </Box>

          {/* Issue detected */}
          <Box bg="white" borderRadius="xl" overflow="hidden" border="1px solid" borderColor="gray.100" shadow="0 1px 4px rgba(0,0,0,0.04)">
            <Box h="2px" bg={issue.severity === 'high' ? '#dc2626' : issue.severity === 'medium' ? '#d97706' : '#16a34a'} />
            <Box p={6}>
              <Text fontSize="xs" fontWeight="700" color="gray.400" textTransform="uppercase" letterSpacing="0.08em" mb={4}>
                Issue Detected by AI
              </Text>
              <HStack gap={2} mb={3} flexWrap="wrap">
                <Badge colorPalette={SEV[issue.severity]} variant="subtle" borderRadius="full" textTransform="capitalize">
                  {issue.severity} severity
                </Badge>
                <Badge colorPalette="blue" variant="subtle" borderRadius="full" textTransform="capitalize">
                  {issue.issueType}
                </Badge>
              </HStack>
              <Text fontWeight="700" color="gray.900" fontSize="md" mb={2}>{issue.title}</Text>
              <Text fontSize="sm" color="gray.500" lineHeight="1.7" mb={3}>{issue.description}</Text>
              <HStack gap={1}>
                <Text fontSize="xs" color="gray.400">📍</Text>
                <Text fontSize="xs" color="gray.500">{issue.location}</Text>
              </HStack>
            </Box>
          </Box>

          {/* AI routing */}
          <Box
            bg="brand.50" borderRadius="xl" p={6}
            border="1px solid" borderColor="brand.100"
          >
            <HStack gap={2} mb={5}>
              <Text fontSize="lg">🤖</Text>
              <Text fontSize="xs" fontWeight="700" color="brand.700" textTransform="uppercase" letterSpacing="0.08em">
                AI Routing Decision
              </Text>
            </HStack>

            <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr' }} gap={5}>
              <VStack align="start" gap={1}>
                <Text fontSize="xs" color="brand.600" fontWeight="600">Institution alerted</Text>
                <Text fontWeight="700" fontSize="sm" color="gray.900">{issue.institution}</Text>
                <Text fontSize="xs" color="gray.500">{issue.institutionEmail}</Text>
              </VStack>
              <VStack align="start" gap={1}>
                <Text fontSize="xs" color="brand.600" fontWeight="600">Alert email</Text>
                <HStack gap={2}>
                  <Box w="8px" h="8px" borderRadius="full" bg={issue.emailSent ? 'green.400' : 'orange.400'} />
                  <Text fontSize="sm" fontWeight="600" color={issue.emailSent ? 'green.700' : 'orange.700'}>
                    {issue.emailSent ? 'Delivered ✓' : 'Pending'}
                  </Text>
                </HStack>
              </VStack>
            </Grid>

            {issue.institutionReason && (
              <Box mt={5} pt={5} borderTop="1px solid" borderColor="brand.200">
                <Text fontSize="xs" color="brand.600" fontWeight="600" mb={2}>Why this institution?</Text>
                <Text fontSize="sm" color="gray.700" lineHeight="1.7">{issue.institutionReason}</Text>
              </Box>
            )}
          </Box>

          {/* Map */}
          {issue.lat !== undefined && issue.lon !== undefined && (
            <Box bg="white" borderRadius="xl" overflow="hidden" border="1px solid" borderColor="gray.100">
              <Box px={5} pt={5} pb={3}>
                <Text fontSize="xs" fontWeight="700" color="gray.400" textTransform="uppercase" letterSpacing="0.08em">
                  Reported Location
                </Text>
              </Box>
              <IssueMap issues={[issue]} height="220px" />
            </Box>
          )}

          {/* Actions */}
          <Grid templateColumns="1fr 1fr" gap={3}>
            <Button
              variant="outline" borderColor="gray.200" color="gray.700" borderRadius="lg" fontWeight="600"
              _hover={{ bg: 'gray.50', borderColor: 'gray.300' }}
              onClick={() => navigate('/report')}
            >
              Report another
            </Button>
            <Button
              bg="brand.600" color="white" fontWeight="700" borderRadius="lg"
              _hover={{ bg: 'brand.700' }}
              onClick={() => navigate('/dashboard')}
            >
              View Dashboard →
            </Button>
          </Grid>
        </VStack>
      </Box>
    </Box>
  )
}
