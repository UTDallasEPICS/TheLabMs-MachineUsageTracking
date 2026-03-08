import { compare } from 'bcrypt-ts'
import prisma from '../../lib/prisma'

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

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (!user) {
    throw createError({ statusCode: 401, message: 'Invalid credentials' })
  }

  const passwordMatches = await compare(rawPassword, user.password_hash)
  if (!passwordMatches) {
    throw createError({ statusCode: 401, message: 'Invalid credentials' })
  }

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
