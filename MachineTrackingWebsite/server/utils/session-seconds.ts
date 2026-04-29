/* 
server/utils/session-seconds.ts
Pure utility used by calendar.get.ts, usage.get.ts, and range-totals.get.ts
to calculate how many seconds of a MachineUsageSession fall within an arbitrary
time window. Clips the session's start and end to the window boundaries so that
sessions spanning midnight are attributed correctly to each day.
Open sessions (ended_at = null) are passed in as null and treated as ending at windowEnd.
*/
export function calculateSessionSeconds(
  startedAt: Date,
  endedAt: Date | null,
  windowStart: Date,
  windowEnd: Date,
): number {
  const effectiveStart = startedAt > windowStart ? startedAt : windowStart
  const effectiveEnd = endedAt !== null
    ? (endedAt < windowEnd ? endedAt : windowEnd)
    : windowEnd

  if (effectiveEnd <= effectiveStart) return 0
  return Math.floor((effectiveEnd.getTime() - effectiveStart.getTime()) / 1000)
}
