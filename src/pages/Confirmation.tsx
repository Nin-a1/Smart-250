import { useEffect, useState } from 'react'
import {
  Box, VStack, HStack, Text, Heading, Button, Badge, Grid, GridItem,
} from '@chakra-ui/react'
import { useNavigate, useParams } from 'react-router-dom'
import { getIssueById } from '../lib/storage'
import IssueMap from '../components/IssueMap'
import { Issue } from '../types'

const sevColor: Record<string, string> = {
  low: 'green', medium: 'orange', high: 'red',
}

export default function Confirmation() {
  const navigate = useNavigate()
  const { issueId } = useParams()
  const [issue, setIssue] = useState<Issue | null>(null)

  useEffect(() => {
    if (issueId) getIssueById(issueId).then(setIssue)
  }, [issueId])

  if (!issue) {
    return (
      <Box maxW="620px" mx="auto" py={16} px={6} textAlign="center">
        <Text fontSize="3xl" mb={4}>✅</Text>
        <Heading fontSize="2xl" fontWeight="800" color="gray.800" mb={3}>
          Report submitted!
        </Heading>
        <Text color="gray.500" mb={6}>Your issue has been recorded.</Text>
        <Button bg="brand.600" color="white" _hover={{ bg: 'brand.700' }} onClick={() => navigate('/dashboard')}>
          View Dashboard
        </Button>
      </Box>
    )
  }

  const hasMap = issue.lat !== undefined && issue.lon !== undefined

  return (
    <Box maxW="660px" mx="auto" py={10} px={6}>
      <VStack gap={6} align="stretch">

        {/* Success header */}
        <VStack gap={2} textAlign="center">
          <Text fontSize="4xl">✅</Text>
          <Heading fontSize="2xl" fontWeight="800" color="gray.800">
            Report submitted!
          </Heading>
          <Text color="gray.500" fontSize="sm">
            Your issue has been recorded and the responsible institution has been alerted.
          </Text>
          <Text fontSize="xs" fontFamily="mono" color="gray.400">{issue.id}</Text>
        </VStack>

        {/* Issue summary */}
        <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={5}>
          <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={3}>
            Issue Detected
          </Text>
          <HStack gap={2} mb={2} flexWrap="wrap">
            <Badge colorPalette={sevColor[issue.severity]} variant="subtle" textTransform="capitalize">
              {issue.severity} severity
            </Badge>
            <Badge colorPalette="blue" variant="subtle" textTransform="capitalize">
              {issue.issueType}
            </Badge>
          </HStack>
          <Text fontWeight="700" color="gray.800" mb={1}>{issue.title}</Text>
          <Text fontSize="sm" color="gray.500" lineHeight="tall">{issue.description}</Text>
          <Text fontSize="xs" color="gray.400" mt={2}>📍 {issue.location}</Text>
        </Box>

        {/* AI institution routing */}
        <Box
          bg="brand.50" border="1px solid" borderColor="brand.200"
          borderRadius="xl" p={5}
        >
          <HStack gap={2} mb={3}>
            <Text fontSize="lg">🤖</Text>
            <Text fontSize="xs" fontWeight="700" color="brand.700" textTransform="uppercase" letterSpacing="wider">
              AI Routing Decision
            </Text>
          </HStack>

          <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr' }} gap={4}>
            <GridItem>
              <VStack align="start" gap={1}>
                <Text fontSize="xs" color="brand.600" fontWeight="600">Institution alerted</Text>
                <Text fontWeight="700" fontSize="sm" color="gray.800">{issue.institution}</Text>
                <Text fontSize="xs" color="gray.500">{issue.institutionEmail}</Text>
              </VStack>
            </GridItem>
            <GridItem>
              <VStack align="start" gap={1}>
                <Text fontSize="xs" color="brand.600" fontWeight="600">Email status</Text>
                <HStack gap={2}>
                  <Box
                    w="8px" h="8px" borderRadius="full"
                    bg={issue.emailSent ? 'green.400' : 'orange.400'}
                  />
                  <Text fontSize="sm" fontWeight="600" color={issue.emailSent ? 'green.700' : 'orange.700'}>
                    {issue.emailSent ? 'Delivered ✓' : 'Pending'}
                  </Text>
                </HStack>
              </VStack>
            </GridItem>
          </Grid>

          {issue.institutionReason && (
            <Box mt={4} pt={4} borderTop="1px solid" borderColor="brand.200">
              <Text fontSize="xs" color="brand.600" fontWeight="600" mb={1}>
                Why this institution?
              </Text>
              <Text fontSize="sm" color="gray.700" lineHeight="tall">
                {issue.institutionReason}
              </Text>
            </Box>
          )}
        </Box>

        {/* Map — only when GPS was captured */}
        {hasMap && (
          <Box>
            <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={2}>
              Reported Location
            </Text>
            <IssueMap issues={[issue]} height="240px" />
          </Box>
        )}

        {/* Actions */}
        <Grid templateColumns="1fr 1fr" gap={3}>
          <Button
            variant="outline" borderColor="brand.400"
            color="brand.700" _hover={{ bg: 'brand.50' }}
            onClick={() => navigate('/report')}
          >
            Report another
          </Button>
          <Button
            bg="brand.600" color="white" _hover={{ bg: 'brand.700' }} fontWeight="700"
            onClick={() => navigate('/dashboard')}
          >
            View Dashboard →
          </Button>
        </Grid>
      </VStack>
    </Box>
  )
}
