import prisma from '../../lib/prisma'
import { calculateSessionSeconds } from '../../utils/session-seconds'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const query = getQuery(event)
  const now = new Date()

  const year = query.year ? parseInt(query.year as string) : now.getFullYear()
  const month = query.month ? parseInt(query.month as string) : now.getMonth() + 1

  // Month boundaries (local-time)
  const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0)
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999) // last day of month
  const daysInMonth = new Date(year, month, 0).getDate()

  const machines = await prisma.microcontroller.findMany({
    orderBy: { name: 'asc' },
    include: {
      usage_sessions: {
        where: {
          AND: [
            { started_at: { lte: monthEnd } },
            {
              OR: [
                { ended_at: null },
                { ended_at: { gte: monthStart } },
              ],
            },
          ],
        },
        select: {
          started_at: true,
          ended_at: true,
        },
      },
    },
  })

  const responseMachines = machines.map((machine) => {
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = i + 1
      const dayStart = new Date(year, month - 1, dayNum, 0, 0, 0, 0)
      const dayEnd = new Date(year, month - 1, dayNum, 23, 59, 59, 999)

      // Cap open sessions at "now" so future time isn't counted
      const cappedNow = now < dayEnd ? now : dayEnd

      const totalSeconds = machine.usage_sessions.reduce((acc, session) => {
        const effectiveEnd = session.ended_at ?? cappedNow
        return acc + calculateSessionSeconds(session.started_at, effectiveEnd, dayStart, dayEnd)
      }, 0)

      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
      return { date: dateStr, totalSeconds }
    })

    return { id: machine.id, name: machine.name, days }
  })

  return { year, month, machines: responseMachines }
})
