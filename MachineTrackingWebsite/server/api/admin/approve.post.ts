import prisma from '../../lib/prisma'
import { requireAdminUser } from '../../utils/admin-auth'

type ApproveBody = {
  id?: string
}

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  const { id } = await readBody<ApproveBody>(event)
  if (!id) {
    throw createError({ statusCode: 400, message: 'Pending user id is required' })
  }

  const pending = await prisma.pendingUser.findUnique({ where: { id } })
  if (!pending) {
    throw createError({ statusCode: 404, message: 'Pending user not found' })
  }

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
