import prisma from '../../lib/prisma'

type MachineUsageItem = {
  id: number
  name: string
  isOn: boolean
  lastSignalAt: string | null
  totalSecondsToday: number
  totalMinutesToday: number
}

function startOfToday(): Date {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

function calculateSessionSeconds(startedAt: Date, endedAt: Date | null, dayStart: Date, now: Date): number {
  const effectiveStart = startedAt > dayStart ? startedAt : dayStart
  const effectiveEnd = endedAt ?? now

  if (effectiveEnd <= effectiveStart) {
    return 0
  }

  return Math.floor((effectiveEnd.getTime() - effectiveStart.getTime()) / 1000)
}

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const dayStart = startOfToday()
  const now = new Date()

  const machines = await prisma.microcontroller.findMany({
    orderBy: { name: 'asc' },
    include: {
      sensor_data: {
        orderBy: { timestamp: 'desc' },
        take: 1,
        select: { timestamp: true, machine_state: true }
      },
      usage_sessions: {
        where: {
          OR: [
            { ended_at: null },
            { ended_at: { gte: dayStart } },
            { started_at: { gte: dayStart } }
          ]
        },
        select: {
          started_at: true,
          ended_at: true
        }
      }
    }
  })

  const responseMachines: MachineUsageItem[] = machines.map((machine) => {
    const totalSecondsToday = machine.usage_sessions.reduce((acc, session) => {
      return acc + calculateSessionSeconds(session.started_at, session.ended_at, dayStart, now)
    }, 0)

    const latestSignal = machine.sensor_data[0] ?? null
    const hasOpenSession = machine.usage_sessions.some((session) => session.ended_at === null)

    return {
      id: machine.id,
      name: machine.name,
      isOn: latestSignal ? latestSignal.machine_state : hasOpenSession,
      lastSignalAt: latestSignal ? latestSignal.timestamp.toISOString() : null,
      totalSecondsToday,
      totalMinutesToday: Math.floor(totalSecondsToday / 60)
    }
  })

  return {
    generatedAt: now.toISOString(),
    machines: responseMachines
  }
})
