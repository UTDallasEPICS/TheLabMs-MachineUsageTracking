/*
  server/api/admin/password/reset.post.ts
  Completes the admin password-reset flow. Verifies the signed token from the
  reset link, hashes the new password, updates the database, and then invalidates
  all existing sessions for that admin in a single transaction so any stolen
  session cookies stop working immediately.
*/
import { hash } from 'bcrypt-ts'
import prisma from '../../../lib/prisma'
import { verifyAdminResetToken } from '../../../utils/admin-password-reset'

type ResetPasswordBody = {
  token?: string
  newPassword?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ResetPasswordBody>(event)
  const token = body.token ?? ''
  const newPassword = body.newPassword ?? ''

  if (!token || !newPassword) {
    throw createError({ statusCode: 400, message: 'Token and new password are required' })
  }

  if (newPassword.length < 8) {
    throw createError({ statusCode: 400, message: 'Password must be at least 8 characters' })
  }

  const admin = await verifyAdminResetToken(token)
  if (!admin) {
    throw createError({ statusCode: 400, message: 'Reset token is invalid or expired' })
  }

  const newHash = await hash(newPassword, 10)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: admin.id },
      data: { password_hash: newHash }
    }),
    prisma.session.deleteMany({ where: { user_id: admin.id } })
  ])

  return { ok: true }
})
