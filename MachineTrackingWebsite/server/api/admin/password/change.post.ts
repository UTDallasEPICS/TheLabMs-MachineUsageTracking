import { compare, hash } from 'bcrypt-ts'
import prisma from '../../../lib/prisma'
import { requireAdminUser } from '../../../utils/admin-auth'

type ChangePasswordBody = {
  currentPassword?: string
  newPassword?: string
}

export default defineEventHandler(async (event) => {
  const adminUser = await requireAdminUser(event)

  const body = await readBody<ChangePasswordBody>(event)
  const currentPassword = body.currentPassword ?? ''
  const newPassword = body.newPassword ?? ''

  if (!currentPassword || !newPassword) {
    throw createError({ statusCode: 400, message: 'Current and new password are required' })
  }

  if (newPassword.length < 8) {
    throw createError({ statusCode: 400, message: 'New password must be at least 8 characters' })
  }

  const admin = await prisma.user.findUnique({
    where: { id: adminUser.id },
    select: { id: true, password_hash: true }
  })

  if (!admin) {
    throw createError({ statusCode: 404, message: 'Admin account not found' })
  }

  const currentMatches = await compare(currentPassword, admin.password_hash)
  if (!currentMatches) {
    throw createError({ statusCode: 401, message: 'Current password is incorrect' })
  }

  const newHash = await hash(newPassword, 10)

  await prisma.user.update({
    where: { id: admin.id },
    data: { password_hash: newHash }
  })

  return { ok: true }
})
