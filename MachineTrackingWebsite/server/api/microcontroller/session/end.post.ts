import prisma from '../../../../server/lib/prisma'

export default defineEventHandler(async (event) => {
  const mc = event.context.microcontroller

  const session = await prisma.machineUsageSession.findFirst({
    where: { microcontroller_id: mc.id, ended_at: null }
  })
  if (!session) throw createError({ statusCode: 404, message: 'No active session' })

  const ended_at = new Date()

  await prisma.machineUsageSession.update({
    where: { id: session.id },
    data: { ended_at }
  })

  return { ok: true }
})