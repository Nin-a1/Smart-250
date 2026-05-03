import { Issue, Severity } from '../types'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'
const TEXT_MODEL = 'llama-3.3-70b-versatile'

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

// Collect all configured API keys from env (VITE_GROQ_API_KEY_1 … VITE_GROQ_API_KEY_9)
function getApiKeys(): string[] {
  const keys: string[] = []
  for (let i = 1; i <= 9; i++) {
    const k = (import.meta.env as Record<string, string>)[`VITE_GROQ_API_KEY_${i}`]
    if (k) keys.push(k)
  }
  return keys
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

// Try every key in order; move to next on 429 / 401 / 403
async function groqChat(model: string, messages: object[], maxTokens = 1024): Promise<string> {
  const keys = getApiKeys()
  if (keys.length === 0) throw new Error('No Groq API keys configured. Add VITE_GROQ_API_KEY_1 … to .env')

  let lastError = ''

  for (const apiKey of keys) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 30_000)

    try {
      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
        signal: controller.signal,
      })

      // Quota / auth failure → try next key silently
      if (res.status === 429 || res.status === 401 || res.status === 403) {
        const body = await res.text().catch(() => '')
        lastError = `key …${apiKey.slice(-6)} → ${res.status}`
        console.warn(`[groq] ${lastError}`, body.slice(0, 120))
        continue
      }

      if (!res.ok) {
        const body = await res.text().catch(() => res.statusText)
        let detail = res.statusText
        try { detail = (JSON.parse(body) as { error?: { message?: string } }).error?.message ?? detail } catch { /* */ }
        throw new Error(`Groq ${res.status}: ${detail}`)
      }

      const data = await res.json() as { choices?: { message: { content: string } }[] }
      const content = data.choices?.[0]?.message?.content
      if (!content) throw new Error('Groq returned an empty response — please try again.')
      return content

    } finally {
      clearTimeout(timer)
    }
  }

  throw new Error(`All Groq API keys exhausted. Last error: ${lastError}`)
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

  const messages = [
    {
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: { url: `data:image/jpeg;base64,${base64}` },
        },
        {
          type: 'text',
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
      ],
    },
  ]

  let text = ''
  try {
    text = await groqChat(VISION_MODEL, messages, 512)
  } catch (err) {
    console.error('[analyzeIssue] all keys failed:', err)
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
  return groqChat(
    TEXT_MODEL,
    [
      {
        role: 'user',
        content: `Write a formal civic report email body to ${issue.institution} on behalf of Smart Kigali Alert.

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
    ],
    1024,
  )
}

// ── Call 3: Verify resolution — compare before and after photos ───────────────

export interface ResolutionVerdict {
  resolved: boolean
  confidence: number
  reasoning: string
}

function photoUrl(b64OrUrl: string): string {
  if (b64OrUrl.startsWith('http')) return b64OrUrl
  const base64 = b64OrUrl.replace(/^data:image\/\w+;base64,/, '')
  return `data:image/jpeg;base64,${base64}`
}

export async function verifyResolution(
  beforeB64OrUrl: string,
  afterB64OrUrl: string,
  issueTitle: string,
): Promise<ResolutionVerdict> {
  const text = await groqChat(
    VISION_MODEL,
    [
      {
        role: 'user',
        content: [
          {
            type: 'text',
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
          { type: 'image_url', image_url: { url: photoUrl(beforeB64OrUrl) } },
          { type: 'image_url', image_url: { url: photoUrl(afterB64OrUrl) } },
        ],
      },
    ],
    256,
  )

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

  return groqChat(
    TEXT_MODEL,
    [
      {
        role: 'user',
        content: `Write a Friday accountability reminder email from Smart Kigali Alert to ${institution}.

They have ${issues.length} unresolved issue(s) in Kigali:
${list}

Tone: polite but firm. Mention this is the weekly Friday follow-up.
List each issue clearly. Ask for a status update or resolution proof by end of day. Note that citizens are monitoring these issues in real time on the Smart Kigali Alert dashboard.

Write the email body only.`,
      },
    ],
    1024,
  )
}
