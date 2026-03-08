import { compare } from 'bcrypt-ts'
import prisma from '../../lib/prisma'
import { assertLoginNotBlocked, clearLoginFailures, recordFailedLogin } from '../../utils/login-rate-limit'


type AdminLoginBody = {
  email?: string
  password?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<AdminLoginBody>(event)
  const email = body.email?.trim().toLowerCase()
  const password = body.password ?? ''

  if (!email || !password) {
    throw createError({ statusCode: 400, message: 'Email and password are required' })
  }

  assertLoginNotBlocked(event, email)

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || user.role !== 'admin') {
    recordFailedLogin(event, email)
    throw createError({ statusCode: 401, message: 'Invalid admin credentials' })
  }

  const passwordMatches = await compare(password, user.password_hash)
  if (!passwordMatches) {
    recordFailedLogin(event, email)
    throw createError({ statusCode: 401, message: 'Invalid admin credentials' })
  }

  clearLoginFailures(event, email)

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
