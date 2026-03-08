import { compare } from 'bcrypt-ts'
import prisma from '../../lib/prisma'
import { assertLoginNotBlocked, clearLoginFailures, recordFailedLogin } from '../../utils/login-rate-limit'

type LoginBody = {
  email?: string
  password?: string
}

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody<LoginBody>(event)
  const normalizedEmail = email?.trim().toLowerCase()
  const rawPassword = password ?? ''

  if (!normalizedEmail || !rawPassword) {
    throw createError({ statusCode: 400, message: 'Email and password are required' })
  }

  assertLoginNotBlocked(event, normalizedEmail)

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (!user) {
    recordFailedLogin(event, normalizedEmail)
    throw createError({ statusCode: 401, message: 'Invalid credentials' })
  }

  const passwordMatches = await compare(rawPassword, user.password_hash)
  if (!passwordMatches) {
    recordFailedLogin(event, normalizedEmail)
    throw createError({ statusCode: 401, message: 'Invalid credentials' })
  }

  clearLoginFailures(event, normalizedEmail)

  const sessionUser = {
    id: user.id,
    email: user.email,
    role: user.role
  }

  await setUserSession(event, { user: sessionUser })

  return {
    ok: true,
    user: sessionUser
  }
})
