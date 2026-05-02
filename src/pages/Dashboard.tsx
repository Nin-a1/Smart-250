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

const sevDot: Record<string, string> = {
  low: '#16a34a', medium: '#d97706', high: '#dc2626',
}

function IssueCard({ issue }: { issue: Issue }) {
  return (
    <Box
      bg="white" border="1px solid" borderColor="gray.100"
      borderRadius="xl" p={5}
      _hover={{ shadow: 'sm', borderColor: 'brand.200' }}
      transition="all 0.2s"
    >
      <VStack align="stretch" gap={3}>
        <HStack justify="space-between" flexWrap="wrap" gap={2}>
          <Text fontSize="xs" fontFamily="mono" color="gray.400">{issue.id}</Text>
          <HStack gap={2}>
            <Box w="8px" h="8px" borderRadius="full" bg={sevDot[issue.severity]} />
            <Badge
              colorPalette={issue.status === 'resolved' ? 'green' : 'orange'}
              variant="subtle" fontSize="10px" textTransform="capitalize"
            >
              {issue.status.replace('_', ' ')}
            </Badge>
          </HStack>
        </HStack>

        {(issue.photoUrl || issue.photoBase64) && (
          <img
            src={issue.photoUrl || issue.photoBase64} alt="issue"
            style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8 }}
          />
        )}

        <Text fontWeight="700" fontSize="sm" color="gray.800">{issue.title}</Text>
        <Text
          fontSize="xs" color="gray.500" lineHeight="tall"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {issue.description}
        </Text>

        <VStack align="start" gap={1}>
          <Text fontSize="xs" color="gray.400">📍 {issue.location}</Text>
          <Text fontSize="xs" color="gray.400">🏛️ {issue.institution}</Text>
        </VStack>

        <Text fontSize="xs" color="gray.400">
          Reported {new Date(issue.createdAt).toLocaleDateString('en-RW')}
          {issue.resolvedAt &&
            ` · Resolved ${new Date(issue.resolvedAt).toLocaleDateString('en-RW')}`}
        </Text>

        {issue.status === 'resolved' && issue.resolutionConfidence && (
          <Box bg="green.50" border="1px solid" borderColor="green.200" borderRadius="md" px={2} py={1}>
            <Text fontSize="xs" color="green.700" fontWeight="600">
              AI confidence: {issue.resolutionConfidence}%
            </Text>
          </Box>
        )}
      </VStack>
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
      // Real-time Firestore listener — no polling needed
      const q = query(collection(db, 'issues'), orderBy('createdAt', 'desc'))
      return onSnapshot(q, snap => {
        setIssues(snap.docs.map(d => d.data() as Issue))
      })
    } else {
      // localStorage fallback with polling
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
      return (
        i.title.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q) ||
        i.issueType.toLowerCase().includes(q)
      )
    })

  return (
    <Box maxW="1100px" mx="auto" py={10} px={6}>
      <VStack gap={8} align="stretch">

        <HStack justify="space-between" flexWrap="wrap" gap={4}>
          <VStack align="start" gap={1}>
            <Heading fontSize="2xl" fontWeight="800" color="gray.800">
              Live Issue Dashboard
            </Heading>
            <Text fontSize="sm" color="gray.500">
              All reported civic issues in Kigali · real-time
            </Text>
          </VStack>
          <HStack gap={3}>
            <Button
              size="sm"
              bg={confirmClear ? 'red.600' : 'white'}
              color={confirmClear ? 'white' : 'red.500'}
              border="1px solid"
              borderColor={confirmClear ? 'red.600' : 'red.200'}
              _hover={{ bg: confirmClear ? 'red.700' : 'red.50' }}
              disabled={clearing}
              onClick={async () => {
                if (!confirmClear) {
                  setConfirmClear(true)
                  setTimeout(() => setConfirmClear(false), 4000)
                  return
                }
                setClearing(true)
                setConfirmClear(false)
                try {
                  await clearAllIssues()
                  setIssues([])
                } finally {
                  setClearing(false)
                }
              }}
            >
              {clearing ? 'Clearing…' : confirmClear ? '⚠️ Confirm clear all' : '🗑 Clear database'}
            </Button>
            <Button
              bg="brand.600" color="white" _hover={{ bg: 'brand.700' }} fontWeight="700"
              onClick={() => navigate('/report')}
            >
              + Report Issue
            </Button>
          </HStack>
        </HStack>

        {/* Stats */}
        <Grid templateColumns="repeat(3, 1fr)" gap={4}>
          {[
            { label: 'Total',    value: issues.length, color: 'gray.700' },
            { label: 'Open',     value: open,          color: 'orange.600' },
            { label: 'Resolved', value: resolved,      color: 'green.600' },
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

        {/* Filters + view toggle */}
        <HStack gap={3} flexWrap="wrap">
          {(['all', 'open', 'in_progress', 'resolved'] as const).map(f => (
            <Button
              key={f} size="sm"
              bg={filter === f ? 'brand.600' : 'white'}
              color={filter === f ? 'white' : 'gray.600'}
              border="1px solid"
              borderColor={filter === f ? 'brand.600' : 'gray.200'}
              _hover={{ borderColor: 'brand.400' }}
              onClick={() => setFilter(f)}
              textTransform="capitalize"
            >
              {f.replace('_', ' ')}
            </Button>
          ))}
          <Input
            placeholder="Search title, location, type…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            maxW="260px" size="sm" borderColor="gray.200"
            _focusVisible={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #0F6E56' }}
          />

          {/* View toggle */}
          <HStack gap={1} ml="auto" bg="gray.100" borderRadius="lg" p={1}>
            <Button
              size="sm" h="28px" px={3}
              bg={viewMode === 'grid' ? 'white' : 'transparent'}
              color={viewMode === 'grid' ? 'gray.800' : 'gray.500'}
              shadow={viewMode === 'grid' ? 'sm' : 'none'}
              _hover={{}}
              borderRadius="md"
              onClick={() => setViewMode('grid')}
            >
              ▦ Grid
            </Button>
            <Button
              size="sm" h="28px" px={3}
              bg={viewMode === 'map' ? 'white' : 'transparent'}
              color={viewMode === 'map' ? 'gray.800' : 'gray.500'}
              shadow={viewMode === 'map' ? 'sm' : 'none'}
              _hover={{}}
              borderRadius="md"
              onClick={() => setViewMode('map')}
            >
              🗺 Map
            </Button>
          </HStack>
        </HStack>

        {/* Map view */}
        {viewMode === 'map' && (
          <IssueMap issues={visible} height="500px" />
        )}

        {/* Grid view */}
        {viewMode === 'grid' && (
          visible.length === 0 ? (
            <Box textAlign="center" py={20}>
              <Text fontSize="3xl" mb={3}>📭</Text>
              <Text color="gray.400" fontSize="lg" fontWeight="600">No issues found</Text>
              <Text color="gray.400" fontSize="sm" mt={1}>
                {issues.length === 0
                  ? 'Be the first to report an issue in Kigali.'
                  : 'Try a different filter or search term.'}
              </Text>
              {issues.length === 0 && (
                <Button
                  mt={6} bg="brand.600" color="white" _hover={{ bg: 'brand.700' }}
                  onClick={() => navigate('/report')}
                >
                  Report the first issue →
                </Button>
              )}
            </Box>
          ) : (
            <Grid
              templateColumns={{ base: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(3,1fr)' }}
              gap={5}
            >
              {visible.map(issue => (
                <GridItem key={issue.id}>
                  <IssueCard issue={issue} />
                </GridItem>
              ))}
            </Grid>
          )
        )}
      </VStack>
    </Box>
  )
}
