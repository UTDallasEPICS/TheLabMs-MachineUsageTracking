import { createHmac, timingSafeEqual } from 'node:crypto'
import prisma from '../lib/prisma'

const TOKEN_TTL_MS = 15 * 60 * 1000

type ResetPayload = {
  uid: string
  email: string
  exp: number
  pwh: string
}

function toBase64Url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function fromBase64Url(input: string): Buffer {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((input.length + 3) % 4)
  return Buffer.from(padded, 'base64')
}

function getSigningSecret(): string {
  return process.env.NUXT_SESSION_PASSWORD || 'replace-this-in-env-with-32-plus-chars'
}

function sign(payloadEncoded: string): string {
  return toBase64Url(createHmac('sha256', getSigningSecret()).update(payloadEncoded).digest())
}

export function createAdminResetToken(user: { id: string; email: string; password_hash: string }): string {
  const payload: ResetPayload = {
    uid: user.id,
    email: user.email,
    exp: Date.now() + TOKEN_TTL_MS,
    pwh: user.password_hash.slice(0, 20)
  }

  const payloadEncoded = toBase64Url(JSON.stringify(payload))
  const signature = sign(payloadEncoded)
  return `${payloadEncoded}.${signature}`
}

function safeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return timingSafeEqual(aBuf, bBuf)
}

export async function verifyAdminResetToken(token: string) {
  const [payloadEncoded, signature] = token.split('.')
  if (!payloadEncoded || !signature) return null

  const expectedSignature = sign(payloadEncoded)
  if (!safeCompare(signature, expectedSignature)) return null

  let payload: ResetPayload
  try {
    payload = JSON.parse(fromBase64Url(payloadEncoded).toString('utf8')) as ResetPayload
  } catch {
    return null
  }

  if (!payload.uid || !payload.email || !payload.exp || !payload.pwh) return null
  if (payload.exp < Date.now()) return null

  const admin = await prisma.user.findUnique({
    where: { id: payload.uid },
    select: { id: true, email: true, password_hash: true, role: true }
  })

  if (!admin || admin.role !== 'admin') return null
  if (admin.email !== payload.email) return null
  if (admin.password_hash.slice(0, 20) !== payload.pwh) return null

  return admin
}

export function getAdminResetTtlMinutes(): number {
  return Math.floor(TOKEN_TTL_MS / 60000)
}
