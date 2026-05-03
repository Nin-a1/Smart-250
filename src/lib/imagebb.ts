const IMGBB_URL = 'https://api.imgbb.com/1/upload'

export async function uploadImage(dataUrl: string): Promise<string> {
  const key = import.meta.env.VITE_IMGBB_API_KEY
  if (!key) throw new Error('VITE_IMGBB_API_KEY is not set')

  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')
  const body = new FormData()
  body.append('key', key)
  body.append('image', base64)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30_000)

  try {
    const res = await fetch(IMGBB_URL, { method: 'POST', body, signal: controller.signal })
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText)
      throw new Error(`ImageBB ${res.status}: ${text}`)
    }
    const data = await res.json() as { data: { url: string }; success: boolean }
    if (!data.success) throw new Error('ImageBB upload unsuccessful')
    return data.data.url
  } finally {
    clearTimeout(timer)
  }
}
