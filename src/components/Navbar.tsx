import { Box, Button, Flex, HStack, Text } from '@chakra-ui/react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isActive = (to: string) => pathname === to || (to !== '/' && pathname.startsWith(to))

  return (
    <Box
      bg="white"
      borderBottom="1px solid"
      borderColor="gray.100"
      px={6} py={3}
      position="sticky" top={0} zIndex={100}
      shadow="0 1px 3px rgba(0,0,0,0.05)"
    >
      <Flex maxW="1200px" mx="auto" align="center">

        <Link to="/" style={{ textDecoration: 'none' }}>
          <HStack gap={2}>
            <Box
              bg="brand.600" color="white" borderRadius="8px"
              px="8px" py="4px" fontSize="11px" fontWeight="800" letterSpacing="0.05em"
            >
              SKA
            </Box>
            <Text fontSize="sm" fontWeight="700" color="gray.900" letterSpacing="-0.01em">
              Smart Kigali Alert
            </Text>
          </HStack>
        </Link>

        <HStack gap={1} ml="auto">
          <Button
            variant="ghost" size="sm" borderRadius="lg"
            color={isActive('/dashboard') ? 'brand.600' : 'gray.600'}
            fontWeight={isActive('/dashboard') ? '600' : '500'}
            bg={isActive('/dashboard') ? 'brand.50' : 'transparent'}
            _hover={{ color: 'brand.600', bg: 'brand.50' }}
            onClick={() => navigate('/dashboard')}
          >
            Live Dashboard
          </Button>
          <Button
            variant="ghost" size="sm" borderRadius="lg"
            color={isActive('/agent') ? 'brand.600' : 'gray.600'}
            fontWeight={isActive('/agent') ? '600' : '500'}
            bg={isActive('/agent') ? 'brand.50' : 'transparent'}
            _hover={{ color: 'brand.600', bg: 'brand.50' }}
            onClick={() => navigate('/agent/login')}
          >
            Agent Portal
          </Button>
          <Button
            bg="brand.600" color="white" size="sm" fontWeight="700"
            px={5} borderRadius="full"
            _hover={{ bg: 'brand.700', transform: 'translateY(-1px)' }}
            transition="all 0.15s"
            onClick={() => navigate('/report')}
          >
            Report Issue
          </Button>
        </HStack>
      </Flex>
    </Box>
  )
}
