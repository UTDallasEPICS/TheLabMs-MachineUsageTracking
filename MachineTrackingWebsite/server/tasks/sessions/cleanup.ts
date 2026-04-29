/* 
server/tasks/sessions/cleanup.ts
Nitro scheduled task (sessions:cleanup) that closes stale MachineUsageSessions.
A session is considered stale when its started_at is more than 24 hours ago and
ended_at is still NULL, which indicates the device lost connectivity before
sending the OFF signal. Each stale session is capped at exactly 24 hours from
its start time to preserve a realistic usage estimate.
Configure the schedule in nuxt.config.ts under nitro.scheduledTasks. 
*/
import prisma from '../../lib/prisma'

const MAX_SESSION_HOURS = 24

export default defineTask({
  meta: {
    name: 'sessions:cleanup',
    description: 'Close machine usage sessions that have been open for more than 24 hours (stale due to device connectivity loss).',
  },
  async run() {
    const cutoff = new Date(Date.now() - MAX_SESSION_HOURS * 60 * 60 * 1000)

    // Find stale sessions — open longer than MAX_SESSION_HOURS
    const staleSessions = await prisma.machineUsageSession.findMany({
      where: {
        ended_at: null,
        started_at: { lt: cutoff },
      },
      select: { id: true, started_at: true },
    })

    if (staleSessions.length === 0) {
      return { result: 'No stale sessions found.' }
    }

    // Cap each session at exactly MAX_SESSION_HOURS from when it started
    await Promise.all(
      staleSessions.map((session) =>
        prisma.machineUsageSession.update({
          where: { id: session.id },
          data: {
            ended_at: new Date(session.started_at.getTime() + MAX_SESSION_HOURS * 60 * 60 * 1000),
          },
        }),
      ),
    )

    return { result: `Closed ${staleSessions.length} stale session(s).` }
  },
})
