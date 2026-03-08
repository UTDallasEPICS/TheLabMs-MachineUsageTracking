import prisma from '../../lib/prisma'
import { requireAdminUser } from '../../utils/admin-auth'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  return prisma.microcontroller.findMany({
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      name: true,
      api_key: true,
      created_at: true,
      _count: {
        select: {
          sensor_data: true,
          usage_sessions: true
        }
      }
    }
  })
})
