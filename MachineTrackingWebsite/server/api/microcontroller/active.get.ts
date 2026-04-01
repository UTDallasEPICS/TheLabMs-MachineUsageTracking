import prisma from '../../lib/prisma'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const openSessions = await prisma.machineUsageSession.findMany({
    where: { ended_at: null },
    select: {
      started_at: true,
      microcontroller: { select: { id: true, name: true } },
    },
  })

  return openSessions.map((s) => ({
    id: s.microcontroller.id,
    name: s.microcontroller.name,
    startedAt: s.started_at.toISOString(),
  }))
})
