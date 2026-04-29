/*
  server/api/admin/user.delete.ts
  Deletes a user account and all associated sessions.
  Two safety guards are enforced: an admin cannot delete their own account, and
  the last remaining admin account cannot be removed (preventing lockout).
  Cascades by deleting Session rows first, then the User row, in a transaction.
  Requires admin session.
*/
import prisma from '../../lib/prisma'
import { requireAdminUser } from '../../utils/admin-auth'

type DeleteUserBody = {
  id?: string
}

export default defineEventHandler(async (event) => {
  const adminUser = await requireAdminUser(event)

  const { id } = await readBody<DeleteUserBody>(event)
  if (!id) {
    throw createError({ statusCode: 400, message: 'User id is required' })
  }

  if (id === adminUser.id) {
    throw createError({ statusCode: 400, message: 'You cannot remove your own admin account' })
  }

  const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } })
  if (!existing) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  const targetUser = await prisma.user.findUnique({
    where: { id },
    select: { role: true }
  })

  if (targetUser?.role === 'admin') {
    const adminCount = await prisma.user.count({ where: { role: 'admin' } })
    if (adminCount <= 1) {
      throw createError({ statusCode: 400, message: 'Cannot remove the last admin account' })
    }
  }

  await prisma.$transaction([
    prisma.session.deleteMany({ where: { user_id: id } }),
    prisma.user.delete({ where: { id } })
  ])

  return { ok: true }
})
