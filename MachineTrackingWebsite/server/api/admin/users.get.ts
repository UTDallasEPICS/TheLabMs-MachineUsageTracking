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
