import { Box, Flex, Text, Button, HStack } from '@chakra-ui/react'
import { useNavigate, Link } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  return (
    <Box bg="brand.600" px={6} py={4} shadow="sm">
      <Flex maxW="1100px" mx="auto" align="center" justify="space-between">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Text fontSize="lg" fontWeight="800" color="white" letterSpacing="tight">
            🚨 Smart Kigali Alert
          </Text>
        </Link>
        <HStack gap={3}>
          <Button
            variant="ghost" color="white" size="sm"
            _hover={{ bg: 'brand.700' }}
            onClick={() => navigate('/dashboard')}
          >
            Live Dashboard
          </Button>
          <Button
            bg="white" color="brand.700" size="sm" fontWeight="700"
            _hover={{ bg: 'brand.50' }}
            onClick={() => navigate('/report')}
          >
            Report Issue
          </Button>
        </HStack>
      </Flex>
    </Box>
  )
}
