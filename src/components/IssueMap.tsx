import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Issue } from '../types'

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
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${SEV_COLOR[severity] ?? '#6b7280'};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

const KIGALI: [number, number] = [-1.9441, 30.0619]

interface Props {
  issues: Issue[]
  height?: string
}

export default function IssueMap({ issues, height = '420px' }: Props) {
  const mapped = issues.filter(i => i.lat !== undefined && i.lon !== undefined)

  useEffect(() => {
    window.dispatchEvent(new Event('resize'))
  }, [issues])

  const center: [number, number] =
    mapped.length > 0 ? [mapped[0].lat!, mapped[0].lon!] : KIGALI

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
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
              <div style={{ padding: '4px 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#111827', margin: 0 }}>{issue.title}</p>
                <div style={{ display: 'flex', gap: 4 }}>
                  <span style={{
                    fontSize: 10, padding: '1px 6px', borderRadius: 9999, fontWeight: 600,
                    background: issue.status === 'resolved' ? '#dcfce7' : '#fff7ed',
                    color: issue.status === 'resolved' ? '#15803d' : '#c2410c',
                    textTransform: 'capitalize',
                  }}>
                    {issue.status.replace('_', ' ')}
                  </span>
                  <span style={{
                    fontSize: 10, padding: '1px 6px', borderRadius: 9999, fontWeight: 600,
                    background: issue.severity === 'high' ? '#fee2e2' : issue.severity === 'medium' ? '#fff7ed' : '#dcfce7',
                    color: issue.severity === 'high' ? '#dc2626' : issue.severity === 'medium' ? '#d97706' : '#16a34a',
                    textTransform: 'capitalize',
                  }}>
                    {issue.severity}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>📍 {issue.location}</p>
                <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>🏛️ {issue.institution}</p>
                <p style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace', margin: 0 }}>{issue.id}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="flex items-center gap-4 px-4 py-2 bg-white border-t border-gray-100">
        {Object.entries(SEV_COLOR).map(([sev, color]) => (
          <div key={sev} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <span className="text-xs text-gray-500 capitalize">{sev}</span>
          </div>
        ))}
        <span className="text-xs text-gray-400 ml-auto">
          {mapped.length} of {issues.length} issues on map
        </span>
      </div>
    </div>
  )
}
