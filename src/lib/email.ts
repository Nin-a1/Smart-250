import emailjs from '@emailjs/browser'

const SERVICE  = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const PUB_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

export async function sendEmail(params: {
  toEmail: string
  toName: string
  issueId: string
  issueTitle: string
  location: string
  severity: string
  reporterName: string
  reporterPhone: string
  body: string
}) {
  return emailjs.send(
    SERVICE, TEMPLATE,
    {
      to_email:      params.toEmail,
      to_name:       params.toName,
      issue_id:      params.issueId,
      issue_title:   params.issueTitle,
      location:      params.location,
      severity:      params.severity,
      reporter_name: params.reporterName,
      reporter_phone: params.reporterPhone,
      message:       params.body,
    },
    PUB_KEY
  )
}
