import { GoogleGenerativeAI } from '@google/generative-ai'
import { Issue, Severity } from '../types'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseJSON<T>(raw: string): T | null {
  try {
    const clean = raw.replace(/```json|```/g, '').trim()
    const m = clean.match(/\{[\s\S]*\}/)
    return m ? JSON.parse(m[0]) : null
  } catch { return null }
}

function stripPrefix(b64: string): string {
  return b64.replace(/^data:image\/\w+;base64,/, '')
}

function img(b64: string) {
  return {
    inlineData: {
      data: stripPrefix(b64),
      mimeType: 'image/jpeg' as const,
    },
  }
}

// ── Call 1a: Analyze photo with vision ───────────────────────────────────────

export interface AnalysisResult {
  issueType: string
  title: string
  description: string
  severity: Severity
  institution: string
  institutionEmail: string
  isRealIssue: boolean
}

export async function analyzeIssue(
  photoBase64: string,
  location: string
): Promise<AnalysisResult> {

  const visionModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const visionRes = await visionModel.generateContent([
    img(photoBase64),
    `You are the AI engine for Smart Kigali Alert, a civic issue reporting
system in Kigali, Rwanda. Analyze this photo.
Location reported: ${location}

Return ONLY valid JSON with no markdown, no explanation:
{
  "issueType": "pothole | streetlight | waste | flooding | sidewalk | infrastructure | other",
  "title": "Short specific title for this exact issue",
  "description": "2-3 sentences describing what you see and its impact on Kigali residents",
  "severity": "low | medium | high",
  "isRealIssue": true
}`,
  ])

  const visionData = parseJSON<Omit<AnalysisResult, 'institution' | 'institutionEmail'>>(
    visionRes.response.text()
  ) ?? {
    issueType: 'other',
    title: 'Urban issue reported in Kigali',
    description: 'A civic issue has been reported and requires attention.',
    severity: 'medium' as Severity,
    isRealIssue: true,
  }

  // ── Call 1b: Research institution with Google Search grounding ──────────────

  const searchModel = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    tools: [{ googleSearch: {} } as any],
  })

  const searchRes = await searchModel.generateContent(
    `Find the official Rwandan government institution or City of Kigali department
responsible for handling "${visionData.issueType}" problems in Kigali, Rwanda.
Find their real contact email address.

Return ONLY valid JSON with no markdown:
{
  "institution": "Full official name of the responsible institution",
  "institutionEmail": "real@email.rw"
}`
  )

  const instData = parseJSON<{ institution: string; institutionEmail: string }>(
    searchRes.response.text()
  ) ?? {
    institution: 'City of Kigali',
    institutionEmail: 'info@kigalicity.gov.rw',
  }

  return { ...visionData, ...instData }
}

// ── Call 2: Generate formal email body ───────────────────────────────────────

export async function generateEmailBody(issue: Issue): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
  const res = await model.generateContent(
    `Write a formal civic report email body to ${issue.institution}
on behalf of Smart Kigali Alert.

Issue ID:      ${issue.id}
Type:          ${issue.issueType}
Title:         ${issue.title}
Location:      ${issue.location}
Severity:      ${issue.severity}
Description:   ${issue.description}
Reported by:   ${issue.reporterName} (${issue.reporterPhone})
Date:          ${new Date(issue.createdAt).toLocaleDateString('en-RW')}

Write only the email body. Be professional and concise. End by asking
them to acknowledge receipt and confirm action taken, referencing the Issue ID.`
  )
  return res.response.text()
}

// ── Call 3: Verify resolution — compare before and after photos ───────────────

export interface ResolutionVerdict {
  resolved: boolean
  confidence: number
  reasoning: string
}

export async function verifyResolution(
  beforeB64: string,
  afterB64: string,
  issueTitle: string
): Promise<ResolutionVerdict> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
  const res = await model.generateContent([
    `You are verifying whether a civic issue in Kigali has been resolved.
Issue: "${issueTitle}"
The FIRST image is BEFORE — the reported problem.
The SECOND image is AFTER — the claimed resolution.
Study both photos carefully.

Return ONLY valid JSON with no markdown:
{
  "resolved": true | false,
  "confidence": 0-100,
  "reasoning": "One clear sentence explaining your verdict"
}`,
    img(beforeB64),
    img(afterB64),
  ])
  return (
    parseJSON<ResolutionVerdict>(res.response.text()) ?? {
      resolved: false,
      confidence: 0,
      reasoning: 'Verification inconclusive — please try again.',
    }
  )
}

// ── Call 4: Friday accountability reminder ────────────────────────────────────

export async function generateFridayReminder(
  institution: string,
  issues: Issue[]
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
  const list = issues
    .map(i =>
      `- ${i.id}: "${i.title}" at ${i.location} ` +
      `(open since ${new Date(i.createdAt).toLocaleDateString('en-RW')})`
    )
    .join('\n')

  const res = await model.generateContent(
    `Write a Friday accountability reminder email from Smart Kigali Alert
to ${institution}.

They have ${issues.length} unresolved issue(s) in Kigali:
${list}

Tone: polite but firm. Mention this is the weekly Friday follow-up.
List each issue clearly. Ask for a status update or resolution proof by
end of day. Note that citizens are monitoring these issues in real time
on the Smart Kigali Alert dashboard.

Write the email body only.`
  )
  return res.response.text()
}
