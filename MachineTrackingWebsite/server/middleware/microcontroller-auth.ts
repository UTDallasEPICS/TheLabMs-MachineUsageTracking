// server/middleware/microcontroller-auth.ts
import prisma from '../lib/prisma'

export default defineEventHandler(async (event) => {
  if (!event.path.startsWith('/api/microcontroller/')) return

  // Public read endpoint used by the dashboard.
  if (event.path === '/api/microcontroller/usage') return

  const apiKey = getHeader(event, 'x-api-key')
  if (!apiKey) throw createError({ statusCode: 401, message: 'No API key' })

  const microcontroller = await prisma.microcontroller.findUnique({
    where: { api_key: apiKey }
  })
  if (!microcontroller) throw createError({ statusCode: 401, message: 'Invalid API key' })

  // Attach to context for use in route handlers
  event.context.microcontroller = microcontroller
})