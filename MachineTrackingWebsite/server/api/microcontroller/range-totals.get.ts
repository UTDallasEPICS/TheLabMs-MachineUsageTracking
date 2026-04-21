import prisma from '../../lib/prisma'
import { calculateSessionSeconds } from '../../utils/session-seconds'

function parseYmdDate(value: string, endOfDay: boolean): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null

  const [yearRaw, monthRaw, dayRaw] = value.split('-')
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  const day = Number(dayRaw)

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null

  const date = endOfDay
    ? new Date(year, month - 1, day, 23, 59, 59, 999)
    : new Date(year, month - 1, day, 0, 0, 0, 0)

  if (
    date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
  ) {
    return null
  }

  return date
}

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const query = getQuery(event)
  const startRaw = String(query.start ?? '')
  const endRaw = String(query.end ?? '')

  const windowStart = parseYmdDate(startRaw, false)
  const windowEnd = parseYmdDate(endRaw, true)

  if (!windowStart || !windowEnd) {
    throw createError({
      statusCode: 400,
      message: 'Invalid date range. Use start/end in YYYY-MM-DD format.',
    })
  }

  if (windowEnd < windowStart) {
    throw createError({
      statusCode: 400,
      message: 'Invalid date range. End date must be on or after start date.',
    })
  }

  const now = new Date()

  const machines = await prisma.microcontroller.findMany({
    orderBy: { name: 'asc' },
    include: {
      usage_sessions: {
        where: {
          AND: [
            { started_at: { lte: windowEnd } },
            {
              OR: [
                { ended_at: null },
                { ended_at: { gte: windowStart } },
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
    const totalSeconds = machine.usage_sessions.reduce((acc, session) => {
      const effectiveEnd = session.ended_at ?? now
      return acc + calculateSessionSeconds(session.started_at, effectiveEnd, windowStart, windowEnd)
    }, 0)

    return {
      id: machine.id,
      name: machine.name,
      totalSeconds,
      totalMinutes: Math.floor(totalSeconds / 60),
    }
  })

  return {
    startDate: startRaw,
    endDate: endRaw,
    machines: responseMachines,
  }
})