// server/middleware/microcontroller-auth.ts
import prisma from '../lib/prisma'

export default defineEventHandler(async (event) => {
  if (!event.path.startsWith('/api/microcontroller/')) return

  // Public read endpoints used by the dashboard (user-session auth, not machine API key).
  if (event.path === '/api/microcontroller/usage') return
  if (event.path.startsWith('/api/microcontroller/calendar')) return
  if (event.path.startsWith('/api/microcontroller/timeline')) return

  const apiKey = getHeader(event, 'x-api-key')
  if (!apiKey) throw createError({ statusCode: 401, message: 'No API key' })

  const microcontroller = await prisma.microcontroller.findUnique({
    where: { api_key: apiKey }
  })
  if (!microcontroller) throw createError({ statusCode: 401, message: 'Invalid API key' })

  // Attach to context for use in route handlers
  event.context.microcontroller = microcontroller
})