import { compare } from 'bcrypt-ts'
import prisma from '../../lib/prisma'


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

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || user.role !== 'admin') {
    throw createError({ statusCode: 401, message: 'Invalid admin credentials' })
  }

  const passwordMatches = await compare(password, user.password_hash)
  if (!passwordMatches) {
    throw createError({ statusCode: 401, message: 'Invalid admin credentials' })
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
