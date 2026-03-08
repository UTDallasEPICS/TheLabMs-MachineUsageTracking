import type { H3Event } from 'h3'

type AttemptWindow = {
  count: number
  firstAttemptAt: number
  blockedUntil?: number
}

const WINDOW_MS = 10 * 60 * 1000
const BLOCK_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 6

const attempts = new Map<string, AttemptWindow>()

function getClientIp(event: H3Event): string {
  const forwardedFor = getHeader(event, 'x-forwarded-for')
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]
    if (first) {
      return first.trim()
    }
  }

  const realIp = getHeader(event, 'x-real-ip')
  return realIp || 'unknown-ip'
}

function getKey(event: H3Event, email: string): string {
  return `${getClientIp(event)}::${email.toLowerCase()}`
}

function now(): number {
  return Date.now()
}

export function assertLoginNotBlocked(event: H3Event, email: string): void {
  const key = getKey(event, email)
  const entry = attempts.get(key)
  const current = now()

  if (!entry) return

  if (entry.blockedUntil && current < entry.blockedUntil) {
    const seconds = Math.ceil((entry.blockedUntil - current) / 1000)
    throw createError({
      statusCode: 429,
      message: `Too many failed login attempts. Try again in ${seconds} seconds.`
    })
  }

  if (current - entry.firstAttemptAt > WINDOW_MS) {
    attempts.delete(key)
  }
}

export function recordFailedLogin(event: H3Event, email: string): void {
  const key = getKey(event, email)
  const current = now()
  const entry = attempts.get(key)

  if (!entry || current - entry.firstAttemptAt > WINDOW_MS) {
    attempts.set(key, {
      count: 1,
      firstAttemptAt: current
    })
    return
  }

  entry.count += 1
  if (entry.count >= MAX_ATTEMPTS) {
    entry.blockedUntil = current + BLOCK_MS
  }
  attempts.set(key, entry)
}

export function clearLoginFailures(event: H3Event, email: string): void {
  attempts.delete(getKey(event, email))
}
