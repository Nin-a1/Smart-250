import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Box, Badge, Text, VStack, HStack } from '@chakra-ui/react'
import { Issue } from '../types'

// Fix Leaflet's bundled marker icons not resolving in Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
})

const SEV_COLOR: Record<string, string> = {
  low: '#16a34a',
  medium: '#d97706',
  high: '#dc2626',
}

function coloredIcon(severity: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:14px;height:14px;border-radius:50%;
      background:${SEV_COLOR[severity] ?? '#6b7280'};
      border:2px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

interface Props {
  issues: Issue[]
  height?: string
}

// Kigali city centre
const KIGALI: [number, number] = [-1.9441, 30.0619]

export default function IssueMap({ issues, height = '420px' }: Props) {
  const mapped = issues.filter(i => i.lat !== undefined && i.lon !== undefined)

  // Invalidate map size when issues change (e.g. after container becomes visible)
  useEffect(() => {
    window.dispatchEvent(new Event('resize'))
  }, [issues])

  const center: [number, number] =
    mapped.length > 0 ? [mapped[0].lat!, mapped[0].lon!] : KIGALI

  return (
    <Box borderRadius="xl" overflow="hidden" border="1px solid" borderColor="gray.200" shadow="sm">
      <MapContainer
        center={center}
        zoom={mapped.length > 0 ? 14 : 13}
        style={{ height, width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {mapped.map(issue => (
          <Marker
            key={issue.id}
            position={[issue.lat!, issue.lon!]}
            icon={coloredIcon(issue.severity)}
          >
            <Popup maxWidth={260}>
              <VStack align="start" gap={1} style={{ padding: '4px 0' }}>
                <Text fontWeight="700" fontSize="sm" color="gray.800">
                  {issue.title}
                </Text>
                <HStack gap={2}>
                  <Badge
                    colorPalette={issue.status === 'resolved' ? 'green' : 'orange'}
                    variant="subtle"
                    fontSize="10px"
                    textTransform="capitalize"
                  >
                    {issue.status.replace('_', ' ')}
                  </Badge>
                  <Badge
                    colorPalette={
                      issue.severity === 'high'
                        ? 'red'
                        : issue.severity === 'medium'
                          ? 'orange'
                          : 'green'
                    }
                    variant="subtle"
                    fontSize="10px"
                    textTransform="capitalize"
                  >
                    {issue.severity}
                  </Badge>
                </HStack>
                <Text fontSize="xs" color="gray.500">
                  📍 {issue.location}
                </Text>
                <Text fontSize="xs" color="gray.400">
                  🏛️ {issue.institution}
                </Text>
                <Text fontSize="xs" color="gray.400" fontFamily="mono">
                  {issue.id}
                </Text>
              </VStack>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <HStack gap={4} px={4} py={2} bg="white" borderTop="1px solid" borderColor="gray.100">
        {Object.entries(SEV_COLOR).map(([sev, color]) => (
          <HStack key={sev} gap={1}>
            <Box w="10px" h="10px" borderRadius="full" bg={color} />
            <Text fontSize="xs" color="gray.500" textTransform="capitalize">{sev}</Text>
          </HStack>
        ))}
        <Text fontSize="xs" color="gray.400" ml="auto">
          {mapped.length} of {issues.length} issues on map
        </Text>
      </HStack>
    </Box>
  )
}
