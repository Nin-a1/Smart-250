export type Severity = 'low' | 'medium' | 'high'
export type IssueStatus = 'open' | 'in_progress' | 'resolved'

export interface Issue {
  id: string
  reporterName: string
  reporterPhone: string
  reporterEmail: string
  location: string
  photoBase64: string
  issueType: string
  title: string
  description: string
  severity: Severity
  institution: string
  institutionEmail: string
  status: IssueStatus
  emailSent: boolean
  createdAt: string
  resolvedAt?: string
  resolutionPhotoBase64?: string
  resolutionReasoning?: string
  resolutionConfidence?: number
  lastReminderSent?: string
  lat?: number
  lon?: number
  institutionReason?: string
  photoUrl?: string
  resolutionPhotoUrl?: string
}
