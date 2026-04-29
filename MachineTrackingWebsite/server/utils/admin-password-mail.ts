import { sendMail } from '../lib/mailer'

export async function sendAdminResetEmail(to: string, resetUrl: string): Promise<void> {
  const subject = 'Admin password reset'
  const text = `A password reset was requested for your admin account. Use this link: ${resetUrl}`
  const html = `<p>A password reset was requested for your admin account.</p>
                <p><a href="${resetUrl}">Reset your admin password</a></p>
                <p>If the link doesn't work, copy and paste this URL into your browser:</p>
                <p>${resetUrl}</p>`

  try {
    await sendMail({ to, subject, text, html })
  } catch (err) {
    console.error('[admin-password-mail] sendMail failed, falling back to log output:', err)
    console.info(`[admin-password-mail] Reset link for ${to}: ${resetUrl}`)
  }
}
