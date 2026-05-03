import { Box, VStack, HStack, Text, Heading, Button, Grid, GridItem } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'

const steps = [
  { icon: '📸', n: '01', title: 'Snap & Report', desc: 'Upload a photo of any urban issue. No account needed — just your name and phone.' },
  { icon: '🤖', n: '02', title: 'AI Analyzes', desc: 'Groq AI identifies the problem type, severity, and the right institution to contact.' },
  { icon: '📧', n: '03', title: 'Auto-Alert', desc: 'A formal report email is sent instantly to the responsible Kigali authority.' },
  { icon: '✅', n: '04', title: 'Verified Fix', desc: 'City agents upload proof. AI compares before & after photos to confirm resolution.' },
]

const stats = [
  { value: 'AI-Powered', label: 'Issue detection & routing' },
  { value: 'Real-time', label: 'Institution alerts' },
  { value: '300 m GPS', label: 'On-site verification' },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <Box bg="gray.50">

      {/* Hero */}
      <Box
        backgroundImage="linear-gradient(135deg, #073B2F 0%, #0F6E56 55%, #2EA682 100%)"
        py={{ base: 20, md: 32 }} px={6}
        position="relative" overflow="hidden"
      >
        <Box position="absolute" top="-140px" right="-140px" w="420px" h="420px"
          borderRadius="full" border="1px solid" borderColor="whiteAlpha.100" pointerEvents="none" />
        <Box position="absolute" top="-70px" right="-70px" w="280px" h="280px"
          borderRadius="full" border="1px solid" borderColor="whiteAlpha.150" pointerEvents="none" />
        <Box position="absolute" bottom="-100px" left="-100px" w="350px" h="350px"
          borderRadius="full" border="1px solid" borderColor="whiteAlpha.80" pointerEvents="none" />

        <VStack gap={7} maxW="680px" mx="auto" textAlign="center" position="relative">
          <Box bg="whiteAlpha.200" borderRadius="full" px={5} py={1.5} display="inline-flex">
            <Text fontSize="xs" fontWeight="700" color="brand.100" letterSpacing="0.08em">
              🇷🇼  CIVIC TECH · KIGALI, RWANDA
            </Text>
          </Box>

          <Heading
            fontSize={{ base: '3xl', md: '5xl' }} fontWeight="800"
            color="white" lineHeight="1.1" letterSpacing="-0.02em"
          >
            See a problem in Kigali?{' '}
            <Text as="span" color="brand.200">Report it in 30 seconds.</Text>
          </Heading>

          <Text fontSize={{ base: 'md', md: 'lg' }} color="brand.100" maxW="500px" lineHeight="1.75">
            AI identifies the issue, alerts the right authority, and follows up every Friday
            until it's fixed — all automatically.
          </Text>

          <HStack gap={3} flexWrap="wrap" justify="center" pt={2}>
            <Button
              size="lg" bg="white" color="brand.700" fontWeight="800"
              px={8} borderRadius="full" shadow="lg"
              _hover={{ bg: 'brand.50', transform: 'translateY(-2px)', shadow: 'xl' }}
              transition="all 0.2s"
              onClick={() => navigate('/report')}
            >
              📸 Report an Issue
            </Button>
            <Button
              size="lg" variant="outline" color="white"
              borderColor="whiteAlpha.400" borderRadius="full" fontWeight="600"
              _hover={{ bg: 'whiteAlpha.100', borderColor: 'white' }}
              transition="all 0.2s"
              onClick={() => navigate('/dashboard')}
            >
              View Live Dashboard →
            </Button>
          </HStack>
        </VStack>
      </Box>

      {/* Stats strip */}
      <Box bg="brand.700" py={5} px={6}>
        <HStack maxW="800px" mx="auto" justify="center" gap={{ base: 8, md: 24 }} flexWrap="wrap">
          {stats.map(s => (
            <VStack key={s.label} gap={0} textAlign="center">
              <Text fontSize="md" fontWeight="800" color="white">{s.value}</Text>
              <Text fontSize="xs" color="brand.200" fontWeight="500">{s.label}</Text>
            </VStack>
          ))}
        </HStack>
      </Box>

      {/* How it works */}
      <Box py={24} px={6} bg="white">
        <VStack gap={16} maxW="1100px" mx="auto">
          <VStack gap={3} textAlign="center">
            <Text fontSize="xs" fontWeight="700" color="brand.600" letterSpacing="0.1em" textTransform="uppercase">
              How it works
            </Text>
            <Heading fontSize={{ base: '2xl', md: '3xl' }} fontWeight="800" color="gray.900" letterSpacing="-0.02em">
              From photo to resolution — fully automated
            </Heading>
            <Text color="gray.500" fontSize="md" maxW="480px" lineHeight="1.7">
              Four steps, zero manual routing. The right institution is alerted within seconds.
            </Text>
          </VStack>

          <Grid
            templateColumns={{ base: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' }}
            gap={5} w="full"
          >
            {steps.map(s => (
              <GridItem key={s.title}>
                <Box
                  bg="white" p={7} borderRadius="xl" h="full"
                  border="1px solid" borderColor="gray.100"
                  shadow="0 1px 4px rgba(0,0,0,0.04)"
                  _hover={{
                    shadow: '0 8px 24px rgba(15,110,86,0.1)',
                    borderColor: 'brand.200',
                    transform: 'translateY(-3px)',
                  }}
                  transition="all 0.2s"
                >
                  <VStack align="start" gap={4}>
                    <HStack justify="space-between" w="full">
                      <Text fontSize="2xl">{s.icon}</Text>
                      <Text fontSize="xs" fontWeight="800" color="gray.200" fontFamily="mono">{s.n}</Text>
                    </HStack>
                    <Box>
                      <Text fontWeight="700" fontSize="md" color="gray.900" mb={2}>{s.title}</Text>
                      <Text fontSize="sm" color="gray.500" lineHeight="1.75">{s.desc}</Text>
                    </Box>
                  </VStack>
                </Box>
              </GridItem>
            ))}
          </Grid>
        </VStack>
      </Box>

      {/* Two entry points */}
      <Box py={24} px={6} bg="gray.50">
        <VStack gap={10} maxW="820px" mx="auto">
          <VStack gap={2} textAlign="center">
            <Heading fontSize={{ base: 'xl', md: '2xl' }} fontWeight="800" color="gray.900" letterSpacing="-0.02em">
              Who are you?
            </Heading>
            <Text color="gray.500">Choose your entry point.</Text>
          </VStack>

          <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={5} w="full">
            <Box
              bg="white" p={8} borderRadius="2xl"
              border="1.5px solid" borderColor="brand.200"
              shadow="0 2px 12px rgba(15,110,86,0.08)"
              _hover={{ shadow: '0 8px 28px rgba(15,110,86,0.15)', transform: 'translateY(-3px)' }}
              transition="all 0.2s" cursor="pointer"
              onClick={() => navigate('/report')}
            >
              <VStack align="start" gap={5}>
                <Box bg="brand.50" p={3} borderRadius="xl" display="inline-flex">
                  <Text fontSize="2xl">👤</Text>
                </Box>
                <Box>
                  <Text fontWeight="800" fontSize="lg" color="gray.900" mb={1}>I spotted an issue</Text>
                  <Text fontSize="sm" color="gray.500" lineHeight="1.75">
                    Upload a photo, share your location. AI handles identification, routing and follow-up.
                  </Text>
                </Box>
                <Button bg="brand.600" color="white" w="full" fontWeight="700" borderRadius="lg" _hover={{ bg: 'brand.700' }}>
                  Report an Issue →
                </Button>
              </VStack>
            </Box>

            <Box
              bg="white" p={8} borderRadius="2xl"
              border="1.5px solid" borderColor="gray.200"
              shadow="0 2px 8px rgba(0,0,0,0.04)"
              _hover={{ shadow: '0 8px 24px rgba(0,0,0,0.1)', transform: 'translateY(-3px)', borderColor: 'gray.300' }}
              transition="all 0.2s" cursor="pointer"
              onClick={() => navigate('/agent/login')}
            >
              <VStack align="start" gap={5}>
                <Box bg="gray.100" p={3} borderRadius="xl" display="inline-flex">
                  <Text fontSize="2xl">🏛️</Text>
                </Box>
                <Box>
                  <Text fontWeight="800" fontSize="lg" color="gray.900" mb={1}>I am a city agent</Text>
                  <Text fontSize="sm" color="gray.500" lineHeight="1.75">
                    Log in to your institution's portal, manage issues, and upload resolution proof.
                  </Text>
                </Box>
                <Button variant="outline" borderColor="gray.300" color="gray.700" w="full" fontWeight="700" borderRadius="lg" _hover={{ bg: 'gray.50' }}>
                  Agent Portal →
                </Button>
              </VStack>
            </Box>
          </Grid>
        </VStack>
      </Box>

      {/* Footer */}
      <Box bg="brand.900" py={8} px={6} textAlign="center">
        <Text fontSize="sm" fontWeight="600" color="brand.300" mb={1}>Smart Kigali Alert</Text>
        <Text fontSize="xs" color="brand.700">Built for the SMART-250 Hackathon · Kigali, Rwanda · 2026</Text>
      </Box>
    </Box>
  )
}
