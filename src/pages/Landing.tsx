import {
  Box, VStack, HStack, Text, Heading,
  Button, Grid, GridItem,
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'

const features = [
  {
    icon: '📸',
    title: 'Snap & Report',
    desc: 'Upload a photo of any urban issue. No login needed — just your name and phone number.',
  },
  {
    icon: '🤖',
    title: 'AI Identifies & Routes',
    desc: 'Gemini AI analyzes the photo, identifies the issue, and finds the right Kigali institution using Google Search.',
  },
  {
    icon: '📧',
    title: 'Instant Institution Alert',
    desc: 'An email is automatically sent to the responsible authority with your full report.',
  },
  {
    icon: '✅',
    title: 'AI-Verified Resolution',
    desc: 'When an agent uploads a fix, AI compares before and after photos to confirm it is truly resolved.',
  },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <Box>
      {/* Hero */}
      <Box bg="brand.600" py={{ base: 16, md: 24 }} px={6}>
        <VStack gap={6} maxW="680px" mx="auto" textAlign="center">
          <Text
            fontSize="xs" fontWeight="700" color="brand.200"
            textTransform="uppercase" letterSpacing="widest"
          >
            City & Community · SMART-250 Lyftathon · Kigali, Rwanda
          </Text>
          <Heading
            fontSize={{ base: '3xl', md: '5xl' }}
            color="white" fontWeight="800" lineHeight="1.15"
          >
            See a problem in Kigali?{' '}
            <Text as="span" color="brand.200">Report it in 30 seconds.</Text>
          </Heading>
          <Text fontSize={{ base: 'md', md: 'lg' }} color="brand.100" maxW="520px">
            Our AI alerts the right institution automatically and follows up every
            Friday until the issue is fixed.
          </Text>
          <HStack gap={4} pt={2} flexWrap="wrap" justify="center">
            <Button
              size="lg" bg="white" color="brand.700" fontWeight="800" px={8}
              _hover={{ bg: 'brand.50', transform: 'translateY(-2px)' }}
              transition="all 0.2s"
              onClick={() => navigate('/report')}
            >
              📸 Report an Issue
            </Button>
            <Button
              size="lg" variant="outline" color="white"
              borderColor="whiteAlpha.600"
              _hover={{ bg: 'brand.700' }}
              onClick={() => navigate('/agent/login')}
            >
              🏛️ I am an Agent
            </Button>
          </HStack>
          <Button
            variant="ghost" color="brand.200" size="sm"
            _hover={{ color: 'white' }}
            onClick={() => navigate('/dashboard')}
          >
            View live issue dashboard →
          </Button>
        </VStack>
      </Box>

      {/* Stats bar */}
      <Box bg="brand.700" py={5} px={6}>
        <HStack
          maxW="800px" mx="auto" justify="center"
          gap={{ base: 8, md: 20 }} flexWrap="wrap"
        >
          {[
            { num: 'AI-Powered', label: 'Issue detection' },
            { num: 'Real-time', label: 'Institution alerts' },
            { num: 'Verified', label: 'Resolution checks' },
          ].map(s => (
            <VStack key={s.label} gap={0} textAlign="center">
              <Text fontSize="md" fontWeight="700" color="white">{s.num}</Text>
              <Text fontSize="xs" color="brand.200">{s.label}</Text>
            </VStack>
          ))}
        </HStack>
      </Box>

      {/* How it works */}
      <Box py={20} px={6} bg="white">
        <VStack gap={12} maxW="1100px" mx="auto">
          <VStack gap={2} textAlign="center">
            <Heading fontSize="2xl" fontWeight="700" color="gray.800">
              How Smart Kigali Alert works
            </Heading>
            <Text color="gray.500">Powered by Gemini AI and Google Search grounding</Text>
          </VStack>
          <Grid
            templateColumns={{ base: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' }}
            gap={6} w="full"
          >
            {features.map((f, i) => (
              <GridItem key={f.title}>
                <Box
                  p={6} borderRadius="xl" border="1.5px solid" borderColor="gray.100"
                  _hover={{ shadow: 'md', borderColor: 'brand.200' }}
                  transition="all 0.2s" h="full"
                >
                  <VStack align="start" gap={3}>
                    <HStack>
                      <Text fontSize="2xl">{f.icon}</Text>
                      <Box
                        w="20px" h="20px" borderRadius="full" bg="brand.600"
                        display="flex" alignItems="center" justifyContent="center"
                      >
                        <Text fontSize="10px" fontWeight="800" color="white">{i + 1}</Text>
                      </Box>
                    </HStack>
                    <Text fontWeight="700" fontSize="md" color="gray.800">{f.title}</Text>
                    <Text fontSize="sm" color="gray.500" lineHeight="tall">{f.desc}</Text>
                  </VStack>
                </Box>
              </GridItem>
            ))}
          </Grid>
        </VStack>
      </Box>

      {/* Two entrances */}
      <Box py={16} px={6} bg="brand.50">
        <Grid
          templateColumns={{ base: '1fr', md: '1fr 1fr' }}
          gap={6} maxW="800px" mx="auto"
        >
          <Box
            bg="white" p={8} borderRadius="2xl"
            border="1.5px solid" borderColor="brand.200" textAlign="center"
          >
            <Text fontSize="3xl" mb={3}>👤</Text>
            <Heading fontSize="xl" fontWeight="700" color="gray.800" mb={2}>
              I spotted an issue
            </Heading>
            <Text fontSize="sm" color="gray.500" mb={6} lineHeight="tall">
              Take a photo, add your location and contact info. AI does the rest.
            </Text>
            <Button
              bg="brand.600" color="white" _hover={{ bg: 'brand.700' }}
              w="full" fontWeight="700"
              onClick={() => navigate('/report')}
            >
              Report an Issue →
            </Button>
          </Box>
          <Box
            bg="white" p={8} borderRadius="2xl"
            border="1.5px solid" borderColor="gray.200" textAlign="center"
          >
            <Text fontSize="3xl" mb={3}>🏛️</Text>
            <Heading fontSize="xl" fontWeight="700" color="gray.800" mb={2}>
              I am a city agent
            </Heading>
            <Text fontSize="sm" color="gray.500" mb={6} lineHeight="tall">
              Log in to see your institution's issues and upload resolution proof.
            </Text>
            <Button
              variant="outline" borderColor="brand.400" color="brand.700"
              _hover={{ bg: 'brand.50' }} w="full" fontWeight="700"
              onClick={() => navigate('/agent/login')}
            >
              Agent Portal →
            </Button>
          </Box>
        </Grid>
      </Box>
    </Box>
  )
}

