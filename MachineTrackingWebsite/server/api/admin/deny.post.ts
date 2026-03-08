import prisma from '../../lib/prisma'
import { requireAdminUser } from '../../utils/admin-auth'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  const { id } = await readBody(event)
  await prisma.pendingUser.delete({ where: { id } })

  return { ok: true }
})