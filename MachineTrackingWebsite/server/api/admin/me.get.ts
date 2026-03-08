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
