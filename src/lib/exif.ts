export interface GpsCoords {
  lat: number
  lon: number
}

export async function extractGpsFromFile(file: File): Promise<GpsCoords | null> {
  try {
    const exifr = await import('exifr')
    const gps = await exifr.gps(file)
    if (gps?.latitude != null && gps?.longitude != null) {
      return { lat: gps.latitude, lon: gps.longitude }
    }
    return null
  } catch {
    return null
  }
}
