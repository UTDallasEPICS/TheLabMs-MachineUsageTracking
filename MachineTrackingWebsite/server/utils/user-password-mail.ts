<<<<<<< HEAD
/* 
server/utils/user-password-mail.ts
Sends the password-reset email to a regular user account via SMTP (nodemailer).
Falls back to a console.info log when SMTP environment variables are absent,
allowing the reset flow to be tested locally without a mail server. 
*/
=======
import { sendMail } from '../lib/mailer'
>>>>>>> a803501a6e0793eb48f6102405012c0549b390be

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
