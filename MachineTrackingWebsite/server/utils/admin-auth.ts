import type { H3Event } from 'h3'
import prisma from '../lib/prisma'

export type SessionAdminUser = {
  id: string
  email: string
  role: 'admin'
}

export async function requireAdminUser(event: H3Event): Promise<SessionAdminUser> {
  const session = await requireUserSession(event)
  const user = session.user as Partial<SessionAdminUser> | undefined

  if (!user?.id || !user?.email || user.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Admin access required' })
  }

  const dbAdmin = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, role: true }
  })

  if (!dbAdmin || dbAdmin.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Admin access required' })
  }

  return {
    id: dbAdmin.id,
    email: dbAdmin.email,
    role: 'admin'
  }
}
