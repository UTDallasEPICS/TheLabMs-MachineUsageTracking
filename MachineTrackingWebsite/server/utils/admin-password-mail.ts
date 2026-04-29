/* 
server/utils/admin-password-mail.ts
Sends the password-reset email to an admin account via SMTP (nodemailer).
When SMTP environment variables (SMTP_HOST, SMTP_USER, SMTP_PASS, MAIL_FROM)
are not set the function falls back to printing the reset link to the server
console, which is useful for local development without a mail server. 
*/

export async function sendAdminResetEmail(to: string, resetUrl: string): Promise<void> {
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = Number(process.env.SMTP_PORT || 587)
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const mailFrom = process.env.MAIL_FROM

  if (smtpHost && smtpUser && smtpPass && mailFrom) {
    try {
      const nodemailer = await import('nodemailer')
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      })

      await transporter.sendMail({
        from: mailFrom,
        to,
        subject: 'Admin password reset',
        text: `A password reset was requested for your admin account. Use this link: ${resetUrl}`
      })
      return
    } catch (error) {
      console.error('[admin-password-mail] SMTP send failed, falling back to log output:', error)
    }
  }

  // Development fallback when SMTP is not configured.
  console.info(`[admin-password-mail] Reset link for ${to}: ${resetUrl}`)
}
