/**
 * Calculates active seconds for a session clipped to a given time window.
 * Open sessions (endedAt = null) are treated as ending at dayEnd.
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
