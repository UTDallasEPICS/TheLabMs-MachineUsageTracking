import prisma from '../../lib/prisma'
import { requireAdminUser } from '../../utils/admin-auth'

type DeleteMicrocontrollerBody = {
  id?: number
}

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  const { id } = await readBody<DeleteMicrocontrollerBody>(event)
  if (!id || Number.isNaN(Number(id))) {
    throw createError({ statusCode: 400, message: 'Microcontroller id is required' })
  }

  const existing = await prisma.microcontroller.findUnique({ where: { id: Number(id) }, select: { id: true } })
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Microcontroller not found' })
  }

  await prisma.$transaction([
    prisma.sensorData.deleteMany({ where: { microcontroller_id: Number(id) } }),
    prisma.machineUsageSession.deleteMany({ where: { microcontroller_id: Number(id) } }),
    prisma.microcontroller.delete({ where: { id: Number(id) } })
  ])

  return { ok: true }
})
