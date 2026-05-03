import { useState } from 'react'
import { Box, VStack, HStack, Text, Heading, Button, Input } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { toaster } from '../lib/toaster'

const INSTITUTIONS = [
  { name: 'Rwanda Transport Development Agency', code: 'RTDA',      passcode: 'rtda2026'  },
  { name: 'City of Kigali — Sanitation',         code: 'COK_SAN',   passcode: 'san2026'   },
  { name: 'Rwanda Energy Group (REG / EUCL)',     code: 'REG',       passcode: 'reg2026'   },
  { name: 'Water and Sanitation Corp (WASAC)',    code: 'WASAC',     passcode: 'wasac2026' },
  { name: 'City of Kigali — Urban Planning',      code: 'COK_URBAN', passcode: 'urban2026' },
]

export default function AgentLogin() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<typeof INSTITUTIONS[0] | null>(null)
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')

  const login = () => {
    if (!selected)                      { setError('Select your institution first'); return }
    if (passcode !== selected.passcode) { setError('Incorrect passcode');            return }
    localStorage.setItem('ska_agent', JSON.stringify({
      institution: selected.name,
      code:        selected.code,
      loggedInAt:  new Date().toISOString(),
    }))
    toaster.create({ title: `Welcome, ${selected.name.split(' ')[0]} team`, type: 'success' })
    navigate('/agent/dashboard')
  }

  return (
    <Box bg="gray.50" minH="100vh" py={16} px={6}>
      <Box maxW="480px" mx="auto">
        <VStack gap={8} align="stretch">

          {/* Header */}
          <VStack gap={3} textAlign="center">
            <Box
              w="56px" h="56px" bg="brand.600" borderRadius="xl"
              display="flex" alignItems="center" justifyContent="center" mx="auto"
            >
              <Text fontSize="2xl">🏛️</Text>
            </Box>
            <Heading fontSize="2xl" fontWeight="800" color="gray.900" letterSpacing="-0.02em">
              Agent Portal
            </Heading>
            <Text fontSize="sm" color="gray.500" lineHeight="1.7">
              Log in to manage and resolve issues assigned to your institution.
            </Text>
          </VStack>

          {/* Institution picker */}
          <Box bg="white" borderRadius="xl" p={5} border="1px solid" borderColor="gray.100" shadow="0 1px 4px rgba(0,0,0,0.04)">
            <Text fontWeight="700" fontSize="sm" mb={3} color="gray.700">
              Select your institution
            </Text>
            <VStack gap={2} align="stretch">
              {INSTITUTIONS.map(inst => (
                <Box
                  key={inst.code}
                  px={4} py={3} borderRadius="lg" border="1.5px solid"
                  borderColor={selected?.code === inst.code ? 'brand.500' : 'gray.100'}
                  bg={selected?.code === inst.code ? 'brand.50' : 'gray.50'}
                  cursor="pointer"
                  _hover={{ borderColor: 'brand.300', bg: 'brand.50' }}
                  transition="all 0.15s"
                  onClick={() => { setSelected(inst); setError('') }}
                >
                  <HStack justify="space-between">
                    <Text
                      fontSize="sm"
                      fontWeight={selected?.code === inst.code ? '700' : '500'}
                      color={selected?.code === inst.code ? 'brand.700' : 'gray.700'}
                    >
                      {inst.name}
                    </Text>
                    {selected?.code === inst.code && (
                      <Box w="8px" h="8px" borderRadius="full" bg="brand.500" flexShrink={0} />
                    )}
                  </HStack>
                </Box>
              ))}
            </VStack>
          </Box>

          {/* Passcode */}
          <Box bg="white" borderRadius="xl" p={5} border="1px solid" borderColor="gray.100" shadow="0 1px 4px rgba(0,0,0,0.04)">
            <Text fontWeight="700" fontSize="sm" mb={3} color="gray.700">Passcode</Text>
            <Input
              type="password"
              placeholder="Enter your institution passcode"
              value={passcode}
              onChange={e => { setPasscode(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && login()}
              borderColor={error ? 'red.300' : 'gray.200'}
              bg="gray.50" borderRadius="lg"
              _focusVisible={{ borderColor: 'brand.500', bg: 'white', boxShadow: '0 0 0 2px rgba(15,110,86,0.15)' }}
            />
            {error && (
              <Text fontSize="xs" color="red.500" mt={2} fontWeight="500">{error}</Text>
            )}

            {/* Demo hints */}
            <Box mt={4} p={4} bg="gray.50" borderRadius="lg" border="1px dashed" borderColor="gray.200">
              <Text fontSize="xs" fontWeight="700" color="gray.500" mb={3} textTransform="uppercase" letterSpacing="0.05em">
                Demo passcodes
              </Text>
              <VStack gap={1.5} align="stretch">
                {INSTITUTIONS.map(inst => (
                  <HStack key={inst.code} justify="space-between">
                    <Text fontSize="xs" color="gray.500" flex={1} overflow="hidden"
                      style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {inst.name.split('—')[0].split('(')[0].trim()}
                    </Text>
                    <Text
                      fontSize="xs" fontFamily="mono" fontWeight="700" color="brand.600"
                      cursor="pointer" flexShrink={0}
                      _hover={{ color: 'brand.800' }}
                      onClick={() => { setSelected(inst); setPasscode(inst.passcode); setError('') }}
                    >
                      {inst.passcode}
                    </Text>
                  </HStack>
                ))}
              </VStack>
              <Text fontSize="10px" color="gray.400" mt={2}>Click any passcode to auto-fill</Text>
            </Box>
          </Box>

          <Button
            size="lg" bg="brand.600" color="white" fontWeight="800"
            borderRadius="xl" h="52px"
            _hover={{ bg: 'brand.700', transform: 'translateY(-1px)', shadow: 'lg' }}
            transition="all 0.15s"
            onClick={login}
          >
            Log in to Agent Portal →
          </Button>
        </VStack>
      </Box>
    </Box>
  )
}
