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

const SEV_COLOR: Record<string, string> = { low: 'green', medium: 'orange', high: 'red' }
const SEV_DOT:   Record<string, string> = { low: '#16a34a', medium: '#d97706', high: '#dc2626' }

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
    getIssues().then(all => setIssues(all.filter(i => i.institution.toLowerCase().includes(keyword))))
  }, [])

  const logout = () => { localStorage.removeItem('ska_agent'); navigate('/agent') }

  const daysSince = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000)

  const simulateFriday = async () => {
    if (!agent) return
    const keyword = agent.institution.toLowerCase().split(' ')[0]
    const open = (await getOpenIssues()).filter(i => i.institution.toLowerCase().includes(keyword))
    if (open.length === 0) { toaster.create({ title: 'No open issues to remind about', type: 'info' }); return }
    setFridayLoading(true)
    try {
      const body = await generateFridayReminder(agent.institution, open)
      await sendEmail({
        toEmail: 'admin@kigalicity.gov.rw', toName: agent.institution,
        issueId: 'FRIDAY-REMINDER',
        issueTitle: `Friday Reminder — ${open.length} open issue(s)`,
        location: 'Kigali, Rwanda', severity: 'medium',
        reporterName: 'Smart Kigali Alert System', reporterPhone: '', body,
      })
      toaster.create({ title: `📅 Friday reminder sent for ${open.length} issue(s)`, type: 'success' })
    } catch {
      toaster.create({ title: 'Could not send reminder', type: 'error' })
    } finally {
      setFridayLoading(false)
    }
  }

  const open     = issues.filter(i => i.status !== 'resolved')
  const resolved = issues.filter(i => i.status === 'resolved')

  return (
    <Box bg="gray.50" minH="100vh">
      <Box maxW="1100px" mx="auto" py={10} px={6}>
        <VStack gap={8} align="stretch">

          {/* Header */}
          <HStack justify="space-between" flexWrap="wrap" gap={4}>
            <VStack align="start" gap={1}>
              <HStack gap={2}>
                <Box bg="brand.600" color="white" borderRadius="lg" px={2} py={1} fontSize="xs" fontWeight="800">
                  AGENT
                </Box>
                <Heading fontSize="xl" fontWeight="800" color="gray.900" letterSpacing="-0.02em">
                  {agent?.institution}
                </Heading>
              </HStack>
              <Text fontSize="sm" color="gray.500">Agent dashboard · manage your institution's issues</Text>
            </VStack>
            <HStack gap={2}>
              <Button
                size="sm" variant="outline" borderColor="orange.200" color="orange.600"
                bg="white" _hover={{ bg: 'orange.50' }} borderRadius="lg"
                onClick={simulateFriday} disabled={fridayLoading}
              >
                {fridayLoading
                  ? <HStack gap={2}><Spinner size="xs" /><Text>Sending…</Text></HStack>
                  : '📅 Friday Reminder'}
              </Button>
              <Button size="sm" variant="ghost" color="gray.500" _hover={{ color: 'gray.700', bg: 'gray.100' }} borderRadius="lg" onClick={logout}>
                Log out
              </Button>
            </HStack>
          </HStack>

          {/* Stats */}
          <Grid templateColumns="repeat(3,1fr)" gap={4}>
            {[
              { label: 'Total Assigned', value: issues.length, color: 'gray.900', bg: 'white' },
              { label: 'Open',           value: open.length,   color: 'orange.600', bg: 'orange.50' },
              { label: 'Resolved',       value: resolved.length, color: 'green.600', bg: 'green.50' },
            ].map(s => (
              <GridItem key={s.label}>
                <Box bg={s.bg} borderRadius="xl" p={5} textAlign="center" border="1px solid" borderColor="gray.100" shadow="0 1px 4px rgba(0,0,0,0.04)">
                  <Text fontSize="3xl" fontWeight="800" color={s.color} letterSpacing="-0.02em">{s.value}</Text>
                  <Text fontSize="xs" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="0.05em" mt={1}>{s.label}</Text>
                </Box>
              </GridItem>
            ))}
          </Grid>

          {/* Open issues */}
          <Box>
            <HStack justify="space-between" mb={4}>
              <Text fontWeight="700" fontSize="lg" color="gray.900">Open Issues</Text>
              <Badge colorPalette="orange" variant="subtle" borderRadius="full" px={3}>
                {open.length} pending
              </Badge>
            </HStack>

            {open.length === 0 ? (
              <Box bg="green.50" border="1px solid" borderColor="green.200" borderRadius="xl" p={12} textAlign="center">
                <Text fontSize="3xl" mb={3}>🎉</Text>
                <Text fontWeight="700" color="green.700" fontSize="lg">All issues resolved!</Text>
                <Text fontSize="sm" color="green.600" mt={1}>No pending issues for your institution.</Text>
              </Box>
            ) : (
              <VStack gap={3} align="stretch">
                {open.map(issue => (
                  <Box
                    key={issue.id} bg="white" borderRadius="xl" overflow="hidden"
                    border="1px solid" borderColor="gray.100"
                    shadow="0 1px 4px rgba(0,0,0,0.04)"
                    _hover={{ shadow: '0 4px 16px rgba(0,0,0,0.08)', borderColor: 'gray.200' }}
                    transition="all 0.15s"
                  >
                    <Box h="3px" bg={SEV_DOT[issue.severity]} />
                    <Box p={5}>
                      <HStack justify="space-between" flexWrap="wrap" gap={3}>
                        <HStack gap={4} flex={1} align="start">
                          {/* Thumbnail */}
                          {(issue.photoUrl || issue.photoBase64) && (
                            <Box flexShrink={0} borderRadius="lg" overflow="hidden" w="80px" h="64px">
                              <img
                                src={issue.photoUrl || issue.photoBase64} alt="issue"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </Box>
                          )}
                          <VStack align="start" gap={1} flex={1} minW={0}>
                            <HStack gap={2} flexWrap="wrap">
                              <Text fontSize="10px" fontFamily="mono" fontWeight="600" color="gray.400">{issue.id}</Text>
                              <Badge colorPalette={SEV_COLOR[issue.severity]} variant="subtle" fontSize="10px" borderRadius="full" textTransform="capitalize">
                                {issue.severity}
                              </Badge>
                              <Badge colorPalette="orange" variant="subtle" fontSize="10px" borderRadius="full">
                                {daysSince(issue.createdAt)}d open
                              </Badge>
                            </HStack>
                            <Text fontWeight="700" fontSize="sm" color="gray.900">{issue.title}</Text>
                            <Text fontSize="xs" color="gray.500">📍 {issue.location}</Text>
                            <Text fontSize="xs" color="gray.400" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{issue.description}</Text>
                          </VStack>
                        </HStack>
                        <Button
                          bg="brand.600" color="white" size="sm" fontWeight="700"
                          borderRadius="lg" flexShrink={0}
                          _hover={{ bg: 'brand.700' }}
                          onClick={() => navigate(`/agent/resolve/${issue.id}`)}
                        >
                          Resolve →
                        </Button>
                      </HStack>
                    </Box>
                  </Box>
                ))}
              </VStack>
            )}
          </Box>

          {/* Resolved history */}
          {resolved.length > 0 && (
            <Box>
              <Text fontWeight="700" fontSize="lg" color="gray.900" mb={4}>Resolved Issues</Text>
              <VStack gap={3} align="stretch">
                {resolved.map(issue => (
                  <Box
                    key={issue.id} bg="white" borderRadius="xl" p={5}
                    border="1px solid" borderColor="gray.100"
                    shadow="0 1px 4px rgba(0,0,0,0.04)"
                  >
                    <HStack justify="space-between" flexWrap="wrap" gap={3}>
                      <HStack gap={3} flex={1} minW={0}>
                        {(issue.resolutionPhotoUrl || issue.photoUrl || issue.photoBase64) && (
                          <Box flexShrink={0} borderRadius="lg" overflow="hidden" w="56px" h="44px" opacity={0.7}>
                            <img
                              src={issue.resolutionPhotoUrl || issue.photoUrl || issue.photoBase64} alt="resolved"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </Box>
                        )}
                        <VStack align="start" gap={0} minW={0}>
                          <HStack gap={2}>
                            <Text fontSize="10px" fontFamily="mono" color="gray.400">{issue.id}</Text>
                            <Badge colorPalette="green" variant="subtle" fontSize="10px" borderRadius="full">✓ Resolved</Badge>
                          </HStack>
                          <Text fontSize="sm" fontWeight="600" color="gray.700">{issue.title}</Text>
                          <Text fontSize="xs" color="gray.400">📍 {issue.location}</Text>
                        </VStack>
                      </HStack>
                      {issue.resolutionConfidence && (
                        <VStack align="end" gap={0}>
                          <Text fontSize="xs" color="gray.400">AI confidence</Text>
                          <Text fontWeight="800" color="green.600" fontSize="xl" letterSpacing="-0.02em">
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
    </Box>
  )
}
