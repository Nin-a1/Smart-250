import { useState, useEffect } from 'react'
import {
  Box, VStack, HStack, Text, Heading,
  Button, Badge, Grid, GridItem, Spinner,
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { toaster } from '../lib/toaster'
import { getIssues, getOpenIssues } from '../lib/storage'
import { generateFridayReminder } from '../lib/gemini'
import { sendEmail } from '../lib/email'
import { Issue } from '../types'

const sevColor: Record<string, string> = {
  low: 'green', medium: 'orange', high: 'red',
}

export default function AgentDashboard() {
  const navigate = useNavigate()
  const [agent, setAgent] = useState<{ institution: string; code: string } | null>(null)
  const [issues, setIssues] = useState<Issue[]>([])
  const [fridayLoading, setFridayLoading] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('ska_agent')
    if (!saved) { navigate('/agent'); return }
    const a = JSON.parse(saved)
    setAgent(a)
    const keyword = a.institution.toLowerCase().split(' ')[0]
    getIssues().then(all =>
      setIssues(all.filter(i => i.institution.toLowerCase().includes(keyword)))
    )
  }, [])

  const logout = () => {
    localStorage.removeItem('ska_agent')
    navigate('/agent')
  }

  const daysSince = (dateStr: string) =>
    Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)

  const simulateFriday = async () => {
    if (!agent) return
    const keyword = agent.institution.toLowerCase().split(' ')[0]
    const open = (await getOpenIssues()).filter(i =>
      i.institution.toLowerCase().includes(keyword)
    )
    if (open.length === 0) {
      toaster.create({ title: 'No open issues to remind about', type: 'info' })
      return
    }
    setFridayLoading(true)
    try {
      const body = await generateFridayReminder(agent.institution, open)
      await sendEmail({
        toEmail:      'admin@kigalicity.gov.rw',
        toName:       agent.institution,
        issueId:      'FRIDAY-REMINDER',
        issueTitle:   `Friday Reminder — ${open.length} open issue(s)`,
        location:     'Kigali, Rwanda',
        severity:     'medium',
        reporterName: 'Smart Kigali Alert System',
        reporterPhone: '',
        body,
      })
      toaster.create({
        title: `📅 Friday reminder sent for ${open.length} issue(s)`,
        type: 'success',
      })
    } catch {
      toaster.create({ title: 'Could not send reminder', type: 'error' })
    } finally {
      setFridayLoading(false)
    }
  }

  const open     = issues.filter(i => i.status !== 'resolved')
  const resolved = issues.filter(i => i.status === 'resolved')

  return (
    <Box maxW="1000px" mx="auto" py={10} px={6}>
      <VStack gap={8} align="stretch">

        {/* Header */}
        <HStack justify="space-between" flexWrap="wrap" gap={4}>
          <VStack align="start" gap={1}>
            <HStack gap={2}>
              <Text fontSize="xl">🏛️</Text>
              <Heading fontSize="xl" fontWeight="800" color="gray.800">
                {agent?.institution}
              </Heading>
            </HStack>
            <Text fontSize="sm" color="gray.500">
              Agent dashboard · manage your institution's issues
            </Text>
          </VStack>
          <HStack gap={3}>
            <Button
              size="sm" variant="outline"
              borderColor="orange.300" color="orange.600"
              _hover={{ bg: 'orange.50' }}
              onClick={simulateFriday} disabled={fridayLoading}
            >
              {fridayLoading
                ? <HStack gap={2}><Spinner size="xs" /><Text>Sending…</Text></HStack>
                : '📅 Simulate Friday Reminder'}
            </Button>
            <Button
              size="sm" variant="ghost" color="gray.500" onClick={logout}
            >
              Log out
            </Button>
          </HStack>
        </HStack>

        {/* Stats */}
        <Grid templateColumns="repeat(3,1fr)" gap={4}>
          {[
            { label: 'Total assigned', value: issues.length, color: 'gray.700' },
            { label: 'Open',           value: open.length,   color: 'orange.600' },
            { label: 'Resolved',       value: resolved.length, color: 'green.600' },
          ].map(s => (
            <GridItem key={s.label}>
              <Box
                bg="white" border="1px solid" borderColor="gray.100"
                borderRadius="xl" p={5} textAlign="center"
              >
                <Text fontSize="3xl" fontWeight="800" color={s.color}>{s.value}</Text>
                <Text fontSize="sm" color="gray.500">{s.label}</Text>
              </Box>
            </GridItem>
          ))}
        </Grid>

        {/* Open issues */}
        <Box>
          <HStack justify="space-between" mb={4}>
            <Text fontWeight="700" fontSize="lg" color="gray.800">Open Issues</Text>
            <Badge colorPalette="orange" variant="subtle">
              {open.length} pending
            </Badge>
          </HStack>

          {open.length === 0 ? (
            <Box
              bg="green.50" border="1px solid" borderColor="green.200"
              borderRadius="xl" p={8} textAlign="center"
            >
              <Text fontSize="2xl" mb={2}>🎉</Text>
              <Text fontWeight="700" color="green.700">All issues resolved!</Text>
              <Text fontSize="sm" color="green.500" mt={1}>
                Great work. No pending issues for your institution.
              </Text>
            </Box>
          ) : (
            <VStack gap={3} align="stretch">
              {open.map(issue => (
                <Box
                  key={issue.id} bg="white" border="1px solid" borderColor="gray.100"
                  borderRadius="xl" p={5}
                  _hover={{ shadow: 'sm', borderColor: 'brand.200' }}
                  transition="all 0.15s"
                >
                  <HStack justify="space-between" flexWrap="wrap" gap={3}>
                    <VStack align="start" gap={1} flex={1}>
                      <HStack gap={2} flexWrap="wrap">
                        <Text fontSize="xs" fontFamily="mono" color="gray.400">
                          {issue.id}
                        </Text>
                        <Badge
                          colorPalette={sevColor[issue.severity]}
                          variant="subtle" fontSize="10px" textTransform="capitalize"
                        >
                          {issue.severity}
                        </Badge>
                        <Badge colorPalette="orange" variant="subtle" fontSize="10px">
                          Open {daysSince(issue.createdAt)}d
                        </Badge>
                      </HStack>
                      <Text fontWeight="700" fontSize="sm" color="gray.800">
                        {issue.title}
                      </Text>
                      <Text fontSize="xs" color="gray.500">📍 {issue.location}</Text>
                      <Text fontSize="xs" color="gray.400" lineHeight="tall">
                        {issue.description}
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        Reported by {issue.reporterName} · {issue.reporterPhone}
                      </Text>
                    </VStack>
                    <VStack gap={2} align="end">
                      {(issue.photoUrl || issue.photoBase64) && (
                        <img
                          src={issue.photoUrl || issue.photoBase64} alt="issue"
                          style={{ width: 90, height: 68, objectFit: 'cover', borderRadius: 8 }}
                        />
                      )}
                      <Button
                        size="sm" bg="brand.600" color="white"
                        _hover={{ bg: 'brand.700' }} fontWeight="700" w="90px"
                        onClick={() => navigate(`/agent/resolve/${issue.id}`)}
                      >
                        Resolve →
                      </Button>
                    </VStack>
                  </HStack>
                </Box>
              ))}
            </VStack>
          )}
        </Box>

        {/* Resolved history */}
        {resolved.length > 0 && (
          <Box>
            <Text fontWeight="700" fontSize="lg" color="gray.800" mb={4}>
              Resolved Issues
            </Text>
            <VStack gap={3} align="stretch">
              {resolved.map(issue => (
                <Box
                  key={issue.id} bg="gray.50" border="1px solid"
                  borderColor="gray.100" borderRadius="xl" p={4}
                >
                  <HStack justify="space-between" flexWrap="wrap" gap={2}>
                    <VStack align="start" gap={0}>
                      <HStack gap={2}>
                        <Text fontSize="xs" fontFamily="mono" color="gray.400">
                          {issue.id}
                        </Text>
                        <Badge colorPalette="green" variant="subtle" fontSize="10px">
                          Resolved
                        </Badge>
                      </HStack>
                      <Text fontSize="sm" fontWeight="600" color="gray.700">
                        {issue.title}
                      </Text>
                      <Text fontSize="xs" color="gray.400">📍 {issue.location}</Text>
                    </VStack>
                    {issue.resolutionConfidence && (
                      <VStack align="end" gap={0}>
                        <Text fontSize="xs" color="gray.400">AI confidence</Text>
                        <Text fontWeight="700" color="green.600" fontSize="lg">
                          {issue.resolutionConfidence}%
                        </Text>
                      </VStack>
                    )}
                  </HStack>
                </Box>
              ))}
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  )
}

