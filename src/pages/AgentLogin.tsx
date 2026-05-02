import { useState } from 'react'
import {
  Box, VStack, Text, Heading, Button, Input,
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { toaster } from '../lib/toaster'

const INSTITUTIONS = [
  { name: 'Rwanda Transport Development Agency', code: 'RTDA',      passcode: 'rtda2026' },
  { name: 'City of Kigali — Sanitation',         code: 'COK_SAN',   passcode: 'san2026'  },
  { name: 'Rwanda Energy Group (REG / EUCL)',     code: 'REG',       passcode: 'reg2026'  },
  { name: 'Water and Sanitation Corp (WASAC)',    code: 'WASAC',     passcode: 'wasac2026'},
  { name: 'City of Kigali — Urban Planning',      code: 'COK_URBAN', passcode: 'urban2026'},
]

export default function AgentLogin() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<typeof INSTITUTIONS[0] | null>(null)
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')

  const login = () => {
    if (!selected)                    { setError('Select your institution'); return }
    if (passcode !== selected.passcode) { setError('Incorrect passcode');      return }
    localStorage.setItem(
      'ska_agent',
      JSON.stringify({
        institution: selected.name,
        code:        selected.code,
        loggedInAt:  new Date().toISOString(),
      })
    )
    toaster.create({ title: `Welcome, ${selected.name.split(' ')[0]}`, type: 'success' })
    navigate('/agent/dashboard')
  }

  return (
    <Box maxW="480px" mx="auto" py={16} px={6}>
      <VStack gap={8} align="stretch">

        <VStack gap={2} textAlign="center">
          <Text fontSize="3xl">🏛️</Text>
          <Heading fontSize="2xl" fontWeight="800" color="gray.800">
            Agent Portal
          </Heading>
          <Text fontSize="sm" color="gray.500">
            Log in to manage and resolve issues for your institution.
          </Text>
        </VStack>

        <Box>
          <Text fontWeight="600" fontSize="sm" mb={3} color="gray.700">
            Select your institution
          </Text>
          <VStack gap={2} align="stretch">
            {INSTITUTIONS.map(inst => (
              <Box
                key={inst.code}
                p={4} borderRadius="xl" border="1.5px solid"
                borderColor={selected?.code === inst.code ? 'brand.500' : 'gray.200'}
                bg={selected?.code === inst.code ? 'brand.50' : 'white'}
                cursor="pointer"
                _hover={{ borderColor: 'brand.300', bg: 'brand.50' }}
                transition="all 0.15s"
                onClick={() => { setSelected(inst); setError('') }}
              >
                <Text
                  fontSize="sm"
                  fontWeight={selected?.code === inst.code ? '700' : '500'}
                  color={selected?.code === inst.code ? 'brand.700' : 'gray.700'}
                >
                  {inst.name}
                </Text>
              </Box>
            ))}
          </VStack>
        </Box>

        <Box>
          <Text fontWeight="600" fontSize="sm" mb={2} color="gray.700">
            Passcode
          </Text>
          <Input
            type="password"
            placeholder="Enter your institution passcode"
            value={passcode}
            onChange={e => { setPasscode(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && login()}
            borderColor={error ? 'red.300' : 'gray.200'}
            _focusVisible={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #0F6E56' }}
          />
          {error && <Text fontSize="xs" color="red.500" mt={1}>{error}</Text>}
          <Text fontSize="xs" color="gray.400" mt={2}>
            Demo: institution code + 2026 · e.g. <Text as="span" fontFamily="mono">rtda2026</Text>
          </Text>
        </Box>

        <Button
          size="lg" bg="brand.600" color="white"
          _hover={{ bg: 'brand.700' }} fontWeight="800"
          onClick={login} h="52px"
        >
          Log in to Agent Portal →
        </Button>
      </VStack>
    </Box>
  )
}
