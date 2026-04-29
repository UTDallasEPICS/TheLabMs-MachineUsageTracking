/*
  server/api/admin/microcontroller.patch.ts
  Updates the isAC field on a Microcontroller record, toggling the machine between
  AC and DC current mode. Called by the AC/DC toggle switch in the admin panel.
  Accepts { id: number, isAC: boolean } in the request body.
  Requires admin session.
*/
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
