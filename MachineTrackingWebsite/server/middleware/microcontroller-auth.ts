/*
server/middleware/microcontroller-auth.ts
Nitro server middleware that guards every /api/microcontroller/* write route.
Read-only dashboard endpoints (usage, active, calendar, timeline, range-totals)
are whitelisted so they remain accessible via user-session auth instead.
For all other microcontroller routes the middleware expects an x-api-key header,
looks it up in the database, and attaches the matching Microcontroller record to
event.context.microcontroller so downstream handlers can use it without re-querying.
*/

import prisma from '../lib/prisma'

export default defineEventHandler(async (event) => {
  if (!event.path.startsWith('/api/microcontroller/')) return

  // Public read endpoints used by the dashboard (user-session auth, not machine API key).
  if (event.path === '/api/microcontroller/usage') return
  if (event.path === '/api/microcontroller/active') return
  if (event.path.startsWith('/api/microcontroller/calendar')) return
  if (event.path.startsWith('/api/microcontroller/timeline')) return
  if (event.path.startsWith('/api/microcontroller/range-totals')) return

  const apiKey = getHeader(event, 'x-api-key')
  if (!apiKey) throw createError({ statusCode: 401, message: 'No API key' })

  const microcontroller = await prisma.microcontroller.findUnique({
    where: { api_key: apiKey }
  })
  if (!microcontroller) throw createError({ statusCode: 401, message: 'Invalid API key' })

  // Attach to context for use in route handlers
  event.context.microcontroller = microcontroller
})