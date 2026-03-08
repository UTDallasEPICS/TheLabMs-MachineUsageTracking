import type { H3Event } from 'h3'

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

  return {
    id: user.id,
    email: user.email,
    role: 'admin'
  }
}
