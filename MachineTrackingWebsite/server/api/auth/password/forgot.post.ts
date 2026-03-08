import prisma from '../../../lib/prisma'
import { sendUserResetEmail } from '../../../utils/user-password-mail'
import { createUserResetToken, getUserResetTtlMinutes } from '../../../utils/user-password-reset'

type ForgotPasswordBody = {
  email?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ForgotPasswordBody>(event)
  const email = body.email?.trim().toLowerCase()

  if (!email) {
    throw createError({ statusCode: 400, message: 'Email is required' })
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, password_hash: true, role: true }
  })

  // Return the same response even when account does not exist.
  if (!user || user.role !== 'user') {
    return { ok: true, message: 'If the email is valid, reset instructions will be sent.' }
  }

  const token = createUserResetToken(user)
  const origin = getRequestURL(event).origin
  const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(token)}`

  await sendUserResetEmail(user.email, resetUrl)

  const isDevelopment = process.env.NODE_ENV !== 'production'

  return {
    ok: true,
    message: `If the email is valid, reset instructions will be sent. Link expires in ${getUserResetTtlMinutes()} minutes.`,
    // Local/dev helper so reset works without SMTP while keeping production safe.
    devResetUrl: isDevelopment ? resetUrl : undefined
  }
})
