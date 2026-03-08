import prisma from '../../lib/prisma'
import { requireAdminUser } from '../../utils/admin-auth'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  return await prisma.pendingUser.findMany({
    orderBy: { requested_at: 'asc' }
  })
})