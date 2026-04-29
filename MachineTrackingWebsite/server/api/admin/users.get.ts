/*
  server/api/admin/users.get.ts
  Returns all user accounts (both admin and user roles), ordered with admins first
  then by newest created. Used by the admin "User Accounts" directory view.
  Requires admin session.
*/
import prisma from '../../lib/prisma'
import { requireAdminUser } from '../../utils/admin-auth'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  return prisma.user.findMany({
    orderBy: [
      { role: 'asc' },
      { created_at: 'desc' }
    ],
    select: {
      id: true,
      email: true,
      role: true,
      created_at: true
    }
  })
})
