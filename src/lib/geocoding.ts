export interface GeocodedLocation {
  address: string
  lat: number
  lon: number
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeocodedLocation | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'User-Agent': 'SmartKigaliAlert/1.0 (hassandayisaba@gmail.com)' } },
    )
    if (!res.ok) return null

    const data = await res.json() as {
      display_name?: string
      address?: { road?: string; suburb?: string; city?: string; country?: string }
    }

    // Build a short readable address, falling back to full display_name
    const a = data.address
    const short = [a?.road, a?.suburb, a?.city]
      .filter(Boolean)
      .join(', ')

    return {
      address: short || data.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
      lat,
      lon,
    }
  } catch {
    return null
  }
}
