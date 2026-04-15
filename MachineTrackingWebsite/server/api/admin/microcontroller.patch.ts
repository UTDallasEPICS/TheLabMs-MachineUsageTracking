import prisma from '../../lib/prisma'
import { requireAdminUser } from '../../utils/admin-auth'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  const { id, isAC } = await readBody(event)
  if (typeof id !== 'number' || typeof isAC !== 'boolean') {
    throw createError({ statusCode: 400, message: 'id (number) and isAC (boolean) are required.' })
  }

  await prisma.microcontroller.update({ where: { id }, data: { isAC } })
  return { ok: true }
})
