import { hash } from 'bcrypt-ts'
import prisma from '../../lib/prisma'

type RegisterBody = {
  email?: string
  password?: string
}

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody<RegisterBody>(event)
  const normalizedEmail = email?.trim().toLowerCase()
  const rawPassword = password ?? ''

  if (!normalizedEmail || !rawPassword) {
    throw createError({ statusCode: 400, message: 'Email and password are required' })
  }

  if (rawPassword.length < 8) {
    throw createError({ statusCode: 400, message: 'Password must be at least 8 characters' })
  }

  const [existingUser, existingPending] = await Promise.all([
    prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } }),
    prisma.pendingUser.findUnique({ where: { email: normalizedEmail }, select: { id: true } })
  ])

  if (existingUser) {
    throw createError({ statusCode: 409, message: 'An account with this email already exists' })
  }

  if (existingPending) {
    throw createError({ statusCode: 409, message: 'Signup request already pending approval' })
  }

  const passwordHash = await hash(rawPassword, 10)

  await prisma.pendingUser.create({
    data: {
      email: normalizedEmail,
      password_hash: passwordHash
    }
  })

  return { ok: true, message: 'Signup request submitted for admin approval' }
})
