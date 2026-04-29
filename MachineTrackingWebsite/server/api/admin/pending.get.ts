/*
  server/api/admin/pending.get.ts
  Returns all pending signup requests ordered oldest-first so admins can process
  them in the order they were submitted. Used to populate the admin dashboard
  "Pending Signups" section. Requires admin session.
*/
import prisma from '../../lib/prisma'
import { requireAdminUser } from '../../utils/admin-auth'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  return await prisma.pendingUser.findMany({
    orderBy: { requested_at: 'asc' }
  })
})