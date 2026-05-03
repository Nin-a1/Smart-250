import emailjs from '@emailjs/browser'

const serviceId  = import.meta.env.VITE_EMAILJS_SERVICE_ID  as string
const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string
const publicKey  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  as string

emailjs.init(publicKey)

export interface SendEmailPayload {
  toEmail: string
  toName: string
  issueId: string
  issueTitle: string
  location: string
  severity: string
  reporterName: string
  reporterPhone: string
  body: string
}

// bypassTest: true → always send to the real address (for reporter emails)
// bypassTest: false (default) → redirect to VITE_TEST_EMAIL when set (for institution emails)
async function send(payload: SendEmailPayload, bypassTest = false): Promise<void> {
  if (!serviceId || !templateId || !publicKey) {
    throw new Error('EmailJS is not configured — check VITE_EMAILJS_* env vars')
  }

  const testEmail = import.meta.env.VITE_TEST_EMAIL as string | undefined
  const useTest   = !bypassTest && Boolean(testEmail)

  const params = {
    to_email:       useTest ? testEmail : payload.toEmail,
    to_name:        useTest ? 'Test Inbox' : payload.toName,
    issue_id:       payload.issueId,
    issue_title:    payload.issueTitle,
    location:       payload.location,
    severity:       payload.severity,
    reporter_name:  payload.reporterName,
    reporter_phone: payload.reporterPhone,
    body: useTest
      ? `[TEST — intended for: ${payload.toName} <${payload.toEmail}>]\n\n${payload.body}`
      : payload.body,
  }

  console.info('[email] →', params.to_email, '|', payload.issueTitle)
  const res = await emailjs.send(serviceId, templateId, params)
  console.info('[email] sent', res.status, res.text)
}

// For institution alerts — redirected to test inbox when VITE_TEST_EMAIL is set
export async function sendEmail(payload: SendEmailPayload): Promise<void> {
  await send(payload, false)
}

// For reporter notifications — always reaches the real reporter email
export async function sendReporterEmail(payload: SendEmailPayload): Promise<void> {
  await send(payload, true)
}

// Submission acknowledgement to the reporter
export async function sendReporterConfirmation(
  reporterEmail: string,
  reporterName: string,
  issueId: string,
  issueTitle: string,
  location: string,
  severity: string,
  institution: string,
  reporterPhone: string,
): Promise<void> {
  await sendReporterEmail({
    toEmail:      reporterEmail,
    toName:       reporterName,
    issueId,
    issueTitle,
    location,
    severity,
    reporterName,
    reporterPhone,
    body:
      `Dear ${reporterName},\n\n` +
      `Thank you for reporting an issue through Smart Kigali Alert.\n\n` +
      `Your report has been received and forwarded to:\n` +
      `🏛️ ${institution}\n\n` +
      `Issue Details:\n` +
      `• ID: ${issueId}\n` +
      `• Title: ${issueTitle}\n` +
      `• Location: ${location}\n` +
      `• Severity: ${severity}\n\n` +
      `You will receive another email once the issue is resolved.\n\n` +
      `— Smart Kigali Alert`,
  })
}
