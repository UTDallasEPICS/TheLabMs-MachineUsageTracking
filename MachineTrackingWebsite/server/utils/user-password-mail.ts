import { sendMail } from '../lib/mailer'

export async function sendUserResetEmail(to: string, resetUrl: string): Promise<void> {
  const subject = 'User password reset'
  const text = `A password reset was requested for your account. Use this link: ${resetUrl}`
  const html = `<p>A password reset was requested for your account.</p>
                <p><a href="${resetUrl}">Reset your password</a></p>
                <p>If the link doesn't work, copy and paste this URL into your browser:</p>
                <p>${resetUrl}</p>`

  try {
    await sendMail({ to, subject, text, html })
  } catch (err) {
    console.error('[user-password-reset] sendMail failed, falling back to log output:', err)
    console.info(`[user-password-reset] Reset link for ${to}: ${resetUrl}`)
  }
}
