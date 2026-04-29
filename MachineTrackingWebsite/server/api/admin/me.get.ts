/*
  server/api/admin/me.get.ts
  Returns the current admin's profile and dashboard statistics in a single request.
  Stats include: number of pending signup requests and total registered machine count.
  Used by admin/index.vue to populate the four overview cards at the top of the page.
  Requires admin session.
*/
import prisma from '../../lib/prisma'
import { requireAdminUser } from '../../utils/admin-auth'

export default defineEventHandler(async (event) => {
  const sessionUser = await requireAdminUser(event)

  const [admin, pendingRequests, machineCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        email: true,
        role: true,
        created_at: true
      }
    }),
    prisma.pendingUser.count(),
    prisma.microcontroller.count()
  ])

  if (!admin) {
    throw createError({ statusCode: 404, message: 'Admin not found' })
  }

  return {
    admin,
    stats: {
      pendingRequests,
      machineCount
    }
  }
})
