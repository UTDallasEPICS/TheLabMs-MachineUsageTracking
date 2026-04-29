/*
  server/api/admin/microcontrollers.get.ts
  Returns all registered microcontrollers ordered by newest first, including the
  API key, isAC mode flag, and counts of related SensorData and MachineUsageSession
  rows. Used to populate the admin "Registered Microcontrollers" directory view.
  Requires admin session.
*/
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
      isAC: true,
      _count: {
        select: {
          sensor_data: true,
          usage_sessions: true
        }
      }
    }
  })
})
