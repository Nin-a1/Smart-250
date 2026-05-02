import { useEffect, useState } from 'react'
import {
  Box, VStack, HStack, Text, Heading,
  Button, Badge, Grid, GridItem,
} from '@chakra-ui/react'
import { useNavigate, useParams } from 'react-router-dom'
import { getIssueById } from '../lib/storage'
import { Issue } from '../types'

const sevColor: Record<string, string> = {
  low: 'green', medium: 'orange', high: 'red',
}

export default function Confirmation() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [issue, setIssue] = useState<Issue | null>(null)

  useEffect(() => {
    if (id) setIssue(getIssueById(id))
  }, [id])

  if (!issue) return (
    <Box textAlign="center" py={20}>
      <Text color="gray.400">Issue not found</Text>
      <Button mt={4} onClick={() => navigate('/')}>Go home</Button>
    </Box>
  )

  return (
    <Box maxW="620px" mx="auto" py={10} px={6}>
      <VStack gap={6} align="stretch">

        {/* Success header */}
        <Box bg="brand.600" borderRadius="2xl" p={8} textAlign="center">
          <Text fontSize="4xl" mb={2}>✅</Text>
          <Heading fontSize="2xl" fontWeight="800" color="white" mb={1}>
            Report Submitted!
          </Heading>
          <Text color="brand.100" fontSize="sm">
            Issue ID:{' '}
            <Text as="span" fontWeight="800" color="white">{issue.id}</Text>
          </Text>
          {issue.emailSent && (
            <Box
              mt={3} display="inline-block"
              bg="brand.500" px={4} py={1} borderRadius="full"
            >
              <Text fontSize="xs" color="white" fontWeight="600">
                📧 Institution alerted
              </Text>
            </Box>
          )}
        </Box>

        {/* AI analysis result */}
        <Box
          bg="white" border="1px solid" borderColor="gray.100"
          borderRadius="xl" p={6}
        >
          <Text
            fontSize="xs" fontWeight="700" color="brand.600"
            textTransform="uppercase" letterSpacing="wider" mb={4}
          >
            AI Analysis Result
          </Text>
          <VStack align="stretch" gap={3}>
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.500">Issue type</Text>
              <Badge colorPalette="blue" variant="subtle" textTransform="capitalize">
                {issue.issueType}
              </Badge>
            </HStack>
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.500">Severity</Text>
              <Badge
                colorPalette={sevColor[issue.severity]}
                variant="subtle" textTransform="capitalize"
              >
                {issue.severity}
              </Badge>
            </HStack>
            <Box pt={2} borderTop="1px solid" borderColor="gray.100">
              <Text fontSize="sm" fontWeight="700" color="gray.800" mb={1}>
                {issue.title}
              </Text>
              <Text fontSize="sm" color="gray.500" lineHeight="tall">
                {issue.description}
              </Text>
            </Box>
          </VStack>
        </Box>

        {/* Institution found */}
        <Box
          bg="brand.50" border="1px solid" borderColor="brand.200"
          borderRadius="xl" p={6}
        >
          <Text
            fontSize="xs" fontWeight="700" color="brand.600"
            textTransform="uppercase" letterSpacing="wider" mb={3}
          >
            Institution Alerted
          </Text>
          <VStack align="stretch" gap={1}>
            <Text fontWeight="700" color="brand.800" fontSize="md">
              {issue.institution}
            </Text>
            <Text fontSize="sm" color="brand.600">{issue.institutionEmail}</Text>
            <Text fontSize="xs" color="brand.500" mt={1}>
              {issue.emailSent ? '✓ Email sent successfully' : '⚠ Email pending'}
            </Text>
          </VStack>
        </Box>

        {/* Photo */}
        <Box>
          <Text
            fontSize="xs" fontWeight="700" color="gray.500"
            textTransform="uppercase" letterSpacing="wider" mb={2}
          >
            Your photo
          </Text>
          <img
            src={issue.photoBase64} alt="Reported issue"
            style={{ width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 220 }}
          />
        </Box>

        {/* What happens next */}
        <Box bg="gray.50" borderRadius="xl" p={6}>
          <Text fontWeight="700" color="gray.700" mb={3} fontSize="sm">
            What happens next
          </Text>
          <VStack align="stretch" gap={2}>
            {[
              'Institution reviews the report and dispatches a team',
              'An agent goes to the location and fixes the issue',
              'Agent uploads resolution proof on-site',
              'AI compares before and after photos to verify the fix',
              'You are notified when your issue is marked resolved',
              'Unresolved issues get a Friday follow-up reminder automatically',
            ].map((s, i) => (
              <HStack key={i} gap={3} align="start">
                <Box
                  w="20px" h="20px" minW="20px" borderRadius="full"
                  bg="brand.100" display="flex" alignItems="center" justifyContent="center"
                >
                  <Text fontSize="10px" fontWeight="700" color="brand.700">{i + 1}</Text>
                </Box>
                <Text fontSize="sm" color="gray.600">{s}</Text>
              </HStack>
            ))}
          </VStack>
        </Box>

        <Grid templateColumns="1fr 1fr" gap={3}>
          <GridItem>
            <Button
              variant="outline" borderColor="brand.400"
              color="brand.700" _hover={{ bg: 'brand.50' }}
              onClick={() => navigate('/report')} w="full"
            >
              Report another
            </Button>
          </GridItem>
          <GridItem>
            <Button
              bg="brand.600" color="white" _hover={{ bg: 'brand.700' }}
              onClick={() => navigate('/dashboard')} w="full"
            >
              View dashboard
            </Button>
          </GridItem>
        </Grid>
      </VStack>
    </Box>
  )
}
