import prisma from '../../lib/prisma'
import { requireAdminUser } from '../../utils/admin-auth'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  const { id } = await readBody(event)
  const pending = await prisma.pendingUser.findUnique({ where: { id } })
  if (!pending) throw createError({ statusCode: 404 })

  await prisma.$transaction([
    prisma.user.create({
      data: {
        email: pending.email,
        password_hash: pending.password_hash,
        role: 'user'
      }
    }),
    prisma.pendingUser.delete({ where: { id } })
  ])

  return { ok: true }
})