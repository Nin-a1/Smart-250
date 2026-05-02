import emailjs from '@emailjs/browser'

const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

if (!serviceId || !templateId || !publicKey) {
  console.warn('EmailJS is not fully configured. Email sending will fail until env vars are set.')
}

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

export async function sendEmail(payload: SendEmailPayload): Promise<void> {
  if (!serviceId || !templateId || !publicKey) {
    throw new Error('EmailJS configuration is missing')
  }

  const testEmail = import.meta.env.VITE_TEST_EMAIL as string | undefined
  const isTest = Boolean(testEmail)

  await emailjs.send(serviceId, templateId, {
    to_email: isTest ? testEmail : payload.toEmail,
    to_name:  isTest ? 'Test Inbox' : payload.toName,
    issue_id:      payload.issueId,
    issue_title:   payload.issueTitle,
    location:      payload.location,
    severity:      payload.severity,
    reporter_name: payload.reporterName,
    reporter_phone: payload.reporterPhone,
    // Prepend a test-mode banner so you can see the intended institution
    body: isTest
      ? `[TEST MODE — intended for: ${payload.toName} <${payload.toEmail}>]\n\n${payload.body}`
      : payload.body,
  })
}
