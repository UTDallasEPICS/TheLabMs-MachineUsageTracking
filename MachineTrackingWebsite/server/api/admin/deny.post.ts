/*
  server/api/admin/deny.post.ts
  Rejects a pending user signup request by deleting the PendingUser record.
  The applicant's email is freed immediately and can be re-used for a new request.
  Requires admin session.
*/
import prisma from '../../lib/prisma'
import { requireAdminUser } from '../../utils/admin-auth'

type DenyBody = {
  id?: string
}

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  const { id } = await readBody<DenyBody>(event)
  if (!id) {
    throw createError({ statusCode: 400, message: 'Pending user id is required' })
  }

  const pending = await prisma.pendingUser.findUnique({ where: { id } })
  if (!pending) {
    throw createError({ statusCode: 404, message: 'Pending user not found' })
  }

  await prisma.pendingUser.delete({ where: { id } })

  return { ok: true }
})