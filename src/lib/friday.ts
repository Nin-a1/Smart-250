import { Issue } from '../types'
import { getOpenIssues } from './issues'
import { generateFridayReminder } from './generative'
import { sendEmail } from './email'

const LAST_SENT_KEY = 'ska_friday_last_sent'

function isFriday(): boolean {
  return new Date().getDay() === 5
}

function alreadySentToday(): boolean {
  const last = localStorage.getItem(LAST_SENT_KEY)
  return last === new Date().toDateString()
}

function groupByInstitution(issues: Issue[]) {
  const map = new Map<string, { email: string; issues: Issue[] }>()
  for (const issue of issues) {
    const key = issue.institution
    if (!map.has(key)) {
      map.set(key, { email: issue.institutionEmail, issues: [] })
    }
    map.get(key)!.issues.push(issue)
  }
  return map
}

export async function checkAndSendFridayReminders(): Promise<void> {
  if (!isFriday() || alreadySentToday()) return

  const open = await getOpenIssues()
  if (open.length === 0) return

  const groups = groupByInstitution(open)

  const sends = Array.from(groups.entries()).map(async ([institution, { email, issues }]) => {
    try {
      const body = await generateFridayReminder(institution, issues)
      await sendEmail({
        toEmail:       email,
        toName:        institution,
        issueId:       'FRIDAY-REMINDER',
        issueTitle:    `Friday Accountability Reminder — ${issues.length} open issue(s)`,
        location:      'Kigali, Rwanda',
        severity:      'medium',
        reporterName:  'Smart Kigali Alert System',
        reporterPhone: '',
        body,
      })
    } catch {
      // Non-fatal — one institution failing shouldn't block others
    }
  })

  await Promise.allSettled(sends)

  // Mark as sent so it doesn't re-fire until next Friday
  localStorage.setItem(LAST_SENT_KEY, new Date().toDateString())
}
