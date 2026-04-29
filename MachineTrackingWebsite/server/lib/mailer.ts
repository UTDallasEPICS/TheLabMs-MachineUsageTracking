export type MailOptions = {
  to: string | string[]
  subject: string
  text?: string
  html?: string
}

export async function getTransporter() {
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = Number(process.env.SMTP_PORT || 587)
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS

  if (!smtpHost || !smtpUser || !smtpPass) return null

  const nodemailer = await import('nodemailer')
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass }
  })
}

export async function sendMail(options: MailOptions): Promise<void> {
  const transporter = await getTransporter()
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || ''

  if (!transporter) {
    console.info('[mailer] SMTP not configured - logging mail output')
    console.info(`From: ${from}`)
    console.info(`To: ${Array.isArray(options.to) ? options.to.join(',') : options.to}`)
    console.info(`Subject: ${options.subject}`)
    if (options.text) console.info(`Text: ${options.text}`)
    if (options.html) console.info(`HTML: ${options.html}`)
    return
  }

  await transporter.sendMail({ from, to: options.to as any, subject: options.subject, text: options.text, html: options.html })
}

export default { getTransporter, sendMail }
