import prisma from '../../lib/prisma'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const query = getQuery(event)
  const dateStr = query.date as string

  // Parse requested date or use today
  const targetDate = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date()
  if (isNaN(targetDate.getTime())) {
    throw createError({ statusCode: 400, message: 'Invalid date format. Use YYYY-MM-DD' })
  }

  const year = targetDate.getFullYear()
  const month = targetDate.getMonth()
  const date = targetDate.getDate()

  // Define the 24-hour boundary for the day
  const dayStart = new Date(year, month, date, 0, 0, 0, 0)
  const dayEnd = new Date(year, month, date, 23, 59, 59, 999)
  const now = new Date()

  const machines = await prisma.microcontroller.findMany({
    orderBy: { name: 'asc' },
    include: {
      usage_sessions: {
        where: {
          AND: [
            { started_at: { lte: dayEnd } },
            {
              OR: [
                { ended_at: null },
                { ended_at: { gte: dayStart } },
              ],
            },
          ],
        },
        select: {
          id: true,
          started_at: true,
          ended_at: true,
        },
      },
    },
  })

  // Format the response and calculate timeline percentages/offsets
  const responseMachines = machines.map((machine) => {
    const sessions = machine.usage_sessions.map((session) => {
      // Calculate effective start and end within this specific day
      const effectiveStart = session.started_at > dayStart ? session.started_at : dayStart
      
      // If session is ongoing (null), it ends at 'now' if today, or 'dayEnd' if it's a past day,
      // but cap it at 'dayEnd' regardless for UI rendering.
      const rawEnd = session.ended_at ?? now
      const effectiveEnd = rawEnd < dayEnd ? rawEnd : dayEnd

      const startSecondsFromDayStart = Math.max(0, (effectiveStart.getTime() - dayStart.getTime()) / 1000)
      let durationSeconds = (effectiveEnd.getTime() - effectiveStart.getTime()) / 1000
      if (durationSeconds < 0) durationSeconds = 0

      // Calculate percentages for CSS (0% to 100% of the 24hr width)
      const dayTotalSeconds = 24 * 60 * 60
      const startPercent = (startSecondsFromDayStart / dayTotalSeconds) * 100
      const widthPercent = (durationSeconds / dayTotalSeconds) * 100

      return {
        id: session.id,
        startedAt: session.started_at.toISOString(),
        endedAt: session.ended_at?.toISOString() || null,
        isOngoing: session.ended_at === null,
        startPercent,
        widthPercent,
        durationSeconds
      }
    })

    return {
      id: machine.id,
      name: machine.name,
      sessions
    }
  })

  return {
    date: `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`,
    machines: responseMachines
  }
})
