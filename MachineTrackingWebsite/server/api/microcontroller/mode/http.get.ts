import prisma from '../../../lib/prisma'

export default defineEventHandler(async (event) => {
  // The microcontroller-auth middleware already validated the API key
  // and attached the matching DB record to event.context.microcontroller
  const mc = event.context.microcontroller

  // Re-fetch to guarantee the latest isAC value from the DB
  const machine = await prisma.microcontroller.findUnique({
    where: { api_key: mc.api_key },
    select: { id: true, name: true, isAC: true },
  })

  if (!machine) {
    throw createError({ statusCode: 404, message: 'Machine not found' })
  }

  return {
    mode: machine.isAC ? 'AC' : 'DC',
  }
})
