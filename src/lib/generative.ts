import { Issue, Severity } from '../types'

const GEMINI_MODEL = 'gemini-1.5-flash'
const GEMINI_URL = (model: string, key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`

// Kigali institution directory — used instead of live search
const INSTITUTIONS: Record<string, { institution: string; institutionEmail: string; institutionReason: string }> = {
  pothole:        { institution: 'Rwanda Transport Development Agency (RTDA)', institutionEmail: 'info@rtda.gov.rw',                      institutionReason: 'Road surface maintenance and pothole repair falls under the Rwanda Transport Development Agency (RTDA).' },
  streetlight:    { institution: 'City of Kigali – Infrastructure Department', institutionEmail: 'infrastructure@kigalicity.gov.rw',       institutionReason: 'Public street lighting is managed by the City of Kigali Infrastructure Department.' },
  waste:          { institution: 'Rwanda Environment Management Authority (REMA)', institutionEmail: 'info@rema.gov.rw',                   institutionReason: 'Illegal waste dumping and environmental cleanliness is regulated by REMA.' },
  flooding:       { institution: 'City of Kigali – Water & Sanitation', institutionEmail: 'water@kigalicity.gov.rw',                      institutionReason: 'Drainage, flooding, and water management in Kigali is the mandate of City of Kigali Water & Sanitation.' },
  sidewalk:       { institution: 'Rwanda Transport Development Agency (RTDA)', institutionEmail: 'info@rtda.gov.rw',                      institutionReason: 'Pedestrian walkways and sidewalk infrastructure are maintained by RTDA.' },
  infrastructure: { institution: 'City of Kigali – Infrastructure Department', institutionEmail: 'infrastructure@kigalicity.gov.rw',       institutionReason: 'General urban infrastructure defects are handled by the City of Kigali Infrastructure Department.' },
  other:          { institution: 'City of Kigali', institutionEmail: 'info@kigalicity.gov.rw',                                           institutionReason: 'This issue has been routed to the City of Kigali for initial assessment and assignment to the correct department.' },
}

function parseJSON<T>(raw: string): T | null {
  try {
    const clean = raw.replace(/```json|```/g, '').trim()
    const m = clean.match(/\{[\s\S]*\}/)
    return m ? JSON.parse(m[0]) : null
  } catch {
    return null
  }
}

type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } }

async function geminiGenerate(
  parts: GeminiPart[],
  _attempt = 0,
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not set')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30_000)

  try {
    const res = await fetch(GEMINI_URL(GEMINI_MODEL, apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }] }),
      signal: controller.signal,
    })

    if (!res.ok) {
      if ((res.status === 429 || res.status >= 500) && _attempt < 2) {
        clearTimeout(timer)
        await new Promise(r => setTimeout(r, (_attempt + 1) * 2000))
        return geminiGenerate(parts, _attempt + 1)
      }
      const body = await res.text().catch(() => res.statusText)
      let detail = res.statusText
      try {
        const parsed = JSON.parse(body) as { error?: { message?: string } }
        detail = parsed?.error?.message ?? detail
      } catch { /* use statusText */ }
      throw new Error(`Gemini ${res.status}: ${detail}`)
    }

    const data = await res.json() as {
      candidates?: { content: { parts: { text: string }[] } }[]
    }
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!content) throw new Error('Gemini returned an empty response — please try again.')
    return content
  } finally {
    clearTimeout(timer)
  }
}

// ── Call 1: Analyze photo with vision ─────────────────────────────────────────

export interface AnalysisResult {
  issueType: string
  title: string
  description: string
  severity: Severity
  institution: string
  institutionEmail: string
  institutionReason: string
  isRealIssue: boolean
}

export async function analyzeIssue(
  photoBase64: string,
  location: string,
): Promise<AnalysisResult> {
  const base64 = photoBase64.replace(/^data:image\/\w+;base64,/, '')

  const parts: GeminiPart[] = [
    { inline_data: { mime_type: 'image/jpeg', data: base64 } },
    {
      text: `You are the AI engine for Smart Kigali Alert, a civic issue reporting system in Kigali, Rwanda. Analyze this photo.
Location reported: ${location}

Return ONLY valid JSON (no markdown, no explanation):
{
  "issueType": "pothole | streetlight | waste | flooding | sidewalk | infrastructure | other",
  "title": "Short specific title for this exact issue",
  "description": "2-3 sentences describing what you see and its impact on Kigali residents",
  "severity": "low | medium | high",
  "isRealIssue": true
}`,
    },
  ]

  let text = ''
  try {
    text = await geminiGenerate(parts)
  } catch (err) {
    console.error('[analyzeIssue] Gemini error:', err)
  }

  const visionData = parseJSON<Omit<AnalysisResult, 'institution' | 'institutionEmail'>>(text) ?? {
    issueType: 'other',
    title: 'Urban issue reported in Kigali',
    description: 'A civic issue has been reported and requires attention.',
    severity: 'medium' as Severity,
    isRealIssue: true,
  }

  const instData = INSTITUTIONS[visionData.issueType] ?? INSTITUTIONS.other

  return { ...visionData, ...instData, isRealIssue: visionData.isRealIssue ?? true }
}

// ── Call 2: Generate formal email body ────────────────────────────────────────

export async function generateEmailBody(issue: Issue): Promise<string> {
  return geminiGenerate([
    {
      text: `Write a formal civic report email body to ${issue.institution} on behalf of Smart Kigali Alert.

Issue ID:      ${issue.id}
Type:          ${issue.issueType}
Title:         ${issue.title}
Location:      ${issue.location}
Severity:      ${issue.severity}
Description:   ${issue.description}
Reported by:   ${issue.reporterName} (${issue.reporterPhone})
Date:          ${new Date(issue.createdAt).toLocaleDateString('en-RW')}

Write only the email body. Be professional and concise. End by asking them to acknowledge receipt and confirm action taken, referencing the Issue ID.`,
    },
  ])
}

// ── Call 3: Verify resolution — compare before and after photos ───────────────

export interface ResolutionVerdict {
  resolved: boolean
  confidence: number
  reasoning: string
}

function photoUrl(b64OrUrl: string): string {
  // Firebase Storage URLs and other https:// links pass through directly
  if (b64OrUrl.startsWith('http')) return b64OrUrl
  const base64 = b64OrUrl.replace(/^data:image\/\w+;base64,/, '')
  return `data:image/jpeg;base64,${base64}`
}

export async function verifyResolution(
  beforeB64OrUrl: string,
  afterB64OrUrl: string,
  issueTitle: string,
): Promise<ResolutionVerdict> {
  const beforeData = photoUrl(beforeB64OrUrl)
  const afterData = photoUrl(afterB64OrUrl)

  const beforePart: GeminiPart = beforeData.startsWith('http')
    ? { text: `BEFORE image URL: ${beforeData}` }
    : { inline_data: { mime_type: 'image/jpeg', data: beforeData.replace(/^data:image\/\w+;base64,/, '') } }

  const afterPart: GeminiPart = afterData.startsWith('http')
    ? { text: `AFTER image URL: ${afterData}` }
    : { inline_data: { mime_type: 'image/jpeg', data: afterData.replace(/^data:image\/\w+;base64,/, '') } }

  const text = await geminiGenerate([
    {
      text: `You are verifying whether a civic issue in Kigali has been resolved.
Issue: "${issueTitle}"
The FIRST image is BEFORE (the reported problem).
The SECOND image is AFTER (the claimed resolution).
Study both photos carefully.

Return ONLY valid JSON (no markdown):
{
  "resolved": true,
  "confidence": 85,
  "reasoning": "One clear sentence explaining your verdict"
}`,
    },
    beforePart,
    afterPart,
  ])

  return (
    parseJSON<ResolutionVerdict>(text) ?? {
      resolved: false,
      confidence: 0,
      reasoning: 'Verification inconclusive — please try again.',
    }
  )
}

// ── Call 4: Friday accountability reminder ────────────────────────────────────

export async function generateFridayReminder(
  institution: string,
  issues: Issue[],
): Promise<string> {
  const list = issues
    .map(
      i =>
        `- ${i.id}: "${i.title}" at ${i.location} ` +
        `(open since ${new Date(i.createdAt).toLocaleDateString('en-RW')})`,
    )
    .join('\n')

  return geminiGenerate([
    {
      text: `Write a Friday accountability reminder email from Smart Kigali Alert to ${institution}.

They have ${issues.length} unresolved issue(s) in Kigali:
${list}

Tone: polite but firm. Mention this is the weekly Friday follow-up.
List each issue clearly. Ask for a status update or resolution proof by end of day. Note that citizens are monitoring these issues in real time on the Smart Kigali Alert dashboard.

Write the email body only.`,
    },
  ])
}
