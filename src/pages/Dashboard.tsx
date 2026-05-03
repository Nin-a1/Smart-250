import { useState, useEffect } from 'react'
import {
  Box, VStack, HStack, Text, Heading,
  Button, Badge, Grid, GridItem, Input,
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import { getIssues, clearAllIssues } from '../lib/storage'
import IssueMap from '../components/IssueMap'
import { Issue, IssueStatus } from '../types'

const SEV_BAR: Record<string, string> = {
  low: '#16a34a', medium: '#d97706', high: '#dc2626',
}
const SEV_LABEL: Record<string, string> = {
  low: 'green', medium: 'orange', high: 'red',
}

function IssueCard({ issue }: { issue: Issue }) {
  const resolved = issue.status === 'resolved'
  return (
    <Box
      bg="white" borderRadius="xl" overflow="hidden"
      border="1px solid" borderColor="gray.100"
      shadow="0 1px 4px rgba(0,0,0,0.04)"
      _hover={{ shadow: '0 6px 20px rgba(0,0,0,0.08)', borderColor: 'gray.200', transform: 'translateY(-2px)' }}
      transition="all 0.2s"
      position="relative"
    >
      {/* Severity accent bar */}
      <Box h="3px" bg={SEV_BAR[issue.severity]} />

      {/* Photo */}
      {(issue.photoUrl || issue.photoBase64) && (
        <Box h="160px" overflow="hidden" bg="gray.100">
          <img
            src={issue.photoUrl || issue.photoBase64} alt="issue"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </Box>
      )}

      <Box p={5}>
        <VStack align="stretch" gap={3}>
          {/* ID + status */}
          <HStack justify="space-between" flexWrap="wrap" gap={2}>
            <Text fontSize="10px" fontFamily="mono" fontWeight="600" color="gray.400" letterSpacing="0.05em">
              {issue.id}
            </Text>
            <Badge
              colorPalette={resolved ? 'green' : 'orange'}
              variant="subtle" fontSize="10px" borderRadius="full" px={2}
              textTransform="capitalize"
            >
              {resolved ? '✓ Resolved' : '● Open'}
            </Badge>
          </HStack>

          {/* Title */}
          <Text fontWeight="700" fontSize="sm" color="gray.900" lineHeight="1.4">
            {issue.title}
          </Text>

          {/* Description */}
          <Text
            fontSize="xs" color="gray.500" lineHeight="1.6"
            style={{
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}
          >
            {issue.description}
          </Text>

          {/* Meta */}
          <VStack align="start" gap={1}>
            <HStack gap={1}>
              <Text fontSize="xs" color="gray.400">📍</Text>
              <Text fontSize="xs" color="gray.500" overflow="hidden" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{issue.location}</Text>
            </HStack>
            <HStack gap={1}>
              <Text fontSize="xs" color="gray.400">🏛️</Text>
              <Text fontSize="xs" color="gray.500" overflow="hidden" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{issue.institution}</Text>
            </HStack>
          </VStack>

          {/* Footer row */}
          <HStack justify="space-between" pt={1} borderTop="1px solid" borderColor="gray.50">
            <HStack gap={2}>
              <Badge colorPalette={SEV_LABEL[issue.severity]} variant="subtle" fontSize="9px" borderRadius="full" textTransform="capitalize">
                {issue.severity}
              </Badge>
              <Badge colorPalette="purple" variant="subtle" fontSize="9px" borderRadius="full" textTransform="capitalize">
                {issue.issueType}
              </Badge>
            </HStack>
            <Text fontSize="10px" color="gray.400">
              {new Date(issue.createdAt).toLocaleDateString('en-RW', { day: 'numeric', month: 'short' })}
            </Text>
          </HStack>

          {resolved && issue.resolutionConfidence && (
            <Box bg="green.50" borderRadius="lg" px={3} py={2}>
              <Text fontSize="xs" color="green.700" fontWeight="600">
                🤖 AI confidence: {issue.resolutionConfidence}%
              </Text>
            </Box>
          )}
        </VStack>
      </Box>
    </Box>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [issues, setIssues] = useState<Issue[]>([])
  const [filter, setFilter] = useState<IssueStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
  const [clearing, setClearing] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => {
    if (isFirebaseConfigured) {
      const q = query(collection(db, 'issues'), orderBy('createdAt', 'desc'))
      return onSnapshot(q, snap => setIssues(snap.docs.map(d => d.data() as Issue)))
    } else {
      getIssues().then(setIssues)
      const t = setInterval(() => getIssues().then(setIssues), 5000)
      return () => clearInterval(t)
    }
  }, [])

  const open     = issues.filter(i => i.status !== 'resolved').length
  const resolved = issues.filter(i => i.status === 'resolved').length

  const visible = issues
    .filter(i => filter === 'all' || i.status === filter)
    .filter(i => {
      if (!search) return true
      const q = search.toLowerCase()
      return i.title.toLowerCase().includes(q) || i.location.toLowerCase().includes(q) || i.issueType.toLowerCase().includes(q)
    })

  const filterBtns: { key: IssueStatus | 'all'; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'resolved', label: 'Resolved' },
  ]

  return (
    <Box bg="gray.50" minH="100vh">
      <Box maxW="1200px" mx="auto" py={10} px={6}>
        <VStack gap={8} align="stretch">

          {/* Header */}
          <HStack justify="space-between" flexWrap="wrap" gap={4}>
            <VStack align="start" gap={1}>
              <Heading fontSize="2xl" fontWeight="800" color="gray.900" letterSpacing="-0.02em">
                Live Issue Dashboard
              </Heading>
              <Text fontSize="sm" color="gray.500">
                All reported civic issues in Kigali · updates in real-time
              </Text>
            </VStack>
            <HStack gap={3}>
              <Button
                size="sm" variant="outline"
                borderColor={confirmClear ? 'red.400' : 'gray.200'}
                color={confirmClear ? 'red.600' : 'gray.500'}
                bg={confirmClear ? 'red.50' : 'white'}
                _hover={{ borderColor: 'red.300', color: 'red.600', bg: 'red.50' }}
                borderRadius="lg"
                disabled={clearing}
                onClick={async () => {
                  if (!confirmClear) { setConfirmClear(true); setTimeout(() => setConfirmClear(false), 4000); return }
                  setClearing(true); setConfirmClear(false)
                  try { await clearAllIssues(); setIssues([]) } finally { setClearing(false) }
                }}
              >
                {clearing ? 'Clearing…' : confirmClear ? '⚠️ Confirm clear' : '🗑 Clear all'}
              </Button>
              <Button
                bg="brand.600" color="white" fontWeight="700" borderRadius="lg"
                _hover={{ bg: 'brand.700' }} onClick={() => navigate('/report')}
              >
                + Report Issue
              </Button>
            </HStack>
          </HStack>

          {/* Stats */}
          <Grid templateColumns="repeat(3, 1fr)" gap={4}>
            {[
              { label: 'Total Issues', value: issues.length, color: 'gray.900', bg: 'white' },
              { label: 'Open',         value: open,          color: 'orange.600', bg: 'orange.50' },
              { label: 'Resolved',     value: resolved,      color: 'green.600',  bg: 'green.50' },
            ].map(s => (
              <GridItem key={s.label}>
                <Box
                  bg={s.bg} borderRadius="xl" p={5} textAlign="center"
                  border="1px solid" borderColor="gray.100"
                  shadow="0 1px 4px rgba(0,0,0,0.04)"
                >
                  <Text fontSize="3xl" fontWeight="800" color={s.color} letterSpacing="-0.02em">
                    {s.value}
                  </Text>
                  <Text fontSize="xs" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="0.05em" mt={1}>
                    {s.label}
                  </Text>
                </Box>
              </GridItem>
            ))}
          </Grid>

          {/* Filters */}
          <HStack gap={2} flexWrap="wrap">
            {filterBtns.map(f => (
              <Button
                key={f.key} size="sm" borderRadius="full"
                bg={filter === f.key ? 'brand.600' : 'white'}
                color={filter === f.key ? 'white' : 'gray.600'}
                border="1px solid"
                borderColor={filter === f.key ? 'brand.600' : 'gray.200'}
                fontWeight={filter === f.key ? '700' : '500'}
                _hover={{ borderColor: 'brand.400', color: filter === f.key ? 'white' : 'brand.600' }}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </Button>
            ))}
            <Input
              placeholder="Search issues…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              maxW="240px" size="sm" borderRadius="full"
              bg="white" borderColor="gray.200"
              _focusVisible={{ borderColor: 'brand.500', boxShadow: '0 0 0 2px rgba(15,110,86,0.15)' }}
            />
            {/* View toggle */}
            <HStack gap={1} ml="auto" bg="gray.200" borderRadius="full" p="3px">
              {(['grid', 'map'] as const).map(v => (
                <Button
                  key={v} size="xs" h="26px" px={3} borderRadius="full"
                  bg={viewMode === v ? 'white' : 'transparent'}
                  color={viewMode === v ? 'gray.800' : 'gray.500'}
                  shadow={viewMode === v ? 'sm' : 'none'}
                  fontWeight={viewMode === v ? '600' : '400'}
                  _hover={{}} onClick={() => setViewMode(v)}
                >
                  {v === 'grid' ? '▦ Grid' : '🗺 Map'}
                </Button>
              ))}
            </HStack>
          </HStack>

          {/* Map */}
          {viewMode === 'map' && <IssueMap issues={visible} height="500px" />}

          {/* Grid */}
          {viewMode === 'grid' && (
            visible.length === 0 ? (
              <Box
                bg="white" borderRadius="2xl" p={20} textAlign="center"
                border="1px solid" borderColor="gray.100"
              >
                <Text fontSize="4xl" mb={4}>📭</Text>
                <Text fontWeight="700" color="gray.700" fontSize="lg" mb={1}>No issues found</Text>
                <Text color="gray.400" fontSize="sm" mb={6}>
                  {issues.length === 0 ? 'Be the first to report an issue in Kigali.' : 'Try a different filter or search term.'}
                </Text>
                {issues.length === 0 && (
                  <Button bg="brand.600" color="white" _hover={{ bg: 'brand.700' }} borderRadius="lg"
                    onClick={() => navigate('/report')}>
                    Report the first issue →
                  </Button>
                )}
              </Box>
            ) : (
              <Grid templateColumns={{ base: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(3,1fr)' }} gap={5}>
                {visible.map(issue => (
                  <GridItem key={issue.id}><IssueCard issue={issue} /></GridItem>
                ))}
              </Grid>
            )
          )}
        </VStack>
      </Box>
    </Box>
  )
}
